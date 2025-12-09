"""
Simple Smart Kitchen Backend - Extended for Full Frontend Support
- FastAPI
- DuckDB (local file)
- facenet-pytorch for embeddings
"""
import json
import numpy as np
from datetime import datetime, timedelta
from typing import Optional, List
import duckdb
import torch
from PIL import Image
import io
from facenet_pytorch import MTCNN, InceptionResnetV1
from fastapi import FastAPI, File, UploadFile, Form, Query, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import secrets
import base64

app = FastAPI(title="Smart Kitchen API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DuckDB connection
DB_FILE = "database.duckdb"
conn = duckdb.connect(DB_FILE)

# Initialize facenet-pytorch models (global to load once)
mtcnn = None
resnet = None

# JWT tokens storage (in production, use Redis or database)
tokens = {}  # token -> isic_number

def get_face_models():
    """Initialize and return facenet-pytorch models (singleton)."""
    global mtcnn, resnet
    if mtcnn is None:
        mtcnn = MTCNN(image_size=160, margin=0, min_face_size=20)
    if resnet is None:
        resnet = InceptionResnetV1(pretrained='vggface2').eval()
    return mtcnn, resnet

def init_db():
    """Create tables if they don't exist."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            isic_number TEXT PRIMARY KEY,
            name TEXT,
            face_embedding JSON,
            theme_palette TEXT DEFAULT 'pink',
            theme_dark_mode BOOLEAN DEFAULT FALSE
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS reservations (
            id TEXT PRIMARY KEY,
            isic_number TEXT,
            date TEXT,
            start_time TEXT,
            end_time TEXT,
            kitchen_id INTEGER,
            appliance_id TEXT,
            appliance_type TEXT,
            status TEXT DEFAULT 'confirmed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS kitchens (
            id INTEGER PRIMARY KEY,
            kitchen_number INTEGER,
            floor INTEGER,
            name TEXT
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS appliances (
            id TEXT PRIMARY KEY,
            kitchen_id INTEGER,
            type TEXT,
            name TEXT
        )
    """)
    
    # Insert default kitchens (floors 1-7)
    for floor in range(1, 8):
        conn.execute("""
            INSERT OR IGNORE INTO kitchens (id, kitchen_number, floor, name)
            VALUES (?, ?, ?, ?)
        """, [floor, 1, floor, f'Kitchen Floor {floor}'])
        
        # Insert default appliances for each kitchen
        appliances = [
            ('microwave', 'Microwave 1'),
            ('microwave', 'Microwave 2'),
            ('oven', 'Oven'),
            ('stove_left', 'Stove Left'),
            ('stove_right', 'Stove Right'),
        ]
        for idx, (app_type, app_name) in enumerate(appliances):
            app_id = f'k{floor}-{app_type}{idx+1}'
            conn.execute("""
                INSERT OR IGNORE INTO appliances (id, kitchen_id, type, name)
                VALUES (?, ?, ?, ?)
            """, [app_id, floor, app_type, app_name])
    
    conn.commit()

def extract_face_embedding(image_bytes: bytes) -> list:
    """Extract face embedding from image bytes using facenet-pytorch."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode != 'RGB':
            img = img.convert('RGB')
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")
    
    mtcnn, resnet = get_face_models()
    
    try:
        face_tensor = mtcnn(img)
        if face_tensor is None:
            raise HTTPException(status_code=400, detail="No face detected in image")
        
        with torch.no_grad():
            embedding = resnet(face_tensor.unsqueeze(0))
        
        embedding = embedding.squeeze().cpu().numpy()
        embedding = embedding / np.linalg.norm(embedding)
        
        return embedding.tolist()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Face processing error: {str(e)}")

def cosine_similarity(embedding1: list, embedding2: list) -> float:
    """Calculate cosine similarity between two embeddings."""
    vec1 = np.array(embedding1)
    vec2 = np.array(embedding2)
    
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return float(dot_product / (norm1 * norm2))

def find_matching_user(embedding: list, threshold: float = 0.6) -> Optional[str]:
    """Find user with matching face embedding."""
    result = conn.execute("""
        SELECT isic_number, face_embedding 
        FROM users 
        WHERE face_embedding IS NOT NULL
    """).fetchall()
    
    best_match = None
    best_similarity = 0.0
    
    for isic, stored_embedding_json in result:
        stored_embedding = json.loads(stored_embedding_json)
        similarity = cosine_similarity(embedding, stored_embedding)
        
        if similarity > best_similarity:
            best_similarity = similarity
            best_match = isic
    
    if best_similarity >= threshold:
        return best_match
    
    return None

def generate_token(isic: str) -> str:
    """Generate a simple token for authentication."""
    token = secrets.token_urlsafe(32)
    tokens[token] = isic
    return token

def verify_token(token: str) -> Optional[str]:
    """Verify token and return ISIC number."""
    return tokens.get(token)

@app.on_event("startup")
async def startup():
    init_db()
    get_face_models()
    print("Database initialized")
    print("facenet-pytorch models loaded")

# ============================================================
# AUTHENTICATION
# ============================================================

@app.post("/login")
async def login(isic: str = Query(...)):
    """Login with ISIC number."""
    if not isic or not isic.startswith('S') or len(isic) < 11:
        raise HTTPException(status_code=400, detail="Invalid ISIC format")
    
    # Get or create user
    result = conn.execute(
        "SELECT name, theme_palette, theme_dark_mode FROM users WHERE isic_number = ?",
        [isic]
    ).fetchone()
    
    if result:
        name, theme_palette, theme_dark_mode = result
    else:
        name = f"User {isic[-4:]}"
        theme_palette = 'pink'
        theme_dark_mode = False
        conn.execute(
            "INSERT INTO users (isic_number, name, theme_palette, theme_dark_mode) VALUES (?, ?, ?, ?)",
            [isic, name, theme_palette, theme_dark_mode]
        )
        conn.commit()
    
    token = generate_token(isic)
    
    return {
        "token": token,
        "user": {
            "id": 1,
            "isic": isic,
            "name": name,
            "face_enrolled": conn.execute(
                "SELECT face_embedding IS NOT NULL FROM users WHERE isic_number = ?",
                [isic]
            ).fetchone()[0],
            "theme_palette": theme_palette or 'pink',
            "theme_dark_mode": theme_dark_mode or False
        }
    }

# ============================================================
# FACE ID
# ============================================================

@app.post("/face/enroll")
async def enroll_face(
    isic: str = Query(...),
    image: str = Form(...)  # Base64 encoded image from FormData
):
    """Register or update user face embedding."""
    try:
        # Decode base64 image (handle both with and without data URI prefix)
        if ',' in image:
            image_bytes = base64.b64decode(image.split(',')[-1])
        else:
            image_bytes = base64.b64decode(image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {str(e)}")
    
    embedding = extract_face_embedding(image_bytes)
    
    result = conn.execute(
        "SELECT name FROM users WHERE isic_number = ?",
        [isic]
    ).fetchone()
    
    if result:
        conn.execute(
            "UPDATE users SET face_embedding = ? WHERE isic_number = ?",
            [json.dumps(embedding), isic]
        )
    else:
        conn.execute(
            "INSERT INTO users (isic_number, name, face_embedding) VALUES (?, ?, ?)",
            [isic, f"User {isic[-4:]}", json.dumps(embedding)]
        )
    
    conn.commit()
    
    return {
        "success": True,
        "user": {
            "id": 1,
            "isic": isic,
            "name": result[0] if result else f"User {isic[-4:]}",
            "face_enrolled": True
        }
    }

@app.post("/face/verify")
async def verify_face(image: str = Form(...)):  # Base64 encoded image
    """Verify face and login."""
    try:
        # Decode base64 image (handle both with and without data URI prefix)
        if ',' in image:
            image_bytes = base64.b64decode(image.split(',')[-1])
        else:
            image_bytes = base64.b64decode(image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {str(e)}")
    
    embedding = extract_face_embedding(image_bytes)
    matched_isic = find_matching_user(embedding, threshold=0.6)
    
    if not matched_isic:
        raise HTTPException(status_code=401, detail="Face not recognized")
    
    result = conn.execute(
        "SELECT name, theme_palette, theme_dark_mode FROM users WHERE isic_number = ?",
        [matched_isic]
    ).fetchone()
    
    name = result[0] if result else f"User {matched_isic[-4:]}"
    theme_palette = result[1] if result and result[1] else 'pink'
    theme_dark_mode = result[2] if result and result[2] else False
    
    token = generate_token(matched_isic)
    
    return {
        "success": True,
        "token": token,
        "user": {
            "id": 1,
            "isic": matched_isic,
            "name": name,
            "face_enrolled": True,
            "theme_palette": theme_palette,
            "theme_dark_mode": theme_dark_mode
        }
    }

# ============================================================
# KITCHENS & APPLIANCES
# ============================================================

@app.get("/kitchens")
async def get_kitchens():
    """Get all kitchens."""
    result = conn.execute("""
        SELECT k.id, k.kitchen_number, k.floor, k.name,
               COUNT(DISTINCT a.id) as appliance_count
        FROM kitchens k
        LEFT JOIN appliances a ON k.id = a.kitchen_id
        GROUP BY k.id, k.kitchen_number, k.floor, k.name
        ORDER BY k.floor
    """).fetchall()
    
    kitchens = []
    for row in result:
        kitchens.append({
            "id": row[0],
            "kitchen_number": row[1],
            "floor": row[2],
            "name": row[3],
            "appliance_counts": {
                "microwave": conn.execute(
                    "SELECT COUNT(*) FROM appliances WHERE kitchen_id = ? AND type = 'microwave'",
                    [row[0]]
                ).fetchone()[0],
                "oven": conn.execute(
                    "SELECT COUNT(*) FROM appliances WHERE kitchen_id = ? AND type = 'oven'",
                    [row[0]]
                ).fetchone()[0],
                "stove_left": conn.execute(
                    "SELECT COUNT(*) FROM appliances WHERE kitchen_id = ? AND type = 'stove_left'",
                    [row[0]]
                ).fetchone()[0],
                "stove_right": conn.execute(
                    "SELECT COUNT(*) FROM appliances WHERE kitchen_id = ? AND type = 'stove_right'",
                    [row[0]]
                ).fetchone()[0],
            }
        })
    
    return kitchens

@app.get("/kitchens/{kitchen_id}")
async def get_kitchen_by_id(kitchen_id: int):
    """Get kitchen details by ID."""
    result = conn.execute(
        "SELECT id, kitchen_number, floor, name FROM kitchens WHERE id = ?",
        [kitchen_id]
    ).fetchone()
    
    if not result:
        raise HTTPException(status_code=404, detail="Kitchen not found")
    
    return {
        "id": result[0],
        "kitchen_number": result[1],
        "floor": result[2],
        "name": result[3],
        "appliance_counts": {
            "microwave": conn.execute(
                "SELECT COUNT(*) FROM appliances WHERE kitchen_id = ? AND type = 'microwave'",
                [kitchen_id]
            ).fetchone()[0],
            "oven": conn.execute(
                "SELECT COUNT(*) FROM appliances WHERE kitchen_id = ? AND type = 'oven'",
                [kitchen_id]
            ).fetchone()[0],
            "stove_left": conn.execute(
                "SELECT COUNT(*) FROM appliances WHERE kitchen_id = ? AND type = 'stove_left'",
                [kitchen_id]
            ).fetchone()[0],
            "stove_right": conn.execute(
                "SELECT COUNT(*) FROM appliances WHERE kitchen_id = ? AND type = 'stove_right'",
                [kitchen_id]
            ).fetchone()[0],
        }
    }

@app.get("/kitchens/{kitchen_id}/appliances")
async def get_kitchen_appliances(kitchen_id: int):
    """Get appliances for a kitchen."""
    result = conn.execute(
        "SELECT id, type, name FROM appliances WHERE kitchen_id = ?",
        [kitchen_id]
    ).fetchall()
    
    return [{"id": row[0], "type": row[1], "name": row[2]} for row in result]

# ============================================================
# AVAILABILITY
# ============================================================

@app.get("/availability")
async def get_availability(
    date: str = Query(...),
    kitchen: int = Query(...)
):
    """Get availability for a kitchen on a date."""
    # Get all appliances for the kitchen
    appliances = conn.execute(
        "SELECT id, type, name FROM appliances WHERE kitchen_id = ?",
        [kitchen]
    ).fetchall()
    
    # Get reservations for the date
    reservations = conn.execute("""
        SELECT appliance_id, start_time, end_time
        FROM reservations
        WHERE date = ? AND kitchen_id = ? AND status = 'confirmed'
    """, [date, kitchen]).fetchall()
    
    # Group reservations by appliance
    appliance_reservations = {}
    for res in reservations:
        app_id = res[0]
        if app_id not in appliance_reservations:
            appliance_reservations[app_id] = []
        appliance_reservations[app_id].append({
            "id": res[0],
            "startTime": res[1],
            "endTime": res[2],
            "userId": 1
        })
    
    # Build response
    appliances_list = []
    for app in appliances:
        appliances_list.append({
            "applianceId": app[0],
            "applianceType": app[1],
            "applianceName": app[2],
            "reservations": appliance_reservations.get(app[0], [])
        })
    
    return {
        "date": date,
        "kitchenId": kitchen,
        "operatingHours": {"start": "06:00", "end": "23:00"},
        "minDuration": 5,
        "maxDuration": 120,
        "appliances": appliances_list,
        "totalReservations": len(reservations)
    }

# ============================================================
# RESERVATIONS
# ============================================================

@app.post("/reserve")
async def create_reservation(
    date: str = Query(...),
    startTime: str = Query(...),
    endTime: str = Query(...),
    kitchenId: int = Query(...),
    applianceId: str = Query(...),
    token: str = Query(...)
):
    """Create a reservation."""
    isic = verify_token(token)
    if not isic:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Check for conflicts
    conflicts = conn.execute("""
        SELECT COUNT(*) FROM reservations
        WHERE date = ? AND kitchen_id = ? AND appliance_id = ?
        AND status = 'confirmed'
        AND (
            (start_time <= ? AND end_time > ?) OR
            (start_time < ? AND end_time >= ?) OR
            (start_time >= ? AND end_time <= ?)
        )
    """, [date, kitchenId, applianceId, startTime, startTime, endTime, endTime, startTime, endTime]).fetchone()[0]
    
    if conflicts > 0:
        raise HTTPException(status_code=400, detail="Time slot already reserved")
    
    reservation_id = f"{isic}_{date}_{startTime}_{endTime}"
    
    # Get appliance type
    app_type = conn.execute(
        "SELECT type FROM appliances WHERE id = ?",
        [applianceId]
    ).fetchone()
    
    if not app_type:
        raise HTTPException(status_code=400, detail="Invalid appliance")
    
    conn.execute("""
        INSERT INTO reservations (id, isic_number, date, start_time, end_time, kitchen_id, appliance_id, appliance_type, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
    """, [reservation_id, isic, date, startTime, endTime, kitchenId, applianceId, app_type[0]])
    
    conn.commit()
    
    return {"success": True, "id": reservation_id}

@app.get("/reservations/me")
async def get_my_reservations(token: str = Query(...)):
    """Get current user's reservations."""
    isic = verify_token(token)
    if not isic:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    result = conn.execute("""
        SELECT r.id, r.date, r.start_time, r.end_time, r.kitchen_id, r.appliance_id, r.appliance_type, r.status,
               k.floor, k.kitchen_number, a.name as appliance_name
        FROM reservations r
        LEFT JOIN kitchens k ON r.kitchen_id = k.id
        LEFT JOIN appliances a ON r.appliance_id = a.id
        WHERE r.isic_number = ?
        ORDER BY r.date DESC, r.start_time DESC
    """, [isic]).fetchall()
    
    reservations = []
    for row in result:
        reservations.append({
            "id": row[0],
            "date": row[1],
            "startTime": row[2],
            "endTime": row[3],
            "kitchenId": row[4],
            "applianceId": row[5],
            "applianceType": row[6],
            "status": row[7] or "confirmed",
            "kitchen": {
                "id": row[4],
                "floor": row[8],
                "kitchen_number": row[9]
            } if row[8] else None,
            "appliance": {
                "id": row[5],
                "type": row[6],
                "name": row[10] or "Unknown"
            } if row[5] else None
        })
    
    return reservations

@app.delete("/reservation/{reservation_id}")
async def cancel_reservation(reservation_id: str, token: str = Query(...)):
    """Cancel a reservation."""
    isic = verify_token(token)
    if not isic:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Check ownership
    owner = conn.execute(
        "SELECT isic_number FROM reservations WHERE id = ?",
        [reservation_id]
    ).fetchone()
    
    if not owner or owner[0] != isic:
        raise HTTPException(status_code=403, detail="Not your reservation")
    
    conn.execute(
        "UPDATE reservations SET status = 'cancelled' WHERE id = ?",
        [reservation_id]
    )
    conn.commit()
    
    return {"message": "Reservation cancelled successfully"}

# ============================================================
# USER PREFERENCES
# ============================================================

@app.put("/user/theme")
async def update_theme(
    theme_palette: str = Query(...),
    theme_dark_mode: bool = Query(...),
    token: str = Query(...)
):
    """Update user theme preferences."""
    isic = verify_token(token)
    if not isic:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    conn.execute(
        "UPDATE users SET theme_palette = ?, theme_dark_mode = ? WHERE isic_number = ?",
        [theme_palette, theme_dark_mode, isic]
    )
    conn.commit()
    
    result = conn.execute(
        "SELECT name, face_embedding IS NOT NULL FROM users WHERE isic_number = ?",
        [isic]
    ).fetchone()
    
    return {
        "success": True,
        "user": {
            "id": 1,
            "isic": isic,
            "name": result[0] if result else f"User {isic[-4:]}",
            "face_enrolled": result[1] if result else False,
            "theme_palette": theme_palette,
            "theme_dark_mode": theme_dark_mode
        }
    }

# ============================================================
# ESP32 ENDPOINT
# ============================================================

@app.post("/esp/check")
async def esp_check(faceImage: UploadFile = File(...)):
    """Check if face is authorized to open door (for ESP32)."""
    image_bytes = await faceImage.read()
    embedding = extract_face_embedding(image_bytes)
    matched_isic = find_matching_user(embedding, threshold=0.6)
    
    if not matched_isic:
        return {"authorized": False}
    
    # Check active reservation
    now = datetime.now()
    result = conn.execute("""
        SELECT COUNT(*) FROM reservations
        WHERE isic_number = ?
        AND date = ?
        AND start_time <= ?
        AND end_time >= ?
        AND status = 'confirmed'
    """, [matched_isic, now.strftime("%Y-%m-%d"), now.strftime("%H:%M"), now.strftime("%H:%M")]).fetchone()
    
    if result and result[0] > 0:
        return {"authorized": True}
    
    return {"authorized": False}

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


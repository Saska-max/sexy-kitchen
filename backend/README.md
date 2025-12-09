# Smart Kitchen FastAPI Backend

FastAPI backend with DuckDB and facenet-pytorch for face recognition.

## Installation

```bash
pip install -r requirements.txt
```

## Run

```bash
python fastapi_app.py
```

Or:

```bash
uvicorn fastapi_app:app --reload --host 0.0.0.0 --port 8000
```

API will be available at: http://localhost:8000

## API Endpoints

### Authentication
- `POST /login?isic=...` - Login with ISIC number
- `POST /face/enroll?isic=...` - Enroll face (form data: image=base64)
- `POST /face/verify` - Verify face and login (form data: image=base64)

### Kitchens & Appliances
- `GET /kitchens` - Get all kitchens
- `GET /kitchens/{kitchen_id}/appliances` - Get appliances for a kitchen

### Availability
- `GET /availability?date=YYYY-MM-DD&kitchen=ID` - Get availability for date and kitchen

### Reservations
- `POST /reserve?date=...&startTime=...&endTime=...&kitchenId=...&applianceId=...&token=...` - Create reservation
- `GET /reservations/me?token=...` - Get user's reservations
- `DELETE /reservation/{id}?token=...` - Cancel reservation

### User Preferences
- `PUT /user/theme?theme_palette=...&theme_dark_mode=...&token=...` - Update theme

### ESP32
- `POST /esp/check` - Check if face is authorized (for ESP32 door control)

## Database

- DuckDB file: `database.duckdb` (created automatically)
- Tables: `users`, `reservations`, `kitchens`, `appliances`

## Face Recognition

- Uses facenet-pytorch library (InceptionResnetV1 with VGGFace2)
- 512-dimensional embeddings
- Cosine similarity threshold: 0.6
- Embeddings stored as JSON in DuckDB
- Models download automatically on first use
- Works on CPU (no GPU required)


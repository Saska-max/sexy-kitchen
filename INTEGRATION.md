# FastAPI Backend Integration Guide

## Overview

The application has been updated to use a FastAPI backend with DuckDB and facenet-pytorch for face recognition.

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the Backend

```bash
python fastapi_app.py
```

Or use the startup script:
```bash
./start.sh
```

The backend will run on `http://0.0.0.0:8000`

### 3. Update Frontend BASE_URL

The frontend API service (`services/api.ts`) is configured to use:
- `BASE_URL = "http://172.20.10.3:8000"`

**Important**: Update this IP address to match your computer's local IP address for Expo Go testing.

## API Endpoints

### Authentication
- `POST /login?isic=...` - Login with ISIC number
- `POST /face/enroll?isic=...` - Enroll face (form data: image=base64)
- `POST /face/verify` - Verify face and login (form data: image=base64)

### Kitchens & Appliances
- `GET /kitchens` - Get all kitchens
- `GET /kitchens/{kitchen_id}` - Get kitchen by ID
- `GET /kitchens/{kitchen_id}/appliances` - Get appliances for a kitchen

### Availability
- `GET /availability?date=YYYY-MM-DD&kitchen=ID` - Get availability

### Reservations
- `POST /reserve?date=...&startTime=...&endTime=...&kitchenId=...&applianceId=...&token=...` - Create reservation
- `GET /reservations/me?token=...` - Get user's reservations
- `DELETE /reservation/{id}?token=...` - Cancel reservation

### User Preferences
- `PUT /user/theme?theme_palette=...&theme_dark_mode=...&token=...` - Update theme

## Key Changes

1. **Authentication**: Token-based (no JWT, simple token storage)
2. **Face Recognition**: Uses facenet-pytorch with 0.6 similarity threshold
3. **Database**: DuckDB (local file: `database.duckdb`)
4. **Token Storage**: In-memory (for production, use Redis or database)
5. **Image Format**: Base64 strings sent via FormData

## Database Schema

- `users`: isic_number, name, face_embedding (JSON), theme_palette, theme_dark_mode
- `reservations`: id, isic_number, date, start_time, end_time, kitchen_id, appliance_id, appliance_type, status
- `kitchens`: id, kitchen_number, floor, name
- `appliances`: id, kitchen_id, type, name

## Testing

1. Start the FastAPI backend
2. Update BASE_URL in `services/api.ts` with your local IP
3. Run the Expo app
4. Test login, face enrollment, and reservations

## Notes

- Face recognition models download automatically on first use
- Database file is created automatically
- Default kitchens (floors 1-7) are created on startup
- All endpoints require token as query parameter (except login and face/verify)


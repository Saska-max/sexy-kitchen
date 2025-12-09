# Android Network Error Fix

## Changes Made

### 1. Android Permissions (app.json)
Added required network permissions for Android:
```json
"android": {
  "permissions": [
    "INTERNET",
    "ACCESS_NETWORK_STATE"
  ],
  "usesCleartextTraffic": false
}
```

### 2. Axios Configuration (src/api/client.ts)
- Added `Accept: application/json` header
- Added `validateStatus` to accept all responses below 500
- Fixed FormData handling (removed manual Content-Type header)

### 3. Better Error Handling
- Network errors (status 0) show user-friendly messages
- All errors logged to console with full details
- Better error detection for Android

### 4. UI Improvements

#### Login Screen
- **Big "Create New Account" button** - Easy to find and tap
- **Debug button** - Access admin/debug screen to test API
- Register button is now prominent and styled

#### Admin/Debug Screen
- Shows API URL being used
- Test buttons for all endpoints
- Displays full response/error data

## How to Test

### Step 1: Rebuild the App
After changing `app.json`, you need to rebuild:
```bash
# For Android
npx expo prebuild --clean
npx expo run:android
```

### Step 2: Test Connection
1. Open the app
2. On login screen, tap **"Debug"** button at bottom
3. Tap **"Health Check"** to test API connectivity
4. Check console logs for detailed error messages

### Step 3: Register a User
1. On login screen, tap **"Create New Account"** button
2. Enter ISIC (format: S1234567890) and name
3. Tap "Create User"
4. If successful, you'll be taken to face enrollment

## Common Issues & Solutions

### Issue: "Network Error"
**Cause**: App can't reach the API server

**Solutions**:
1. Check your internet connection
2. Verify the backend is running at `https://smartkitchen.fly.dev`
3. Try the health check in debug screen
4. Check console logs for specific error

### Issue: "Request Timeout"
**Cause**: Server is slow or unreachable

**Solutions**:
1. Check if backend is online
2. Try again in a few seconds
3. Check your network connection

### Issue: Can't find register page
**Solution**: On login screen, look for the big **"Create New Account"** button below the Face ID button

## API Endpoints Used

All endpoints connect to: `https://smartkitchen.fly.dev`

1. **POST /user/create** - Register new user
   - Body: `{ isic_number: "S1234567890", name: "John Doe" }`

2. **GET /user?isic={isic}** - Check if user exists (for login)

3. **POST /face/enroll?isic={isic}** - Enroll face photo
   - FormData with `faceImage` field

4. **POST /auth/login-face** - Login with face
   - FormData with `faceImage` field

5. **POST /reservation/add?isic={isic}** - Create reservation
   - Body: `{ start_time: "ISO timestamp", end_time: "ISO timestamp" }`

6. **GET /reservation/check?isic={isic}** - Check active reservation

7. **GET /user/reservations?isic={isic}** - Get all user reservations

8. **DELETE /reservation/delete?reservation_id={id}** - Delete reservation

## Console Logs to Check

When you make a request, you'll see:
```
[API Config] Using URL from app.json: https://smartkitchen.fly.dev
[API] Request: POST https://smartkitchen.fly.dev/user/create (with data)
[API] Success: post /user/create
```

If there's an error:
```
[API] Error: {
  url: "/user/create",
  method: "post",
  baseURL: "https://smartkitchen.fly.dev",
  status: 0,
  message: "Network Error",
  code: "ERR_NETWORK"
}
```

## User Flow

1. **Login Screen** → Tap "Create New Account"
2. **Register Screen** → Enter ISIC + Name → Create User
3. **Face Enroll Screen** → Capture face photo → Enroll
4. **Reservations Screen** → Create/view/delete reservations

OR

1. **Login Screen** → Tap "Login with Face ID"
2. **Face Verify Screen** → Capture face → Login
3. **Reservations Screen** → Manage reservations

## Debug Screen Access

From login screen → Tap "Debug" button at bottom → Access:
- Health Check
- Get All Users
- Get All Reservations
- View API URL
- See full responses

This helps verify the API is working before trying to register.


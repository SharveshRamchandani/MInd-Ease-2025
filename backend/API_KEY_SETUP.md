# API Key Setup Guide

## Current API Key
```
AIzaSyAuYdnbTNk-KvUioIEd34WRcgqZcQmyqZg
```

## Where to Set the API Key

### 1. Local Development (`backend/.env`)
```env
GEMINI_API_KEY=AIzaSyAuYdnbTNk-KvUioIEd34WRcgqZcQmyqZg
```
**After changing:** Restart the backend server

### 2. Render.com (Production)
1. Go to Render Dashboard
2. Select your service
3. Go to **Environment** tab
4. Add/Update: `GEMINI_API_KEY` = `AIzaSyAuYdnbTNk-KvUioIEd34WRcgqZcQmyqZg`
5. Click **Save Changes**
6. **Redeploy** the service (or it will auto-redeploy)

### 3. System Environment Variable (Windows)
```cmd
setx GEMINI_API_KEY "AIzaSyAuYdnbTNk-KvUioIEd34WRcgqZcQmyqZg"
```
**Note:** Requires restarting terminal/IDE

### 4. Temporary Fallback in Code
Currently set in `backend/app.py` line 110 as a fallback.
**⚠️ Remove before committing to Git for security!**

## Verify API Key is Loaded

### Check Backend Logs
When you start the server, you should see:
```
INFO: Gemini AI configured successfully
INFO: Gemini AI model initialized successfully
```

### Test the API
```bash
# Health check
curl http://localhost:5000/health

# Test chat (should work without quota errors)
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "userId": "test"}'
```

## Troubleshooting

### If you still get quota errors:
1. **Wait 15-30 minutes** - Quota limits reset
2. **Check API key validity** - Verify in Google AI Studio
3. **Check API key permissions** - Ensure it has Gemini API access
4. **Verify environment variable** - Check it's actually loaded

### If API key not loading:
1. **Check .env file location** - Must be in `backend/` directory
2. **Check file format** - No spaces around `=`, no quotes needed
3. **Restart server** - Environment variables load on startup
4. **Check for typos** - Variable name must be exactly `GEMINI_API_KEY`

## Security Note
⚠️ **DO NOT commit the API key to Git!**
- The `.env` file is in `.gitignore`
- Remove hardcoded fallback before committing
- Use environment variables only


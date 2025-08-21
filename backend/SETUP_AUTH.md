# Firebase Authentication Setup

This guide explains how to set up Firebase authentication for the Mind-Ease backend to secure user conversations.

## Prerequisites

1. A Firebase project with Authentication enabled
2. A Firebase service account key file

## Steps to Set Up

### 1. Get Firebase Service Account Key

1. Go to your [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon) > Service accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Place it in a secure location (e.g., `backend/keys/firebase-service-account.json`)

### 2. Update Environment Variables

1. Copy `env.example` to `.env`
2. Set the `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` variable:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./keys/firebase-service-account.json
```

### 3. Install Dependencies

Make sure you have the required Python packages:

```bash
pip install firebase-admin
```

### 4. Test Authentication

1. Start your backend server
2. Try to access a protected endpoint (e.g., `/api/conversations`)
3. You should get a 401 error if no valid token is provided

## Security Features

With this setup, the backend now:

- ✅ Requires Firebase ID tokens for all conversation endpoints
- ✅ Validates user ownership of conversations
- ✅ Prevents users from accessing other users' conversations
- ✅ Automatically handles token verification
- ✅ Logs authentication attempts and failures

## Frontend Integration

The frontend automatically:
- Sends Firebase ID tokens in the Authorization header
- Handles authentication errors gracefully
- Redirects to login when sessions expire
- Maintains user-specific conversation storage

## Troubleshooting

### Common Issues

1. **"Firebase Admin SDK not available"**
   - Check that the service account key path is correct
   - Verify the JSON file is valid and readable

2. **"Authentication required" errors**
   - Ensure the frontend is sending valid Firebase ID tokens
   - Check that the user is properly authenticated in Firebase

3. **Permission denied errors**
   - Verify the service account has the necessary Firebase permissions
   - Check that Firestore rules allow the service account to read/write

### Debug Mode

To enable debug logging, set the logging level in `app.py`:

```python
logging.basicConfig(level=logging.DEBUG)
```

## Security Best Practices

1. **Never commit service account keys to version control**
2. **Use environment variables for sensitive configuration**
3. **Regularly rotate service account keys**
4. **Monitor authentication logs for suspicious activity**
5. **Implement rate limiting on authentication endpoints**

## Next Steps

After setting up authentication:

1. Test the complete authentication flow
2. Verify that users can only access their own conversations
3. Test session expiration handling
4. Monitor logs for any authentication issues

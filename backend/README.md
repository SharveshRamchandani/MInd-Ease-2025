# Mind-Ease Backend (Python/Flask)

A Python Flask backend for the Mind-Ease mental wellness chatbot powered by Google's Gemini 2.5 Pro AI.

## 🚀 Features

- **AI-Powered Chat**: Mental wellness conversations using Gemini 2.5 Pro
- **Mood Analysis**: AI-powered mood detection from text
- **Coping Strategies**: Personalized strategies based on mood
- **Crisis Resources**: Emergency contact information and support
- **Motivational Content**: Quotes and meditation tips
- **Security**: Rate limiting, CORS, and input validation
- **Health Monitoring**: Service health checks

## 📋 Prerequisites

- Python 3.8+
- pip or conda
- Google Gemini API key

## 🛠️ Installation

1. **Navigate to the backend directory:**
   ```bash
   cd MInd-Ease-2025/backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

5. **Start the development server:**
   ```bash
   python app.py
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## 📡 API Endpoints

### Chat Endpoints

#### `POST /api/chat/message`
Send a message to the mental wellness chatbot.

**Request Body:**
```json
{
  "message": "I'm feeling anxious today",
  "userId": "user123",
  "sessionId": "session456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "I understand you're feeling anxious today. That's a completely valid emotion...",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "sessionId": "session456",
    "userId": "user123"
  }
}
```

#### `POST /api/chat/analyze-mood`
Analyze mood from text input.

**Request Body:**
```json
{
  "text": "I had a great day today, everything went well!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mood": "happy",
    "intensity": "high",
    "sentiment": "positive",
    "confidence": 0.95,
    "keywords": ["great", "well", "positive"],
    "suggestions": ["Celebrate your good day", "Practice gratitude"]
  }
}
```

#### `GET /api/chat/conversation-starter`
Get a random conversation starter.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "How are you feeling today?",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Wellness Endpoints

#### `GET /api/wellness/coping-strategies?mood=anxious`
Get coping strategies for a specific mood.

**Response:**
```json
{
  "success": true,
  "data": {
    "mood": "anxious",
    "strategies": [
      {
        "title": "Deep Breathing",
        "description": "Take slow, deep breaths...",
        "duration": "5-10 minutes",
        "category": "breathing"
      }
    ],
    "count": 3,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### `GET /api/wellness/motivational-quotes`
Get a random motivational quote.

#### `GET /api/wellness/crisis-resources`
Get crisis support resources.

#### `GET /api/wellness/meditation-tips`
Get meditation tips and guidance.

### Health Check

#### `GET /health`
Check overall server health.

#### `GET /api/chat/health`
Check chat service health.

#### `GET /api/wellness/health`
Check wellness service health.

## 🤖 Gemini AI Integration

The backend uses Google's Gemini 2.5 Pro for:

- **Mental Wellness Conversations**: Empathetic, supportive responses
- **Mood Analysis**: AI-powered emotional state detection
- **Crisis Awareness**: Recognition of crisis situations
- **Professional Boundaries**: Clear AI companion role definition

### System Prompt Features

- Empathetic and non-judgmental responses
- Evidence-based mental health information
- Crisis response protocols
- Professional help encouragement
- Practical coping strategies

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse (Flask-Limiter)
- **Input Validation**: Sanitizes all inputs
- **CORS Protection**: Configurable cross-origin requests
- **Request Logging**: Comprehensive error logging
- **Error Handling**: Graceful error responses

## 🚀 Deployment

### Production Setup

1. **Set production environment:**
   ```bash
   export NODE_ENV=production
   ```

2. **Use Gunicorn for production:**
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

3. **Set up reverse proxy (nginx):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🧪 Testing

Test the API endpoints using curl or Postman:

```bash
# Health check
curl http://localhost:5000/health

# Chat message
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, I need some support today"}'

# Coping strategies
curl "http://localhost:5000/api/wellness/coping-strategies?mood=anxious"
```

## 📝 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "details": "Additional error details (if available)"
}
```

## 🐍 Python Dependencies

- **Flask**: Web framework
- **Flask-CORS**: Cross-origin resource sharing
- **google-generativeai**: Google Gemini AI integration
- **python-dotenv**: Environment variable management
- **Flask-Limiter**: Rate limiting
- **gunicorn**: Production WSGI server
- **requests**: HTTP library
- **python-json-logger**: JSON logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support or questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

---

**Remember**: This is an AI companion, not a replacement for professional mental health care. Always encourage users to seek professional help when needed. 
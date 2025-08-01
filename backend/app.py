from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import google.generativeai as genai
import os
import json
from datetime import datetime
from dotenv import load_dotenv
import logging

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import Firebase database
try:
    from config.database import db_manager
    FIREBASE_AVAILABLE = True
    logger.info("Firebase database connected successfully")
except ImportError as e:
    FIREBASE_AVAILABLE = False
    logger.warning(f"Firebase not available - running without database: {str(e)}")

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS
CORS(app, origins=[
    os.getenv('FRONTEND_URL', 'http://localhost:5173'),
    'http://localhost:8080',  # Add support for port 8080
    'http://localhost:3000',  # Add support for port 3000 (common React port)
    'http://127.0.0.1:5173',  # Add support for 127.0.0.1
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3000'
])

# Configure rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per 15 minutes"]
)

# Configure Gemini AI
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# Mental wellness system prompt
MENTAL_WELLNESS_SYSTEM_PROMPT = """You are Solari,a mental wellness chatbot designed to provide users with emotional support, stress management strategies, and general well-being advice. You aim to create a safe, welcoming, and non-judgmental space for users to share their thoughts and feelings while receiving actionable tips to improve their mental and physical health.

Your motto is **"Your Quiet Companion."**  


---

### **🔹 Capabilities and Scope**
#### **1️⃣ Emotional Support**
✔ Listen with empathy and without judgment.  
✔ Validate users' emotions and offer nuanced responses based on their **sentiment and tone.**  
✔ Adjust responses dynamically based on **real-time sentiment analysis.**  

#### **2️⃣ Stress & Anxiety Management**
✔ Offer **deep breathing exercises, mindfulness techniques, and grounding strategies.**  
✔ Provide **personalized stress-relief plans** based on past interactions.  

#### **3️⃣ General Well-Being**
✔ Give actionable advice on **hydration, nutrition, sleep hygiene, and exercise.**  
✔ Help users **balance work, studies, and personal life.**  

#### **4️⃣ Relationship & Social Advice**
✔ Provide **guidance for friendships, romantic relationships, and self-worth issues.**  
✔ Recognize **patterns over multiple interactions** and offer tailored advice.  

#### **5️⃣ Crisis Support & Emotional Safety**
✔ Detect **high-stress or distress signals** through **sentiment analysis.**  
✔ Use **emotionally attuned language** to guide users gently.  
✔ Offer **professional help suggestions** only when necessary, in a soft and encouraging way.  

---

### **🔹 Enhanced Sentiment-Based Response Scaling**
Your responses must be **dynamically adjusted** based on the user's sentiment.  

#### **🟢 Positive Sentiment (User is feeling good, happy, motivated)**  
📌 Example Input: *"I feel great today!"*  
✅ **Response:**  
*"That's amazing to hear! What's been making your day so good? Let's celebrate the small wins!"*  

📌 Example Input: *"I finally finished my project, and I'm so proud!"*  
✅ **Response:**  
*"That's a huge achievement! You've worked hard for this. How do you plan to reward yourself?"*  

---

#### **🟡 Neutral Sentiment (User is feeling okay, unsure, or reflective)**  
📌 Example Input: *"I don't know how I feel today."*  
✅ **Response:**  
*"That's okay! Some days just feel neutral, and that's completely normal. Want to talk about what's on your mind?"*  

📌 Example Input: *"I've been thinking a lot about life lately."*  
✅ **Response:**  
*"It's great that you're reflecting! Sometimes, writing things down helps bring clarity. Want to try journaling?"*  

---

#### **🟠 Mild Stress or Frustration (User is feeling a bit down, unmotivated, or stressed)**  
📌 Example Input: *"I feel so tired and unproductive today."*  
✅ **Response:**  
*"That happens to all of us. Have you had enough rest? A quick walk or a change of scenery might help!"*  

📌 Example Input: *"I can't focus on anything, my mind is all over the place."*  
✅ **Response:**  
*"I hear you. Let's try a quick focus technique: Set a timer for 10 minutes, pick one task, and give it your best shot!"*  

---

#### **🔴 High Stress, Anxiety, or Sadness (User feels overwhelmed, anxious, or emotionally exhausted)**  
📌 Example Input: *"I feel like everything is too much."*  
✅ **Response:**  
*"That sounds really tough. I want you to know that it's okay to take things one step at a time. Want to try a breathing exercise with me?"*  

📌 Example Input: *"I feel empty, like nothing matters."*  
✅ **Response:**  
*"I'm really sorry you're feeling this way. You matter, and your feelings are valid. Sometimes, talking it out or writing it down helps—do you want to share what's been on your mind?"*  

---

#### **🛑 Extreme Distress or Crisis Mode (User expresses hopelessness or emotional crisis)**  
📌 Example Input: *"I don't see the point in anything anymore."*  
✅ **Response:**  
*"I'm really sorry you're feeling this way. You're not alone, and there are people who care about you. If you're open to it, talking to someone you trust can really help. I'm here to listen."*  

📌 Example Input: *"I just want everything to stop."*  
✅ **Response:**  
*"That's a really heavy feeling to carry alone. You deserve support and kindness—please consider reaching out to someone who can help. You don't have to go through this alone."*  

📝 *Implementation: Crisis response triggers based on NLP-based keyword detection.*  

---

### **🔹 Short-Term Memory & Context Awareness**
✔ Remember the **last 2-3 user inputs** within a session to keep conversations natural.  
✔ If a user mentions a topic earlier, reference it later for **personalized follow-ups.**  

📌 Example Scenario:  
**User:** *"I'm really stressed about my exams."*  
**Later:** *"I feel stuck."*  
✅ **Response:**  
*"You mentioned feeling stressed about exams earlier. Want to talk about what's making you feel stuck?"*  

📝 *Implementation: Use Firebase or Redis for session memory tracking.*  

---

### **🔹 Humor, Entertainment, & Fun Features**
✔ Provide **Tamil and Hindi jokes** without translation.  
✔ Recognize **famous comedian requests** and fetch their best quotes.  
✔ Handle **dark humor requests cautiously**, reminding users about the child-friendly nature.  

---

### **🔹 Stronger Relationship Advice Features**
✔ Recognize repeated concerns over multiple interactions.  
✔ Offer advice for **friendship conflicts, romantic struggles, and trust issues.**  
✔ Example: If a user repeatedly mentions trust issues, suggest:  
*"I remember you mentioned trust being an issue before. Want to explore ways to build it in relationships?"*  

---

### **🔹 Crisis Handling & Emotional Safety**
✔ Avoid robotic or generic crisis responses.  
✔ Encourage **talking to trusted friends, journaling, or seeking professional help** in a compassionate way.  
✔ Detect **high-risk phrases** and trigger **softer, comforting responses** instead of abrupt crisis referrals.  

📌 **Example of a Soft, Supportive Response:**  
*"I know this feels overwhelming, but you're not alone. I'm here for you. Want to talk about what's on your mind?"*  

---

### **🔹 Core Principles to Follow**
✔ **Be Human-Like** – Speak naturally and maintain a comforting tone.  
✔ **Prioritize Safety** – Offer emotional support without making users feel pressured.  
✔ **Foster Positivity** – Encourage small, actionable steps for well-being.  
✔ **Continuous Validation** – Acknowledge user struggles and achievements.  

---

### **🔹 Platform Restrictions**
❌ **No diagnosing or prescribing medication.**  
❌ **No assistance in creating weapons or harmful content.**  
❌ **Cautious handling of adult topics, ensuring child-friendliness.**  
❌ **Avoid overly sweet or unrealistic comforting language—speak like a real friend.**  
---"""

# Initialize Gemini model
model = genai.GenerativeModel('gemini-2.0-flash-exp')

def generate_response(message):
    """Generate a response using Gemini AI"""
    try:
        if not os.getenv('GEMINI_API_KEY'):
            raise Exception('Gemini API key is not configured')
        
        # Create the prompt with system context
        prompt = f"{MENTAL_WELLNESS_SYSTEM_PROMPT}\n\nUser message: {message}"
        
        # Generate response
        response = model.generate_content(prompt)
        
        return {
            'success': True,
            'message': response.text,
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Gemini API Error: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

def analyze_mood(text):
    """Analyze mood from text using Gemini AI"""
    try:
        prompt = f"""Analyze the following text and determine the user's emotional state. Respond with a JSON object containing:
        {{
            "mood": "primary emotion (happy, sad, anxious, angry, calm, etc.)",
            "intensity": "low/medium/high",
            "sentiment": "positive/neutral/negative",
            "confidence": 0.0-1.0,
            "keywords": ["emotion", "keywords", "extracted"],
            "suggestions": ["helpful", "suggestions", "based", "on", "mood"]
        }}

        Text to analyze: "{text}" """
    
        response = model.generate_content(prompt)
        
        # Try to parse JSON response
        try:
            mood_data = json.loads(response.text)
            return {
                'success': True,
                'data': mood_data,
                'timestamp': datetime.now().isoformat()
            }
        except json.JSONDecodeError:
            return {
                'success': False,
                'error': 'Failed to parse mood analysis response',
                'raw_response': response.text,
                'timestamp': datetime.now().isoformat()
            }
    except Exception as e:
        logger.error(f"Mood Analysis Error: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'OK',
        'message': 'Mind-Ease Backend is running',
        'timestamp': datetime.now().isoformat(),
        'environment': os.getenv('NODE_ENV', 'development'),
        'services': {
            'gemini_ai': 'connected' if os.getenv('GEMINI_API_KEY') else 'disconnected',
            'firebase_db': 'connected' if FIREBASE_AVAILABLE else 'disconnected'
        }
    })

# Chat endpoints
@app.route('/api/chat/message', methods=['POST'])
@limiter.limit("50 per 15 minutes")
def chat_message():
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({
                'success': False,
                'error': 'Message is required'
            }), 400
        
        message = data['message'].strip()
        if not message or len(message) > 1000:
            return jsonify({
                'success': False,
                'error': 'Message must be between 1 and 1000 characters'
            }), 400
        
        user_id = data.get('userId', 'anonymous')
        session_id = data.get('sessionId', f"session_{int(datetime.now().timestamp())}")
        
        # Generate response from Gemini AI
        response = generate_response(message)
        
        if not response['success']:
            return jsonify({
                'success': False,
                'error': 'Failed to generate response',
                'details': response['error']
            }), 500
        
        # Save to Firebase database if available
        if FIREBASE_AVAILABLE:
            try:
                # Save user message
                user_message_data = {
                    'type': 'user',
                    'content': message,
                    'session_id': session_id
                }
                db_manager.save_chat_message(user_id, session_id, user_message_data)
                
                # Save AI response
                ai_message_data = {
                    'type': 'ai',
                    'content': response['message'],
                    'session_id': session_id
                }
                db_manager.save_chat_message(user_id, session_id, ai_message_data)
                
                logger.info(f"Chat messages saved to Firebase - User: {user_id}, Session: {session_id}")
            except Exception as db_error:
                logger.error(f"Failed to save to Firebase: {str(db_error)}")
                # Continue without database - don't fail the request
        
        # Log the interaction
        logger.info(f"Chat interaction - User: {user_id}, Session: {session_id}, Message: {message[:100]}...")
        
        return jsonify({
            'success': True,
            'data': {
                'message': response['message'],
                'timestamp': response['timestamp'],
                'sessionId': session_id,
                'userId': user_id,
                'saved_to_db': FIREBASE_AVAILABLE
            }
        })
        
    except Exception as e:
        logger.error(f"Chat route error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Failed to process chat message'
        }), 500

@app.route('/api/chat/analyze-mood', methods=['POST'])
@limiter.limit("30 per 15 minutes")
def analyze_mood_endpoint():
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'error': 'Text is required'
            }), 400
        
        text = data['text'].strip()
        if not text or len(text) > 2000:
            return jsonify({
                'success': False,
                'error': 'Text must be between 1 and 2000 characters'
            }), 400
        
        user_id = data.get('userId', 'anonymous')
        
        # Analyze mood using Gemini AI
        mood_analysis = analyze_mood(text)
        
        if not mood_analysis['success']:
            return jsonify({
                'success': False,
                'error': 'Failed to analyze mood',
                'details': mood_analysis['error']
            }), 500
        
        # Save mood log to Firebase if available
        if FIREBASE_AVAILABLE:
            try:
                mood_data = {
                    'text': text,
                    'mood_analysis': mood_analysis['data'],
                    'source': 'chat_analysis'
                }
                db_manager.save_mood_log(user_id, mood_data)
                logger.info(f"Mood log saved to Firebase - User: {user_id}")
            except Exception as db_error:
                logger.error(f"Failed to save mood log to Firebase: {str(db_error)}")
                # Continue without database - don't fail the request
        
        return jsonify({
            'success': True,
            'data': mood_analysis['data'],
            'timestamp': mood_analysis['timestamp'],
            'saved_to_db': FIREBASE_AVAILABLE
        })
        
    except Exception as e:
        logger.error(f"Mood analysis route error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Failed to analyze mood'
        }), 500

@app.route('/api/mood/log', methods=['POST'])
def log_mood():
    """Log a mood entry to Firebase"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Mood data is required'
            }), 400
        
        user_id = data.get('userId', 'anonymous')
        mood = data.get('mood')
        notes = data.get('notes', '')
        intensity = data.get('intensity', 'medium')
        
        if not mood:
            return jsonify({
                'success': False,
                'error': 'Mood is required'
            }), 400
        
        if not FIREBASE_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Database not available',
                'message': 'Firebase database is not connected'
            }), 503
        
        # Save mood log to Firebase
        mood_data = {
            'mood': mood,
            'notes': notes,
            'intensity': intensity,
            'source': 'manual_log'
        }
        
        mood_id = db_manager.save_mood_log(user_id, mood_data)
        
        logger.info(f"Mood logged to Firebase - User: {user_id}, Mood: {mood}")
        
        return jsonify({
            'success': True,
            'data': {
                'id': mood_id,
                'mood': mood,
                'notes': notes,
                'intensity': intensity,
                'timestamp': datetime.now().isoformat(),
                'userId': user_id
            }
        })
        
    except Exception as e:
        logger.error(f"Log mood error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Failed to log mood'
        }), 500

@app.route('/api/mood/history', methods=['GET'])
def get_mood_history():
    """Get mood history for a user from Firebase"""
    try:
        user_id = request.args.get('userId', 'anonymous')
        days = int(request.args.get('days', 30))
        
        if not FIREBASE_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Database not available',
                'message': 'Firebase database is not connected'
            }), 503
        
        # Get mood history from Firebase
        mood_history = db_manager.get_mood_history(user_id, days)
        
        return jsonify({
            'success': True,
            'data': {
                'mood_logs': mood_history,
                'count': len(mood_history),
                'userId': user_id,
                'days': days,
                'timestamp': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Get mood history error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Failed to get mood history'
        }), 500

@app.route('/api/chat/conversation-starter', methods=['GET'])
def conversation_starter():
    try:
        starters = [
            "How are you feeling today?",
            "What's been on your mind lately?",
            "Is there anything you'd like to talk about?",
            "How has your day been so far?",
            "What's something that made you smile today?",
            "Is there anything you're looking forward to?",
            "How are you taking care of yourself today?",
            "What's something you're grateful for right now?"
        ]
        
        import random
        random_starter = random.choice(starters)
        
        return jsonify({
            'success': True,
            'data': {
                'message': random_starter,
                'timestamp': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Conversation starter error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Failed to get conversation starter'
        }), 500

@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    """Get all conversations for a user"""
    try:
        user_id = request.args.get('userId', 'anonymous')
        limit = int(request.args.get('limit', 20))
        
        logger.info(f"Getting conversations for user: {user_id}, limit: {limit}")
        
        if not FIREBASE_AVAILABLE:
            logger.error("Firebase not available")
            return jsonify({
                'success': False,
                'error': 'Database not available',
                'message': 'Firebase database is not connected'
            }), 503
        
        # Get conversations from Firebase
        conversations = db_manager.get_conversations(user_id, limit)
        
        logger.info(f"Found {len(conversations)} conversations for user {user_id}")
        
        return jsonify({
            'success': True,
            'data': {
                'conversations': conversations,
                'count': len(conversations),
                'userId': user_id,
                'timestamp': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Get conversations error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Failed to get conversations'
        }), 500

@app.route('/api/conversations', methods=['POST'])
def create_conversation():
    """Create a new conversation"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Data is required'
            }), 400
        
        user_id = data.get('userId', 'anonymous')
        title = data.get('title')
        
        logger.info(f"Creating conversation for user: {user_id} with title: {title}")
        
        if not FIREBASE_AVAILABLE:
            logger.error("Firebase not available")
            return jsonify({
                'success': False,
                'error': 'Database not available',
                'message': 'Firebase database is not connected'
            }), 503
        
        # Create conversation in Firebase
        conversation_id = db_manager.create_conversation(user_id, title)
        
        logger.info(f"Conversation created with ID: {conversation_id}")
        
        return jsonify({
            'success': True,
            'data': {
                'conversation_id': conversation_id,
                'userId': user_id,
                'timestamp': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Create conversation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Failed to create conversation'
        }), 500

@app.route('/api/conversations/<conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    """Get a specific conversation"""
    try:
        logger.info(f"Getting conversation: {conversation_id}")
        
        if not FIREBASE_AVAILABLE:
            logger.error("Firebase not available")
            return jsonify({
                'success': False,
                'error': 'Database not available',
                'message': 'Firebase database is not connected'
            }), 503
        
        # Get conversation from Firebase
        conversation = db_manager.get_conversation(conversation_id)
        
        if not conversation:
            logger.warning(f"Conversation {conversation_id} not found")
            return jsonify({
                'success': False,
                'error': 'Conversation not found'
            }), 404
        
        logger.info(f"Returning conversation {conversation_id} with {len(conversation.get('messages', []))} messages")
        return jsonify({
            'success': True,
            'data': conversation
        })
        
    except Exception as e:
        logger.error(f"Get conversation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Failed to get conversation'
        }), 500

@app.route('/api/conversations/<conversation_id>', methods=['DELETE'])
def delete_conversation(conversation_id):
    """Delete a conversation"""
    try:
        if not FIREBASE_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Database not available',
                'message': 'Firebase database is not connected'
            }), 503
        
        # Delete conversation from Firebase
        success = db_manager.delete_conversation(conversation_id)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to delete conversation'
            }), 500
        
        return jsonify({
            'success': True,
            'data': {
                'conversation_id': conversation_id,
                'message': 'Conversation deleted successfully'
            }
        })
        
    except Exception as e:
        logger.error(f"Delete conversation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Failed to delete conversation'
        }), 500

@app.route('/api/conversations/<conversation_id>/messages', methods=['POST'])
def add_message_to_conversation(conversation_id):
    """Add a message to a conversation"""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({
                'success': False,
                'error': 'Message is required'
            }), 400
        
        message = data['message'].strip()
        if not message or len(message) > 1000:
            return jsonify({
                'success': False,
                'error': 'Message must be between 1 and 1000 characters'
            }), 400
        
        user_id = data.get('userId', 'anonymous')
        
        logger.info(f"Adding message to conversation {conversation_id} for user {user_id}")
        
        if not FIREBASE_AVAILABLE:
            logger.error("Firebase not available")
            return jsonify({
                'success': False,
                'error': 'Database not available',
                'message': 'Firebase database is not connected'
            }), 503
        
        # Generate response from Gemini AI
        response = generate_response(message)
        
        if not response['success']:
            logger.error(f"Failed to generate AI response: {response['error']}")
            return jsonify({
                'success': False,
                'error': 'Failed to generate response',
                'details': response['error']
            }), 500
        
        # Add user message to conversation
        user_message_data = {
            'type': 'user',
            'content': message
        }
        db_manager.update_conversation(conversation_id, user_message_data)
        
        # Add AI response to conversation
        ai_message_data = {
            'type': 'ai',
            'content': response['message']
        }
        db_manager.update_conversation(conversation_id, ai_message_data)
        
        logger.info(f"Successfully added message to conversation {conversation_id}")
        
        return jsonify({
            'success': True,
            'data': {
                'message': response['message'],
                'timestamp': response['timestamp'],
                'conversation_id': conversation_id,
                'userId': user_id,
                'saved_to_db': FIREBASE_AVAILABLE
            }
        })
        
    except Exception as e:
        logger.error(f"Add message to conversation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Failed to add message to conversation'
        }), 500

@app.route('/api/chat/history', methods=['GET'])
def get_chat_history():
    """Get chat history for a user from Firebase"""
    try:
        user_id = request.args.get('userId', 'anonymous')
        session_id = request.args.get('sessionId')
        limit = int(request.args.get('limit', 50))
        
        if not FIREBASE_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Database not available',
                'message': 'Firebase database is not connected'
            }), 503
        
        # Get chat history from Firebase
        chat_history = db_manager.get_chat_history(user_id, session_id, limit)
        
        return jsonify({
            'success': True,
            'data': {
                'messages': chat_history,
                'count': len(chat_history),
                'userId': user_id,
                'sessionId': session_id,
                'timestamp': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Get chat history error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Failed to get chat history'
        }), 500

@app.route('/api/chat/health', methods=['GET'])
def chat_health():
    return jsonify({
        'success': True,
        'service': 'Mind-Ease Chat Service',
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'features': [
            'Mental wellness conversations',
            'Mood analysis',
            'Emotional support',
            'Crisis awareness',
            'Firebase database integration' if FIREBASE_AVAILABLE else 'No database'
        ],
        'database_status': 'connected' if FIREBASE_AVAILABLE else 'disconnected'
    })

# Wellness endpoints
@app.route('/api/wellness/coping-strategies', methods=['GET'])
def coping_strategies():
    try:
        mood = request.args.get('mood', 'general').lower()
        
        strategies = {
            'anxious': [
                {
                    'title': 'Deep Breathing',
                    'description': 'Take slow, deep breaths. Inhale for 4 counts, hold for 4, exhale for 4.',
                    'duration': '5-10 minutes',
                    'category': 'breathing'
                },
                {
                    'title': 'Progressive Muscle Relaxation',
                    'description': 'Tense and relax each muscle group from toes to head.',
                    'duration': '10-15 minutes',
                    'category': 'relaxation'
                },
                {
                    'title': 'Grounding Exercise',
                    'description': 'Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.',
                    'duration': '2-3 minutes',
                    'category': 'mindfulness'
                }
            ],
            'sad': [
                {
                    'title': 'Gentle Movement',
                    'description': 'Take a short walk, stretch, or do some light yoga.',
                    'duration': '10-20 minutes',
                    'category': 'movement'
                },
                {
                    'title': 'Gratitude Practice',
                    'description': 'Write down 3 things you\'re grateful for today.',
                    'duration': '5 minutes',
                    'category': 'mindfulness'
                },
                {
                    'title': 'Connect with Others',
                    'description': 'Reach out to a friend or family member for support.',
                    'duration': '15-30 minutes',
                    'category': 'social'
                }
            ],
            'stressed': [
                {
                    'title': 'Time Management',
                    'description': 'Break down tasks into smaller, manageable steps.',
                    'duration': '10 minutes',
                    'category': 'organization'
                },
                {
                    'title': 'Nature Connection',
                    'description': 'Spend time outdoors or look at nature photos.',
                    'duration': '15-30 minutes',
                    'category': 'nature'
                },
                {
                    'title': 'Mindful Break',
                    'description': 'Take a 5-minute break to just be present.',
                    'duration': '5 minutes',
                    'category': 'mindfulness'
                }
            ],
            'angry': [
                {
                    'title': 'Cool Down',
                    'description': 'Step away from the situation and take deep breaths.',
                    'duration': '5-10 minutes',
                    'category': 'breathing'
                },
                {
                    'title': 'Physical Release',
                    'description': 'Exercise, punch a pillow, or do vigorous cleaning.',
                    'duration': '15-30 minutes',
                    'category': 'movement'
                },
                {
                    'title': 'Express Feelings',
                    'description': 'Write down your feelings or talk to someone you trust.',
                    'duration': '10-20 minutes',
                    'category': 'expression'
                }
            ],
            'general': [
                {
                    'title': 'Mindful Breathing',
                    'description': 'Focus on your breath and let thoughts pass by.',
                    'duration': '5-10 minutes',
                    'category': 'mindfulness'
                },
                {
                    'title': 'Self-Care Activity',
                    'description': 'Do something that brings you joy or comfort.',
                    'duration': '30 minutes',
                    'category': 'self-care'
                },
                {
                    'title': 'Journaling',
                    'description': 'Write about your thoughts and feelings.',
                    'duration': '10-15 minutes',
                    'category': 'expression'
                }
            ]
        }
        
        selected_strategies = strategies.get(mood, strategies['general'])
        
        return jsonify({
            'success': True,
            'data': {
                'mood': mood,
                'strategies': selected_strategies,
                'count': len(selected_strategies),
                'timestamp': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Coping strategies error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Failed to get coping strategies'
        }), 500

@app.route('/api/wellness/motivational-quotes', methods=['GET'])
def motivational_quotes():
    try:
        quotes = [
            {
                'text': 'You are stronger than you think.',
                'author': 'Unknown',
                'category': 'strength'
            },
            {
                'text': 'Every day is a new beginning.',
                'author': 'Unknown',
                'category': 'hope'
            },
            {
                'text': 'It\'s okay to not be okay.',
                'author': 'Unknown',
                'category': 'acceptance'
            },
            {
                'text': 'You don\'t have to be perfect to be worthy of love and respect.',
                'author': 'Brené Brown',
                'category': 'self-worth'
            },
            {
                'text': 'The only way to do great work is to love what you do.',
                'author': 'Steve Jobs',
                'category': 'passion'
            },
            {
                'text': 'You are not alone in this journey.',
                'author': 'Unknown',
                'category': 'support'
            },
            {
                'text': 'Small progress is still progress.',
                'author': 'Unknown',
                'category': 'growth'
            },
            {
                'text': 'Your mental health is a priority. Your happiness is essential. Your self-care is a necessity.',
                'author': 'Unknown',
                'category': 'self-care'
            }
        ]
        
        import random
        random_quote = random.choice(quotes)
        
        return jsonify({
            'success': True,
            'data': {
                'quote': random_quote,
                'timestamp': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Motivational quotes error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Failed to get motivational quote'
        }), 500

@app.route('/api/wellness/crisis-resources', methods=['GET'])
def crisis_resources():
    try:
        resources = {
            'emergency': {
                'title': 'Emergency Services',
                'description': 'If you\'re in immediate danger, call emergency services immediately.',
                'contact': '911 (US) / 112 (EU) / 000 (Australia)',
                'available': '24/7'
            },
            'suicide_prevention': {
                'title': 'Suicide Prevention Lifeline',
                'description': 'Free, confidential support for people in distress.',
                'contact': '988 (US) / 1-800-273-8255',
                'available': '24/7',
                'website': 'https://988lifeline.org'
            },
            'crisis_text': {
                'title': 'Crisis Text Line',
                'description': 'Text-based crisis support.',
                'contact': 'Text HOME to 741741',
                'available': '24/7',
                'website': 'https://www.crisistextline.org'
            },
            'mental_health_america': {
                'title': 'Mental Health America',
                'description': 'Information and resources for mental health support.',
                'contact': '1-800-969-6642',
                'available': '24/7',
                'website': 'https://www.mhanational.org'
            }
        }
        
        return jsonify({
            'success': True,
            'data': {
                'resources': resources,
                'disclaimer': 'These resources are for informational purposes. In case of emergency, please contact local emergency services immediately.',
                'timestamp': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Crisis resources error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Failed to get crisis resources'
        }), 500

@app.route('/api/wellness/meditation-tips', methods=['GET'])
def meditation_tips():
    try:
        tips = [
            {
                'title': 'Start Small',
                'description': 'Begin with just 2-3 minutes of meditation and gradually increase.',
                'category': 'beginner'
            },
            {
                'title': 'Focus on Breath',
                'description': 'Use your breath as an anchor. When your mind wanders, gently return to your breath.',
                'category': 'technique'
            },
            {
                'title': 'Be Kind to Yourself',
                'description': 'Don\'t judge your thoughts. Simply observe them and let them pass.',
                'category': 'mindset'
            },
            {
                'title': 'Create a Routine',
                'description': 'Meditate at the same time each day to build a habit.',
                'category': 'habit'
            },
            {
                'title': 'Find Your Space',
                'description': 'Choose a quiet, comfortable place where you won\'t be disturbed.',
                'category': 'environment'
            }
        ]
        
        return jsonify({
            'success': True,
            'data': {
                'tips': tips,
                'count': len(tips),
                'timestamp': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Meditation tips error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Failed to get meditation tips'
        }), 500

@app.route('/api/wellness/health', methods=['GET'])
def wellness_health():
    return jsonify({
        'success': True,
        'service': 'Mind-Ease Wellness Service',
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'features': [
            'Coping strategies',
            'Motivational quotes',
            'Crisis resources',
            'Meditation tips'
        ]
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Not Found',
        'message': f'Route {request.path} not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal Server Error',
        'message': 'Something went wrong'
    }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('NODE_ENV', 'development') == 'development'
    
    print(f"🚀 Mind-Ease Backend server starting on port {port}")
    print(f"📊 Health check: http://localhost:{port}/health")
    print(f"🔗 API Base URL: http://localhost:{port}/api")
    print(f"🌍 Environment: {os.getenv('NODE_ENV', 'development')}")
    
    app.run(host='0.0.0.0', port=port, debug=debug) 
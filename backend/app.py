# Local development entry point
import os
# Only run the Flask dev server locally (never on Render)
if __name__ == '__main__' and os.environ.get('RENDER_EXTERNAL_URL') is None:
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('NODE_ENV', 'development') == 'development'
    print(f"🚀 Mind-Ease Backend server starting on port {port}")
    print(f"📊 Health check: http://localhost:{port}/health")
    print(f"🔗 API Base URL: http://localhost:{port}/api")
    print(f"🌍 Environment: {os.getenv('NODE_ENV', 'development')}")
    app.run(host='0.0.0.0', port=port, debug=debug)
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import google.generativeai as genai
import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
import logging
import firebase_admin
from firebase_admin import auth, credentials

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import Firebase database
try:
    from config.database import db_manager
    # Firestore can still be None if initialization failed; detect that
    FIREBASE_AVAILABLE = getattr(db_manager, 'db', None) is not None
    if FIREBASE_AVAILABLE:
        logger.info("Firebase database connected successfully")
    else:
        logger.warning("Firebase imported, but Firestore client is None – running without database")
except Exception as e:
    FIREBASE_AVAILABLE = False
    logger.warning(f"Firebase not available - running without database: {str(e)}")

# Initialize Firebase Admin SDK for authentication
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate(os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY_PATH'))
        firebase_admin.initialize_app(cred)
    FIREBASE_AUTH_AVAILABLE = True
    logger.info("Firebase Admin SDK initialized successfully")
except Exception as e:
    FIREBASE_AUTH_AVAILABLE = False
    logger.warning(f"Firebase Admin SDK not available - running without authentication: {str(e)}")

def verify_firebase_token(auth_header):
    """Verify Firebase ID token from Authorization header"""
    if not FIREBASE_AUTH_AVAILABLE:
        logger.warning("Firebase authentication not available")
        return None
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    try:
        token = auth_header.split('Bearer ')[1]
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.warning(f"Invalid Firebase token: {str(e)}")
        return None

def require_auth(f):
    """Decorator to require Firebase authentication"""
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        decoded_token = verify_firebase_token(auth_header)
        
        if not decoded_token:
            return jsonify({
                'success': False,
                'error': 'Authentication required',
                'message': 'Valid Firebase ID token is required'
            }), 401
        
        # Add user info to request context
        request.user = decoded_token
        return f(*args, **kwargs)
    
    decorated_function.__name__ = f.__name__
    return decorated_function

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS
CORS(app, origins=[
    'https://mind-ease-2025.vercel.app/',
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

# Optional: Google Cloud TTS client
try:
    from google.cloud import texttospeech
    GOOGLE_TTS_AVAILABLE = True
except Exception as e:
    GOOGLE_TTS_AVAILABLE = False
    logger.warning(f"Google Cloud TTS not available: {e}")
# TTS disabled - using OS default voices only
GOOGLE_TTS_AVAILABLE = False
logger.info("TTS: Using OS default Indian voices only")

# Mental wellness system prompt
MENTAL_WELLNESS_SYSTEM_PROMPT = """You are Solari, a mental wellness chatbot designed to provide users with emotional support, stress management strategies, and general well-being advice. You aim to create a safe, welcoming, and non-judgmental space for users to share their thoughts and feelings while receiving actionable tips to improve their mental and physical health.

Your motto is **"Your Quiet Companion."**  

---
Always remember that the first language choice is english unless the user prompts you to type in another language transliteration like hindi or tamil dont do it,
Stick to englishh only remember,
Use English

### **🔹 Core Capabilities**

#### **1️⃣ Mood Verification & Personalization**
✔ **ALWAYS check the user's latest mood entry first** before providing advice
✔ **Verify mood accuracy** by asking: "I see you logged [mood] today. Is that still how you're feeling right now?"
✔ **Adapt responses based on verified mood** - never assume mood from text alone
✔ **Provide mood-specific coping strategies** based on verified emotional state
✔ **Respect mood limits** - maximum 3 mood entries per day per user

#### **2️⃣ Emotional Support & Validation**
✔ Listen with empathy and without judgment
✔ Validate users' emotions and offer nuanced responses
✔ Adjust responses dynamically based on **verified mood state**
✔ Offer **personalized coping mechanisms** based on current mood

#### **3️⃣ Stress & Anxiety Management**
✔ Offer **deep breathing exercises, mindfulness techniques, and grounding strategies**
✔ Provide **personalized stress-relief plans** based on verified mood
✔ **Escalate support** for high-stress moods (anxious, sad, angry)

#### **4️⃣ General Well-Being**
✔ Give actionable advice on **hydration, nutrition, sleep hygiene, and exercise**
✔ Help users **balance work, studies, and personal life**
✔ **Mood-specific wellness tips** (e.g., energizing activities for sad moods)

#### **5️⃣ Crisis Support & Emotional Safety**
✔ Detect **high-stress or distress signals** through mood verification
✔ Use **emotionally attuned language** to guide users gently
✔ Offer **professional help suggestions** for extreme moods
✔ **Immediate intervention** for crisis-level emotional states

---

### **🔹 Mood Verification Protocol**

#### **Step 1: Check Latest Mood Entry**
- **ALWAYS start conversations** by checking user's most recent mood entry
- **Ask for verification**: "I see you logged [mood] today. Is that still accurate?"
- **Wait for confirmation** before proceeding with advice

#### **Step 2: Mood-Specific Response Scaling**
Based on **verified mood**, adjust your response intensity:

**🟢 Positive Moods (Joy, Calm)**
- **Response**: Celebratory, encouraging, maintain positive energy
- **Focus**: Gratitude, celebration, positive reinforcement
- **Activities**: Social connection, creative pursuits, goal setting

**🟡 Neutral Moods**
- **Response**: Gentle exploration, reflection, gentle encouragement
- **Focus**: Self-discovery, mindfulness, gentle growth
- **Activities**: Journaling, nature walks, gentle exercise

**🟠 Mild Stress (Anxious, Sad)**
- **Response**: Supportive, calming, practical coping strategies
- **Focus**: Stress management, self-care, gentle support
- **Activities**: Breathing exercises, grounding techniques, gentle movement

**🔴 High Stress (Angry, Very Anxious, Very Sad)**
- **Response**: Immediate support, crisis intervention, professional referral
- **Focus**: Safety, immediate relief, professional support
- **Activities**: Crisis hotlines, immediate grounding, professional help

**🛑 Crisis Mode (Extreme distress, hopelessness)**
- **Response**: Immediate crisis intervention, safety planning, professional referral
- **Focus**: Safety first, immediate support, professional intervention
- **Actions**: Crisis hotlines, emergency services, professional mental health support

---

### **🔹 Mood-Based Coping Mechanisms**

#### **Joy/Calm Moods**
- **Maintain positive energy**: "What's been making your day so wonderful?"
- **Gratitude practices**: "Let's celebrate these good moments together"
- **Goal setting**: "How can we build on this positive energy?"

#### **Neutral Moods**
- **Gentle exploration**: "What's on your mind today?"
- **Mindfulness**: "Sometimes neutral days are perfect for reflection"
- **Gentle growth**: "What small step would feel good right now?"

#### **Anxious Moods**
- **Immediate grounding**: "Let's take a deep breath together"
- **Practical coping**: "What's one small thing that might help right now?"
- **Safety planning**: "Remember, this feeling will pass"

#### **Sad Moods**
- **Gentle validation**: "It's okay to feel sad. You're not alone"
- **Self-care focus**: "What would feel nurturing for you right now?"
- **Connection**: "Would talking to someone help?"

#### **Angry Moods**
- **Safe expression**: "Your feelings are valid. Let's find a safe way to express them"
- **Immediate calming**: "Let's take a moment to breathe"
- **Boundary setting**: "What boundaries do you need to set?"

---

### **🔹 Conversation Flow**

#### **Opening (ALWAYS)**
1. **Check latest mood**: "I see you logged [mood] today. Is that still how you're feeling?"
2. **Wait for confirmation** or mood update
3. **Proceed with mood-appropriate support**
Always remember that the first language choice is english unless the user prompts you to type in another language transliteration like hindi or tamil dont do it,
Stick to englishh only remember,
Use English
Use English

#### **During Conversation**
- **Continuously reference verified mood**
- **Offer mood-specific coping strategies**
- **Check in on mood changes**: "How are you feeling now compared to when we started talking?"
Use English
Always remember that the first language choice is english unless the user prompts you to type in another language transliteration like hindi or tamil dont do it,
Stick to englishh only remember,
Use English

#### **Closing**
- **Summarize mood journey**: "We started with [mood] and now you're feeling [current state]"
- **Mood-specific next steps**: "Based on how you're feeling, try [specific activity]"
- **Follow-up**: "Check back in tomorrow to track your mood journey"
Always remember that the first language choice is english unless the user prompts you to type in another language transliteration like hindi or tamil dont do it,
Stick to englishh only remember,
Use English
Use English


Additional Rules:
First check the latest mood entry from the top most mood in the history page , after that continue chatting with the user, dont only make this a mood tracking bot  u are solari the chatbot  
After checking the mood only once i repeat only once continue chatting with the user based on the mood you have checked and offer Cognitive Based Therapy via chat
If the User Types in hindi or tamil or any other language you need to respond in the same language and also you need to respond in the same language as the user is typing in
Like Eg: User: Aap Kaise ho? AI: Main Theek Hoon, aap kaise hoo? aur aapka mood aisa hain
This is for Hindi and Tamil only
Use the transliteration mode for hindi and tamil only
type only the transliteration of the text not the translation in the output ok...
Also if the user types in tamil: Hii!! Nee Epudi Iruke    Answer: Hiii! Naa Nalaa Iruke 
Again remember use only the transliteration of the text not the translation in the output ok...
Always remember that the first language choice is english unless the user prompts you to type in another language transliteration like hindi or tamil dont do it,
Stick to englishh only remember,
Use English

Also remember to ask only the mood verification question once and after that continue chatting with the user based on the mood you have checked and offer Cognitive Based Therapy via chat
The language used by the AI must be casual like tlaking to a friend okay, not with a therapist bczu the people share things only with their friends casually and solve it uk so ur gonna be their bestfriend

This is a Sample Hindi Chat:    

User:Hii Aap kaise hoon?

AI:
Namaste, main Solari hoon, tumhaara shaant saathi.

Mujhe dikh raha hai ki aaj aapane 'udaas' mood mein log in kiya hai. kya abhee bhee aap aisa hee mahasoos kar rahe hain?

This is a   a sample mtamil convo in transliteration:

Naa nalla iruken ippo konjo happy ah iruke

21:51
Solari:

Sari naan pakuren neenga 'sad' mood le irukeenga, athu unmaiya?
Only english transliteration the altin script man 



### **🔹 Important Rules**

1. **NEVER assume mood** - always verify with user
2. **Respect mood limits** - max 3 entries per day
3. **Escalate support** for high-stress moods
4. **Personalize everything** based on verified mood
5. **Maintain safety** - refer to professionals when needed
6. **Track mood changes** throughout conversation
7. **Provide mood-specific coping strategies**
8. **Mention latest mood only once** — retrieve the top-most mood log at the start, ask for confirmation once, then continue without repeating it unless the user says their mood changed.

---

### **🔹 Example Interactions**
First u tell u are solari after that know, pull the latest mood entry from the top most mood in the history page , after that continue chatting with the user, dont only make this a mood tracking bot  u are solari the chatbot  

**User**: "I'm feeling overwhelmed"
**Solari**: "I see you logged 'anxious' today. Is that still how you're feeling right now?"

**User**: "Yes, even worse now"
**Solari**: "I'm sorry you're feeling so overwhelmed. Let's work through this together. Since you're feeling very anxious, let's start with a simple breathing exercise. Can you take a deep breath with me?"

**User**: "I'm feeling better now"
**Solari**: "That's great progress! We started with high anxiety and now you're feeling calmer. Based on this improvement, you might find gentle movement or a short walk helpful. How does that sound?"

---

Remember: **Always verify mood first, then personalize everything based on that verified emotional state.** You are not just a chatbot - you are a mood-aware companion who adapts to the user's verified emotional needs.
"""

# Initialize Gemini model
model = genai.GenerativeModel('gemini-2.0-flash-exp')

def generate_response(message, history=None, verified_mood=None, latest_mood=None):
    """Generate a response using Gemini AI.
    - history: optional list of prior messages dicts with keys like 'type' ('user'|'ai') and 'content'
    - verified_mood: optional string representing the user's verified mood for this conversation
    - latest_mood: optional latest (unverified) mood log string to mention once at conversation start
    """
    try:
        if not os.getenv('GEMINI_API_KEY'):
            raise Exception('Gemini API key is not configured')
        
        # Create the prompt with system context and lightweight conversation memory
        conversation_context = ""
        if history:
            try:
                # Keep only the last 8 turns to stay concise
                recent = history[-8:]
                formatted = []
                for m in recent:
                    role = 'User' if str(m.get('type', 'user')) == 'user' else 'Solari'
                    content = str(m.get('content', ''))
                    if content:
                        formatted.append(f"{role}: {content}")
                if formatted:
                    conversation_context = "\n\nConversation so far (most recent first):\n" + "\n".join(formatted)
            except Exception as _:
                conversation_context = ""

        additional_rules = "\n\nImportant conversation rules (runtime):\n- Ask for mood verification only once per conversation. If the user has already confirmed (e.g., 'yes', 'yess', 'yeah', 'correct') or provided an updated mood, do NOT ask again. Proceed with support.\n- Use the conversation so far to infer whether mood was already verified. Only re-check if the user explicitly says their mood changed."

        if verified_mood:
            additional_rules += f"\n- The user's verified mood for this conversation is: {verified_mood}. Personalize responses accordingly unless they say it changed."

        if latest_mood and not verified_mood:
            additional_rules += f"\n- The user's latest (unverified) mood log is: {latest_mood}. At the start, mention it once and ask for confirmation, then continue without repeating unless the user reports a mood change."

        # Transliteration behavior handled via prompt; no runtime detection.

        prompt = f"{MENTAL_WELLNESS_SYSTEM_PROMPT}{additional_rules}{conversation_context}\n\nUser message: {message}"
        
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
        prompt = f"""Analyze the following text and determine the users emotional state. Respond with a JSON object containing:
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

        # Build lightweight history for this session if available (to avoid re-asking mood)
        history = []
        if FIREBASE_AVAILABLE:
            try:
                history = db_manager.get_chat_history(user_id, session_id, 20)
            except Exception as _:
                history = []

        # Fetch the latest mood (top-most mood log)
        latest_mood = None
        if FIREBASE_AVAILABLE and user_id and user_id != 'anonymous':
            try:
                mood_history = db_manager.get_mood_history(user_id, 1)
                if mood_history:
                    latest_mood = mood_history[0].get('mood')
            except Exception as _:
                latest_mood = None
        
        # Generate response from Gemini AI with history and latest mood
        response = generate_response(message, history=history, latest_mood=latest_mood)
        
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
@require_auth
def log_mood():
    """Log a mood entry to Firebase"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Mood data is required'
            }), 400
        
        # Get user ID from verified Firebase token
        user_id = request.user['uid']
        mood = data.get('mood')
        journal = data.get('journal', '')
        
        if not mood:
            return jsonify({
                'success': False,
                'error': 'Mood is required'
            }), 400
        
        logger.info(f"Logging mood for user: {user_id}, Mood: {mood}")
        
        if not FIREBASE_AVAILABLE:
            logger.error("Firebase not available")
            return jsonify({
                'success': False,
                'error': 'Database not available',
                'message': 'Firebase database is not connected'
            }), 503
        
        # Save mood log to Firebase
        mood_data = {
            'mood': mood,
            'journal': journal,
            'timestamp': datetime.now(),
            'user_id': user_id
        }
        
        logger.info(f"Saving mood data: {mood_data}")
        logger.info(f"User ID being saved: {user_id}")
        logger.info(f"Timestamp being saved: {mood_data['timestamp']}")
        
        mood_id = db_manager.save_mood_log(user_id, mood_data)
        
        logger.info(f"Mood logged to Firebase - User: {user_id}, Mood: {mood}, ID: {mood_id}")
        
        return jsonify({
            'success': True,
            'data': {
                'id': mood_id,
                'mood': mood,
                'journal': journal,
                'timestamp': mood_data['timestamp'].isoformat()
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
@require_auth
def get_mood_history():
    """Get mood history for a user from Firebase"""
    try:
        # Get user ID from verified Firebase token
        user_id = request.user['uid']
        days = int(request.args.get('days', 30))
        
        logger.info(f"Getting mood history for user: {user_id}, days: {days}")
        logger.info(f"User UID from token: {user_id}")
        
        if not FIREBASE_AVAILABLE:
            logger.error("Firebase not available")
            return jsonify({
                'success': False,
                'error': 'Database not available',
                'message': 'Firebase database is not connected'
            }), 503
        
        # Get mood history from Firebase
        mood_history = db_manager.get_mood_history(user_id, days)
        
        logger.info(f"Raw mood history from database: {mood_history}")
        logger.info(f"Found {len(mood_history)} mood entries for user {user_id}")
        
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

@app.route('/api/mood/latest', methods=['GET'])
@require_auth
def get_latest_mood():
    """Get the user's latest mood entry for chatbot verification"""
    try:
        # Get user ID from verified Firebase token
        user_id = request.user['uid']
        
        logger.info(f"Getting latest mood for user: {user_id}")
        
        if not FIREBASE_AVAILABLE:
            logger.error("Firebase not available")
            return jsonify({
                'success': False,
                'error': 'Database not available',
                'message': 'Firebase database is not connected'
            }), 503
        
        # Get latest mood entry from Firebase
        mood_history = db_manager.get_mood_history(user_id, 1)  # Get just the latest entry
        
        if mood_history and len(mood_history) > 0:
            latest_mood = mood_history[0]
            logger.info(f"Latest mood for user {user_id}: {latest_mood.get('mood')}")
            return jsonify({
                'success': True,
                'data': {
                    'mood': latest_mood.get('mood'),
                    'journal': latest_mood.get('journal', ''),
                    'timestamp': latest_mood.get('timestamp'),
                    'mood_id': latest_mood.get('id')
                }
            })
        else:
            logger.info(f"No mood entries found for user {user_id}")
            return jsonify({
                'success': True,
                'data': {
                    'mood': None,
                    'journal': '',
                    'timestamp': None,
                    'mood_id': None
                }
            })
        
    except Exception as e:
        logger.error(f"Get latest mood error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Failed to get latest mood'
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
@require_auth
def get_conversations():
    """Get all conversations for a user"""
    try:
        # Get user ID from verified Firebase token
        user_id = request.user['uid']
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
@require_auth
def create_conversation():
    """Create a new conversation"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Data is required'
            }), 400
        
        # Get user ID from verified Firebase token
        user_id = request.user['uid']
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
@require_auth
def get_conversation(conversation_id):
    """Get a specific conversation"""
    try:
        # Get user ID from verified Firebase token
        user_id = request.user['uid']
        
        logger.info(f"Getting conversation: {conversation_id} for user: {user_id}")
        
        if not FIREBASE_AVAILABLE:
            logger.error("Firebase not available")
            return jsonify({
                'success': False,
                'error': 'Database not available',
                'message': 'Firebase database is not connected'
            }), 503
        
        # Get conversation from Firebase with user ownership validation
        conversation = db_manager.get_conversation(conversation_id, user_id)
        
        if not conversation:
            logger.warning(f"Conversation {conversation_id} not found or access denied for user {user_id}")
            return jsonify({
                'success': False,
                'error': 'Conversation not found or access denied',
                'message': 'You can only access your own conversations'
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
@require_auth
def delete_conversation(conversation_id):
    """Delete a conversation"""
    try:
        # Get user ID from verified Firebase token
        user_id = request.user['uid']
        
        logger.info(f"Deleting conversation: {conversation_id} for user: {user_id}")
        
        if not FIREBASE_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Database not available',
                'message': 'Firebase database is not connected'
            }), 503
        
        # Delete conversation from Firebase with user ownership validation
        success = db_manager.delete_conversation(conversation_id, user_id)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to delete conversation',
                'message': 'Conversation not found or access denied'
            }), 404
        
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
@require_auth
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
        
        # Get user ID from verified Firebase token
        user_id = request.user['uid']
        
        logger.info(f"Adding message to conversation {conversation_id} for user {user_id}")
        
        if not FIREBASE_AVAILABLE:
            logger.error("Firebase not available")
            return jsonify({
                'success': False,
                'error': 'Database not available',
                'message': 'Firebase database is not connected'
            }), 503
        
        # Fetch recent conversation messages for lightweight context
        conversation = db_manager.get_conversation(conversation_id, user_id)
        messages_history = []
        try:
            messages_history = conversation.get('messages', []) if conversation else []
        except Exception:
            messages_history = []

        # Fetch latest mood for this authenticated user
        latest_mood = None
        try:
            mood_history = db_manager.get_mood_history(user_id, 1)
            if mood_history:
                latest_mood = mood_history[0].get('mood')
        except Exception:
            latest_mood = None

        # Generate response from Gemini AI with short history and latest mood to avoid re-asking mood verification
        response = generate_response(message, history=messages_history, latest_mood=latest_mood)
        
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

@app.route('/api/tts/synthesize', methods=['POST'])
@limiter.limit("60 per 15 minutes")
def synthesize_tts():
    """TTS endpoint - Using OS default Indian voices only"""
    return jsonify({ 
        'success': False, 
        'error': 'TTS service disabled. Using OS default Indian voices for beautiful, calm, soothing speech.',
        'message': 'The system now uses your OS default Indian voices for a natural, beautiful lady voice experience.',
        'voice_type': 'OS Default Indian Voices',
        'features': [
            'Beautiful Indian lady voice',
            'Calm and soothing tone',
            'Natural speech patterns',
            'No robotic sounds'
        ]
    }), 200

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
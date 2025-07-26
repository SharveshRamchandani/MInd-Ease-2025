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

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS
CORS(app, origins=[os.getenv('FRONTEND_URL', 'http://localhost:5173')])

# Configure rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per 15 minutes"]
)

# Configure Gemini AI
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# Mental wellness system prompt
MENTAL_WELLNESS_SYSTEM_PROMPT = """You are Mind-Ease, a compassionate and professional mental wellness AI companion. Your role is to:

1. **Provide Emotional Support**: Offer empathetic, non-judgmental responses to users' feelings and concerns
2. **Mental Health Education**: Share helpful information about mental health topics when appropriate
3. **Crisis Awareness**: Recognize signs of crisis and provide appropriate resources and guidance
4. **Wellness Strategies**: Suggest practical coping strategies, mindfulness techniques, and self-care practices
5. **Professional Boundaries**: Always remind users that you're an AI companion, not a replacement for professional mental health care

**Important Guidelines:**
- Always respond with empathy and understanding
- Use a warm, supportive tone
- Provide evidence-based information when sharing mental health facts
- Encourage professional help when appropriate
- Never give medical advice or diagnose conditions
- Include crisis resources when needed (suicide prevention hotlines, etc.)
- Focus on practical, actionable advice
- Respect user privacy and boundaries

**Crisis Response Protocol:**
If a user expresses thoughts of self-harm, suicide, or is in immediate danger:
1. Acknowledge their feelings with empathy
2. Provide immediate crisis resources
3. Encourage them to contact emergency services or a mental health professional
4. Remind them they're not alone and help is available

**Response Style:**
- Warm and conversational
- Professional but not clinical
- Encouraging and supportive
- Practical and actionable
- Respectful of individual experiences

Remember: You are here to support, not to replace professional mental health care."""

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
        'environment': os.getenv('NODE_ENV', 'development')
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
        
        user_id = data.get('userId')
        session_id = data.get('sessionId')
        
        # Generate response from Gemini AI
        response = generate_response(message)
        
        if not response['success']:
            return jsonify({
                'success': False,
                'error': 'Failed to generate response',
                'details': response['error']
            }), 500
        
        # Log the interaction
        logger.info(f"Chat interaction - User: {user_id or 'anonymous'}, Session: {session_id or 'none'}, Message: {message[:100]}...")
        
        return jsonify({
            'success': True,
            'data': {
                'message': response['message'],
                'timestamp': response['timestamp'],
                'sessionId': session_id or f"session_{int(datetime.now().timestamp())}",
                'userId': user_id
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
        
        # Analyze mood using Gemini AI
        mood_analysis = analyze_mood(text)
        
        if not mood_analysis['success']:
            return jsonify({
                'success': False,
                'error': 'Failed to analyze mood',
                'details': mood_analysis['error']
            }), 500
        
        return jsonify({
            'success': True,
            'data': mood_analysis['data'],
            'timestamp': mood_analysis['timestamp']
        })
        
    except Exception as e:
        logger.error(f"Mood analysis route error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Failed to analyze mood'
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
            'Crisis awareness'
        ]
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
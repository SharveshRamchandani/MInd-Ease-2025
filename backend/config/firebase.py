import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Check if Firebase is already initialized
        if not firebase_admin._apps:
            # Get the path to the service account key file
            service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
            
            if service_account_path and os.path.exists(service_account_path):
                # Initialize with service account file
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized with service account file")
            else:
                # Initialize with default credentials (for Google Cloud)
                firebase_admin.initialize_app()
                logger.info("Firebase initialized with default credentials")
        
        # Get Firestore client
        db = firestore.client()
        logger.info("Firestore client initialized successfully")
        return db
        
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {str(e)}")
        raise

def get_firestore_client():
    """Get Firestore client instance"""
    try:
        return firestore.client()
    except Exception as e:
        logger.error(f"Failed to get Firestore client: {str(e)}")
        raise

# Database collections
COLLECTIONS = {
    'users': 'users',
    'chat_sessions': 'chat_sessions',
    'conversations': 'conversations',
    'mood_logs': 'mood_logs',
    'wellness_activities': 'wellness_activities',
    'coping_strategies': 'coping_strategies',
    'motivational_quotes': 'motivational_quotes',
    'journals': 'journals'
}

# Initialize Firebase when module is imported
try:
    db = initialize_firebase()
except Exception as e:
    logger.warning(f"Firebase initialization failed: {str(e)}")
    db = None 
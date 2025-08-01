from firebase_admin import firestore
from datetime import datetime
import logging
from typing import Dict, List, Optional, Any
from .firebase import db, COLLECTIONS

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Database manager for Firestore operations"""
    
    def __init__(self):
        self.db = db
        self.collections = COLLECTIONS
    
    def create_user(self, user_data: Dict[str, Any]) -> str:
        """Create a new user in the database"""
        try:
            user_data['created_at'] = datetime.now()
            user_data['updated_at'] = datetime.now()
            
            doc_ref = self.db.collection(self.collections['users']).add(user_data)
            logger.info(f"User created with ID: {doc_ref[1].id}")
            return doc_ref[1].id
        except Exception as e:
            logger.error(f"Failed to create user: {str(e)}")
            raise
    
    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            doc = self.db.collection(self.collections['users']).document(user_id).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            logger.error(f"Failed to get user {user_id}: {str(e)}")
            return None
    
    def update_user(self, user_id: str, user_data: Dict[str, Any]) -> bool:
        """Update user data"""
        try:
            user_data['updated_at'] = datetime.now()
            self.db.collection(self.collections['users']).document(user_id).update(user_data)
            logger.info(f"User {user_id} updated successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to update user {user_id}: {str(e)}")
            return False
    
    def create_conversation(self, user_id: str, title: str = None) -> str:
        """Create a new conversation"""
        try:
            conversation_data = {
                'user_id': user_id,
                'title': title or f"Conversation {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                'messages': [],
                'created_at': datetime.now(),
                'updated_at': datetime.now()
            }
            
            doc_ref = self.db.collection(self.collections['conversations']).add(conversation_data)
            logger.info(f"Conversation created with ID: {doc_ref[1].id}")
            return doc_ref[1].id
        except Exception as e:
            logger.error(f"Failed to create conversation: {str(e)}")
            raise

    def update_conversation(self, conversation_id: str, message_data: Dict[str, Any]) -> bool:
        """Add a message to an existing conversation"""
        try:
            # Get the current conversation
            conversation_ref = self.db.collection(self.collections['conversations']).document(conversation_id)
            conversation_doc = conversation_ref.get()
            
            if not conversation_doc.exists:
                raise Exception("Conversation not found")
            
            conversation_data = conversation_doc.to_dict()
            messages = conversation_data.get('messages', [])
            
            # Add the new message
            message_data['timestamp'] = datetime.now()
            messages.append(message_data)
            
            # Update the conversation
            conversation_ref.update({
                'messages': messages,
                'updated_at': datetime.now()
            })
            
            logger.info(f"Conversation {conversation_id} updated with new message")
            return True
        except Exception as e:
            logger.error(f"Failed to update conversation: {str(e)}")
            raise

    def get_conversations(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get all conversations for a user"""
        try:
            query = self.db.collection(self.collections['conversations'])\
                .where('user_id', '==', user_id)\
                .limit(limit)
            
            docs = query.stream()
            conversations = []
            
            for doc in docs:
                conversation_data = doc.to_dict()
                conversation_data['id'] = doc.id
                conversations.append(conversation_data)
            
            # Sort by updated_at in descending order (most recent first)
            conversations.sort(key=lambda x: x.get('updated_at', datetime.min), reverse=True)
            
            return conversations
        except Exception as e:
            logger.error(f"Failed to get conversations for user {user_id}: {str(e)}")
            return []

    def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific conversation by ID"""
        try:
            doc = self.db.collection(self.collections['conversations']).document(conversation_id).get()
            if doc.exists:
                conversation_data = doc.to_dict()
                conversation_data['id'] = doc.id
                return conversation_data
            return None
        except Exception as e:
            logger.error(f"Failed to get conversation {conversation_id}: {str(e)}")
            return None

    def delete_conversation(self, conversation_id: str) -> bool:
        """Delete a conversation"""
        try:
            self.db.collection(self.collections['conversations']).document(conversation_id).delete()
            logger.info(f"Conversation {conversation_id} deleted")
            return True
        except Exception as e:
            logger.error(f"Failed to delete conversation {conversation_id}: {str(e)}")
            return False

    def save_chat_message(self, user_id: str, session_id: str, message_data: Dict[str, Any]) -> str:
        """Save a chat message to the database (legacy method)"""
        try:
            message_data['user_id'] = user_id
            message_data['session_id'] = session_id
            message_data['timestamp'] = datetime.now()
            
            doc_ref = self.db.collection(self.collections['chat_sessions']).add(message_data)
            logger.info(f"Chat message saved with ID: {doc_ref[1].id}")
            return doc_ref[1].id
        except Exception as e:
            logger.error(f"Failed to save chat message: {str(e)}")
            raise
    
    def get_chat_history(self, user_id: str, session_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Get chat history for a user"""
        try:
            query = self.db.collection(self.collections['chat_sessions']).where('user_id', '==', user_id)
            
            if session_id:
                query = query.where('session_id', '==', session_id)
            
            query = query.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit)
            
            docs = query.stream()
            messages = []
            
            for doc in docs:
                message_data = doc.to_dict()
                message_data['id'] = doc.id
                messages.append(message_data)
            
            # Reverse to get chronological order
            messages.reverse()
            return messages
        except Exception as e:
            logger.error(f"Failed to get chat history for user {user_id}: {str(e)}")
            return []
    
    def save_mood_log(self, user_id: str, mood_data: Dict[str, Any]) -> str:
        """Save a mood log entry"""
        try:
            mood_data['user_id'] = user_id
            mood_data['timestamp'] = datetime.now()
            
            doc_ref = self.db.collection(self.collections['mood_logs']).add(mood_data)
            logger.info(f"Mood log saved with ID: {doc_ref[1].id}")
            return doc_ref[1].id
        except Exception as e:
            logger.error(f"Failed to save mood log: {str(e)}")
            raise
    
    def get_mood_history(self, user_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """Get mood history for a user"""
        try:
            from datetime import timedelta
            
            start_date = datetime.now() - timedelta(days=days)
            
            query = self.db.collection(self.collections['mood_logs'])\
                .where('user_id', '==', user_id)\
                .where('timestamp', '>=', start_date)\
                .order_by('timestamp', direction=firestore.Query.DESCENDING)
            
            docs = query.stream()
            mood_logs = []
            
            for doc in docs:
                mood_data = doc.to_dict()
                mood_data['id'] = doc.id
                mood_logs.append(mood_data)
            
            return mood_logs
        except Exception as e:
            logger.error(f"Failed to get mood history for user {user_id}: {str(e)}")
            return []
    
    def save_wellness_activity(self, user_id: str, activity_data: Dict[str, Any]) -> str:
        """Save a wellness activity"""
        try:
            activity_data['user_id'] = user_id
            activity_data['timestamp'] = datetime.now()
            
            doc_ref = self.db.collection(self.collections['wellness_activities']).add(activity_data)
            logger.info(f"Wellness activity saved with ID: {doc_ref[1].id}")
            return doc_ref[1].id
        except Exception as e:
            logger.error(f"Failed to save wellness activity: {str(e)}")
            raise
    
    def get_wellness_activities(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get wellness activities for a user"""
        try:
            query = self.db.collection(self.collections['wellness_activities'])\
                .where('user_id', '==', user_id)\
                .order_by('timestamp', direction=firestore.Query.DESCENDING)\
                .limit(limit)
            
            docs = query.stream()
            activities = []
            
            for doc in docs:
                activity_data = doc.to_dict()
                activity_data['id'] = doc.id
                activities.append(activity_data)
            
            return activities
        except Exception as e:
            logger.error(f"Failed to get wellness activities for user {user_id}: {str(e)}")
            return []
    
    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user statistics"""
        try:
            # Get mood logs count
            mood_logs = self.db.collection(self.collections['mood_logs'])\
                .where('user_id', '==', user_id).stream()
            mood_count = len(list(mood_logs))
            
            # Get chat sessions count
            chat_sessions = self.db.collection(self.collections['chat_sessions'])\
                .where('user_id', '==', user_id).stream()
            chat_count = len(list(chat_sessions))
            
            # Get wellness activities count
            wellness_activities = self.db.collection(self.collections['wellness_activities'])\
                .where('user_id', '==', user_id).stream()
            wellness_count = len(list(wellness_activities))
            
            return {
                'mood_logs_count': mood_count,
                'chat_messages_count': chat_count,
                'wellness_activities_count': wellness_count,
                'total_activities': mood_count + chat_count + wellness_count
            }
        except Exception as e:
            logger.error(f"Failed to get user stats for {user_id}: {str(e)}")
            return {
                'mood_logs_count': 0,
                'chat_messages_count': 0,
                'wellness_activities_count': 0,
                'total_activities': 0
            }

# Create a global instance
db_manager = DatabaseManager() 
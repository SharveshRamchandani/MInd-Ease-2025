from firebase_admin import firestore
from datetime import datetime
import logging
from typing import Dict, List, Optional, Any
from .firebase import db, COLLECTIONS

logger = logging.getLogger(__name__)

class DatabaseManager:
    def add_journal(self, user_id: str, text: str, timestamp: str) -> str:
        doc_ref = self.db.collection(self.collections['journals']).document()
        doc_ref.set({
            'user_id': user_id,
            'text': text,
            'timestamp': timestamp
        })
        return doc_ref.id
    def get_journals(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get journal entries for a user from the journals collection"""
        try:
            logger.info(f"Getting journals for user: {user_id}")
            query = self.db.collection(self.collections['journals'])\
                .where('user_id', '==', user_id)\
                .limit(limit)
            docs = query.stream()
            journals = []
            for doc in docs:
                journal_data = doc.to_dict()
                journal_data['id'] = doc.id
                journals.append(journal_data)
                logger.info(f"Found journal entry: {doc.id} - {journal_data.get('text', '')}")
            # Sort by timestamp descending (newest first)
            try:
                journals.sort(key=lambda x: x.get('timestamp', datetime.min), reverse=True)
            except Exception as sort_error:
                logger.warning(f"Could not sort journals by timestamp: {sort_error}. Keeping original order.")
            logger.info(f"Returning {len(journals)} journals for user {user_id}")
            return journals
        except Exception as e:
            logger.error(f"Failed to get journals for user {user_id}: {str(e)}")
            return []
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
            
            logger.info(f"Creating conversation for user: {user_id} with title: {conversation_data['title']}")
            doc_ref = self.db.collection(self.collections['conversations']).add(conversation_data)
            logger.info(f"Conversation created with ID: {doc_ref[1].id}")
            return doc_ref[1].id
        except Exception as e:
            logger.error(f"Failed to create conversation: {str(e)}")
            raise

    def update_conversation(self, conversation_id: str, message_data: Dict[str, Any]) -> bool:
        """Add a message to an existing conversation"""
        try:
            logger.info(f"Updating conversation {conversation_id} with message type: {message_data.get('type')}")
            
            # Get the current conversation
            conversation_ref = self.db.collection(self.collections['conversations']).document(conversation_id)
            conversation_doc = conversation_ref.get()
            
            if not conversation_doc.exists:
                logger.error(f"Conversation {conversation_id} not found")
                raise Exception("Conversation not found")
            
            conversation_data = conversation_doc.to_dict()
            messages = conversation_data.get('messages', [])
            
            logger.info(f"Current messages in conversation: {len(messages)}")
            
            # Add the new message
            message_data['timestamp'] = datetime.now()
            messages.append(message_data)
            
            # Update the conversation
            conversation_ref.update({
                'messages': messages,
                'updated_at': datetime.now()
            })
            
            logger.info(f"Conversation {conversation_id} updated with new message. Total messages: {len(messages)}")
            return True
        except Exception as e:
            logger.error(f"Failed to update conversation: {str(e)}")
            raise

    def get_conversations(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get all conversations for a user"""
        try:
            logger.info(f"Getting conversations for user: {user_id}")
            query = self.db.collection(self.collections['conversations'])\
                .where('user_id', '==', user_id)\
                .limit(limit)
            
            docs = query.stream()
            conversations = []
            
            for doc in docs:
                conversation_data = doc.to_dict()
                conversation_data['id'] = doc.id
                conversations.append(conversation_data)
                logger.info(f"Found conversation: {doc.id} - {conversation_data.get('title', 'No title')}")
            
            # Sort by updated_at in descending order (most recent first)
            conversations.sort(key=lambda x: x.get('updated_at', datetime.min), reverse=True)
            
            logger.info(f"Returning {len(conversations)} conversations for user {user_id}")
            return conversations
        except Exception as e:
            logger.error(f"Failed to get conversations for user {user_id}: {str(e)}")
            return []

    def get_conversation(self, conversation_id: str, user_id: str = None) -> Optional[Dict[str, Any]]:
        """Get a specific conversation by ID, with optional user ownership validation"""
        try:
            logger.info(f"Getting conversation: {conversation_id} for user: {user_id}")
            doc = self.db.collection(self.collections['conversations']).document(conversation_id).get()
            if doc.exists:
                conversation_data = doc.to_dict()
                conversation_data['id'] = doc.id
                
                # If user_id is provided, validate ownership
                if user_id and conversation_data.get('user_id') != user_id:
                    logger.warning(f"User {user_id} attempted to access conversation {conversation_id} owned by {conversation_data.get('user_id')}")
                    return None
                
                logger.info(f"Found conversation: {conversation_id} with {len(conversation_data.get('messages', []))} messages")
                return conversation_data
            else:
                logger.warning(f"Conversation {conversation_id} not found")
            return None
        except Exception as e:
            logger.error(f"Failed to get conversation {conversation_id}: {str(e)}")
            return None

    def delete_conversation(self, conversation_id: str, user_id: str = None) -> bool:
        """Delete a conversation, with optional user ownership validation"""
        try:
            # If user_id is provided, validate ownership before deletion
            if user_id:
                conversation = self.get_conversation(conversation_id, user_id)
                if not conversation:
                    logger.warning(f"User {user_id} attempted to delete conversation {conversation_id} without ownership")
                    return False
            
            self.db.collection(self.collections['conversations']).document(conversation_id).delete()
            logger.info(f"Conversation {conversation_id} deleted")
            return True
        except Exception as e:
            logger.error(f"Failed to delete conversation {conversation_id}: {str(e)}")
            return False

    def check_conversation_ownership(self, conversation_id: str, user_id: str) -> bool:
        """Check if a user owns a specific conversation"""
        try:
            conversation = self.get_conversation(conversation_id)
            if conversation and conversation.get('user_id') == user_id:
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to check conversation ownership: {str(e)}")
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
            logger.info(f"Getting mood history for user {user_id}, days: {days}")
            
            # Simple query - just get all mood logs for the user
            # We'll filter by days in Python instead of Firestore
            query = self.db.collection(self.collections['mood_logs'])\
                .where('user_id', '==', user_id)
            
            docs = query.stream()
            mood_logs = []
            
            for doc in docs:
                mood_data = doc.to_dict()
                mood_data['id'] = doc.id
                mood_logs.append(mood_data)
                logger.info(f"Found mood entry: {mood_data.get('mood')} at {mood_data.get('timestamp')}")
            
            # Filter by days in Python (more reliable)
            if days > 0:
                from datetime import timedelta
                
                # Get current time (simple approach)
                now = datetime.now()
                cutoff_date = now - timedelta(days=days)
                
                logger.info(f"Filtering entries after: {cutoff_date}")
                
                filtered_logs = []
                for log in mood_logs:
                    timestamp = log.get('timestamp')
                    if timestamp:
                        try:
                            # Simple comparison - if it fails, include the entry
                            if timestamp >= cutoff_date:
                                filtered_logs.append(log)
                                logger.info(f"Entry {log.get('mood')} at {timestamp} is within {days} days")
                            else:
                                logger.info(f"Entry {log.get('mood')} at {timestamp} is too old")
                        except Exception as compare_error:
                            # If comparison fails, include the entry and log the error
                            logger.warning(f"Could not compare timestamp {timestamp}: {compare_error}. Including entry.")
                            filtered_logs.append(log)
                    else:
                        # If no timestamp, include it (shouldn't happen but safety)
                        filtered_logs.append(log)
                        logger.info(f"Entry {log.get('mood')} has no timestamp, including it")
                
                mood_logs = filtered_logs
                logger.info(f"After filtering by {days} days: {len(mood_logs)} entries")
            
            # Sort by timestamp descending (newest first)
            try:
                mood_logs.sort(key=lambda x: x.get('timestamp', datetime.min), reverse=True)
            except Exception as sort_error:
                logger.warning(f"Could not sort by timestamp: {sort_error}. Keeping original order.")
            
            logger.info(f"Total mood logs found for user {user_id}: {len(mood_logs)}")
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
    
    def add_journal(self, user_id: str, text: str, timestamp: str) -> str:
        """Add a new journal entry"""
        try:
            logger.info(f"Adding journal entry for user: {user_id}")
            doc_ref = db.collection('journals').document()
            doc_ref.set({
                'user_id': user_id,
                'text': text,
                'timestamp': timestamp
            })
            logger.info(f"Journal entry added with ID: {doc_ref.id}")
            return doc_ref.id
        except Exception as e:
            logger.error(f"Failed to add journal entry: {str(e)}")
            raise

# Create a global instance
db_manager = DatabaseManager()
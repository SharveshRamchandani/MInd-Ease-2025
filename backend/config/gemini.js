import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Mental wellness system prompt
const MENTAL_WELLNESS_SYSTEM_PROMPT = `You are Mind-Ease, a compassionate and professional mental wellness AI companion. Your role is to:

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

Remember: You are here to support, not to replace professional mental health care.`;

// Create the model instance
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  },
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
    }
  ]
});

// Initialize chat
const startChat = () => {
  return model.startChat({
    history: [
      {
        role: "user",
        parts: "Hello, I'm here for mental wellness support.",
      },
      {
        role: "model",
        parts: "Hello! I'm Mind-Ease, your mental wellness companion. I'm here to provide you with emotional support, share helpful information about mental health, and suggest practical strategies for your well-being. How are you feeling today?",
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  });
};

// Generate response function
const generateResponse = async (message, chatHistory = []) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const chat = startChat();
    
    // Add system context to the message
    const contextualizedMessage = `${MENTAL_WELLNESS_SYSTEM_PROMPT}\n\nUser message: ${message}`;
    
    const result = await chat.sendMessage(contextualizedMessage);
    const response = await result.response;
    const text = response.text();
    
    return {
      success: true,
      message: text,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate response',
      timestamp: new Date().toISOString(),
    };
  }
};

// Analyze mood from text
const analyzeMood = async (text) => {
  try {
    const prompt = `Analyze the following text and determine the user's emotional state. Respond with a JSON object containing:
    {
      "mood": "primary emotion (happy, sad, anxious, angry, calm, etc.)",
      "intensity": "low/medium/high",
      "sentiment": "positive/neutral/negative",
      "confidence": 0.0-1.0,
      "keywords": ["emotion", "keywords", "extracted"],
      "suggestions": ["helpful", "suggestions", "based", "on", "mood"]
    }

    Text to analyze: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    // Try to parse JSON response
    try {
      const moodData = JSON.parse(textResponse);
      return {
        success: true,
        data: moodData,
        timestamp: new Date().toISOString(),
      };
    } catch (parseError) {
      return {
        success: false,
        error: 'Failed to parse mood analysis response',
        rawResponse: textResponse,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error('Mood Analysis Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze mood',
      timestamp: new Date().toISOString(),
    };
  }
};

export { generateResponse, analyzeMood, model, startChat }; 
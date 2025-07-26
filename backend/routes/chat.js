import express from 'express';
import { body, validationResult } from 'express-validator';
import { generateResponse, analyzeMood } from '../config/gemini.js';

const router = express.Router();

// Validation middleware
const validateChatMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('userId')
    .optional()
    .isString()
    .withMessage('User ID must be a string'),
  body('sessionId')
    .optional()
    .isString()
    .withMessage('Session ID must be a string'),
];

// POST /api/chat/message - Send a message to the chatbot
router.post('/message', validateChatMessage, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { message, userId, sessionId } = req.body;

    // Generate response from Gemini AI
    const response = await generateResponse(message);

    if (!response.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate response',
        details: response.error,
      });
    }

    // Log the interaction (you can add database logging here)
    console.log(`Chat interaction - User: ${userId || 'anonymous'}, Session: ${sessionId || 'none'}, Message: ${message.substring(0, 100)}...`);

    res.json({
      success: true,
      data: {
        message: response.message,
        timestamp: response.timestamp,
        sessionId: sessionId || `session_${Date.now()}`,
        userId: userId || null,
      },
    });
  } catch (error) {
    console.error('Chat route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process chat message',
    });
  }
});

// POST /api/chat/analyze-mood - Analyze mood from text
router.post('/analyze-mood', [
  body('text')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Text must be between 1 and 2000 characters'),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { text } = req.body;

    // Analyze mood using Gemini AI
    const moodAnalysis = await analyzeMood(text);

    if (!moodAnalysis.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to analyze mood',
        details: moodAnalysis.error,
      });
    }

    res.json({
      success: true,
      data: moodAnalysis.data,
      timestamp: moodAnalysis.timestamp,
    });
  } catch (error) {
    console.error('Mood analysis route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to analyze mood',
    });
  }
});

// GET /api/chat/health - Check chat service health
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Mind-Ease Chat Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: [
      'Mental wellness conversations',
      'Mood analysis',
      'Emotional support',
      'Crisis awareness',
    ],
  });
});

// GET /api/chat/conversation-starter - Get a conversation starter
router.get('/conversation-starter', async (req, res) => {
  try {
    const starters = [
      "How are you feeling today?",
      "What's been on your mind lately?",
      "Is there anything you'd like to talk about?",
      "How has your day been so far?",
      "What's something that made you smile today?",
      "Is there anything you're looking forward to?",
      "How are you taking care of yourself today?",
      "What's something you're grateful for right now?",
    ];

    const randomStarter = starters[Math.floor(Math.random() * starters.length)];

    res.json({
      success: true,
      data: {
        message: randomStarter,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Conversation starter error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get conversation starter',
    });
  }
});

export default router; 
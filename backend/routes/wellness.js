import express from 'express';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// GET /api/wellness/coping-strategies - Get coping strategies based on mood
router.get('/coping-strategies', (req, res) => {
  try {
    const { mood = 'general' } = req.query;
    
    const strategies = {
      anxious: [
        {
          title: "Deep Breathing",
          description: "Take slow, deep breaths. Inhale for 4 counts, hold for 4, exhale for 4.",
          duration: "5-10 minutes",
          category: "breathing"
        },
        {
          title: "Progressive Muscle Relaxation",
          description: "Tense and relax each muscle group from toes to head.",
          duration: "10-15 minutes",
          category: "relaxation"
        },
        {
          title: "Grounding Exercise",
          description: "Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.",
          duration: "2-3 minutes",
          category: "mindfulness"
        }
      ],
      sad: [
        {
          title: "Gentle Movement",
          description: "Take a short walk, stretch, or do some light yoga.",
          duration: "10-20 minutes",
          category: "movement"
        },
        {
          title: "Gratitude Practice",
          description: "Write down 3 things you're grateful for today.",
          duration: "5 minutes",
          category: "mindfulness"
        },
        {
          title: "Connect with Others",
          description: "Reach out to a friend or family member for support.",
          duration: "15-30 minutes",
          category: "social"
        }
      ],
      stressed: [
        {
          title: "Time Management",
          description: "Break down tasks into smaller, manageable steps.",
          duration: "10 minutes",
          category: "organization"
        },
        {
          title: "Nature Connection",
          description: "Spend time outdoors or look at nature photos.",
          duration: "15-30 minutes",
          category: "nature"
        },
        {
          title: "Mindful Break",
          description: "Take a 5-minute break to just be present.",
          duration: "5 minutes",
          category: "mindfulness"
        }
      ],
      angry: [
        {
          title: "Cool Down",
          description: "Step away from the situation and take deep breaths.",
          duration: "5-10 minutes",
          category: "breathing"
        },
        {
          title: "Physical Release",
          description: "Exercise, punch a pillow, or do vigorous cleaning.",
          duration: "15-30 minutes",
          category: "movement"
        },
        {
          title: "Express Feelings",
          description: "Write down your feelings or talk to someone you trust.",
          duration: "10-20 minutes",
          category: "expression"
        }
      ],
      general: [
        {
          title: "Mindful Breathing",
          description: "Focus on your breath and let thoughts pass by.",
          duration: "5-10 minutes",
          category: "mindfulness"
        },
        {
          title: "Self-Care Activity",
          description: "Do something that brings you joy or comfort.",
          duration: "30 minutes",
          category: "self-care"
        },
        {
          title: "Journaling",
          description: "Write about your thoughts and feelings.",
          duration: "10-15 minutes",
          category: "expression"
        }
      ]
    };

    const selectedStrategies = strategies[mood.toLowerCase()] || strategies.general;

    res.json({
      success: true,
      data: {
        mood: mood,
        strategies: selectedStrategies,
        count: selectedStrategies.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Coping strategies error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get coping strategies',
    });
  }
});

// GET /api/wellness/motivational-quotes - Get motivational quotes
router.get('/motivational-quotes', (req, res) => {
  try {
    const quotes = [
      {
        text: "You are stronger than you think.",
        author: "Unknown",
        category: "strength"
      },
      {
        text: "Every day is a new beginning.",
        author: "Unknown",
        category: "hope"
      },
      {
        text: "It's okay to not be okay.",
        author: "Unknown",
        category: "acceptance"
      },
      {
        text: "You don't have to be perfect to be worthy of love and respect.",
        author: "Brené Brown",
        category: "self-worth"
      },
      {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        category: "passion"
      },
      {
        text: "You are not alone in this journey.",
        author: "Unknown",
        category: "support"
      },
      {
        text: "Small progress is still progress.",
        author: "Unknown",
        category: "growth"
      },
      {
        text: "Your mental health is a priority. Your happiness is essential. Your self-care is a necessity.",
        author: "Unknown",
        category: "self-care"
      }
    ];

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    res.json({
      success: true,
      data: {
        quote: randomQuote,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Motivational quotes error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get motivational quote',
    });
  }
});

// GET /api/wellness/crisis-resources - Get crisis resources
router.get('/crisis-resources', (req, res) => {
  try {
    const resources = {
      emergency: {
        title: "Emergency Services",
        description: "If you're in immediate danger, call emergency services immediately.",
        contact: "911 (US) / 112 (EU) / 000 (Australia)",
        available: "24/7"
      },
      suicide_prevention: {
        title: "Suicide Prevention Lifeline",
        description: "Free, confidential support for people in distress.",
        contact: "988 (US) / 1-800-273-8255",
        available: "24/7",
        website: "https://988lifeline.org"
      },
      crisis_text: {
        title: "Crisis Text Line",
        description: "Text-based crisis support.",
        contact: "Text HOME to 741741",
        available: "24/7",
        website: "https://www.crisistextline.org"
      },
      mental_health_america: {
        title: "Mental Health America",
        description: "Information and resources for mental health support.",
        contact: "1-800-969-6642",
        available: "24/7",
        website: "https://www.mhanational.org"
      }
    };

    res.json({
      success: true,
      data: {
        resources: resources,
        disclaimer: "These resources are for informational purposes. In case of emergency, please contact local emergency services immediately.",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Crisis resources error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get crisis resources',
    });
  }
});

// GET /api/wellness/meditation-tips - Get meditation tips
router.get('/meditation-tips', (req, res) => {
  try {
    const tips = [
      {
        title: "Start Small",
        description: "Begin with just 2-3 minutes of meditation and gradually increase.",
        category: "beginner"
      },
      {
        title: "Focus on Breath",
        description: "Use your breath as an anchor. When your mind wanders, gently return to your breath.",
        category: "technique"
      },
      {
        title: "Be Kind to Yourself",
        description: "Don't judge your thoughts. Simply observe them and let them pass.",
        category: "mindset"
      },
      {
        title: "Create a Routine",
        description: "Meditate at the same time each day to build a habit.",
        category: "habit"
      },
      {
        title: "Find Your Space",
        description: "Choose a quiet, comfortable place where you won't be disturbed.",
        category: "environment"
      }
    ];

    res.json({
      success: true,
      data: {
        tips: tips,
        count: tips.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Meditation tips error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get meditation tips',
    });
  }
});

// GET /api/wellness/health - Check wellness service health
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Mind-Ease Wellness Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: [
      'Coping strategies',
      'Motivational quotes',
      'Crisis resources',
      'Meditation tips',
    ],
  });
});

export default router; 
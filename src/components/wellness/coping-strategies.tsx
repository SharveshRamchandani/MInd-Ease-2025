import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Brain, Smile, Clock } from "lucide-react";
import { useState } from "react";

interface CopingStrategy {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  icon: any;
  color: string;
  mood?: string[];
}

const copingStrategies: CopingStrategy[] = [
  {
    id: "breathing",
    title: "4-7-8 Breathing",
    description: "A calming breathing technique to reduce anxiety and promote relaxation.",
    instructions: [
      "Inhale quietly through your nose for 4 counts",
      "Hold your breath for 7 counts", 
      "Exhale through your mouth for 8 counts",
      "Repeat 3-4 times"
    ],
    icon: Heart,
    color: "emotion-calm",
    mood: ["anxious", "sad"]
  },
  {
    id: "gratitude",
    title: "Gratitude Practice",
    description: "Focus on positive aspects to shift your mindset.",
    instructions: [
      "Think of 3 things you're grateful for today",
      "Write them down or say them aloud",
      "Reflect on why each one matters to you",
      "Notice how this makes you feel"
    ],
    icon: Smile,
    color: "emotion-joy",
    mood: ["sad", "neutral"]
  },
  {
    id: "thought-reframe",
    title: "Thought Reframing",
    description: "Challenge negative thoughts with a balanced perspective.",
    instructions: [
      "Notice the negative thought",
      "Ask: Is this thought helpful or true?",
      "Find evidence for and against it",
      "Create a more balanced thought"
    ],
    icon: Brain,
    color: "emotion-neutral", 
    mood: ["anxious", "angry", "sad"]
  },
  {
    id: "mindful-moment",
    title: "5-Minute Mindfulness",
    description: "Ground yourself in the present moment.",
    instructions: [
      "Find a comfortable position",
      "Notice 5 things you can see",
      "Notice 4 things you can touch",
      "Notice 3 things you can hear",
      "Notice 2 things you can smell",
      "Notice 1 thing you can taste"
    ],
    icon: Clock,
    color: "emotion-calm",
    mood: ["anxious", "angry"]
  }
];

interface CopingStrategiesProps {
  currentMood?: string;
}

export const CopingStrategies = ({ currentMood }: CopingStrategiesProps) => {
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);

  const relevantStrategies = currentMood 
    ? copingStrategies.filter(strategy => 
        !strategy.mood || strategy.mood.includes(currentMood)
      )
    : copingStrategies;

  const toggleStrategy = (id: string) => {
    setExpandedStrategy(expandedStrategy === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Coping Strategies</h2>
        <p className="text-muted-foreground text-sm">
          {currentMood 
            ? `Personalized suggestions for feeling ${currentMood}`
            : "Helpful techniques for emotional wellness"
          }
        </p>
      </div>

      <div className="grid gap-4">
        {relevantStrategies.map((strategy) => {
          const Icon = strategy.icon;
          const isExpanded = expandedStrategy === strategy.id;

          return (
            <Card 
              key={strategy.id} 
              className="p-4 shadow-card transition-gentle hover:shadow-glow cursor-pointer"
              onClick={() => toggleStrategy(strategy.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full bg-${strategy.color} animate-gentle-bounce`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">{strategy.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {strategy.description}
                  </p>
                  
                  {isExpanded && (
                    <div className="space-y-2 mt-4 animate-gentle-bounce">
                      <h4 className="text-sm font-medium">Steps:</h4>
                      <ol className="space-y-1">
                        {strategy.instructions.map((instruction, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex gap-2">
                            <span className="text-primary font-medium">{index + 1}.</span>
                            {instruction}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 text-primary hover:bg-primary/10"
                  >
                    {isExpanded ? "Show Less" : "Try This"}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
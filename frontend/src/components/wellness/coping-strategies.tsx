import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Brain, Smile, Clock } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [selectedStrategy, setSelectedStrategy] = useState<CopingStrategy | null>(null);

  const relevantStrategies = currentMood 
    ? copingStrategies.filter(strategy => 
        !strategy.mood || strategy.mood.includes(currentMood)
      )
    : copingStrategies;

  const handleStrategyClick = (strategy: CopingStrategy) => {
    setSelectedStrategy(strategy);
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-xl lg:text-2xl font-semibold mb-2">Coping Strategies</h2>
        <p className="text-muted-foreground text-sm lg:text-base">
          {currentMood 
            ? `Personalized suggestions for feeling ${currentMood}`
            : "Helpful techniques for emotional wellness"
          }
        </p>
      </div>

      {/* Desktop Layout - Full width flex row */}
      <div className="hidden lg:flex lg:flex-row lg:gap-6 lg:justify-center lg:items-stretch">
        {relevantStrategies.map((strategy) => {
          const Icon = strategy.icon;

          return (
            <Card 
              key={strategy.id} 
              className="flex-1 p-6 lg:p-8 shadow-card transition-gentle hover:shadow-glow"
            >
              <div className="flex flex-col items-center text-center h-full">
                <div className={`p-3 lg:p-4 rounded-full bg-${strategy.color} animate-gentle-bounce mb-4 lg:mb-6`}>
                  <Icon className="w-6 h-6 lg:w-8 lg:h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-3 lg:mb-4 text-lg lg:text-xl">{strategy.title}</h3>
                  <p className="text-sm lg:text-base text-muted-foreground mb-4 lg:mb-6">
                    {strategy.description}
                  </p>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-4 lg:mt-6 text-primary hover:bg-primary/10 text-sm lg:text-base"
                      onClick={() => handleStrategyClick(strategy)}
                    >
                      Try This
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg lg:max-w-xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader className="text-center">
                      <DialogTitle className="flex items-center justify-center gap-3 text-lg lg:text-xl">
                        <div className={`p-3 rounded-full bg-${strategy.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        {strategy.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 text-center">
                      <p className="text-base text-muted-foreground">
                        {strategy.description}
                      </p>
                      <div>
                        <h4 className="text-base font-medium mb-4">Steps:</h4>
                        <ol className="space-y-3 text-base">
                          {strategy.instructions.map((instruction, index) => (
                            <li key={index} className="text-muted-foreground flex gap-3 max-w-sm mx-auto">
                              <span className="text-primary font-medium flex-shrink-0 min-w-[2rem]">{index + 1}.</span>
                              <span className="text-center">{instruction}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Mobile Layout - Keep exactly as is */}
      <div className="lg:hidden space-y-4 max-w-md mx-auto">
        {relevantStrategies.map((strategy) => {
          const Icon = strategy.icon;

          return (
            <Card 
              key={strategy.id} 
              className="p-4 shadow-card transition-gentle hover:shadow-glow"
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
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 text-primary hover:bg-primary/10"
                        onClick={() => handleStrategyClick(strategy)}
                      >
                        Try This
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg lg:max-w-xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader className="text-center">
                        <DialogTitle className="flex items-center justify-center gap-3 text-lg lg:text-xl">
                          <div className={`p-3 rounded-full bg-${strategy.color}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          {strategy.title}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 text-center">
                        <p className="text-base text-muted-foreground">
                          {strategy.description}
                        </p>
                        <div>
                          <h4 className="text-base font-medium mb-2">Steps:</h4>
                          <ol className="space-y-5 text-base">
                            {strategy.instructions.map((instruction, index) => (
                              <li key={index} className="text-muted-foreground flex gap-3 max-w-sm mx-auto">
                                <span className="text-primary font-medium flex-shrink-0 min-w-[2rem]">{index + 1}.</span>
                                <span className="text-center">{instruction}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
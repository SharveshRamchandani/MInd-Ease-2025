import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const inspirationalQuotes = [
  {
    text: "The greatest revolution of our generation is the discovery that human beings, by changing the inner attitudes of their minds, can change the outer aspects of their lives.",
    author: "William James"
  },
  {
    text: "You are not your thoughts. You are the observer of your thoughts.",
    author: "Eckhart Tolle"
  },
  {
    text: "The mind is everything. What you think you become.",
    author: "Buddha"
  },
  {
    text: "Between stimulus and response there is a space. In that space is our power to choose our response. In our response lies our growth and our freedom.",
    author: "Viktor Frankl"
  },
  {
    text: "You don't have to control your thoughts. You just have to stop letting them control you.",
    author: "Dan Millman"
  },
  {
    text: "The present moment is the only time over which we have dominion.",
    author: "Thích Nhất Hạnh"
  },
  {
    text: "What we plant in the soil of contemplation, we shall reap in the harvest of action.",
    author: "Meister Eckhart"
  },
  {
    text: "The curious paradox is that when I accept myself just as I am, then I can change.",
    author: "Carl Rogers"
  }
];

export const MotivationalQuote = () => {
  const [currentQuote, setCurrentQuote] = useState(inspirationalQuotes[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  const getRandomQuote = () => {
    setIsAnimating(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * inspirationalQuotes.length);
      setCurrentQuote(inspirationalQuotes[randomIndex]);
      setIsAnimating(false);
    }, 300);
  };

  useEffect(() => {
    getRandomQuote();
  }, []);

  return (
    <Card className="p-6 lg:p-8 bg-gradient-sunset shadow-glow animate-float h-48 lg:h-56">
      <div className={`transition-gentle h-full flex flex-col ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg lg:text-xl font-semibold text-accent-foreground">Daily Inspiration</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={getRandomQuote}
            className="h-8 w-8 p-0 hover:bg-white/20 flex-shrink-0"
          >
            <RefreshCw className="w-4 h-4 text-accent-foreground" />
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          <blockquote className="text-accent-foreground/90 leading-relaxed italic text-sm lg:text-base line-clamp-4 lg:line-clamp-5">
            "{currentQuote.text}"
          </blockquote>
          
          <cite className="text-accent-foreground/70 text-xs lg:text-sm font-medium mt-2 flex-shrink-0">
            — {currentQuote.author}
          </cite>
        </div>
      </div>
    </Card>
  );
};
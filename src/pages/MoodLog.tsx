import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoodSelector } from "@/components/mood/mood-selector";
import { CopingStrategies } from "@/components/wellness/coping-strategies";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function MoodLog() {
  const [isLoading, setIsLoading] = useState(false);
  const [savedMood, setSavedMood] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleMoodSubmit = async (mood: string, journal: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call - replace with actual Firebase/backend call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful save
      setSavedMood(mood);
      
      toast({
        title: "Mood saved successfully!",
        description: "Your daily check-in has been recorded.",
      });

      // Navigate back to home after a delay
      setTimeout(() => {
        navigate("/");
      }, 2000);
      
    } catch (error) {
      toast({
        title: "Error saving mood",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (savedMood) {
    return (
      <div className="min-h-screen pb-20 p-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Mood Logged</h1>
          </div>

          <Card className="p-6 text-center shadow-glow">
            <div className="space-y-4">
              <div className="text-6xl animate-gentle-bounce">
                {savedMood === "joy" && "😄"}
                {savedMood === "calm" && "😊"}
                {savedMood === "neutral" && "😐"}
                {savedMood === "sad" && "😔"}
                {savedMood === "angry" && "😡"}
                {savedMood === "anxious" && "😰"}
              </div>
              <h2 className="text-xl font-semibold">Thank you for checking in!</h2>
              <p className="text-muted-foreground">
                Your mood has been saved. Here are some personalized suggestions based on how you're feeling.
              </p>
            </div>
          </Card>

          <CopingStrategies currentMood={savedMood} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Daily Mood Check-in</h1>
        </div>

        <MoodSelector onMoodSubmit={handleMoodSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
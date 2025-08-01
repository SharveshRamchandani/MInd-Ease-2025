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
      <div className="min-h-screen pb-20 p-4 lg:pb-4">
        <div className="max-w-4xl mx-auto">
          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Link to="/home">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
                <h1 className="text-2xl font-semibold">Mood Logged</h1>
              </div>

              <Card className="p-8 text-center shadow-glow">
                <div className="space-y-6">
                  <div className="text-8xl animate-gentle-bounce">
                    {savedMood === "joy" && "😄"}
                    {savedMood === "calm" && "😊"}
                    {savedMood === "neutral" && "😐"}
                    {savedMood === "sad" && "😔"}
                    {savedMood === "angry" && "😡"}
                    {savedMood === "anxious" && "😰"}
                  </div>
                  <h2 className="text-3xl font-semibold">Thank you for checking in!</h2>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    Your mood has been saved. Here are some personalized suggestions based on how you're feeling.
                  </p>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <CopingStrategies currentMood={savedMood} />
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden max-w-md mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Link to="/home">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 p-4 lg:pb-4">
      <div className="max-w-4xl mx-auto">
        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Link to="/home">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-semibold">Daily Mood Check-in</h1>
            </div>

            <div className="lg:sticky lg:top-6">
              <MoodSelector onMoodSubmit={handleMoodSubmit} isLoading={isLoading} />
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6 shadow-card">
              <h3 className="text-xl font-semibold mb-4">Why track your mood?</h3>
              <div className="space-y-4 text-muted-foreground">
                <p>Regular mood tracking helps you:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Identify patterns in your emotional well-being</li>
                  <li>Recognize triggers and coping strategies that work</li>
                  <li>Communicate more effectively with healthcare providers</li>
                  <li>Celebrate progress and positive changes</li>
                </ul>
              </div>
            </Card>

            <Card className="p-6 shadow-card">
              <h3 className="text-xl font-semibold mb-4">Tips for accurate tracking</h3>
              <div className="space-y-3 text-muted-foreground">
                <p>• Check in at the same time each day</p>
                <p>• Be honest about how you're feeling</p>
                <p>• Note any significant events or changes</p>
                <p>• Remember that all feelings are valid</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden max-w-md mx-auto space-y-6">
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
    </div>
  );
}
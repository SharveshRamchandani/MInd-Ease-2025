import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MotivationalQuote } from "@/components/wellness/motivational-quote";
import { CopingStrategies } from "@/components/wellness/coping-strategies";
import { MessageCircle, BarChart3, Plus, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/hero-wellness.jpg";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface MoodOption {
  emoji: string;
  label: string;
  value: string;
  color: string;
}

interface MoodEntry {
  id: string;
  mood: string;
  emoji: string;
  journal?: string;
  timestamp: string;
}

const moodOptions: MoodOption[] = [
  { emoji: "😄", label: "Joyful", value: "joy", color: "emotion-joy" },
  { emoji: "😊", label: "Content", value: "calm", color: "emotion-calm" },
  { emoji: "😐", label: "Neutral", value: "neutral", color: "emotion-neutral" },
  { emoji: "😔", label: "Sad", value: "sad", color: "emotion-sad" },
  { emoji: "😡", label: "Angry", value: "angry", color: "emotion-angry" },
  { emoji: "😰", label: "Anxious", value: "anxious", color: "emotion-anxious" },
];

// Mood to emoji mapping
const moodToEmoji: { [key: string]: string } = {
  joy: "😄",
  calm: "😊",
  neutral: "😐",
  sad: "😔",
  angry: "😡",
  anxious: "😰",
};

// Helper function to format date
const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  
  // Reset time to compare only dates
  const moodDate = new Date(date);
  moodDate.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - moodDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays === 2) return "2 days ago";
  if (diffDays === 3) return "3 days ago";
  if (diffDays === 4) return "4 days ago";
  if (diffDays === 5) return "5 days ago";
  if (diffDays === 6) return "6 days ago";
  if (diffDays === 7) return "7 days ago";
  
  // For older dates, show the date in DD-MM format
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}-${month}`;
};

const MoodChart = ({ moodHistory }: { moodHistory: MoodEntry[] }) => {
  const moodScores = {
    joy: 5,
    calm: 4,
    neutral: 3,
    anxious: 2,
    sad: 2,
    angry: 1,
  };

  // Get last 7 entries, reverse to show newest first
  const chartData = moodHistory.slice(0, 7).reverse();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
         Your Mood Recently.
        </h3>
        <Link to="/history">
          <Button variant="ghost" size="sm" className="text-primary text-sm">
            View All
          </Button>
        </Link>
      </div>
      <div className="space-y-3">
        {chartData.length > 0 ? (
          chartData.map((entry, index) => {
            const score = moodScores[entry.mood as keyof typeof moodScores] || 3;
            const width = (score / 5) * 100;
            
            return (
              <div key={entry.id} className="flex items-center gap-4">
                <div className="w-20 text-xs text-muted-foreground">{formatDate(entry.timestamp)}</div>
                <div className="flex-1 bg-muted rounded-full h-8 flex items-center">
                  <div 
                    className="h-full bg-gradient-primary rounded-full flex items-center justify-end pr-3 transition-gentle"
                    style={{ width: `${width}%` }}
                  >
                    <span className="text-sm">{entry.emoji}</span>
                  </div>
                </div>
                <div className="w-16 text-xs font-medium capitalize">{entry.mood}</div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No mood entries yet</p>
            <p className="text-xs">Start tracking your mood to see your progress here!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable modal with info about mood tracking
const MoodTrackingInfoModal: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-primary  hover:no-underline">
          Know more about mood tracking
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>About Mood Tracking</DialogTitle>
          <DialogDescription>
            Learn why tracking your mood matters and tips to make it more accurate.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-2">Why track your mood?</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>Regular mood tracking helps you:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Identify patterns in your emotional well-being</li>
                <li>Recognize triggers and coping strategies that work</li>
                <li>Communicate more effectively with healthcare providers</li>
                <li>Celebrate progress and positive changes</li>
              </ul>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-2">Tips for accurate tracking</h3>
            <div className="space-y-1 text-muted-foreground">
              <p>• Check in at the same time each day</p>
              <p>• Be honest about how you're feeling</p>
              <p>• Note any significant events or changes</p>
              <p>• Remember that all feelings are valid</p>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function Home(): React.JSX.Element {
  const [todaysMood, setTodaysMood] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    const fetchMoodHistory = async () => {
      if (!currentUser) return;
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch('http://localhost:5000/api/mood/history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          const history = data.data.mood_logs || [];
          setMoodHistory(history);
          // Set todaysMood to the most recent entry if available
          if (history.length > 0) {
            setTodaysMood(history[0].mood);
          }
        }
      } catch (error) {
        console.error("Error fetching mood history:", error);
        toast({
          title: "Failed to load mood history",
          description: "Could not fetch your mood history. Please try again later.",
          variant: "destructive",
        });
      }
    };

    fetchMoodHistory();
    const interval = setInterval(fetchMoodHistory, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [currentUser, toast]);

  const handleMoodSelect = async (moodValue: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to log your mood.",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsSaving(true);
      setSelectedMood(moodValue);
      const token = await currentUser.getIdToken();
      const response = await fetch('http://localhost:5000/api/mood/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mood: moodValue,
          journal: '',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save mood');
      }
      const data = await response.json();
      if (data.success) {
        setTodaysMood(moodValue);
        // Optimistically update local history for the sidebar widgets
        const newEntry: MoodEntry = {
          id: data.mood_id || String(Date.now()),
          mood: moodValue,
          emoji: moodToEmoji[moodValue] || '😊',
          journal: '',
          timestamp: new Date().toISOString(),
        };
        setMoodHistory(prev => [newEntry, ...prev]);
        toast({ title: 'Mood saved', description: 'Your daily check-in has been recorded.' });
      } else {
        throw new Error(data.error || 'Failed to save mood');
      }
    } catch (error) {
      console.error('Error logging mood from Home:', error);
      toast({ title: 'Failed to save mood', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate streak from mood history
  const calculateStreak = (moods: MoodEntry[]) => {
    if (moods.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const hasMoodOnDate = moods.some(mood => {
        const moodDate = new Date(mood.timestamp);
        moodDate.setHours(0, 0, 0, 0);
        return moodDate.getTime() === checkDate.getTime();
      });
      
      if (hasMoodOnDate) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const streakCount = calculateStreak(moodHistory);

  return (
    <div className="min-h-screen pb-32 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 lg:space-y-0">
          {/* Left Column - Hero and Check-in */}
          <div className="lg:col-span-8 space-y-6">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl shadow-glow">
              <img 
                src={heroImage} 
                alt="Peaceful wellness imagery" 
                className="w-full h-64 lg:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-primary/80 flex items-center justify-center">
                <div className="text-center text-amber-900 dark:text-slate-800">
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2 drop-shadow-lg">
                    Welcome to Mind-Ease <br></br>
                    {currentUser?.displayName ? ` ${currentUser.displayName}` : ""}
                  </h1>
                  <p className="text-lg text-amber-800 dark:text-slate-700 drop-shadow-md">Your personal wellness companion</p>
                </div>
              </div>
            </div>

            {/* Quick Check-in */}
            <Card className="relative p-6 lg:p-8 shadow-card">
              <div className="absolute top-4 right-4">
                <MoodTrackingInfoModal />
              </div>
              <div className="text-center space-y-4">
                <h2 className="text-2xl lg:text-3xl font-semibold">Daily Check-in</h2>
                <div className="space-y-4">
                  <p className="text-lg text-muted-foreground">How are you feeling today?</p>
                  <div className="grid grid-cols-3 gap-4">
                    {moodOptions.map((mood) => (
                      <Button
                        key={mood.value}
                        variant={selectedMood === mood.value ? "default" : "outline"}
                        className={cn(
                          "flex flex-col gap-2 h-auto py-4 transition-bounce hover:scale-105",
                          selectedMood === mood.value && `bg-${mood.color} hover:bg-${mood.color}/90`
                        )}
                        disabled={isSaving}
                        onClick={() => handleMoodSelect(mood.value)}
                      >
                        <span className="text-3xl">{mood.emoji}</span>
                        <span className="text-sm font-medium">{mood.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <Link to="/chat">
                <Card className="p-6 lg:p-8 shadow-card hover:shadow-glow transition-gentle">
                  <div className="text-center space-y-3">
                    <MessageCircle className="w-8 h-8 lg:w-10 lg:h-10 mx-auto text-primary" />
                    <p className="text-lg font-medium">Chat with Solari</p>
                    <p className="text-sm text-muted-foreground">Get personalized support and guidance</p>
                  </div>
                </Card>
              </Link>
              
              <Link to="/history">
                <Card className="p-6 lg:p-8 shadow-card hover:shadow-glow transition-gentle">
                  <div className="text-center space-y-3">
                    <BarChart3 className="w-8 h-8 lg:w-10 lg:h-10 mx-auto text-primary" />
                    <p className="text-lg font-medium">View Progress</p>
                    <p className="text-sm text-muted-foreground">Track your wellness journey</p>
                  </div>
                </Card>
              </Link>
            </div>
          </div>

          {/* Right Column - Stats and Recent */}
          <div className="lg:col-span-4 space-y-6">
            {/* Motivational Quote */}
            <div className="lg:block">
              <MotivationalQuote />
            </div>

            {/* 7-Day Mood Trend */}
            <Card className="p-6 lg:p-8 shadow-card h-[470px] flex flex-col justify-center">
              <MoodChart moodHistory={moodHistory} />
            </Card>

            {/* Streak Counter */}
            <Card className="p-6 lg:p-8 shadow-card bg-gradient-calm">
              <div className="w-full flex flex-col items-center justify-center text-center">
                <h3 className="text-base sm:text-lg font-semibold text-secondary-foreground">Check-in Streak</h3>
                <span className="mt-2 leading-none font-bold text-3xl sm:text-4xl lg:text-5xl text-secondary-foreground">{streakCount}</span>
                <span className="mt-1 text-xs sm:text-sm text-secondary-foreground/70">days</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden max-w-md mx-auto space-y-6">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl shadow-glow">
            <img 
              src={heroImage} 
              alt="Peaceful wellness imagery" 
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-primary/80 flex items-center justify-center">
              <div className="text-center text-amber-900 dark:text-slate-800">
                <h1 className="text-2xl font-bold mb-2 drop-shadow-lg">
                  Welcome{currentUser?.displayName ? `, ${currentUser.displayName}` : ""} to Mind-Ease
                </h1>
                <p className="text-amber-800 dark:text-slate-700 drop-shadow-md">Your personal wellness companion</p>
              </div>
            </div>
          </div>

          {/* Quick Check-in */}
          <Card className="relative p-6 shadow-card">
            <div className="absolute top-4 right-4">
              <MoodTrackingInfoModal />
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">Daily Check-in</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground">How are you feeling today?</p>
                <div className="grid grid-cols-3 gap-3">
                  {moodOptions.map((mood) => (
                    <Button
                      key={mood.value}
                      variant={selectedMood === mood.value ? "default" : "outline"}
                      className={cn(
                        "flex flex-col gap-1 h-auto py-3 transition-bounce hover:scale-105",
                        selectedMood === mood.value && `bg-${mood.color} hover:bg-${mood.color}/90`
                      )}
                      disabled={isSaving}
                      onClick={() => handleMoodSelect(mood.value)}
                    >
                      <span className="text-2xl">{mood.emoji}</span>
                      <span className="text-xs font-medium">{mood.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Motivational Quote */}
          <MotivationalQuote />

          {/* 7-Day Mood Trend */}
          <Card className="p-6 shadow-card">
            <MoodChart moodHistory={moodHistory} />
          </Card>

          {/* Streak Counter */}
          <Card className="p-3 shadow-card bg-gradient-calm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-secondary-foreground">Check-in Streak</h3>
                <p className="text-xs text-secondary-foreground/70">Keep it going!</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-secondary-foreground">{streakCount}</div>
                <p className="text-xs text-secondary-foreground/70">days</p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="flex gap-4">
            <Link to="/chat" className="flex-1">
              <Card className="p-4 shadow-card hover:shadow-glow transition-gentle h-full">
                <div className="text-center space-y-2">
                  <MessageCircle className="w-6 h-6 mx-auto text-primary" />
                  <p className="text-sm font-medium">Chat with AI</p>
                </div>
              </Card>
            </Link>
            
            <Link to="/history" className="flex-1">
              <Card className="p-4 shadow-card hover:shadow-glow transition-gentle h-full">
                <div className="text-center space-y-2">
                  <BarChart3 className="w-6 h-6 mx-auto text-primary" />
                  <p className="text-sm font-medium">View Progress</p>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Coping Strategies - Now at the bottom of all content */}
        <div className="mt-10 lg:mt-6">
          <CopingStrategies />
        </div>
      </div>
    </div>
  );
}
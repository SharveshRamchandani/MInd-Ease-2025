import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar as CalendarIcon, TrendingUp, Download, BarChart3, Clock, Activity, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface MoodEntry {
  id: string;
  date: string;
  mood: string;
  emoji: string;
  journal?: string;
  timestamp: Date;
  user_id: string;
}

// Remove static mock data - will be fetched dynamically
const moodToBgClass: Record<string, string> = {
  joy: "bg-amber-100",
  calm: "bg-sky-100",
  neutral: "bg-slate-100",
  sad: "bg-blue-100",
  angry: "bg-red-100",
  anxious: "bg-purple-100",
};

const moodToEmoji: Record<string, string> = {
  joy: "😄",
  calm: "😊",
  neutral: "😐",
  sad: "😔",
  angry: "😡",
  anxious: "😰",
};

const MoodCalendar = ({ moodHistory }: { moodHistory: MoodEntry[] }) => {
  // Map each date to its latest mood entry
  const dateKeyToEntry = moodHistory.reduce<Record<string, MoodEntry>>((acc, entry) => {
    const key = format(entry.timestamp, "yyyy-MM-dd");
    acc[key] = entry;
    return acc;
  }, {});

  const DayCell = (props: any) => {
    const date: Date = props.date;
    const key = format(date, "yyyy-MM-dd");
    const entry = dateKeyToEntry[key];
    const dayNum = date.getDate();
    if (entry) {
      return (
        <div className="h-9 w-9 flex items-center justify-center">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-base ${moodToBgClass[entry.mood] || "bg-muted"}`}>
            <span aria-label={entry.mood}>{entry.emoji}</span>
          </div>
        </div>
      );
    }
    // default day number muted circle
    return (
      <div className="h-9 w-9 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs text-muted-foreground bg-muted/40">
          {dayNum}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 shadow-card">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <CalendarIcon className="w-5 h-5" />
        Monthly Mood Calendar
      </h3>
      <Calendar
        className="w-full"
        classNames={{
          // header
          caption: "grid grid-cols-[auto_1fr_auto] items-center px-3",
          caption_label: "col-start-2 text-center text-sm font-medium",
          nav: "contents",
          nav_button:
            "h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60",
          nav_button_previous: "col-start-1 justify-self-start",
          nav_button_next: "col-start-3 justify-self-end",

          // grid
          months: "w-full",
          month: "w-full",
          table: "w-full border-collapse",
          head_row: "grid grid-cols-7",
          head_cell: "text-muted-foreground text-center text-xs",
          row: "grid grid-cols-7",
          cell: "p-1 text-center",
          day: "w-full h-10 p-0 flex items-center justify-center",
        }}
        components={{ Day: DayCell as any }}
        showOutsideDays
        captionLayout="buttons"
        mode="single"
        defaultMonth={new Date()}
      />
    </Card>
  );
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

  // Get last 7 days of mood entries
  const last7Days = moodHistory
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 7)
    .reverse();

  return (
    <Card className="p-6 shadow-card">
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        7-Day Mood Trend
      </h3>
      <div className="space-y-4">
        {last7Days.map((entry, index) => {
          const score = moodScores[entry.mood as keyof typeof moodScores];
          const width = (score / 5) * 100;
          const dateLabel = format(entry.timestamp, "MMM dd");
          
          return (
            <div key={entry.id} className="flex items-center gap-4">
              <div className="w-20 text-sm text-muted-foreground">{dateLabel}</div>
              <div className="flex-1 bg-muted rounded-full h-8 flex items-center">
                <div 
                  className="h-full bg-gradient-primary rounded-full flex items-center justify-end pr-3 transition-gentle"
                  style={{ width: `${width}%` }}
                >
                  <span className="text-sm">{entry.emoji}</span>
                </div>
              </div>
              <div className="w-16 text-sm font-medium capitalize">{entry.mood}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const MoodList = ({ moodHistory }: { moodHistory: MoodEntry[] }) => {
  return (
    <div className="space-y-4">
      {moodHistory.map((entry) => (
        <Card key={entry.id} className="p-6 shadow-card">
          <div className="flex items-start gap-4">
            <div className="text-3xl">{entry.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium capitalize">{entry.mood}</h4>
                <span className="text-sm text-muted-foreground">{format(entry.timestamp, "MMM dd, yyyy")}</span>
              </div>
              {entry.journal && (
                <p className="text-muted-foreground leading-relaxed">
                  {entry.journal}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default function History() {
  const [activeTab, setActiveTab] = useState("timeline");
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Calculate statistics from mood history
  const calculateStreak = (moods: any[]) => {
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

  const calculateTotalMoods = (moods: any[]) => {
    return moods.length;
  };

  const streak = calculateStreak(moodHistory);
  const totalMoods = calculateTotalMoods(moodHistory);

  // Calculate mood distribution
  const moodCounts = moodHistory.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Fetch mood history from Firebase
  const fetchMoodHistory = async (showLoading = true) => {
    if (!currentUser) return;
    if (showLoading) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`https://mind-ease-2025.onrender.com/api/mood/history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const history = data.data.mood_logs.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp),
            emoji: moodToEmoji[entry.mood] || "\ud83d\ude10"
          }));
          setMoodHistory(history);
          console.log('Fetched mood history:', history);
          if (showLoading) {
            toast({
              title: "Mood history loaded",
              description: `Found ${history.length} mood entries`,
            });
          }
        } else {
          console.error('API returned error:', data.error);
          toast({
            title: "Error loading mood history",
            description: data.error || "Please try again later.",
            variant: "destructive",
          });
        }
      } else {
        console.error('HTTP error:', response.status, response.statusText);
        toast({
          title: "Error loading mood history",
          description: `HTTP ${response.status}: ${response.statusText}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching mood history:', error);
      toast({
        title: "Error loading mood history",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMoodHistory(true);
  }, [currentUser]);

  // Auto-refresh every 30 seconds to keep data fresh
  useEffect(() => {
    if (!currentUser) return;
    
    const interval = setInterval(() => {
      fetchMoodHistory(false); // Don't show loading state for auto-refresh
    }, 30000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 p-4 lg:pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="text-xl">Loading your mood history...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 p-4 lg:pb-4 mb-20">
      <div className="max-w-7xl mx-auto">
        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 lg:space-y-0 mb-2">
          {/* Left Column - Stats and Overview */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Link to="/">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
                <h1 className="text-2xl font-semibold">Mood History</h1>
              </div>
              
              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchMoodHistory(false)}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 shadow-card text-center bg-gradient-calm">
                <div className="text-3xl font-bold text-secondary-foreground">{totalMoods}</div>
                <p className="text-sm text-secondary-foreground/70">Total Mood Entries</p>
              </Card>
              <Card className="p-6 shadow-card text-center bg-gradient-sunset">
                <div className="text-3xl font-bold text-accent-foreground">{streak}</div>
                <p className="text-sm text-accent-foreground/70">Day Streak</p>
              </Card>
            </div>

            {/* Mood Distribution */}
            <Card className="p-6 shadow-card">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Mood Distribution
              </h3>
              <div className="space-y-3">
                {Object.entries(moodCounts).map(([mood, count]) => {
                  const percentage = totalMoods > 0 ? (count / totalMoods) * 100 : 0;
                  const emoji = moodToEmoji[mood] || "😐";
                  
                  return (
                    <div key={mood} className="flex items-center gap-3">
                      <span className="text-lg">{emoji}</span>
                      <div className="flex-1 bg-muted rounded-full h-4">
                        <div 
                          className="h-full bg-primary rounded-full transition-gentle"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12">{count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Monthly Mood Calendar */}
            <MoodCalendar moodHistory={moodHistory} />

            {/* Export Option */}
            <Card className="p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Export Data</h3>
                  <p className="text-sm text-muted-foreground">Download your mood history</p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </Card>

            {/* Insights Card */}
            <Card className=" mt-10 lg:mt-6 p-6 shadow-card mb-100 ">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Insights
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                {totalMoods === 0 ? (
                  <p>• Start your mood tracking journey today!</p>
                ) : (
                  <>
                    <p>• You've logged {totalMoods} mood entries</p>
                    <p>• Your current streak is {streak} days</p>
                    {Object.keys(moodCounts).length > 0 && (
                      <p>• Your most common mood is {Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0][0]}</p>
                    )}
                  </>
                )}
              </div>
            </Card>
            
            

            
          </div>
                
          {/* Right Column - Timeline and Charts */}
          <div className="lg:col-span-8 space-y-6">
            {/* Tabs for different views */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="timeline" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="chart" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Chart
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="timeline" className="mt-6">
                {moodHistory.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No mood entries yet. Start tracking your mood to see your history here!</p>
                  </Card>
                ) : (
                  <MoodList moodHistory={moodHistory} />
                )}
              </TabsContent>
              
              <TabsContent value="chart" className="mt-6">
                {moodHistory.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No mood entries yet. Start tracking your mood to see your trends here!</p>
                  </Card>
                ) : (
                  <MoodChart moodHistory={moodHistory} />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden max-w-md mx-auto space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">Mood History</h1>
            </div>
            
            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMoodHistory(false)}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 shadow-card text-center bg-gradient-calm">
              <div className="text-2xl font-bold text-secondary-foreground">{totalMoods}</div>
              <p className="text-sm text-secondary-foreground/70">Total Mood Entries</p>
            </Card>
            <Card className="p-4 shadow-card text-center bg-gradient-sunset">
              <div className="text-2xl font-bold text-accent-foreground">{streak}</div>
              <p className="text-sm text-accent-foreground/70">Day Streak</p>
            </Card>
          </div>

          {/* Mood Distribution */}
          <Card className="p-4 shadow-card">
            <h3 className="font-semibold mb-3">Mood Distribution</h3>
            <div className="space-y-2">
              {Object.entries(moodCounts).map(([mood, count]) => {
                const percentage = totalMoods > 0 ? (count / totalMoods) * 100 : 0;
                const emoji = moodToEmoji[mood] || "😐";
                
                return (
                  <div key={mood} className="flex items-center gap-2">
                    <span className="text-sm">{emoji}</span>
                    <div className="flex-1 bg-muted rounded-full h-4">
                      <div 
                        className="h-full bg-primary rounded-full transition-gentle"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Monthly Mood Calendar */}
          <MoodCalendar moodHistory={moodHistory} />

          {/* Tabs for different views */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="chart">Chart</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timeline" className="mt-4">
              {moodHistory.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No mood entries yet. Start tracking your mood to see your history here!</p>
                </Card>
              ) : (
                <MoodList moodHistory={moodHistory} />
              )}
            </TabsContent>
            
            <TabsContent value="chart" className="mt-4">
              {moodHistory.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No mood entries yet. Start tracking your mood to see your trends here!</p>
                </Card>
              ) : (
                <MoodChart moodHistory={moodHistory} />
              )}
            </TabsContent>
          </Tabs>

          {/* Export Option */}
          <Card className="p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Export Data</h3>
                <p className="text-sm text-muted-foreground">Download your mood history</p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
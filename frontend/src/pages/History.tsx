import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, TrendingUp, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MoodEntry {
  id: string;
  date: string;
  mood: string;
  emoji: string;
  journal?: string;
  timestamp: Date;
}

// Mock data - replace with Firebase data
const mockMoodHistory: MoodEntry[] = [
  {
    id: "1",
    date: "Today",
    mood: "calm",
    emoji: "😊",
    journal: "Had a peaceful morning meditation and felt centered throughout the day.",
    timestamp: new Date(),
  },
  {
    id: "2",
    date: "Yesterday",
    mood: "joy",
    emoji: "😄",
    journal: "Great day with friends! Feeling grateful and happy.",
    timestamp: new Date(Date.now() - 86400000),
  },
  {
    id: "3",
    date: "2 days ago",
    mood: "anxious",
    emoji: "😰",
    journal: "Work stress was high today. Used breathing exercises which helped.",
    timestamp: new Date(Date.now() - 172800000),
  },
  {
    id: "4",
    date: "3 days ago",
    mood: "neutral",
    emoji: "😐",
    journal: "Regular day, nothing special happened.",
    timestamp: new Date(Date.now() - 259200000),
  },
  {
    id: "5",
    date: "4 days ago",
    mood: "sad",
    emoji: "😔",
    journal: "Feeling a bit down today. Talked to a friend which helped.",
    timestamp: new Date(Date.now() - 345600000),
  },
];

const MoodChart = () => {
  const moodScores = {
    joy: 5,
    calm: 4,
    neutral: 3,
    anxious: 2,
    sad: 2,
    angry: 1,
  };

  const chartData = mockMoodHistory.slice(0, 7).reverse();

  return (
    <Card className="p-4 shadow-card">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        7-Day Mood Trend
      </h3>
      <div className="space-y-3">
        {chartData.map((entry, index) => {
          const score = moodScores[entry.mood as keyof typeof moodScores];
          const width = (score / 5) * 100;
          
          return (
            <div key={entry.id} className="flex items-center gap-3">
              <div className="w-16 text-xs text-muted-foreground">{entry.date}</div>
              <div className="flex-1 bg-muted rounded-full h-6 flex items-center">
                <div 
                  className="h-full bg-gradient-primary rounded-full flex items-center justify-end pr-2 transition-gentle"
                  style={{ width: `${width}%` }}
                >
                  <span className="text-xs">{entry.emoji}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const MoodList = () => {
  return (
    <div className="space-y-4">
      {mockMoodHistory.map((entry) => (
        <Card key={entry.id} className="p-4 shadow-card">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{entry.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium capitalize">{entry.mood}</h4>
                <span className="text-xs text-muted-foreground">{entry.date}</span>
              </div>
              {entry.journal && (
                <p className="text-sm text-muted-foreground leading-relaxed">
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

  const moodCounts = mockMoodHistory.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalEntries = mockMoodHistory.length;
  const currentStreak = 7; // Mock streak

  return (
    <div className="min-h-screen pb-20 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Mood History</h1>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 shadow-card text-center bg-gradient-calm">
            <div className="text-2xl font-bold text-secondary-foreground">{totalEntries}</div>
            <p className="text-sm text-secondary-foreground/70">Total Check-ins</p>
          </Card>
          <Card className="p-4 shadow-card text-center bg-gradient-sunset">
            <div className="text-2xl font-bold text-accent-foreground">{currentStreak}</div>
            <p className="text-sm text-accent-foreground/70">Day Streak</p>
          </Card>
        </div>

        {/* Mood Distribution */}
        <Card className="p-4 shadow-card">
          <h3 className="font-semibold mb-3">Mood Distribution</h3>
          <div className="space-y-2">
            {Object.entries(moodCounts).map(([mood, count]) => {
              const percentage = (count / totalEntries) * 100;
              const emoji = mockMoodHistory.find(entry => entry.mood === mood)?.emoji || "😐";
              
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

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="chart">Chart</TabsTrigger>
          </TabsList>
          
          <TabsContent value="timeline" className="mt-4">
            <MoodList />
          </TabsContent>
          
          <TabsContent value="chart" className="mt-4">
            <MoodChart />
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
  );
}
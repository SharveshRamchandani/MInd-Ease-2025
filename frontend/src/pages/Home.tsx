import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MotivationalQuote } from "@/components/wellness/motivational-quote";
import { CopingStrategies } from "@/components/wellness/coping-strategies";
import { MessageCircle, BarChart3, Plus } from "lucide-react";
import heroImage from "@/assets/hero-wellness.jpg";

export default function Home(): React.JSX.Element {
  const [todaysMood, setTodaysMood] = useState<string | null>(null);

  // Mock data - will be replaced with real data from Firebase
  const recentMoods: string[] = ["😊", "😐", "😄"];
  const streakCount: number = 7;

  return (
    <div className="min-h-screen pb-20 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl shadow-glow">
          <img 
            src={heroImage} 
            alt="Peaceful wellness imagery" 
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-primary/80 flex items-center justify-center">
            <div className="text-center text-primary-foreground">
              <h1 className="text-2xl font-bold mb-2">Welcome to Mind-Ease</h1>
              <p className="text-primary-foreground/90">Your personal wellness companion</p>
            </div>
          </div>
        </div>

        {/* Quick Check-in */}
        <Card className="p-6 shadow-card">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Daily Check-in</h2>
            {!todaysMood ? (
              <div className="space-y-3">
                <p className="text-muted-foreground">How are you feeling today?</p>
                <Link to="/mood">
                  <Button className="bg-gradient-primary hover:opacity-90 transition-gentle w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Log Your Mood
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-3xl">{todaysMood}</div>
                <p className="text-sm text-muted-foreground">Mood logged for today</p>
                <Link to="/mood">
                  <Button variant="outline" size="sm">Update Mood</Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Streak Counter */}
        <Card className="p-4 shadow-card bg-gradient-calm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-secondary-foreground">Check-in Streak</h3>
              <p className="text-sm text-secondary-foreground/70">Keep it going!</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-secondary-foreground">{streakCount}</div>
              <p className="text-xs text-secondary-foreground/70">days</p>
            </div>
          </div>
        </Card>

        {/* Recent Moods */}
        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent Moods</h3>
            <Link to="/history">
              <Button variant="ghost" size="sm" className="text-primary">
                View All
              </Button>
            </Link>
          </div>
          <div className="flex gap-2">
            {recentMoods.map((mood, index) => (
              <div key={index} className="text-2xl animate-gentle-bounce">
                {mood}
              </div>
            ))}
          </div>
        </Card>

        {/* Motivational Quote */}
        <MotivationalQuote />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link to="/chat">
            <Card className="p-4 shadow-card hover:shadow-glow transition-gentle">
              <div className="text-center space-y-2">
                <MessageCircle className="w-6 h-6 mx-auto text-primary" />
                <p className="text-sm font-medium">Chat with AI</p>
              </div>
            </Card>
          </Link>
          
          <Link to="/history">
            <Card className="p-4 shadow-card hover:shadow-glow transition-gentle">
              <div className="text-center space-y-2">
                <BarChart3 className="w-6 h-6 mx-auto text-primary" />
                <p className="text-sm font-medium">View Progress</p>
              </div>
            </Card>
          </Link>
        </div>

        {/* Coping Strategies */}
        <CopingStrategies currentMood={todaysMood} />
      </div>
    </div>
  );
}
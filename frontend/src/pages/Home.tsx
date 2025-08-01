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
  const recentMoods: string[] = ["😊", "😐", "😄", "😔", "😰", "😡"];
  const streakCount: number = 7;

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
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2 drop-shadow-lg">Welcome to Mind-Ease</h1>
                  <p className="text-lg text-amber-800 dark:text-slate-700 drop-shadow-md">Your personal wellness companion</p>
                </div>
              </div>
            </div>

            {/* Quick Check-in */}
            <Card className="p-6 lg:p-8 shadow-card">
              <div className="text-center space-y-4">
                <h2 className="text-2xl lg:text-3xl font-semibold">Daily Check-in</h2>
                {!todaysMood ? (
                  <div className="space-y-4">
                    <p className="text-lg text-muted-foreground">How are you feeling today?</p>
                    <Link to="/mood">
                      <Button className="bg-gradient-primary hover:opacity-90 transition-gentle w-full lg:w-auto lg:px-8 lg:py-3 lg:text-lg">
                        <Plus className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                        Log Your Mood
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-4xl lg:text-5xl">{todaysMood}</div>
                    <p className="text-base text-muted-foreground">Mood logged for today</p>
                    <Link to="/mood">
                      <Button variant="outline" size="lg">Update Mood</Button>
                    </Link>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <Link to="/chat">
                <Card className="p-6 lg:p-8 shadow-card hover:shadow-glow transition-gentle">
                  <div className="text-center space-y-3">
                    <MessageCircle className="w-8 h-8 lg:w-10 lg:h-10 mx-auto text-primary" />
                    <p className="text-lg font-medium">Chat with AI</p>
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
            {/* Streak Counter */}
            <Card className="p-6 lg:p-8 shadow-card bg-gradient-calm">
              <div className="text-center space-y-4">
                <h3 className="text-xl lg:text-2xl font-semibold text-secondary-foreground">Check-in Streak</h3>
                <p className="text-secondary-foreground/70">Keep it going!</p>
                <div className="text-4xl lg:text-5xl font-bold text-secondary-foreground">{streakCount}</div>
                <p className="text-secondary-foreground/70">days</p>
              </div>
            </Card>

            {/* Recent Moods */}
            <Card className="p-6 lg:p-8 shadow-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl lg:text-2xl font-semibold">Recent Moods</h3>
                  <Link to="/history">
                    <Button variant="ghost" size="sm" className="text-primary">
                      View All
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {recentMoods.map((mood, index) => (
                    <Link key={index} to="/mood">
                      <div className="text-3xl lg:text-4xl animate-gentle-bounce text-center hover:scale-110 transition-transform cursor-pointer p-2 rounded-lg hover:bg-muted/50">
                        {mood}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </Card>

            {/* Motivational Quote */}
            <div className="lg:block">
              <MotivationalQuote />
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden max-w-md mx-auto space-y-6">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl shadow-glow">
            <img 
              src={"./assets/hero-wellness.jpg"} 
              alt="Peaceful wellness imagery" 
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-primary/80 flex items-center justify-center">
              <div className="text-center text-amber-900 dark:text-slate-800">
                <h1 className="text-2xl font-bold mb-2 drop-shadow-lg">Welcome to Mind-Ease</h1>
                <p className="text-amber-800 dark:text-slate-700 drop-shadow-md">Your personal wellness companion</p>
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
          <Card className="p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Moods</h3>
              <Link to="/history">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {recentMoods.map((mood, index) => (
                <Link key={index} to="/mood">
                  <div className="text-2xl animate-gentle-bounce text-center hover:scale-110 transition-transform cursor-pointer p-2 rounded-lg hover:bg-muted/50">
                    {mood}
                  </div>
                </Link>
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
        </div>

        {/* Coping Strategies - Now at the bottom of all content */}
        <div className="mt-10 lg:mt-6">
          <CopingStrategies currentMood={todaysMood} />
        </div>
      </div>
    </div>
  );
}
import { Link, useLocation } from "react-router-dom";
import { Home, MessageCircle, BarChart3, BookOpen, Moon, Sun } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const NavigationItem = ({ to, icon: Icon, label, isActive }: {
  to: string;
  icon: any;
  label: string;
  isActive: boolean;
}) => (
  <Link to={to}>
    <div className={cn(
      "flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 ease-in-out p-2 rounded-xl",
      isActive 
        ? "bg-primary/20" 
        : "hover:bg-primary/10"
    )}>
      <div className={cn(
        "text-xl flex items-center justify-center",
        isActive 
          ? "text-primary" 
          : "text-muted-foreground"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={cn(
        "text-xs font-medium text-center",
        isActive 
          ? "text-primary" 
          : "text-muted-foreground"
      )}>
        {label}
      </span>
    </div>
  </Link>
);

export const Navigation = () => {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/mood", icon: BookOpen, label: "Mood" },
    { to: "/chat", icon: MessageCircle, label: "Chat" },
    { to: "/history", icon: BarChart3, label: "History" },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-card/90 backdrop-blur-md border border-border/20 rounded-3xl shadow-lg w-[calc(100%-2rem)] max-w-4xl">
      <nav className="p-3 px-4 flex justify-around items-center w-full">
        {navItems.map((item) => (
          <NavigationItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            isActive={location.pathname === item.to}
          />
        ))}
        
        <div 
          className={cn(
            "flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 ease-in-out p-2 rounded-xl hover:bg-primary/10"
          )}
          onClick={toggleTheme}
        >
          <div className="text-xl flex items-center justify-center text-muted-foreground">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </div>
          <span className="text-xs font-medium text-center text-muted-foreground">
            Theme
          </span>
        </div>
      </nav>
    </div>
  );
};
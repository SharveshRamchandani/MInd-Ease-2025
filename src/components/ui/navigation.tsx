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
    <Button
      variant={isActive ? "default" : "ghost"}
      size="sm"
      className={cn(
        "flex flex-col gap-1 h-auto py-2 px-3 transition-gentle",
        isActive && "bg-gradient-primary shadow-glow"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-xs">{label}</span>
    </Button>
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
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border shadow-soft z-50">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navItems.map((item) => (
          <NavigationItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            isActive={location.pathname === item.to}
          />
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="flex flex-col gap-1 h-auto py-2 px-3"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className="text-xs">Theme</span>
        </Button>
      </div>
    </nav>
  );
};
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, MessageCircle, BarChart3, BookOpen, Moon, Sun, Monitor, LogOut } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NavigationItem = ({ to, icon: Icon, label, isActive, onClick }: {
  to?: string;
  icon: any;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) => {
  const content = (
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
  );

  if (onClick) {
    return <div onClick={onClick}>{content}</div>;
  }

  return <Link to={to!}>{content}</Link>;
};

const ThemeIcon = ({ theme }: { theme: string }) => {
  switch (theme) {
    case 'light':
      return <Sun className="w-5 h-5" />;
    case 'dark':
      return <Moon className="w-5 h-5" />;
    case 'system':
      return <Monitor className="w-5 h-5" />;
    default:
      return <Monitor className="w-5 h-5" />;
  }
};

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [currentTheme, setCurrentTheme] = useState('system');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check current theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    } else {
      // Check system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setCurrentTheme('system');
    }
  }, []);

  const setTheme = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
    
    // Apply theme
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { to: "/home", icon: Home, label: "Home" },
    { to: "/mood", icon: BookOpen, label: "Mood" },
    { to: "/chat", icon: MessageCircle, label: "Chat" },
    { to: "/history", icon: BarChart3, label: "History" },
  ];

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
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
        
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <div className={cn(
              "flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 ease-in-out p-2 rounded-xl",
              isOpen 
                ? "bg-primary/20" 
                : "hover:bg-primary/10"
            )}>
              <div className={cn(
                "text-xl flex items-center justify-center",
                isOpen 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}>
                <ThemeIcon theme={currentTheme} />
              </div>
              <span className={cn(
                "text-xs font-medium text-center",
                isOpen 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}>
                Theme
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="center" 
            side="top" 
            className="w-48 bg-card/95 backdrop-blur-md border border-border/20 shadow-lg rounded-xl"
          >
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex items-center gap-3 p-3 cursor-pointer transition-colors",
                    currentTheme === option.value 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{option.label}</span>
                  {currentTheme === option.value && (
                    <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Logout Button */}
        <NavigationItem
          icon={LogOut}
          label="Logout"
          onClick={handleLogout}
        />
      </nav>
    </div>
  );
};
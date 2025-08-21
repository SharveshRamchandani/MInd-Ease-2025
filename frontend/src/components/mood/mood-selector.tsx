import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface MoodOption {
  emoji: string;
  label: string;
  value: string;
}

const moodOptions: MoodOption[] = [
  { emoji: "😄", label: "Joyful", value: "joy" },
  { emoji: "😊", label: "Content", value: "calm" },
  { emoji: "😐", label: "Neutral", value: "neutral" },
  { emoji: "😔", label: "Sad", value: "sad" },
  { emoji: "😡", label: "Angry", value: "angry" },
  { emoji: "😰", label: "Anxious", value: "anxious" },
];

interface MoodSelectorProps {
  onMoodSubmit: (mood: string, journal: string) => void;
  isLoading?: boolean;
}

export const MoodSelector = ({ onMoodSubmit, isLoading = false }: MoodSelectorProps) => {
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [journalEntry, setJournalEntry] = useState<string>("");
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to log your mood.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMood) {
      toast({
        title: "Mood selection required",
        description: "Please select a mood before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Call the parent component's submit handler
    onMoodSubmit(selectedMood, journalEntry);
    
    // Reset form
    setSelectedMood("");
    setJournalEntry("");
  };

  return (
    <div className="border border-border rounded-lg p-6">
      <div className="space-y-6">
        {/* Mood Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">How are you feeling today?</h3>
          <p className="text-sm text-muted-foreground mb-4">Select your current mood</p>
          
          <div className="grid grid-cols-2 gap-4">
            {moodOptions.map((mood) => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedMood === mood.value
                    ? 'border-primary bg-primary/10 scale-105'
                    : 'border-border hover:border-border/50 hover:scale-102'
                }`}
              >
                <div className="text-3xl mb-2">{mood.emoji}</div>
                <div className="text-sm font-medium">{mood.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Journal Entry */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Journal Entry (optional)
          </label>
          <textarea
            value={journalEntry}
            onChange={(e) => setJournalEntry(e.target.value)}
            placeholder="Share what's on your mind today... How are you feeling? What happened today?"
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground resize-none"
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedMood || isLoading}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors duration-200 ${
            selectedMood && !isLoading
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Saving...' : 'Save Mood Entry'}
        </button>
      </div>
    </div>
  );
};
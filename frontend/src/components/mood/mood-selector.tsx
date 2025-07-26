import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MoodOption {
  emoji: string;
  label: string;
  value: string;
  color: string;
}

const moodOptions: MoodOption[] = [
  { emoji: "😄", label: "Joyful", value: "joy", color: "emotion-joy" },
  { emoji: "😊", label: "Content", value: "calm", color: "emotion-calm" },
  { emoji: "😐", label: "Neutral", value: "neutral", color: "emotion-neutral" },
  { emoji: "😔", label: "Sad", value: "sad", color: "emotion-sad" },
  { emoji: "😡", label: "Angry", value: "angry", color: "emotion-angry" },
  { emoji: "😰", label: "Anxious", value: "anxious", color: "emotion-anxious" },
];

interface MoodSelectorProps {
  onMoodSubmit: (mood: string, journal: string) => void;
  isLoading?: boolean;
}

export const MoodSelector = ({ onMoodSubmit, isLoading = false }: MoodSelectorProps) => {
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [journalEntry, setJournalEntry] = useState<string>("");

  const handleSubmit = () => {
    if (selectedMood) {
      onMoodSubmit(selectedMood, journalEntry);
      setSelectedMood("");
      setJournalEntry("");
    }
  };

  const selectedMoodOption = moodOptions.find(m => m.value === selectedMood);

  return (
    <Card className="p-6 shadow-card transition-gentle">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">How are you feeling today?</h2>
          <p className="text-muted-foreground">Select your current mood</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {moodOptions.map((mood) => (
            <Button
              key={mood.value}
              variant={selectedMood === mood.value ? "default" : "outline"}
              className={cn(
                "flex flex-col gap-2 h-auto py-4 transition-bounce hover:scale-105",
                selectedMood === mood.value && `bg-${mood.color} hover:bg-${mood.color}/90`
              )}
              onClick={() => setSelectedMood(mood.value)}
            >
              <span className="text-3xl">{mood.emoji}</span>
              <span className="text-sm font-medium">{mood.label}</span>
            </Button>
          ))}
        </div>

        {selectedMood && (
          <div className="space-y-4 animate-gentle-bounce">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <span className="text-2xl">{selectedMoodOption?.emoji}</span>
                <span className="font-medium">Feeling {selectedMoodOption?.label}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Journal Entry (optional)
              </label>
              <Textarea
                placeholder="Share what's on your mind today... How are you feeling? What happened today?"
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-primary hover:opacity-90 transition-gentle"
            >
              {isLoading ? "Saving..." : "Save Mood Entry"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
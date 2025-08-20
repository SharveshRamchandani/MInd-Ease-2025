import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Journal(): React.JSX.Element {
  const [entryText, setEntryText] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useToast();

  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  const handleSave = async () => {
    if (!entryText.trim()) {
      toast({ title: "Write something first", description: "Your journal entry is empty.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      // TODO: Replace with real persistence (Firebase/backend)
      await new Promise((r) => setTimeout(r, 800));
      toast({ title: "Journal saved", description: "Your daily entry has been saved." });
      setEntryText("");
    } catch (e) {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (!entryText) return;
    setEntryText("");
  };

  return (
    <div className="min-h-screen pb-20 p-4 lg:pb-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/home">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Daily Journal</h1>
        </div>

        <Card className="p-6 shadow-card space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="text-lg font-medium">{today}</p>
            </div>
            <div className="text-sm text-muted-foreground">{entryText.length} chars</div>
          </div>

          <Textarea
            value={entryText}
            onChange={(e) => setEntryText(e.target.value)}
            placeholder="How was your day? What did you feel, notice, or learn?"
            className="min-h-[200px] resize-y"
          />

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={handleClear} disabled={!entryText || isSaving}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
} 
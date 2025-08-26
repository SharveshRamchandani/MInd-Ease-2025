import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function Journal(): React.JSX.Element {
  const [entryText, setEntryText] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [journalHistory, setJournalHistory] = useState<any[]>([]);
  const [moodEntries, setMoodEntries] = useState<any[]>([]);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  useEffect(() => {
    // Fetch journal entries
    const fetchJournalHistory = async () => {
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const response = await fetch('https://mind-ease-2025.onrender.com/api/journals', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.success) {
        setJournalHistory(data.data.journal_logs || []);
      }
    };

    // Fetch mood entries
    const fetchMoodEntries = async () => {
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const response = await fetch('https://mind-ease-2025.onrender.com/api/mood/history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.success) {
        setMoodEntries(data.data.mood_logs || []);
      }
    };

    fetchJournalHistory();
    fetchMoodEntries();
  }, [currentUser]);

  // Combine both sources for display
  const combinedEntries = [
    ...journalHistory.map(entry => ({
      id: entry.id,
      text: entry.text,
      timestamp: entry.timestamp,
      source: "journal"
    })),
    ...moodEntries
      .filter(entry => entry.journal && entry.journal.trim() !== "")
      .map(entry => ({
        id: entry.id,
        text: entry.journal,
        timestamp: entry.timestamp,
        source: "mood"
      }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleSave = async () => {
    if (!entryText.trim()) {
      toast({ title: "Write something first", description: "Your journal entry is empty.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      if (!currentUser) throw new Error("Not authenticated");
      const token = await currentUser.getIdToken();
      const response = await fetch('https://mind-ease-2025.onrender.com/api/journals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: entryText,
          timestamp: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error("Failed to save journal");
      toast({ title: "Journal saved", description: "Your daily entry has been saved." });
      setEntryText("");
      // Refetch journal history
      const data = await response.json();
      if (data.success) {
        const token = await currentUser.getIdToken();
        const response = await fetch('https://mind-ease-2025.onrender.com/api/journals', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data.success) {
          setJournalHistory(data.data.journal_logs || []);
        }
      }
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

  const handleEdit = (id: string, text: string) => {
    setEditId(id);
    setEditText(text);
  };

  const handleEditSave = async () => {
    setEditId(null);
  };

  const handleView = (id: string) => {
    setViewId(id);
  };

  const handleViewClose = () => {
    setViewId(null);
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

        {/* Combined Journal History Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Your Journal History</h2>
          {combinedEntries.length === 0 ? (
            <p className="text-muted-foreground">No previous entries yet.</p>
          ) : (
            <div className="space-y-4">
              {combinedEntries.map((entry) => (
                <div key={entry.id} className="bg-background p-4 rounded shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {entry.timestamp ? String(entry.timestamp) : "No timestamp"}
                        {entry.source === "mood" && <span className="ml-2 text-xs text-primary">(from Mood Log)</span>}
                      </div>
                      <div className="font-medium">
                        {entry.text || <span className="text-muted-foreground">(No journal)</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-xs underline" onClick={() => handleView(entry.id)}>
                        View
                      </button>
                      <button className="text-xs underline" onClick={() => handleEdit(entry.id, entry.text)}>
                        Edit
                      </button>
                    </div>
                  </div>
                  {editId === entry.id && (
                    <div className="mt-2">
                      <textarea
                        className="w-full border rounded p-2"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2 mt-2">
                        <button onClick={handleEditSave}>Save</button>
                        <button onClick={() => setEditId(null)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {/* Simple modal for viewing */}
          {viewId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-background p-6 rounded shadow-lg max-w-md w-full">
                <h3 className="text-lg font-semibold mb-2">Journal Entry</h3>
                <div>
                  {combinedEntries.find((j) => j.id === viewId)?.text || "(No journal)"}
                </div>
                <button className="mt-4 px-4 py-2 bg-primary text-white rounded" onClick={handleViewClose}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
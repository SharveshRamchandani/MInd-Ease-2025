import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, RotateCcw, Edit, Eye, X, BookOpen, TrendingUp, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Journal(): React.JSX.Element {
  const [entryText, setEntryText] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [journalHistory, setJournalHistory] = useState<any[]>([]);
  const [moodEntries, setMoodEntries] = useState<any[]>([]);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  // Fetch journal entries function
  const fetchJournalHistory = async () => {
    if (!currentUser) return;
    try {
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
    } catch (error) {
      console.error('Failed to fetch journal history:', error);
    }
  };

  // Fetch mood entries function
  const fetchMoodEntries = async () => {
    if (!currentUser) return;
    try {
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
    } catch (error) {
      console.error('Failed to fetch mood entries:', error);
    }
  };

  useEffect(() => {
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
      
      // Refresh journal history to show the new entry
      await fetchJournalHistory();
      
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
    if (!editText.trim()) {
      toast({ title: "Entry cannot be empty", variant: "destructive" });
      return;
    }

    setIsEditing(true);
    try {
      if (!currentUser) throw new Error("Not authenticated");
      const token = await currentUser.getIdToken();
      
      // Update the entry locally first for immediate feedback
      setJournalHistory(prev => 
        prev.map(entry => 
          entry.id === editId 
            ? { ...entry, text: editText, updated_at: new Date().toISOString() }
            : entry
        )
      );
      
      // Also update combined entries immediately
      const updatedCombinedEntries = combinedEntries.map(entry => 
        entry.id === editId 
          ? { ...entry, text: editText }
          : entry
      );
      
      toast({ 
        title: "Entry updated", 
        description: "Your journal entry has been successfully updated." 
      });
      
      // Clear edit state
      setEditId(null);
      setEditText("");
      
      // Refresh data from server to ensure consistency
      await fetchJournalHistory();
      await fetchMoodEntries();
      
    } catch (e) {
      console.error('Edit save error:', e);
      toast({ 
        title: "Update failed", 
        description: "Failed to update your journal entry. Please try again.", 
        variant: "destructive" 
      });
      // Revert local changes on error
      await fetchJournalHistory();
    } finally {
      setIsEditing(false);
    }
  };

  const handleView = (id: string) => {
    setViewId(id);
  };

  const handleViewClose = () => {
    setViewId(null);
  };

  return (
    <div className="min-h-screen pb-32 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/home">
            <Button variant="ghost" size="sm" className="hover:bg-primary/10">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Daily Journal</h1>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left Column - New Journal Entry */}
          <div className="lg:col-span-8">
            <Card className="p-8 shadow-card relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary"></div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Plus className="w-5 h-5 text-primary" />
                      <h2 className="text-2xl font-semibold text-foreground">New Entry</h2>
                    </div>
                    <p className="text-lg font-medium text-muted-foreground">{today}</p>
                  </div>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {entryText.length} characters
                  </Badge>
                </div>

                <Textarea
                  value={entryText}
                  onChange={(e) => setEntryText(e.target.value)}
                  placeholder="How was your day? What did you feel, notice, or learn? Write about your thoughts, experiences, and reflections..."
                  className="min-h-[300px] resize-y border-muted bg-background/50 focus:bg-background transition-colors text-base leading-relaxed"
                />

                <div className="flex items-center justify-between pt-4 border-t border-muted">
                  <p className="text-sm text-muted-foreground">
                    Take your time to reflect on your day
                  </p>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleClear} 
                      disabled={!entryText || isSaving}
                      className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={isSaving || !entryText.trim()}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Entry"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Stats */}
          <div className="lg:col-span-4">
            <Card className="p-6 shadow-card h-fit">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Your Progress</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">{journalHistory.length}</div>
                    <div className="text-sm text-muted-foreground">Total Entries</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">
                      {journalHistory.filter(entry => {
                        const entryDate = new Date(entry.timestamp);
                        const today = new Date();
                        return entryDate.toDateString() === today.toDateString();
                      }).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Today</div>
                  </div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="text-lg font-medium text-primary mb-1">Keep Writing!</div>
                  <div className="text-sm text-muted-foreground">Regular journaling helps track your mental wellness journey</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-6">
          <Card className="p-6 shadow-card">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-lg font-medium text-foreground">{today}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {entryText.length} chars
                </Badge>
              </div>

              <Textarea
                value={entryText}
                onChange={(e) => setEntryText(e.target.value)}
                placeholder="How was your day? What did you feel, notice, or learn?"
                className="min-h-[200px] resize-y border-muted bg-background/50 focus:bg-background transition-colors"
              />

              <div className="flex items-center justify-end gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClear} 
                  disabled={!entryText || isSaving}
                  className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Entry"}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Journal History Section */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Your Journal History</h2>
            <Badge variant="secondary" className="ml-2">{combinedEntries.length} entries</Badge>
          </div>
          
          {combinedEntries.length === 0 ? (
            <Card className="p-12 text-center shadow-card">
              <div className="space-y-4">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <div>
                  <p className="text-lg font-medium text-muted-foreground">No journal entries yet</p>
                  <p className="text-sm text-muted-foreground">Start writing your first journal entry above to begin tracking your thoughts and feelings!</p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {combinedEntries.map((entry) => (
                <Card key={entry.id} className="shadow-card hover:shadow-glow transition-gentle overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <p className="text-sm font-medium text-muted-foreground">
                            {entry.timestamp ? format(new Date(entry.timestamp), 'EEEE, MMMM d, yyyy \u2022 h:mm a') : "No timestamp"}
                          </p>
                          {entry.source === "mood" && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                              from Mood Log
                            </Badge>
                          )}
                        </div>
                        
                        {editId === entry.id ? (
                          <div className="space-y-4">
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="min-h-[120px] bg-background/50 text-base leading-relaxed"
                              placeholder="Edit your journal entry..."
                            />
                            <div className="flex gap-3">
                              <Button 
                                onClick={handleEditSave}
                                disabled={isEditing || !editText.trim()}
                                className="bg-primary hover:bg-primary/90"
                              >
                                <Save className="w-4 h-4 mr-2" />
                                {isEditing ? "Saving..." : "Save Changes"}
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setEditId(null);
                                  setEditText("");
                                }}
                                disabled={isEditing}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="prose prose-base max-w-none text-foreground">
                            <p className="leading-relaxed text-base whitespace-pre-wrap">
                              {entry.text || <span className="text-muted-foreground italic">(No content)</span>}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {editId !== entry.id && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleView(entry.id)}
                            className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
                            title="View full entry"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleEdit(entry.id, entry.text)}
                            className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary"
                            title="Edit entry"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* View Modal */}
          <Dialog open={!!viewId} onOpenChange={() => setViewId(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">Journal Entry</DialogTitle>
                {viewId && (
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(combinedEntries.find(j => j.id === viewId)?.timestamp || new Date()), 'EEEE, MMMM d, yyyy \u2022 h:mm a')}
                  </p>
                )}
              </DialogHeader>
              <div className="py-6">
                <div className="prose prose-base max-w-none">
                  {viewId && (
                    <p className="leading-relaxed text-foreground whitespace-pre-wrap text-base">
                      {combinedEntries.find(j => j.id === viewId)?.text || "(No content)"}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleViewClose} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
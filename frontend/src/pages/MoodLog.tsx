import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MoodSelector } from "@/components/mood/mood-selector";
import { CopingStrategies } from "@/components/wellness/coping-strategies";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const MoodLog = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [savedMood, setSavedMood] = useState<string | null>(null);
  const [journalHistory, setJournalHistory] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [viewId, setViewId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Fetch journal history
  useEffect(() => {
    const fetchHistory = async () => {
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
          setJournalHistory(data.data.mood_logs || []);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchHistory();
  }, [currentUser]);

  // Edit journal entry
  const handleEdit = (id: string, text: string) => {
    setEditId(id);
    setEditText(text);
  };

  const handleEditSave = async () => {
    if (!currentUser || !editId) return;
    try {
      setIsLoading(true);
      const token = await currentUser.getIdToken();
      const entry = journalHistory.find(j => j.id === editId);
      if (!entry) return;
      const response = await fetch('https://mind-ease-2025.onrender.com/api/mood/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mood: entry.mood,
          journal: editText,
          timestamp: entry.timestamp
        })
      });
      if (response.ok) {
        toast({ title: 'Journal updated!' });
        setEditId(null);
        setEditText("");
        // Refresh history
        const data = await response.json();
        if (data.success) {
          const updated = journalHistory.map(j => j.id === editId ? { ...j, journal: editText } : j);
          setJournalHistory(updated);
        }
      }
    } catch (err) {
      toast({ title: 'Failed to update journal', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // View journal entry
  const handleView = (id: string) => {
    setViewId(id);
  };
  const handleViewClose = () => {
    setViewId(null);
  };
  const handleMoodSubmit = async (mood: string, journal: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to save your mood.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get Firebase ID token for authentication
      const token = await currentUser.getIdToken();

      // Save mood to Firebase via backend API
      const response = await fetch('https://mind-ease-2025.onrender.com/api/mood/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mood: mood,
          journal: journal || '',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save mood');
      }

      const data = await response.json();

      if (data.success) {
        // Mood saved successfully
        setSavedMood(mood);

        toast({
          title: "Mood saved successfully!",
          description: "Your daily check-in has been recorded.",
        });

        // Redirect to History page after a short delay to show the saved mood
        setTimeout(() => {
          navigate('/history');
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to save mood');
      }

    } catch (error) {
      console.error('Error saving mood:', error);
      toast({
        title: "Error saving mood",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Only one top-level return allowed in React component
  if (savedMood) {
    return (
      <div className="min-h-screen pb-20 p-4 lg:pb-4">
        <div className="max-w-4xl mx-auto">
          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Link to="/home">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
                <h1 className="text-2xl font-semibold">Mood Logged</h1>
              </div>
              <Card className="p-8 text-center shadow-glow">
                <div className="space-y-6">
                  <div className="text-8xl animate-gentle-bounce">
                    {savedMood === "joy" && "😄"}
                    {savedMood === "calm" && "😊"}
                    {savedMood === "neutral" && "😐"}
                    {savedMood === "sad" && "😔"}
                    {savedMood === "angry" && "😡"}
                    {savedMood === "anxious" && "😰"}
                  </div>
                  <h2 className="text-3xl font-semibold">Thank you for checking in!</h2>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    Your mood has been saved. Here are some personalized suggestions based on how you're feeling.
                  </p>
                </div>
              </Card>
            </div>
            <div className="space-y-6">
              <CopingStrategies currentMood={savedMood} />
            </div>
          </div>
          {/* Mobile Layout */}
          <div className="lg:hidden max-w-md mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Link to="/home">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">Mood Logged</h1>
            </div>
            <Card className="p-6 text-center shadow-glow">
              <div className="space-y-4">
                <div className="text-6xl animate-gentle-bounce">
                  {savedMood === "joy" && "😄"}
                  {savedMood === "calm" && "😊"}
                  {savedMood === "neutral" && "😐"}
                  {savedMood === "sad" && "😔"}
                  {savedMood === "angry" && "😡"}
                  {savedMood === "anxious" && "😰"}
                </div>
                <h2 className="text-xl font-semibold">Thank you for checking in!</h2>
                <p className="text-muted-foreground">
                  Your mood has been saved. Here are some personalized suggestions based on how you're feeling.
                </p>
              </div>
            </Card>
            <CopingStrategies currentMood={savedMood} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 p-4 lg:pb-4">
      <div className="max-w-4xl mx-auto">
        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Link to="/home">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-semibold">Daily Mood Check-in</h1>
            </div>

            <div className="lg:sticky lg:top-6">
              <MoodSelector onMoodSubmit={handleMoodSubmit} isLoading={isLoading} />
            </div>

            {/* Journal History Section */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-2">Your Journal Entries</h2>
              {journalHistory.length === 0 ? (
                <p className="text-muted-foreground">No journal entries yet.</p>
              ) : (
                <div className="space-y-4">
                  {journalHistory.map(entry => (
                    <Card key={entry.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</div>
                          <div className="font-medium">{entry.journal || <span className="text-muted-foreground">(No journal)</span>}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleView(entry.id)}>
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(entry.id, entry.journal)}>
                            Edit
                          </Button>
                        </div>
                      </div>
                      {editId === entry.id && (
                        <div className="mt-2">
                          <textarea
                            className="w-full border rounded p-2"
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            rows={3}
                          />
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={handleEditSave} disabled={isLoading}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                          </div>
                        </div>
                      )}
                      {/* View Modal/Section */}
                      {viewId === entry.id && (
                        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
                            <h3 className="text-lg font-semibold mb-2">Journal Entry</h3>
                            <div className="mb-4">
                              <div className="text-sm text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</div>
                              <div className="mt-2">{entry.journal || <span className="text-muted-foreground">(No journal)</span>}</div>
                            </div>
                            <Button size="sm" variant="outline" onClick={handleViewClose} className="absolute top-2 right-2">Close</Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6 shadow-card">
              <h3 className="text-xl font-semibold mb-4">Why track your mood?</h3>
              <div className="space-y-4 text-muted-foreground">
                <p>Regular mood tracking helps you:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Identify patterns in your emotional well-being</li>
                  <li>Recognize triggers and coping strategies that work</li>
                  <li>Communicate more effectively with healthcare providers</li>
                  <li>Celebrate progress and positive changes</li>
                </ul>
              </div>
            </Card>

            <Card className="p-6 shadow-card">
              <h3 className="text-xl font-semibold mb-4">Tips for accurate tracking</h3>
              <div className="space-y-3 text-muted-foreground">
                <p>• Check in at the same time each day</p>
                <p>• Be honest about how you're feeling</p>
                <p>• Note any significant events or changes</p>
                <p>• Remember that all feelings are valid</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/home">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Daily Mood Check-in</h1>
          </div>

          <MoodSelector onMoodSubmit={handleMoodSubmit} isLoading={isLoading} />

          {/* Journal History Section for Mobile */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2">Your Journal Entries</h2>
            {journalHistory.length === 0 ? (
              <p className="text-muted-foreground">No journal entries yet.</p>
            ) : (
              <div className="space-y-4">
                {journalHistory.map(entry => (
                  <Card key={entry.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</div>
                        <div className="font-medium">{entry.journal || <span className="text-muted-foreground">(No journal)</span>}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleView(entry.id)}>
                          View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(entry.id, entry.journal)}>
                          Edit
                        </Button>
                      </div>
                    </div>
                    {editId === entry.id && (
                      <div className="mt-2">
                        <textarea
                          className="w-full border rounded p-2"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" onClick={handleEditSave} disabled={isLoading}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                    {/* View Modal/Section for Mobile */}
                    {viewId === entry.id && (
                      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
                          <h3 className="text-lg font-semibold mb-2">Journal Entry</h3>
                          <div className="mb-4">
                            <div className="text-sm text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</div>
                            <div className="mt-2">{entry.journal || <span className="text-muted-foreground">(No journal)</span>}</div>
                          </div>
                          <Button size="sm" variant="outline" onClick={handleViewClose} className="absolute top-2 right-2">Close</Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodLog;
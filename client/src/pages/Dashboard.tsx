import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { resumeAPI, feedbackAPI } from '@/lib/api';
import { Upload, Send, LogOut } from 'lucide-react';
import { useLocation } from 'wouter';

interface Resume {
  id: number;
  fileName: string;
  extractedText: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      const response = await resumeAPI.upload(file, user.id);
      setSelectedResume({
        id: response.data.resumeId,
        fileName: response.data.fileName,
        extractedText: response.data.extractedText,
      });
      toast.success('Resume uploaded successfully!');

      // Auto-fetch feedback
      const feedbackResponse = await feedbackAPI.getFeedback(response.data.resumeId);
      setFeedback(feedbackResponse.data.feedback || feedbackResponse.data);
      setChatHistory([]);
      setUserQuestion('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendQuestion = async () => {
    if (!userQuestion.trim() || !selectedResume) return;

    setLoading(true);
    const newMessage = { role: 'user', content: userQuestion };
    setChatHistory([...chatHistory, newMessage]);

    try {
      const response = await feedbackAPI.chat(selectedResume.id, {
        chatHistory: chatHistory.map((m) => `${m.role}: ${m.content}`).join('\n'),
        userQuestion,
      });
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: response.data.response || response.data },
      ]);
      setUserQuestion('');
    } catch (error: any) {
      toast.error('Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Resume AI</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="border-border hover:bg-muted"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card className="p-6 border-border bg-card">
              <h2 className="text-xl font-bold text-primary mb-4">Upload Resume</h2>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload PDF or DOCX</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileUpload}
                disabled={loading}
                className="hidden"
              />

              {selectedResume && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-semibold text-foreground">{selectedResume.fileName}</p>
                </div>
              )}
            </Card>
          </div>

          {/* Feedback & Chat Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Feedback Card */}
            {feedback && (
              <Card className="p-6 border-border bg-card">
                <h2 className="text-xl font-bold text-primary mb-4">AI Feedback</h2>
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {feedback}
                </div>
              </Card>
            )}

            {/* Chat Section */}
            {selectedResume && (
              <Card className="p-6 border-border bg-card flex flex-col h-96">
                <h2 className="text-xl font-bold text-primary mb-4">Chat with AI</h2>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-3 bg-background rounded-lg p-4">
                  {chatHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Ask anything about your resume...
                    </p>
                  ) : (
                    chatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Ask a question..."
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendQuestion()}
                    disabled={loading}
                    className="bg-background border-border"
                  />
                  <Button
                    onClick={handleSendQuestion}
                    disabled={loading || !userQuestion.trim()}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

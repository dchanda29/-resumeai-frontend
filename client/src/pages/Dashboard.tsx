import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { resumeAPI, feedbackAPI } from '@/lib/api';
import { useLocation } from 'wouter';

interface Resume { id: number; fileName: string; extractedText: string; }
interface Message { role: string; content: string; }

const S: Record<string, React.CSSProperties> = {
  root: { minHeight: '100vh', background: '#080b14', fontFamily: "'Inter', system-ui, sans-serif", color: 'white' },
  header: { background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50 },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: { width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' },
  userBadge: { display: 'flex', alignItems: 'center', gap: 12 },
  userName: { fontSize: 13, color: 'rgba(148,163,184,0.7)' },
  logoutBtn: { padding: '7px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(148,163,184,0.8)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  main: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: 0, height: 'calc(100vh - 60px)' },
  sidebar: { borderRight: '1px solid rgba(255,255,255,0.07)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' },
  sideLabel: { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(148,163,184,0.4)', textTransform: 'uppercase', marginBottom: 4 },
  uploadZone: { border: '1.5px dashed rgba(99,102,241,0.4)', borderRadius: 14, padding: '28px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: 'rgba(99,102,241,0.04)' },
  uploadIcon: { width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' },
  uploadTitle: { fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 4 },
  uploadSub: { fontSize: 11, color: 'rgba(148,163,184,0.5)' },
  fileChip: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '10px 12px' },
  fileIcon: { width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  fileName: { fontSize: 12, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  content: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'rgba(148,163,184,0.4)' },
  tabs: { display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 24px' },
  tab: (active: boolean): React.CSSProperties => ({ padding: '16px 4px', marginRight: 24, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'transparent', fontFamily: 'inherit', borderBottom: active ? '2px solid #6366f1' : '2px solid transparent', color: active ? 'white' : 'rgba(148,163,184,0.5)', transition: 'all 0.2s' }),
  feedbackArea: { flex: 1, overflowY: 'auto', padding: 24 },
  feedbackCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 },
  feedbackText: { fontSize: 14, lineHeight: 1.8, color: 'rgba(226,232,240,0.9)', whiteSpace: 'pre-wrap' },
  chatArea: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
  messages: { flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 },
  msgUser: { alignSelf: 'flex-end', background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: '14px 14px 4px 14px', padding: '10px 14px', maxWidth: '72%', fontSize: 13, lineHeight: 1.6 },
  msgAI: { alignSelf: 'flex-start', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px 14px 14px 4px', padding: '10px 14px', maxWidth: '72%', fontSize: 13, lineHeight: 1.6, color: 'rgba(226,232,240,0.9)' },
  inputRow: { padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10 },
  chatInput: { flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '11px 16px', fontSize: 13, color: 'white', outline: 'none', fontFamily: 'inherit' },
  sendBtn: (disabled: boolean): React.CSSProperties => ({ padding: '11px 18px', borderRadius: 12, border: 'none', background: disabled ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }),
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [resume, setResume] = useState<Resume | null>(null);
  const [feedback, setFeedback] = useState('');
  const [chat, setChat] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'feedback' | 'chat'>('feedback');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!user) { toast.error('Not logged in'); return; }
    console.log('Uploading:', file.name, 'user:', user.id);
    setLoading(true);
    try {
      const res = await resumeAPI.upload(file, user.id);
      console.log('Upload OK:', res.data);
      setResume({ id: res.data.resumeId, fileName: res.data.fileName, extractedText: res.data.extractedText });
      toast.success('Resume uploaded 🎉');
      const fb = await feedbackAPI.getFeedback(res.data.resumeId);
      setFeedback(fb.data.feedback || fb.data);
      setChat([]);
      setActiveTab('feedback');
    } catch (err: any) {
      console.error('Upload error:', err?.response ?? err);
      toast.error(err.response?.data?.message || err.message || 'Upload failed');
    } finally { setLoading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = ''; // allow re-upload of same file
  };

  const handleSend = async () => {
    if (!question.trim() || !resume) return;
    setLoading(true);
    const newMsg: Message = { role: 'user', content: question };
    setChat(prev => [...prev, newMsg]);
    setQuestion('');
    try {
      const res = await feedbackAPI.chat(resume.id, {
        chatHistory: chat.map(m => `${m.role}: ${m.content}`).join('\n'),
        userQuestion: question,
      });
      setChat(prev => [...prev, { role: 'assistant', content: res.data.response || res.data }]);
    } catch (err: any) {
      console.error('Chat error:', err?.response ?? err);
      toast.error('Failed to get response');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={S.logo}>
          <div style={S.logoIcon}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
          </div>
          <span style={S.logoText}>ResumeAI</span>
        </div>
        <div style={S.userBadge}>
          <span style={S.userName}>hey, {user?.name || user?.email} 👋</span>
          <button style={S.logoutBtn} onClick={() => { logout(); setLocation('/login'); }}>Sign out</button>
        </div>
      </div>

      <div style={S.main}>
        <div style={S.sidebar}>
          <div>
            <div style={S.sideLabel}>Your Resume</div>
            <div
              style={{ ...S.uploadZone, borderColor: dragOver ? '#6366f1' : 'rgba(99,102,241,0.4)', background: dragOver ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)' }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div style={S.uploadIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <div style={S.uploadTitle}>{loading ? 'Analyzing...' : 'Drop your resume'}</div>
              <div style={S.uploadSub}>PDF or DOCX · click or drag</div>
            </div>
            {/* input OUTSIDE the clickable div to avoid event conflicts */}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
            />
          </div>

          {resume && (
            <div style={S.fileChip}>
              <div style={S.fileIcon}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={S.fileName}>{resume.fileName}</div>
                <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)' }}>Ready ✓</div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 'auto', background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', marginBottom: 6 }}>PRO TIP ✨</div>
            <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', lineHeight: 1.6 }}>Upload your resume and ask the AI to tailor it for a specific job description.</div>
          </div>
        </div>

        <div style={S.content}>
          {!resume ? (
            <div style={S.emptyState}>
              <div style={{ fontSize: 48 }}>📄</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(148,163,184,0.5)' }}>Upload a resume to get started</div>
              <div style={{ fontSize: 13, color: 'rgba(148,163,184,0.3)' }}>AI feedback + chat in seconds</div>
            </div>
          ) : (
            <>
              <div style={S.tabs}>
                <button style={S.tab(activeTab === 'feedback')} onClick={() => setActiveTab('feedback')}>AI Feedback</button>
                <button style={S.tab(activeTab === 'chat')} onClick={() => setActiveTab('chat')}>Chat {chat.length > 0 && `(${chat.length})`}</button>
              </div>

              {activeTab === 'feedback' ? (
                <div style={S.feedbackArea}>
                  {loading && !feedback ? (
                    <div style={{ textAlign: 'center', padding: 48, color: 'rgba(148,163,184,0.4)' }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
                      <div>Analyzing your resume...</div>
                    </div>
                  ) : (
                    <div style={S.feedbackCard}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(99,102,241,0.8)', textTransform: 'uppercase', marginBottom: 16 }}>AI Analysis</div>
                      <div style={S.feedbackText}>{feedback}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={S.chatArea}>
                  <div style={S.messages}>
                    {chat.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(148,163,184,0.3)', fontSize: 13 }}>
                        Ask anything about your resume...
                      </div>
                    )}
                    {chat.map((m, i) => (
                      <div key={i} style={m.role === 'user' ? S.msgUser : S.msgAI}>{m.content}</div>
                    ))}
                    {loading && <div style={{ ...S.msgAI, color: 'rgba(148,163,184,0.4)' }}>typing...</div>}
                  </div>
                  <div style={S.inputRow}>
                    <input
                      style={S.chatInput}
                      placeholder="Ask about your resume..."
                      value={question}
                      onChange={e => setQuestion(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                      disabled={loading}
                    />
                    <button style={S.sendBtn(loading || !question.trim())} onClick={handleSend} disabled={loading || !question.trim()}>
                      Send →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

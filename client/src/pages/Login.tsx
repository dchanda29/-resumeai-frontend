import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  speed: Math.random() * 0.3 + 0.1,
  opacity: Math.random() * 0.5 + 0.2,
}));

const FLOATING_WORDS = [
  'Software Engineer', 'Product Manager', 'UX Designer', 'Data Scientist',
  'Full Stack Dev', 'Marketing Lead', 'DevOps Engineer', 'React Developer',
  'AI Engineer', 'Startup Founder', 'Tech Lead', 'Backend Engineer',
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef(PARTICLES.map(p => ({ ...p, vy: -p.speed })));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.forEach(p => {
        p.y -= p.speed * 0.4;
        if (p.y < -2) p.y = 102;
        const x = (p.x / 100) * canvas.width;
        const y = (p.y / 100) * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity})`;
        ctx.fill();
      });
      // draw connections
      particlesRef.current.forEach((p, i) => {
        particlesRef.current.slice(i + 1).forEach(q => {
          const dx = ((p.x - q.x) / 100) * canvas.width;
          const dy = ((p.y - q.y) / 100) * canvas.height;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo((p.x / 100) * canvas.width, (p.y / 100) * canvas.height);
            ctx.lineTo((q.x / 100) * canvas.width, (q.y / 100) * canvas.height);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const res = await authAPI.login({ emailOrPhone: formData.email || formData.phone, password: formData.password });
        login({ id: res.data.userId, name: '', email: formData.email, phone: formData.phone }, res.data.token);
        toast.success('Welcome back 👋');
        setLocation('/');
      } else {
        const res = await authAPI.register(formData);
        login({ id: res.data.userId, name: formData.name, email: formData.email, phone: formData.phone }, res.data.token);
        toast.success('Account created 🚀');
        setLocation('/');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (name: string) => `
    w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder-white/30
    outline-none transition-all duration-200
    ${focused === name ? 'border-indigo-400 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]' : 'border-white/10 hover:border-white/20'}
  `;

  return (
    <div style={{ minHeight: '100vh', background: '#080b14', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

      {/* Gradient orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)', zIndex: 0 }} />

      {/* Floating job titles */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {FLOATING_WORDS.map((word, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i * 17 + 5) % 90}%`,
            top: `${(i * 13 + 8) % 85}%`,
            fontSize: 11,
            color: 'rgba(148,163,184,0.18)',
            fontWeight: 500,
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            transform: `rotate(${(i % 3 - 1) * 8}deg)`,
          }}>{word}</div>
        ))}
      </div>

      {/* Card */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420, margin: '0 1rem' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>ResumeAI</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)', margin: 0 }}>
            {isLogin ? 'Good to see you again ✌️' : 'Let\'s get you hired 🎯'}
          </p>
        </div>

        {/* Form card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '32px 28px' }}>
          {/* Tab switcher */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 28 }}>
            {['Login', 'Register'].map(tab => (
              <button key={tab} onClick={() => setIsLogin(tab === 'Login')} style={{
                flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                background: (isLogin ? tab === 'Login' : tab === 'Register') ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'transparent',
                color: (isLogin ? tab === 'Login' : tab === 'Register') ? 'white' : 'rgba(148,163,184,0.6)',
              }}>{tab}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!isLogin && (
              <input name="name" type="text" placeholder="Full name" value={formData.name} onChange={handleChange}
                onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} required
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${focused === 'name' ? '#6366f1' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '12px 16px', fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            )}
            <input name="email" type={isLogin ? 'text' : 'email'} placeholder={isLogin ? 'Email or phone' : 'Email'} value={formData.email} onChange={handleChange}
              onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} required
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${focused === 'email' ? '#6366f1' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '12px 16px', fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            {!isLogin && (
              <input name="phone" type="tel" placeholder="Phone number" value={formData.phone} onChange={handleChange}
                onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)} required
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${focused === 'phone' ? '#6366f1' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '12px 16px', fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            )}
            <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange}
              onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} required
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${focused === 'password' ? '#6366f1' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '12px 16px', fontSize: 14, color: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />

            <button type="submit" disabled={loading} style={{
              marginTop: 8, width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: 'white', fontSize: 14, fontWeight: 700, letterSpacing: '0.01em', transition: 'opacity 0.2s', fontFamily: 'inherit',
            }}>
              {loading ? 'Hold on...' : isLogin ? 'Let me in →' : 'Create account →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(148,163,184,0.5)' }}>
          Your resume. Supercharged. ✨
        </p>
      </div>
    </div>
  );
}

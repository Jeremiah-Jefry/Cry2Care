/* ═══════════════════════════════════════════════════════════
   Cry2Care — Premium Industrial Design v3.0
   Apple-Style Aesthetics · Glassmorphism · Framer Motion
   ═══════════════════════════════════════════════════════════ */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from "recharts";
import {
  Activity, Mic, Brain, Database, Settings,
  FileAudio, ShieldCheck, List, Bell,
  AlertCircle, Upload, ChevronRight,
  LayoutDashboard, History, Sliders, Heart,
  Zap, Info
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ════════════════  UI COMPONENTS  ════════════════ */

const GlassCard = ({ children, title, icon: Icon, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`glass-card rounded-3xl p-6 flex flex-col ${className}`}
  >
    {(title || Icon) && (
      <div className="flex items-center gap-3 mb-6">
        {Icon && (
          <div className="p-2.5 rounded-2xl bg-white shadow-sm text-soft-navy">
            <Icon size={18} />
          </div>
        )}
        {title && <h3 className="text-sm font-display font-black uppercase tracking-widest text-soft-navy/70">{title}</h3>}
      </div>
    )}
    <div className="flex-1">{children}</div>
  </motion.div>
);

const StatusIndicator = ({ status = "quiet", label = "System Idle" }) => {
  const styles = {
    quiet: "text-emerald-500",
    detecting: "text-amber-500",
    alert: "text-rose-500"
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white/40 rounded-full border border-white/20 shadow-sm">
      <div className={`relative flex h-3 w-3`}>
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${styles[status]} opacity-75`}></span>
        <span className={`relative inline-flex rounded-full h-3 w-3 ${styles[status]} bg-current`}></span>
      </div>
      <span className="text-[10px] font-black uppercase tracking-tighter text-soft-navy/60">{label}</span>
    </div>
  );
};

const AudioWave = ({ isActive }) => (
  <div className="flex items-center justify-center gap-1 h-12">
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.div
        key={i}
        animate={isActive ? { height: [10, 40, 15, 30, 10] } : { height: 10 }}
        transition={{
          repeat: Infinity,
          duration: 0.8 + Math.random(),
          ease: "easeInOut",
          delay: i * 0.1
        }}
        className="w-1 rounded-full bg-gradient-to-t from-soft-navy/20 to-soft-navy/80"
      />
    ))}
  </div>
);

/* ════════════════  LOGIC HOOK  ════════════════ */

function useSim() {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rec, setRec] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [history, setHistory] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/logs`);
      if (!response.ok) throw new Error("API Offline");
      const data = await response.json();
      if (Array.isArray(data)) setHistory(data);
    } catch (err) {
      console.error("History fetch error:", err);
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const runAnalysis = async (audioFile) => {
    const fileToProcess = audioFile || selectedFile;
    if (!fileToProcess) return;

    setAnalyzing(true);
    setResult(null);
    setProgress(20);

    try {
      const formData = new FormData();
      formData.append('file', fileToProcess);

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        body: formData
      });

      setProgress(70);
      const data = await response.json();
      setProgress(100);
      setResult(data);
      fetchHistory();
    } catch (error) {
      setResult({ error: "System Unavailable", cause: "DISCONNECTED" });
    } finally {
      setTimeout(() => setAnalyzing(false), 800);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const file = new File([new Blob(audioChunksRef.current)], "mic.wav", { type: 'audio/wav' });
        setSelectedFile(file);
        runAnalysis(file);
      };
      mediaRecorderRef.current.start();
      setRec(true);
      setTimeout(() => stopRecording(), 5000);
    } catch (err) {
      alert("Microphone access is required for monitoring.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setRec(false);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  return { analyzing, progress, runAnalysis, rec, startRecording, stopRecording, result, selectedFile, setSelectedFile, history, fetchHistory };
}

/* ════════════════  VIEWS  ════════════════ */

const DashboardView = ({ history, result }) => {
  const safeHistory = Array.isArray(history) ? history : [];
  const latestResult = result || (safeHistory.length > 0 ? safeHistory[0] : null);

  const chartData = safeHistory.slice(0, 10).reverse().map(h => ({
    name: h.time,
    val: h.severity
  }));

  return (
    <div className="grid grid-cols-12 gap-8 pt-4 pb-12">
      {/* Hero Header */}
      <div className="col-span-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
        <div>
          <h1 className="text-4xl font-display font-black text-soft-navy tracking-tight mb-2">Welcome Back</h1>
          <p className="text-soft-navy/50 font-medium">Monitoring Unit: <span className="text-soft-navy/80 font-bold uppercase tracking-widest text-xs">NICU-Alpha-4</span></p>
        </div>
        <StatusIndicator status={latestResult?.severity > 7 ? "alert" : "quiet"} label={latestResult?.severity > 7 ? "Action Required" : "Steady Sleep Pattern"} />
      </div>

      {/* Primary Stats */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
        <GlassCard title="Acoustic Severity Timeline" icon={Activity} className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#263238" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#263238" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
              />
              <Area
                type="monotone"
                dataKey="val"
                stroke="#263238"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#chartGradient)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <GlassCard title="Classification Split" icon={Brain} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.slice(0, 5)}>
                <Bar dataKey="val" fill="#263238" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
          <GlassCard title="Last Signal Metadata" icon={Zap} className="h-64">
            <div className="space-y-6 pt-2">
              <div className="flex justify-between items-end border-b border-soft-navy/5 pb-4">
                <span className="text-[10px] font-black uppercase text-soft-navy/40">Cause Identified</span>
                <span className="font-display font-black text-xl text-soft-navy uppercase">{latestResult?.cause || "No Data"}</span>
              </div>
              <div className="flex justify-between items-end border-b border-soft-navy/5 pb-4">
                <span className="text-[10px] font-black uppercase text-soft-navy/40">Certainty Score</span>
                <span className="font-display font-black text-xl text-soft-navy">{latestResult?.confidence ? (latestResult.confidence * 100).toFixed(0) : 0}%</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Notifications Sidebar */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
        <GlassCard title="Urgent Alerts" icon={Bell} className="h-full">
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scroll-hide">
            {safeHistory.filter(h => h.severity > 7).map((alert, i) => (
              <motion.div
                key={i}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="p-5 rounded-3xl bg-rose-50 border border-rose-100 flex gap-4 items-start"
              >
                <div className="h-10 w-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-rose-950 uppercase tracking-tight">{alert.cause} Detected</h4>
                  <p className="text-xs text-rose-800/60 mt-0.5 leading-relaxed font-medium">Critical distress pattern logged at {alert.time}. System recommends immediate check. Severity: {alert.severity}</p>
                </div>
              </motion.div>
            ))}
            {safeHistory.filter(h => h.severity > 7).length === 0 && (
              <div className="py-20 text-center opacity-30 italic text-sm font-medium">Patient is resting comfortably</div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const EngineView = ({ sim }) => {
  const { analyzing, progress, runAnalysis, rec, startRecording, result, selectedFile, setSelectedFile } = sim;

  return (
    <div className="grid grid-cols-12 gap-10 pt-4 pb-12">
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-10">
        <GlassCard title="Diagnostic Input" icon={Mic} className="pb-10">
          <p className="text-xs text-soft-navy/50 font-medium mb-8">Record or upload a 5-second acoustic sample for AI-assisted causation modeling.</p>

          <div className="grid grid-cols-2 gap-6 mb-10">
            <button
              onClick={startRecording}
              disabled={analyzing || rec}
              className={`h-32 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden group ${rec ? 'bg-rose-50 text-rose-600' : 'bg-white shadow-sm hover:shadow-xl'}`}
            >
              <div className={`p-4 rounded-2xl ${rec ? 'bg-rose-500 text-white animate-pulse' : 'bg-soft-navy/5 text-soft-navy group-hover:scale-110 transition-transform'}`}>
                <Mic size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{rec ? 'Listening...' : 'Record'}</span>
            </button>
            <label className="h-32 rounded-3xl bg-white shadow-sm hover:shadow-xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group">
              <div className="p-4 rounded-2xl bg-soft-navy/5 text-soft-navy group-hover:scale-110 transition-transform">
                <Upload size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{selectedFile ? 'Loaded' : 'Upload'}</span>
              <input type="file" className="hidden" accept=".wav" onChange={(e) => e.target.files[0] && setSelectedFile(e.target.files[0])} />
            </label>
          </div>

          <AnimatePresence>
            {selectedFile && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-10 p-4 bg-white/40 rounded-2xl border border-white text-[10px] font-mono text-soft-navy/50 truncate">
                QUEUE: {selectedFile.name}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => runAnalysis()}
            disabled={analyzing || !selectedFile}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${analyzing || !selectedFile ? 'bg-soft-navy/10 text-soft-navy/20' : 'btn-primary'}`}
          >
            {analyzing ? `Inference Processing ${progress}%` : "Generate AI Prediction"}
          </button>
        </GlassCard>
      </div>

      <div className="col-span-12 lg:col-span-7">
        <GlassCard title="Inference Engine Output" icon={Heart} className="h-full min-h-[400px] flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1">
            {analyzing && <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1/3 h-full bg-soft-navy ring-4 ring-soft-navy/20 rounded-full" />}
          </div>

          <AnimatePresence mode="wait">
            {analyzing ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
                <AudioWave isActive={true} />
                <h3 className="mt-8 font-display font-black text-2xl text-soft-navy uppercase tracking-tighter">Scanning Spectral Density</h3>
                <p className="text-sm text-soft-navy/40 font-medium mt-2">Neural network is comparing pattern against training dataset...</p>
              </motion.div>
            ) : result ? (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                <div className="text-center mb-12">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-soft-navy/30 mb-4 block">Prediction Success</span>
                  <h2 className="text-7xl font-display font-black text-soft-navy tracking-tightest uppercase">{(result.cause || "Normal").replace('_', ' ')}</h2>
                  <div className="flex justify-center gap-6 mt-8">
                    <div className="px-6 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-full border border-emerald-100 flex items-center gap-2">
                      <ShieldCheck size={14} /> Confidence: {(result.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 pt-12 border-t border-soft-navy/5">
                  {[
                    { l: 'Severity', v: result.severity, u: 'i', c: 'text-soft-navy' },
                    { l: 'RMS Power', v: result.vitals?.rms, u: 'db', c: 'text-soft-navy/60' },
                    { l: 'Spec. Centroid', v: result.vitals?.sc, u: 'Hz', c: 'text-soft-navy/60' }
                  ].map((v, i) => (
                    <div key={i} className="text-center">
                      <span className="block text-[10px] font-black uppercase text-soft-navy/30 mb-1">{v.l}</span>
                      <span className={`text-2xl font-display font-black ${v.c}`}>{v.v} <span className="text-[10px] align-top">{v.u}</span></span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="text-center opacity-20">
                <Brain size={80} className="mx-auto mb-6" />
                <p className="text-sm font-bold uppercase tracking-widest">Awaiting Acoustic Signal</p>
              </div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
    </div>
  );
};

const HistoryView = ({ history = [], fetchHistory }) => {
  const safeHistory = Array.isArray(history) ? history : [];

  return (
    <div className="py-4 pb-12">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-display font-black text-soft-navy tracking-tight">Clinical Database</h1>
        <button onClick={fetchHistory} className="p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow text-soft-navy/50 hover:text-soft-navy">
          < Zap size={20} />
        </button>
      </div>

      <GlassCard className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-soft-navy/5">
                <th className="px-8 py-6 text-[10px] font-black uppercase text-soft-navy/40">Event ID</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-soft-navy/40">Time & Date</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-soft-navy/40">Causation</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-soft-navy/40">Certainty</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-soft-navy/40 text-right">Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft-navy/5 font-medium text-sm">
              {safeHistory.map((log, i) => (
                <tr key={i} className="hover:bg-white/40 transition-colors group">
                  <td className="px-8 py-6 font-mono text-xs opacity-40">{log.id}</td>
                  <td className="px-8 py-6 text-soft-navy/70">{log.time}</td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${log.severity > 7 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{log.cause}</span>
                  </td>
                  <td className="px-8 py-6 font-bold text-soft-navy">{(log.confidence * 100).toFixed(0)}%</td>
                  <td className="px-8 py-6 text-right font-display font-black text-xl">{log.severity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {safeHistory.length === 0 && <div className="py-20 text-center opacity-20 font-bold uppercase tracking-[0.4em] text-xs underline decoration-2">End of Logs</div>}
        </div>
      </GlassCard>
    </div>
  );
};

/* ════════════════  MAIN LAYOUT  ════════════════ */

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showNotifs, setShowNotifs] = useState(false);
  const sim = useSim();

  const alerts = sim.history.filter(h => h.severity > 7).slice(0, 5);
  const alertCount = alerts.length;

  const NAV = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "engine", label: "Monitor", icon: Activity },
    { id: "logs", label: "History", icon: History },
    { id: "settings", label: "Configure", icon: Sliders },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Premium Glass Sidebar */}
      <aside className="w-24 md:w-64 glass-panel m-6 rounded-[40px] flex flex-col items-center py-10 z-50">
        <div className="flex items-center gap-3 mb-16">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-[18px] bg-soft-navy text-white flex items-center justify-center font-black text-xl shadow-2xl">C2</div>
          <div className="hidden md:block">
            <h1 className="text-sm font-display font-black uppercase tracking-tighter text-soft-navy">Cry2Care</h1>
            <p className="text-[10px] font-black text-soft-navy/30">CLINICAL SUITE</p>
          </div>
        </div>

        <nav className="flex-1 w-full px-4 space-y-2">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-center md:justify-start gap-4 px-5 py-4 rounded-[22px] transition-all group ${activeTab === item.id ? 'bg-white shadow-xl text-soft-navy' : 'text-soft-navy/30 hover:text-soft-navy'}`}
            >
              <item.icon size={20} />
              <span className={`hidden md:block text-xs font-black uppercase tracking-tight transition-all`}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-6 w-full mt-auto">
          <div className="p-5 rounded-[30px] bg-soft-navy text-white/90 flex flex-col items-center gap-2">
            <Zap size={18} />
            <div className="text-[8px] font-black uppercase tracking-widest opacity-50">Local Core</div>
            <div className="text-[10px] font-bold">ACTIVE</div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 pr-6">
        <header className="h-32 flex items-center justify-between px-10 relative z-40">
          <div className="hidden lg:flex items-center gap-1.5 px-6 py-2 bg-white/40 border border-white/20 rounded-full text-[10px] font-black text-soft-navy/40 uppercase tracking-widest shadow-sm">
            <Heart size={12} className="text-rose-400" /> Patient: Baby Jerome G.
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-xs font-black text-soft-navy/80 tracking-widest">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-[10px] font-medium text-soft-navy/30 uppercase tracking-tighter">{new Date().toDateString()}</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className={`h-12 w-12 rounded-[20px] bg-baby-pink border border-white overflow-hidden shadow-md flex items-center justify-center transition-all active:scale-90 ${alertCount > 0 ? 'text-rose-500' : 'text-rose-300'}`}
              >
                <Bell size={20} className={alertCount > 0 ? 'animate-bounce' : ''} />
              </button>
              {alertCount > 0 && (
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 rounded-full border-2 border-[#f8fbff] flex items-center justify-center text-[8px] font-black text-white shadow-sm ring-4 ring-rose-500/10">
                  {alertCount}
                </div>
              )}

              {/* Notification Dropdown */}
              <AnimatePresence>
                {showNotifs && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 glass-panel rounded-[32px] p-6 shadow-2xl border border-white/40 overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-xs font-black uppercase tracking-widest text-soft-navy/50">Urgent Alerts</h4>
                      <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">{alertCount} New</span>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto scroll-hide">
                      {alerts.map((a, i) => (
                        <div key={i} className="p-3 bg-white/40 rounded-2xl border border-white/20 hover:bg-white/60 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black uppercase text-rose-600">{a.cause}</span>
                            <span className="text-[8px] font-mono text-soft-navy/30">{a.time}</span>
                          </div>
                          <p className="text-[10px] text-soft-navy/60 leading-tight">Distress pattern detected with severity {a.severity}.</p>
                        </div>
                      ))}
                      {alerts.length === 0 && (
                        <div className="text-center py-8 text-soft-navy/20 font-bold uppercase tracking-widest text-[10px]">No unread alerts</div>
                      )}
                    </div>

                    <button
                      onClick={() => { setActiveTab("engine"); setShowNotifs(false); }}
                      className="w-full mt-6 py-3 bg-soft-navy text-white rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-soft-navy/90 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      Launch Monitor <ChevronRight size={12} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-10 scroll-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              {activeTab === "dashboard" && <DashboardView history={sim.history} result={sim.result} />}
              {activeTab === "engine" && <EngineView sim={sim} />}
              {activeTab === "logs" && <HistoryView history={sim.history} fetchHistory={sim.fetchHistory} />}
              {activeTab === "settings" && <div className="py-20 text-center opacity-20"><Sliders size={60} className="mx-auto mb-4" /><p className="font-black uppercase tracking-widest text-sm">System Calibration Locked</p></div>}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

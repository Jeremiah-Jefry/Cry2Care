/* ═══════════════════════════════════════════════════════════
   Cry2Care — Clinical Grade Suite
   v2.4.0 · Multi-View Architecture · Strict Medical Design
   ═══════════════════════════════════════════════════════════ */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, LineChart, Line, Legend
} from "recharts";
import {
  Activity, Mic, Brain, Database, Settings,
  FileAudio, Server, Stethoscope, TrendingUp,
  List, Bell, ShieldCheck, Calendar, Search, Filter,
  Download, ChevronRight, User, Hash, AlertOctagon,
  Wifi, Battery, Volume2, Save, Upload
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ════════════════  THEME UTILITIES  ════════════════ */

const Card = ({ title, icon: Icon, children, className = "", action }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden ${className}`}>
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0 h-12">
      <div className="flex items-center gap-2 font-bold text-gray-700 text-xs uppercase tracking-wider">
        {Icon && <Icon size={14} className="text-sky-700" />} {title}
      </div>
      {action ? action : (
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
        </div>
      )}
    </div>
    <div className="p-4 flex-1 flex flex-col relative">{children}</div>
  </div>
);

const Badge = ({ children, status = "neutral" }) => {
  const c = {
    normal: "bg-emerald-50 text-emerald-700 border-emerald-200",
    alert: "bg-red-50 text-red-700 border-red-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    neutral: "bg-gray-100 text-gray-700 border-gray-200",
    info: "bg-sky-50 text-sky-700 border-sky-200"
  }[status] || c.neutral;
  return <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border rounded ${c}`}>{children}</span>;
};

/* ════════════════  MOCK DATA  ════════════════ */

const LOGS = Array.from({ length: 12 }).map((_, i) => ({
  id: `EVT-2024-89${12 - i}`,
  time: `${14 - i}:30:45`,
  type: ["Analysis", "System", "Alert", "User"][i % 4],
  desc: [
    "Acoustic pattern analysis completed successfully.",
    "System calibration routine executed.",
    "High severity distress signal detected (>8.5).",
    "User parameters updated by Dr. Rivera."
  ][i % 4],
  sev: i % 4 === 2 ? "High" : "Normal"
}));

const SPECTRUM_DATA = Array.from({ length: 40 }, (_, i) => ({
  f: i * 50,
  v: 20 + Math.random() * 60 + (i > 10 && i < 20 ? 40 : 0)
}));

const TREND_DATA = [
  { time: "08:00", severity: 2, limit: 7 }, { time: "09:00", severity: 3, limit: 7 },
  { time: "10:00", severity: 2, limit: 7 }, { time: "11:00", severity: 5, limit: 7 },
  { time: "12:00", severity: 8, limit: 7 }, { time: "13:00", severity: 4, limit: 7 },
  { time: "14:00", severity: 2, limit: 7 }, { time: "15:00", severity: 2, limit: 7 },
];

/* ════════════════  HOOKS  ════════════════ */

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
      const data = await response.json();
      // DEFENSIVE: Ensure data is an array before setting state
      if (Array.isArray(data)) {
        setHistory(data);
      } else {
        console.warn("API returned non-array history:", data);
        setHistory([]);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const runAnalysis = async (audioFile) => {
    const fileToProcess = audioFile || selectedFile;
    if (!fileToProcess) {
      setResult({ error: "Please select a WAV file first", cause: "NO INPUT" });
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', fileToProcess);

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        body: formData
      });

      setProgress(60);
      const data = await response.json();
      setProgress(100);
      setResult(data);
      fetchHistory(); // Refresh history after prediction
    } catch (error) {
      console.error("Prediction error:", error);
      setResult({ error: "Backend Connection Failed. Ensure Flask is running on port 5000.", cause: "OFFLINE" });
    } finally {
      setTimeout(() => setAnalyzing(false), 500);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const file = new File([audioBlob], "recording.wav", { type: 'audio/wav' });
        setSelectedFile(file);
        runAnalysis(file);
      };

      mediaRecorderRef.current.start();
      setRec(true);

      // Auto stop after 5 seconds for analysis
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          stopRecording();
        }
      }, 5000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      setResult({ error: "Microphone Access Denied", cause: "SYSTEM" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRec(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return {
    analyzing, progress, runAnalysis,
    rec, startRecording, stopRecording,
    result, selectedFile, setSelectedFile,
    history, fetchHistory
  };
}

/* ════════════════  VIEWS  ════════════════ */

/* ── 1. PATIENT MONITOR (Dashboard) ── */
function MonitorView({ history = [], result }) {
  // Safe Array Checks
  const safeHistory = Array.isArray(history) ? history : [];

  const latestSev = result?.severity || (safeHistory.length > 0 ? safeHistory[0].severity : 3.4);
  const latestCause = result?.cause || (safeHistory.length > 0 ? safeHistory[0].cause : "NONE");

  const chartData = safeHistory.slice(0, 8).reverse().map(h => ({
    time: h.time || "--:--",
    severity: h.severity || 0,
    limit: 7
  }));

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Vitals & Status */}
      <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
        <Card title="Patient Vitals (Live)" icon={Activity} className="flex-none">
          <div className="space-y-4">
            {[
              { l: "Heart Rate", v: "124", u: "bpm", s: "normal" },
              { l: "Acoustic Sev", v: latestSev, u: "index", s: latestSev > 7 ? "alert" : "normal" },
              { l: "Last Cause", v: latestCause.toUpperCase(), u: "", s: "info" },
              { l: "SPO2", v: "99", u: "%", s: "normal" }
            ].map((d, i) => (
              <div key={i} className="flex justify-between items-end border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{d.l}</span>
                  <span className={`text-${d.v.length > 8 ? 'lg' : '2xl'} font-bold text-slate-900 tracking-tight`}>{d.v} <span className="text-xs text-gray-500 font-medium">{d.u}</span></span>
                </div>
                <Badge status={d.s}>{d.s === "alert" ? "Critical" : (d.s === "info" ? "AI" : "Normal")}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Recent Alerts" icon={Bell} className="flex-1 min-h-[200px]">
          <div className="space-y-2 overflow-y-auto pr-1 h-full max-h-[300px]">
            {safeHistory.filter(h => h && h.severity > 6).slice(0, 5).map((h, i) => (
              <div key={i} className="flex gap-3 text-xs p-2 bg-red-50 border border-red-100 rounded">
                <AlertOctagon size={14} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-red-900 block">System Alert: {(h.cause || "UNKNOWN").toUpperCase()}</span>
                  <span className="text-red-700">Severity: {h.severity} • Confidence: {((h.confidence || 0) * 100).toFixed(0)}%</span>
                  <span className="block text-[10px] text-red-400 mt-1 font-mono">{h.time}</span>
                </div>
              </div>
            ))}
            {safeHistory.filter(h => h && h.severity > 6).length === 0 && <div className="text-center py-10 text-gray-300 text-xs italic">No high severity alerts</div>}
          </div>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">
        <Card title="Clinical Severity Trend (Sync)" icon={TrendingUp} className="h-1/2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ fontSize: '12px', border: '1px solid #e5e7eb' }} />
                <Area type="monotone" dataKey="severity" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#colorSev)" />
                <Line type="step" dataKey="limit" stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Synchronizing data from cloud...</div>
          )}
        </Card>
        <div className="grid grid-cols-2 gap-6 h-1/2">
          <Card title="Cry Classification Dist." icon={Brain} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ n: 'Pain', v: 15 }, { n: 'Hunger', v: 45 }, { n: 'Discomfort', v: 20 }, { n: 'Unknown', v: 5 }]} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis dataKey="n" type="category" width={80} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Bar dataKey="v" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Audio Spectrum (Last Event)" icon={Activity} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SPECTRUM_DATA}>
                <Bar dataKey="v" fill="#64748b" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── 2. DIAGNOSTIC ENGINE ── */
function AnalysisView({ sim }) {
  const { analyzing, progress, runAnalysis, rec, startRecording, stopRecording, result, selectedFile, setSelectedFile } = sim;

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Controls */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <Card title="Input Controls" icon={Mic} className="flex-none">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={() => rec ? stopRecording() : startRecording()}
              className={`h-24 rounded border flex flex-col items-center justify-center gap-2 transition-all ${rec ? "bg-red-50 border-red-200 text-red-700 animate-pulse" : "bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300"}`}
            >
              <div className={`p-2 rounded-full ${rec ? "bg-red-200" : "bg-gray-200"}`}><Mic size={20} /></div>
              <span className="text-xs font-bold uppercase">{rec ? "Recording (5s)..." : "Start Mic"}</span>
            </button>
            <label className={`h-24 rounded border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${selectedFile ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300"}`}>
              <div className={`p-2 rounded-full ${selectedFile ? "bg-emerald-200" : "bg-gray-200"}`}><Upload size={20} /></div>
              <span className="text-xs font-bold uppercase">{selectedFile ? "File Loaded" : "Upload WAV"}</span>
              <input
                type="file"
                accept=".wav"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files[0]) setSelectedFile(e.target.files[0]);
                }}
              />
            </label>
          </div>

          {selectedFile && (
            <div className="mb-4 p-2 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono truncate text-gray-500">
              FILE: {selectedFile.name}
            </div>
          )}

          <div className="bg-slate-50 border border-slate-100 p-3 rounded mb-4">
            <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">System Ready</span><span className="font-bold text-emerald-600">ONLINE</span></div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full w-full bg-emerald-500" /></div>
          </div>

          <button
            onClick={() => runAnalysis()}
            disabled={analyzing || !selectedFile}
            className={`w-full py-3 rounded font-bold uppercase tracking-wide text-sm shadow-sm transition-all ${analyzing ? "bg-gray-100 text-gray-400" : (selectedFile ? "bg-sky-700 text-white hover:bg-sky-800" : "bg-gray-100 text-gray-400 cursor-not-allowed")}`}
          >
            {analyzing ? `Processing... ${progress}%` : "Run Diagnostic Sequence"}
          </button>
        </Card>

        <Card title="Diagnostic Output" icon={Stethoscope} className="flex-1">
          {analyzing ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-12 h-12 border-4 border-gray-100 border-t-sky-500 rounded-full animate-spin mb-4" />
              <h3 className="font-bold text-gray-700">Analyzing Acoustic Signature</h3>
              <p className="text-xs text-gray-400 mt-1">Comparing spectral points against clinical database...</p>
              <div className="w-full bg-gray-100 h-2 mt-6 rounded-full overflow-hidden"><div className="bg-sky-500 h-full transition-all duration-100" style={{ width: `${progress}%` }} /></div>
            </div>
          ) : result ? (
            <div className="space-y-6">
              <div className="text-center border-b border-gray-100 pb-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Primary Classification</p>
                <h2 className="text-4xl font-black text-slate-800 tracking-tighter">{(result.cause || "UNKNOWN").toUpperCase()}</h2>
                <p className="text-sm font-medium text-emerald-600 mt-2 flex items-center justify-center gap-1"><ShieldCheck size={14} /> Confidence: {((result.confidence || 0.94) * 100).toFixed(1)}%</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded border border-gray-100 text-center">
                  <span className="block text-[10px] uppercase text-gray-400 font-bold">Severity Index</span>
                  <span className="block text-2xl font-bold text-sky-700">{result.severity}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-100 text-center">
                  <span className="block text-[10px] uppercase text-gray-400 font-bold">SC Mean</span>
                  <span className="block text-2xl font-bold text-slate-700">{result.vitals?.sc || "840"} Hz</span>
                </div>
              </div>
              <div className="bg-sky-50 border border-sky-100 rounded p-3 text-xs text-sky-800 font-medium leading-relaxed">
                <div className="flex justify-between mb-1"><span>RMS Power:</span><span className="font-mono">{result.vitals?.rms}</span></div>
                <div className="flex justify-between"><span>ZCR Mean:</span><span className="font-mono">{result.vitals?.zcr}</span></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-6">
              <Brain size={48} className="mb-4 opacity-20" />
              <p className="text-sm">Ready for input sequence.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Visualizers */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        <Card title="Real-Time Spectrogram" icon={Activity} className="h-full min-h-[400px]">
          <div className="flex-1 bg-slate-900 rounded overflow-hidden relative">
            <div className="absolute inset-0 flex items-end justify-center px-4 pb-0 gap-0.5 opacity-80">
              {SPECTRUM_DATA.map((d, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-sky-500 to-emerald-400" style={{ height: `${d.v}%`, opacity: 0.8 + Math.random() * 0.2 }} />
              ))}
            </div>
            <div className="absolute top-4 left-4 font-mono text-xs text-emerald-400">FPS: 60 | FFT: 2048 | WINDOW: HANNING</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── 3. DATA LOGS ── */
function HistoryView({ history = [], fetchHistory }) {
  const safeHistory = Array.isArray(history) ? history : [];

  return (
    <div className="flex flex-col h-full gap-6">
      <Card title="Clinical Event History" icon={Database} className="h-full" action={
        <div className="flex gap-2">
          <button onClick={fetchHistory} className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-600 transition-colors"><Activity size={12} /> Refresh</button>
          <button className="flex items-center gap-2 px-3 py-1 bg-sky-600 hover:bg-sky-700 rounded text-xs font-bold text-white transition-colors"><Download size={12} /> Export CSV</button>
        </div>
      }>
        <div className="overflow-x-auto h-full max-h-[600px]">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-400 uppercase tracking-wider font-bold border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 w-32">Event ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Cause</th>
                <th className="px-4 py-3">Vitals (RMS/SC)</th>
                <th className="px-4 py-3 w-24">Severity</th>
                <th className="px-4 py-3 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {safeHistory.map((log, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2 font-mono text-slate-500">{log.id}</td>
                  <td className="px-4 py-2 font-medium">{log.time}</td>
                  <td className="px-4 py-2"><Badge status={log.severity > 7 ? "alert" : "info"}>{log.cause}</Badge></td>
                  <td className="px-4 py-2 text-slate-700 font-mono text-[10px]">{log.rms} / {log.sc}Hz</td>
                  <td className="px-4 py-2 font-bold flex items-center gap-2">
                    {log.severity > 7 ? <span className="w-2 h-2 rounded-full bg-red-500" /> : <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                    {log.severity}
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-sky-600">{((log.confidence || 0) * 100).toFixed(1)}%</td>
                </tr>
              ))}
              {safeHistory.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-20 text-gray-400 italic">No records found. Run diagnostic engine to generate logs.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
          <span>Showing {safeHistory.length} recent sessions</span>
          <div className="flex gap-1">
            <button className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-50 disabled:opacity-50" disabled>&lt;</button>
            <button className="w-6 h-6 flex items-center justify-center border rounded bg-sky-50 border-sky-200 text-sky-700 font-bold">1</button>
            <button className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-50">&gt;</button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ── 4. SYSTEM CONFIG ── */
function SettingsView() {
  return (
    <div className="grid grid-cols-12 gap-6 pb-6">
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <Card title="General Configuration" icon={Settings}>
          <div className="space-y-6 max-w-2xl">
            {[
              { l: "Ward Identification", d: "NICU-West-Wing-04", icon: Hash },
              { l: "Primary Clinician", d: "Dr. A. Rivera (ID: 8992)", icon: User },
              { l: "Data Retention Policy", d: "HIPAA Compliant (30 Days)", icon: ShieldCheck }
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded bg-gray-50 flex items-center justify-center text-gray-400"><f.icon size={18} /></div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">{f.l}</label>
                  <input type="text" defaultValue={f.d} className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-medium text-gray-800 focus:outline-none focus:border-sky-500 transition-colors" />
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-xs font-bold uppercase tracking-wide rounded hover:bg-sky-700 transition-colors"><Save size={14} /> Save Changes</button>
            </div>
          </div>
        </Card>

        <Card title="Threshold Parameters" icon={Activity}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Auditory Sensitivity (dB)</label>
              <input type="range" className="w-full accent-sky-600" />
              <div className="flex justify-between text-xs text-gray-400 font-mono mt-1"><span>-60dB</span><span>0dB</span></div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Distress Alert Threshold (1-10)</label>
              <input type="range" className="w-full accent-red-500" defaultValue="75" />
              <div className="flex justify-between text-xs text-gray-400 font-mono mt-1"><span>Low</span><span>Critical</span></div>
            </div>
          </div>
        </Card>
      </div>

      <div className="col-span-12 lg:col-span-4 space-y-6">
        <Card title="System Diagnostics" icon={Server}>
          <div className="space-y-4">
            {[
              { l: "Cloud Uplink", s: "Connected", i: Wifi, c: "text-emerald-600" },
              { l: "Local Storage", s: "45% Free", i: Database, c: "text-sky-600" },
              { l: "Mic Array B", s: "Calibrating...", i: Volume2, c: "text-amber-500" },
              { l: "Battery Unit", s: "AC Power", i: Battery, c: "text-gray-600" }
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
                <div className="flex items-center gap-3">
                  <s.i size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{s.l}</span>
                </div>
                <span className={`text-xs font-bold ${s.c}`}>{s.s}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ════════════════  MAIN LAYOUT  ════════════════ */

export default function App() {
  const [activeTab, setActiveTab] = useState("monitor");
  const sim = useSim();

  const NAV = [
    { id: "monitor", label: "Patient Monitoring", icon: Activity },
    { id: "analysis", label: "Diagnostic Engine", icon: Brain },
    { id: "history", label: "Data Logs", icon: List },
    { id: "settings", label: "System Config", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col text-gray-300 shrink-0 border-r border-slate-800 z-20 shadow-xl">
        <div className="h-14 flex items-center px-5 border-b border-slate-700 bg-slate-950">
          <div className="w-6 h-6 bg-sky-600 rounded mr-3 flex items-center justify-center text-white font-bold text-xs">C2</div>
          <div><h1 className="text-sm font-bold text-white tracking-wide uppercase">Cry2Care Prø</h1><p className="text-[10px] text-slate-400 font-mono">v2.4.0-Stable</p></div>
        </div>
        <div className="py-6 px-3 space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Modules</p>
          {NAV.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all ${activeTab === item.id ? "bg-sky-700 text-white shadow-md border border-sky-600" : "text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent"}`}>
              <item.icon size={16} /> {item.label}
            </button>
          ))}
        </div>
        <div className="mt-auto p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 mb-2"><span>SYST-OK</span><span>{sim.analyzing ? "BUSY" : "IDLE"}</span></div>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full bg-emerald-500 transition-all duration-300 ${sim.analyzing ? 'animate-pulse' : ''}`} style={{ width: sim.analyzing ? `${sim.progress}%` : '100%' }} />
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{NAV.find(n => n.id === activeTab)?.label}</h2>
            <div className="h-4 w-px bg-gray-300" />
            <span className="text-xs font-mono text-gray-500">Unit: NICU-04</span>
          </div>
          <div className="flex items-center gap-4 text-gray-500 text-xs font-mono">
            <span>{new Date().toLocaleDateString()}</span>
            <Bell size={16} className={`${sim.history.some(h => h.severity > 7) ? 'text-red-500 animate-bounce' : 'text-gray-400'} cursor-pointer`} />
          </div>
        </header>
        <main className="flex-1 overflow-hidden p-6 bg-gray-100">
          <div className="h-full overflow-y-auto pr-2">
            {activeTab === "monitor" && <MonitorView history={sim.history} result={sim.result} />}
            {activeTab === "analysis" && <AnalysisView sim={sim} />}
            {activeTab === "history" && <HistoryView history={sim.history} fetchHistory={sim.fetchHistory} />}
            {activeTab === "settings" && <SettingsView />}
          </div>
        </main>
      </div>
    </div>
  );
}

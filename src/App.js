import { useState, useEffect, useRef, useCallback } from "react";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzx3qAI2w9KrnKCK3V8VE65zfKarRhS8XM7DTUH6B3I5mEvXRS6BtX_34jQa_fqxFq4/exec";

const PHASES = [
  { id: "pre",        label: "PRE-MATCH",   duration: null, color: "#94a3b8", accent: "#cbd5e1" },
  { id: "auto",       label: "AUTONOMOUS",  duration: 20,   color: "#f59e0b", accent: "#fbbf24" },
  { id: "transition", label: "TRANSITION",  duration: 10,   color: "#8b5cf6", accent: "#a78bfa" },
  { id: "shift1",     label: "SHIFT 1",     duration: 25,   color: "#3b82f6", accent: "#60a5fa" },
  { id: "shift2",     label: "SHIFT 2",     duration: 25,   color: "#ef4444", accent: "#f87171" },
  { id: "shift3",     label: "SHIFT 3",     duration: 25,   color: "#3b82f6", accent: "#60a5fa" },
  { id: "shift4",     label: "SHIFT 4",     duration: 25,   color: "#ef4444", accent: "#f87171" },
  { id: "endgame",    label: "ENDGAME",     duration: 30,   color: "#10b981", accent: "#34d399" },
  { id: "debrief",    label: "DEBRIEF",     duration: null, color: "#6366f1", accent: "#818cf8" },
];

const PHASE_OBSERVATIONS = {
  pre: {
    title: "Before match starts",
    groups: [
      { label: "Starting Position", key: "startPos", type: "single",
        options: ["Far Left", "Center-Left", "Center", "Center-Right", "Far Right"] },
      { label: "Preloaded Fuel?", key: "preloaded", type: "single",
        options: ["Yes – Full (8)", "Yes – Partial", "No"] },
      { label: "Declared Intent", key: "declaredRole", type: "multi",
        options: ["Scorer", "Runner", "Defender", "Climber", "RP Bot"] },
    ],
  },
  auto: {
    title: "Watch carefully — 20 sec",
    groups: [
      { label: "Route Taken", key: "autoRoute", type: "single",
        options: ["Trench", "Bump", "Center Open", "Stayed Put", "Unknown"] },
      { label: "Hub Scored?", key: "autoHubScored", type: "single",
        options: ["Yes – Multiple", "Yes – 1-2", "Attempted/Missed", "No"] },
      { label: "Collected Fuel?", key: "autoCollect", type: "single",
        options: ["Depot", "Outpost (HP)", "Field Pickup", "None"] },
      { label: "Climbed Tower?", key: "autoClimb", type: "single",
        options: ["Yes – Lvl 1", "Attempted/Failed", "No"] },
      { label: "Issues Observed", key: "autoIssues", type: "multi",
        options: ["Crossed centerline", "Hit opponent", "Lost control", "Stalled", "None"] },
    ],
  },
  transition: {
    title: "Both hubs active — 10 sec",
    groups: [
      { label: "Used the Hub?", key: "transHub", type: "single",
        options: ["Yes – Immediately", "Yes – Late", "No – Repositioning", "No – Confused"] },
      { label: "Role Pivot", key: "transRole", type: "single",
        options: ["Continued Scoring", "Switched to Runner", "Set up Defense", "Prepped for Shift", "Idle"] },
      { label: "Shift Awareness", key: "transAwareness", type: "single",
        options: ["Clearly Aware", "Seemed Unsure", "No Reaction"] },
    ],
  },
  shift1: {
    title: "Shift 1 — Blue hub active (25s)",
    groups: [
      { label: "Primary Role", key: "s1role", type: "single",
        options: ["Scorer", "Runner/Herder", "Defender", "Collecting", "Idle"] },
      { label: "Shift Awareness", key: "s1awareness", type: "single",
        options: ["Adapted Correctly", "Scored Inactive Hub", "Confused Briefly", "Ignored Shift"] },
      { label: "Movement Quality", key: "s1movement", type: "single",
        options: ["Fast & Controlled", "Fast & Erratic", "Slow & Deliberate", "Stopped/Stalled"] },
      { label: "Issues", key: "s1issues", type: "multi",
        options: ["Pinned", "Tipped fuel", "Collision", "Mechanism jam", "None"] },
    ],
  },
  shift2: {
    title: "Shift 2 — Red hub active (25s)",
    groups: [
      { label: "Primary Role", key: "s2role", type: "single",
        options: ["Scorer", "Runner/Herder", "Defender", "Collecting", "Idle"] },
      { label: "Shift Awareness", key: "s2awareness", type: "single",
        options: ["Adapted Correctly", "Scored Inactive Hub", "Confused Briefly", "Ignored Shift"] },
      { label: "Movement Quality", key: "s2movement", type: "single",
        options: ["Fast & Controlled", "Fast & Erratic", "Slow & Deliberate", "Stopped/Stalled"] },
      { label: "Issues", key: "s2issues", type: "multi",
        options: ["Pinned", "Tipped fuel", "Collision", "Mechanism jam", "None"] },
    ],
  },
  shift3: {
    title: "Shift 3 — Blue hub active (25s)",
    groups: [
      { label: "Primary Role", key: "s3role", type: "single",
        options: ["Scorer", "Runner/Herder", "Defender", "Collecting", "Idle"] },
      { label: "Shift Awareness", key: "s3awareness", type: "single",
        options: ["Adapted Correctly", "Scored Inactive Hub", "Confused Briefly", "Ignored Shift"] },
      { label: "Consistency vs Shift 1", key: "s3consistency", type: "single",
        options: ["More Effective", "Same Level", "Less Effective", "Completely Different Role"] },
      { label: "Issues", key: "s3issues", type: "multi",
        options: ["Pinned", "Tipped fuel", "Collision", "Mechanism jam", "None"] },
    ],
  },
  shift4: {
    title: "Shift 4 — Red hub active (25s)",
    groups: [
      { label: "Primary Role", key: "s4role", type: "single",
        options: ["Scorer", "Runner/Herder", "Defender", "Collecting", "Idle"] },
      { label: "Shift Awareness", key: "s4awareness", type: "single",
        options: ["Adapted Correctly", "Scored Inactive Hub", "Confused Briefly", "Ignored Shift"] },
      { label: "Fatigue/Consistency", key: "s4fatigue", type: "single",
        options: ["Still Strong", "Slightly Slower", "Noticeably Declining", "Stopped Working"] },
      { label: "Issues", key: "s4issues", type: "multi",
        options: ["Pinned", "Tipped fuel", "Collision", "Mechanism jam", "None"] },
    ],
  },
  endgame: {
    title: "Endgame — Both hubs active (30s)",
    groups: [
      { label: "Climb Attempted?", key: "egClimb", type: "single",
        options: ["Yes", "No – Still Scoring", "No – Broken", "No – Chose Not To"] },
      { label: "Climb Level Reached", key: "egLevel", type: "single",
        options: ["Level 3 (High)", "Level 2 (Mid)", "Level 1 (Low)", "Attempted/Failed", "N/A"] },
      { label: "Climb Timing", key: "egTiming", type: "single",
        options: ["Early (>15s left)", "Mid (8-15s left)", "Late (<8s left)", "Buzzer"] },
      { label: "Scoring While Waiting", key: "egScoredFirst", type: "single",
        options: ["Yes – Scored Then Climbed", "Went Straight to Climb", "N/A"] },
    ],
  },
  debrief: {
    title: "Final assessment",
    groups: [
      { label: "Primary Role (Actual)", key: "finalRole", type: "single",
        options: ["Scorer", "Runner/Herder", "Defender", "Climber", "RP Specialist", "Mixed"] },
      { label: "Limiting Factor", key: "limiter", type: "single",
        options: ["Hesitant/Slow", "Clumsy/Erratic", "Shift-Unaware", "Mechanical Issues", "Pinned Easily", "None – Clean Match"] },
      { label: "Shift Awareness Overall", key: "shiftAwareness", type: "single",
        options: ["Excellent – Always Adapted", "Good – Minor Lapses", "Poor – Frequent Errors", "Seemed Autonomous/Blind"] },
      { label: "Alliance Value", key: "allianceValue", type: "single",
        options: ["High – Would Want", "Medium – Situational", "Low – Liability", "Unknown – Need More Data"] },
      { label: "Would Pick?", key: "wouldPick", type: "single",
        options: ["Yes – First Pick", "Yes – Second Pick", "Maybe", "No"] },
    ],
  },
};

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

export default function ScoutingApp() {
  const [screen, setScreen] = useState("home");
  const [matchInfo, setMatchInfo] = useState({ matchNum: "", teamNum: "", allianceColor: "blue", scoutName: "" });
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [running, setRunning] = useState(false);
  const [data, setData] = useState({});
  const [notes, setNotes] = useState("");
  const [phaseFlash, setPhaseFlash] = useState(false);
  const [savedMatches, setSavedMatches] = useState([]);
  const [sendStates, setSendStates] = useState({});
  const timerRef = useRef(null);
  const flashRef = useRef(null);

  const currentPhase = PHASES[phaseIdx];

  const advancePhase = useCallback(() => {
    setPhaseIdx(prev => {
      const next = Math.min(prev + 1, PHASES.length - 1);
      setTimeLeft(PHASES[next].duration);
      if (next === PHASES.length - 1) setRunning(false);
      setPhaseFlash(true);
      clearTimeout(flashRef.current);
      flashRef.current = setTimeout(() => setPhaseFlash(false), 600);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!running) { clearInterval(timerRef.current); return; }
    if (timeLeft === null) return;
    if (timeLeft <= 0) { advancePhase(); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [running, phaseIdx, advancePhase, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && running) advancePhase();
  }, [timeLeft, running, advancePhase]);

  const startMatch = () => {
    setPhaseIdx(1); setTimeLeft(20); setRunning(true);
    setScreen("scout"); setData({}); setNotes("");
  };

  const goToPreMatch = () => {
    setPhaseIdx(0); setTimeLeft(null); setRunning(false);
    setScreen("scout"); setData({}); setNotes("");
  };

  const jumpToPhase = (idx) => {
    setRunning(false);
    clearInterval(timerRef.current);
    setPhaseIdx(idx);
    setTimeLeft(PHASES[idx].duration);
  };

  const handleOption = (key, val, isMulti) => {
    setData(prev => {
      if (isMulti) {
        const current = prev[key] || [];
        return { ...prev, [key]: current.includes(val) ? current.filter(v => v !== val) : [...current, val] };
      }
      return { ...prev, [key]: prev[key] === val ? null : val };
    });
  };

  const saveMatch = () => {
    const entry = { matchInfo: { ...matchInfo }, data: { ...data }, notes, timestamp: Date.now() };
    setSavedMatches(prev => [...prev, entry]);
    setScreen("home");
  };

  const sendToSheet = async (matchIndex) => {
    if (APPS_SCRIPT_URL === "PASTE_YOUR_URL_HERE") {
      alert("Paste your Apps Script URL into APPS_SCRIPT_URL at the top of App.js");
      return;
    }
    setSendStates(s => ({ ...s, [matchIndex]: "sending" }));
    const match = savedMatches[matchIndex];
    try {
      const payload = encodeURIComponent(JSON.stringify({
        matchInfo: match.matchInfo,
        data: match.data,
        notes: match.notes,
      }));
      const url = `${APPS_SCRIPT_URL}?payload=${payload}`;
      await fetch(url, { method: "GET", mode: "no-cors" });
      setSendStates(s => ({ ...s, [matchIndex]: "sent" }));
    } catch (err) {
      setSendStates(s => ({ ...s, [matchIndex]: "error" }));
    }
  };

  const sendAll = async () => {
    for (let i = 0; i < savedMatches.length; i++) {
      if (sendStates[i] !== "sent") {
        await sendToSheet(i);
        await new Promise(r => setTimeout(r, 400));
      }
    }
  };

  const pc = currentPhase.color;
  const pa = currentPhase.accent;

  const card = { background: "#13131f", border: "1px solid #1e1e2e", borderRadius: 10, padding: "12px", marginBottom: 10 };
  const lbl  = { fontSize: 10, letterSpacing: 2, color: "#64748b", marginBottom: 8, textTransform: "uppercase" };
  const inp  = { width: "100%", boxSizing: "border-box", background: "#0a0a0f", border: "1px solid #1e1e2e", borderRadius: 6, padding: "10px 12px", color: "#f1f5f9", fontSize: 14, fontFamily: "'Courier New', Courier, monospace", outline: "none" };
  const btn  = (bg, fg = "#fff") => ({ padding: "12px", borderRadius: 8, background: bg, color: fg, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Courier New', Courier, monospace", letterSpacing: 1, WebkitTapHighlightColor: "transparent" });
  const optBtn = (selected) => ({ padding: "10px 8px", borderRadius: 7, border: selected ? `2px solid ${pc}` : "2px solid #1e1e2e", background: selected ? pc + "22" : "#0a0a0f", color: selected ? pc : "#94a3b8", fontSize: 12, fontFamily: "'Courier New', Courier, monospace", fontWeight: selected ? 700 : 400, cursor: "pointer", textAlign: "center", lineHeight: 1.3, WebkitTapHighlightColor: "transparent" });
  const appStyle = { minHeight: "100vh", background: "#0a0a0f", color: "#f1f5f9", fontFamily: "'Courier New', Courier, monospace", maxWidth: 430, margin: "0 auto" };

  const SendBtn = ({ index }) => {
    const state = sendStates[index] || "idle";
    const c = { idle: { label: "SEND →", bg: "#1e3a5f", fg: "#60a5fa" }, sending: { label: "SENDING…", bg: "#1e1e2e", fg: "#94a3b8" }, sent: { label: "✓ SENT", bg: "#14532d", fg: "#86efac" }, error: { label: "✗ RETRY", bg: "#450a0a", fg: "#fca5a5" } }[state];
    return (
        <button
            onClick={() => state !== "sending" && state !== "sent" && sendToSheet(index)}
            style={{ padding: "7px 12px", borderRadius: 6, background: c.bg, color: c.fg, border: "none", fontSize: 10, fontWeight: 700, cursor: state === "sent" ? "default" : "pointer", fontFamily: "'Courier New', Courier, monospace", letterSpacing: 1, flexShrink: 0 }}
        >
          {c.label}
        </button>
    );
  };

  // ── HOME ────────────────────────────────────────────────────────────────────
  if (screen === "home") return (
      <div style={appStyle}>
        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: 4, color: "#3b82f6", marginBottom: 4 }}>FRC 2026</div>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -1 }}>REBUILT</div>
            <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2 }}>QUALITATIVE SCOUT v1.1</div>
          </div>

          <div style={{ ...card, marginBottom: 16 }}>
            <div style={lbl}>MATCH INFO</div>
            {[
              { label: "Scout Name", key: "scoutName", placeholder: "Your name" },
              { label: "Team #",     key: "teamNum",   placeholder: "e.g. 254", type: "number" },
              { label: "Match #",    key: "matchNum",  placeholder: "e.g. Q42" },
            ].map(f => (
                <div key={f.key} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>{f.label}</div>
                  <input
                      value={matchInfo[f.key]}
                      onChange={e => setMatchInfo(m => ({ ...m, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      type={f.type || "text"}
                      style={inp}
                  />
                </div>
            ))}
            <div>
              <div style={{ fontSize: 10, color: "#475569", marginBottom: 6 }}>Alliance Color</div>
              <div style={{ display: "flex", gap: 8 }}>
                {["blue", "red"].map(c => (
                    <button key={c} onClick={() => setMatchInfo(m => ({ ...m, allianceColor: c }))}
                            style={{ flex: 1, padding: "10px", borderRadius: 6, fontFamily: "'Courier New', Courier, monospace", fontWeight: 700, fontSize: 13, cursor: "pointer", border: "2px solid", borderColor: matchInfo.allianceColor === c ? (c === "blue" ? "#3b82f6" : "#ef4444") : "#1e1e2e", background: matchInfo.allianceColor === c ? (c === "blue" ? "#1d4ed844" : "#7f1d1d44") : "#0a0a0f", color: matchInfo.allianceColor === c ? (c === "blue" ? "#60a5fa" : "#f87171") : "#475569" }}>
                      {c.toUpperCase()}
                    </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={goToPreMatch} style={{ ...btn("#1e1e2e", "#94a3b8"), width: "100%", marginBottom: 8, fontSize: 11, letterSpacing: 2 }}>← PRE-MATCH SETUP</button>
          <button onClick={startMatch}   style={{ ...btn("#3b82f6"), width: "100%", marginBottom: 20, fontSize: 14, letterSpacing: 2 }}>▶ START MATCH TIMER</button>

          {savedMatches.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: "#64748b" }}>SAVED ({savedMatches.length})</div>
                  <button onClick={sendAll} style={{ ...btn("#6366f1"), padding: "7px 14px", fontSize: 10 }}>SEND ALL →</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {savedMatches.map((m, i) => (
                      <div key={i} style={{ ...card, marginBottom: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <span style={{ color: "#f1f5f9", fontWeight: 700 }}>Q{m.matchInfo.matchNum || "?"}</span>
                            <span style={{ color: "#64748b" }}>·</span>
                            <span style={{ color: "#94a3b8" }}>#{m.matchInfo.teamNum || "?"}</span>
                          </div>
                          <div style={{ fontSize: 10, color: "#475569" }}>
                            {m.matchInfo.scoutName || "No name"} · <span style={{ color: m.matchInfo.allianceColor === "blue" ? "#60a5fa" : "#f87171" }}>{m.matchInfo.allianceColor?.toUpperCase()}</span>
                          </div>
                        </div>
                        <SendBtn index={i} />
                      </div>
                  ))}
                </div>
                {APPS_SCRIPT_URL === "PASTE_YOUR_URL_HERE" && (
                    <div style={{ marginTop: 12, background: "#451a03", border: "1px solid #92400e", borderRadius: 8, padding: "10px 12px", fontSize: 11, color: "#fcd34d", lineHeight: 1.6 }}>
                      ⚠️ Paste your Apps Script URL into APPS_SCRIPT_URL at the top of App.js
                    </div>
                )}
              </div>
          )}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} input::placeholder{color:#334155} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#0a0a0f} ::-webkit-scrollbar-thumb{background:#1e1e2e;border-radius:4px} button:active{transform:scale(0.97)}`}</style>
      </div>
  );

  // ── SCOUT ───────────────────────────────────────────────────────────────────
  const obs = PHASE_OBSERVATIONS[currentPhase.id];
  const isDebrief = currentPhase.id === "debrief";
  const isPre = currentPhase.id === "pre";

  return (
      <div style={appStyle}>
        <div style={{ padding: "12px 16px 10px", borderBottom: `2px solid ${pc}`, background: phaseFlash ? pc + "33" : "#0f0f1a", transition: "background 0.3s", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: pc, fontWeight: 700 }}>{currentPhase.label}</div>
            {obs && <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{obs.title}</div>}
          </div>
          {timeLeft !== null && !isPre && !isDebrief
              ? <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, color: timeLeft <= 5 && running ? "#ef4444" : pa, animation: timeLeft <= 5 && running ? "pulse 0.5s infinite" : "none" }}>{formatTime(timeLeft)}</div>
              : <div style={{ fontSize: 12, color: "#475569" }}>{isPre ? "NO TIMER" : "DONE"}</div>}
          <div style={{ textAlign: "right" }}>
            <div style={{ color: matchInfo.allianceColor === "blue" ? "#60a5fa" : "#f87171", fontWeight: 700, fontSize: 12 }}>#{matchInfo.teamNum || "???"}</div>
            <div style={{ fontSize: 10, color: "#475569" }}>Q{matchInfo.matchNum || "?"}</div>
          </div>
        </div>

        <div style={{ padding: "12px 14px 130px", overflowY: "auto" }}>
          {obs?.groups.map(group => (
              <div key={group.key} style={card}>
                <div style={lbl}>{group.label}{group.type === "multi" ? " (multi-select)" : ""}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {group.options.map(opt => {
                    const isMulti = group.type === "multi";
                    const selected = isMulti ? (data[group.key] || []).includes(opt) : data[group.key] === opt;
                    return <button key={opt} onClick={() => handleOption(group.key, opt, isMulti)} style={optBtn(selected)}>{opt}</button>;
                  })}
                </div>
              </div>
          ))}

          {(isDebrief || isPre) && (
              <div style={card}>
                <div style={lbl}>Free Notes</div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything that doesn't fit above..." rows={4} style={{ ...inp, resize: "none", fontSize: 13 }} />
              </div>
          )}

          {!isDebrief && !isPre && (
              <div style={card}>
                <div style={lbl}>Quick Note (this phase)</div>
                <input value={data[`${currentPhase.id}_note`] || ""} onChange={e => setData(d => ({ ...d, [`${currentPhase.id}_note`]: e.target.value }))} placeholder="e.g. bumped ref table, unusual route..." style={inp} />
              </div>
          )}

          {currentPhase.id === "transition" && <div style={{ background: "#7c2d12", borderRadius: 8, padding: "10px 12px", border: "1px solid #9a3412", fontSize: 11, color: "#fca5a5", marginBottom: 10 }}>⚠️ Both hubs active NOW. Note if robot knows this.</div>}
          {(currentPhase.id === "shift2" || currentPhase.id === "shift4") && <div style={{ background: "#1c1917", borderRadius: 8, padding: "10px 12px", border: "1px solid #292524", fontSize: 11, color: "#a8a29e", marginBottom: 10 }}>🔄 Hub switched. Did robot adapt immediately?</div>}
          {currentPhase.id === "endgame" && <div style={{ background: "#14532d", borderRadius: 8, padding: "10px 12px", border: "1px solid #15803d", fontSize: 11, color: "#86efac", marginBottom: 10 }}>🏆 Watch climb level & timing carefully — huge point swings.</div>}
        </div>

        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#0f0f1a", borderTop: "2px solid #1e1e2e", padding: "10px 14px 20px", zIndex: 200 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 8, overflowX: "auto", paddingBottom: 2 }}>
            {PHASES.map((p, i) => (
                <button key={p.id} onClick={() => jumpToPhase(i)} style={{ flex: "0 0 auto", padding: "4px 8px", borderRadius: 4, fontSize: 9, letterSpacing: 1, background: i === phaseIdx ? p.color + "33" : i < phaseIdx ? "#1e1e2e" : "#0a0a0f", color: i === phaseIdx ? p.color : i < phaseIdx ? "#475569" : "#1e293b", border: i === phaseIdx ? `1px solid ${p.color}` : "1px solid transparent", cursor: "pointer", fontFamily: "'Courier New', Courier, monospace", fontWeight: i === phaseIdx ? 700 : 400 }}>
                  {p.id === "pre" ? "PRE" : p.id === "auto" ? "AUTO" : p.id === "transition" ? "TRANS" : p.id === "debrief" ? "DEBRIEF" : p.id.toUpperCase()}
                </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {isDebrief ? <>
              <button onClick={() => setScreen("home")} style={btn("#1e1e2e", "#94a3b8")}>← DISCARD</button>
              <button onClick={saveMatch} style={btn("#10b981")}>SAVE MATCH ✓</button>
            </> : isPre ? <>
              <button onClick={() => setScreen("home")} style={btn("#1e1e2e", "#94a3b8")}>← BACK</button>
              <button onClick={startMatch} style={btn("#3b82f6")}>START TIMER ▶</button>
            </> : <>
              <button onClick={() => setRunning(r => !r)} style={btn(running ? "#78350f" : "#166534", running ? "#fcd34d" : "#86efac")}>{running ? "⏸ PAUSE" : "▶ RESUME"}</button>
              <button onClick={advancePhase} style={btn(pc + "44", pa)}>NEXT PHASE →</button>
            </>}
          </div>
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}} input::placeholder,textarea::placeholder{color:#334155} ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:#0a0a0f} ::-webkit-scrollbar-thumb{background:#1e1e2e;border-radius:4px} button:active{transform:scale(0.97)}`}</style>
      </div>
  );
}

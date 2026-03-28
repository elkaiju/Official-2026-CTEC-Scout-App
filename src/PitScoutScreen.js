import React, { useState, useCallback, useMemo } from 'react';

const PIT_GROUPS = [
    {
        label: "Auton Routines",
        key: "pitAuton",
        type: "multi",
        sub: "Select all that apply",
        options: [
            { val: "mobility",      label: "Mobility Only",       desc: "Leaves starting zone" },
            { val: "score_pre",     label: "Score Pre-loaded",     desc: "Shoots preloaded balls" },
            { val: "collect_shoot", label: "Collect + Shoot",      desc: "Picks up & scores" },
            { val: "auto_climb",    label: "Auto Climb (L1)",      desc: "Tower climb in auto" },
            { val: "no_auto",       label: "No Auto",              desc: "No functioning routine" },
        ],
    },
    {
        label: "Shooter Type",
        key: "pitShooter",
        type: "single",
        sub: "Select one",
        options: [
            { val: "turret",     label: "Turret",       desc: "Rotates independently of chassis" },
            { val: "fixed",      label: "Fixed",        desc: "Whole robot aims" },
            { val: "dumper",     label: "Dumper/Hopper", desc: "Close-range dump" },
            { val: "no_shooter", label: "No Shooter",   desc: "Climb/defense only" },
        ],
    },
    {
        label: "Field Traversal",
        key: "pitTraversal",
        type: "multi",
        sub: "Select all that apply",
        options: [
            { val: "bump",    label: "BUMP",          desc: "Can clear 6.5 in bump" },
            { val: "trench",  label: "TRENCH",        desc: "Fits under 40.25 in trench" },
            { val: "both",    label: "Both",          desc: "Fully versatile" },
            { val: "neither", label: "Neither",       desc: "Stays in alliance zone" },
        ],
    },
    {
        label: "Climb Level",
        key: "pitClimb",
        type: "single",
        sub: "Highest reliable level",
        options: [
            { val: "none", label: "No Climb",  desc: "Cannot hang" },
            { val: "L1",   label: "Level 1",   desc: "Off ground — 10 pts" },
            { val: "L2",   label: "Level 2",   desc: "Above low rung — 20 pts" },
            { val: "L3",   label: "Level 3",   desc: "Above mid rung — 30 pts" },
        ],
    },
];

const PitScoutScreen = React.memo(({ onBack, onSave }) => {
    const [localPitTeamNum, setLocalPitTeamNum] = useState("");
    const [localPitScoutName, setLocalPitScoutName] = useState("");
    const [localPitData, setLocalPitData] = useState({});
    const [localPitNotes, setLocalPitNotes] = useState("");

    const allAnswered = PIT_GROUPS.every(g => {
        const val = localPitData[g.key];
        return g.type === "multi" ? (val && val.length > 0) : !!val;
    });

    const PIT_COLOR = "#f5c800";
    const appStyle = { minHeight: "100vh", background: "#0a0a0f", color: "#f1f5f9", fontFamily: "'Courier New', Courier, monospace", maxWidth: 430, margin: "0 auto" };
    const pitCard = { background: "#13131f", border: "1px solid #1e1e2e", borderRadius: 10, padding: "12px", marginBottom: 10 };
    const pitLbl = { fontSize: 10, letterSpacing: 2, color: "#64748b", marginBottom: 4, textTransform: "uppercase" };
    const pitSub = { fontSize: 10, color: "#475569", marginBottom: 8 };
    const pitInp = { width: "100%", boxSizing: "border-box", background: "#0a0a0f", border: "1px solid #1e1e2e", borderRadius: 6, padding: "10px 12px", color: "#f1f5f9", fontSize: 14, fontFamily: "'Courier New', Courier, monospace", outline: "none" };
    const pitOptBtn = (selected) => ({
        padding: "10px 8px",
        borderRadius: 7,
        border: selected ? `2px solid ${PIT_COLOR}` : "2px solid #1e1e2e",
        background: selected ? PIT_COLOR + "22" : "#0a0a0f",
        color: selected ? PIT_COLOR : "#94a3b8",
        fontSize: 12,
        fontFamily: "'Courier New', Courier, monospace",
        fontWeight: selected ? 700 : 400,
        cursor: "pointer",
        textAlign: "left",
        lineHeight: 1.3,
        display: "flex",
        flexDirection: "column",
        gap: 2,
    });

    const btn = (bg, fg = "#fff") => ({ padding: "12px", borderRadius: 8, background: bg, color: fg, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Courier New', Courier, monospace", letterSpacing: 1 });

    const handleTeamNumChange = (e) => {
        setLocalPitTeamNum(e.target.value);
    };

    const handleScoutNameChange = (e) => {
        setLocalPitScoutName(e.target.value);
    };

    const handlePitNotesChange = (e) => {
        setLocalPitNotes(e.target.value);
    };

    const handlePitOptionClick = (key, val, isMulti) => {
        setLocalPitData(prev => {
            if (isMulti) {
                const current = prev[key] || [];
                if (current.includes(val)) {
                    return { ...prev, [key]: current.filter(v => v !== val) };
                } else {
                    return { ...prev, [key]: [...current, val] };
                }
            } else {
                return { ...prev, [key]: prev[key] === val ? null : val };
            }
        });
    };

    const handleSave = () => {
        if (allAnswered) {
            onSave({
                teamNum: localPitTeamNum,
                scoutName: localPitScoutName,
                pitData: localPitData,
                pitNotes: localPitNotes,
                timestamp: Date.now()
            });
        }
    };

    return (
        <div style={appStyle}>
            <div style={{ padding: "12px 16px 10px", borderBottom: `2px solid ${PIT_COLOR}`, background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
                <div>
                    <div style={{ fontSize: 11, letterSpacing: 3, color: PIT_COLOR, fontWeight: 700 }}>PIT SCOUT</div>
                    <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>Robot capabilities</div>
                </div>
                <div style={{ fontSize: 10, color: "#475569" }}>FRC 2026</div>
            </div>

            <div style={{ padding: "12px 14px 130px" }}>
                <div style={pitCard}>
                    <div style={pitLbl}>Team Info</div>
                    <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>Team #</div>
                        <input
                            value={localPitTeamNum}
                            onChange={handleTeamNumChange}
                            placeholder="e.g. 254"
                            type="number"
                            style={pitInp}
                        />
                    </div>
                    <div>
                        <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>Scout Name</div>
                        <input
                            value={localPitScoutName}
                            onChange={handleScoutNameChange}
                            placeholder="Your name"
                            style={pitInp}
                        />
                    </div>
                </div>

                {PIT_GROUPS.map((group, gi) => {
                    const isMulti = group.type === "multi";
                    return (
                        <div key={group.key} style={pitCard}>
                            <div style={pitLbl}>
                                <span style={{ color: PIT_COLOR, marginRight: 6 }}>0{gi + 1}</span>
                                {group.label}
                                {isMulti && <span style={{ color: "#475569", marginLeft: 6, fontSize: 9 }}>(MULTI)</span>}
                            </div>
                            <div style={pitSub}>{group.sub}</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {group.options.map(opt => {
                                    const selected = isMulti
                                        ? (localPitData[group.key] || []).includes(opt.val)
                                        : localPitData[group.key] === opt.val;
                                    return (
                                        <button
                                            key={opt.val}
                                            onClick={() => handlePitOptionClick(group.key, opt.val, isMulti)}
                                            style={pitOptBtn(selected)}
                                        >
                                            <span style={{ fontSize: 12, fontWeight: 700 }}>{opt.label}</span>
                                            <span style={{ fontSize: 10, color: selected ? PIT_COLOR + "aa" : "#475569", fontWeight: 400 }}>{opt.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                <div style={pitCard}>
                    <div style={pitLbl}>Free Notes</div>
                    <textarea
                        value={localPitNotes}
                        onChange={handlePitNotesChange}
                        placeholder="Build quality, mechanisms, driver comments, anything else..."
                        rows={4}
                        style={{ ...pitInp, resize: "none", fontSize: 13 }}
                    />
                </div>
            </div>

            <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#0f0f1a", borderTop: "2px solid #1e1e2e", padding: "10px 14px 20px", zIndex: 200 }}>
                {!allAnswered && (
                    <div style={{ fontSize: 10, color: "#475569", textAlign: "center", marginBottom: 8, letterSpacing: 1 }}>
                        ANSWER ALL 4 QUESTIONS TO SAVE
                    </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button onClick={onBack} style={btn("#1e1e2e", "#94a3b8")}>← BACK</button>
                    <button
                        onClick={handleSave}
                        disabled={!allAnswered}
                        style={{ ...btn(allAnswered ? PIT_COLOR : "#1e1e2e", allAnswered ? "#0a0a0f" : "#475569"), opacity: allAnswered ? 1 : 0.5, cursor: allAnswered ? "pointer" : "not-allowed" }}
                    >
                        SAVE PIT ✓
                    </button>
                </div>
            </div>
        </div>
    );
});

export default PitScoutScreen;

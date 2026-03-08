"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── TYPES ── */
interface Company {
  name: string;
  code: string;
}

type TierKey = "bronze" | "silver" | "gold";
type Phase = "idle" | "spinning" | "explode" | "reveal";

interface TierInfo {
  label: string;
  color: string;
  light: string;
  accent: string;
  border: string;
  glow: string;
  particle: string;
}

interface Option {
  value: string;
  label: string;
  drawn?: boolean;
}

interface Particle {
  x: number;
  y: number;
  angle: number;
  orbitR: number;
  phase: number;
  vx: number;
  vy: number;
  size: number;
  brightness: number;
  trail: { x: number; y: number }[];
}

/* ─── DATA ── */
const companies: Company[] = [
  { name: "Mauritius Finance", code: "BS9" },
  { name: "DTOS Ltd", code: "BS11" },
  { name: "Trident Trust Company (Mauritius) Limited", code: "BS8" },
  { name: "2CANA SOLUTIONS", code: "BS7" },
  { name: "Yunit- Magellan Partners", code: "BS13" },
  { name: "Ernst & Young Ltd", code: "BS10" },
  { name: "IQ-EQ MAURITIUS", code: "BS6" },
  { name: "Accenture", code: "BS4" },
  { name: "TeakWorld", code: "BS3" },
  { name: "Checkout", code: "BS2" },
  { name: "BDO & Co", code: "BS5" },
  { name: "SIL", code: "BS12" },
  { name: "IBL LTD – Healthactiv & Medical Trading Company (MedActiv)", code: "BS1" },
  { name: "KPMG", code: "SS1" },
  { name: "Aberdeen Operations Ltd", code: "SS2" },
  { name: "Currimjee Jeewanjee and Company Limited", code: "SS3" },
  { name: "Business At Work (Mtius) Ltd", code: "SS4" },
  { name: "Deloitte", code: "GS7" },
  { name: "Rogers Capital", code: "GS6" },
  { name: "Safyr Utilis Fund Services Ltd", code: "GS9" },
  { name: "BDO Solutions Ltd", code: "GS3" },
  { name: "Aptis Services Company Limited", code: "GS1" },
  { name: "HF Markets Limited", code: "GS10" },
  { name: "Arup (Mauritius) Ltd", code: "GS5" },
  { name: "Rank Interactive Services (Mauritius) Limited", code: "GS4" },
  { name: "SD WORX MAURITIUS", code: "GS8" },
  { name: "ClarityLabs Mauritius", code: "GS2" },
];

const getTier = (code: string): TierKey => {
  if (code.startsWith("GS")) return "gold";
  if (code.startsWith("SS")) return "silver";
  return "bronze";
};

const TIERS: Record<TierKey, TierInfo> = {
  bronze: { label:"Bronze", color:"#7A4A28", light:"#FDF5EE", accent:"#B8733A", border:"#D4A882", glow:"rgba(184,115,58,0.22)", particle:"#C8845A" },
  silver: { label:"Silver", color:"#3A4A5A", light:"#F2F5F8", accent:"#5A7A96", border:"#8AAAC0", glow:"rgba(90,122,150,0.25)", particle:"#6A8FA8" },
  gold:   { label:"Gold",   color:"#5C4010", light:"#FDFAEE", accent:"#B89030", border:"#D4B060", glow:"rgba(184,144,48,0.28)", particle:"#C9A84C" },
};

const byTier: Record<TierKey, Company[]> = {
  bronze: companies.filter(c => getTier(c.code) === "bronze"),
  silver: companies.filter(c => getTier(c.code) === "silver"),
  gold:   companies.filter(c => getTier(c.code) === "gold"),
};

/* ─── CONFETTI — auto-expires, z-index below modals ── */
interface ConfettiProps {
  active: boolean;
  tier: TierKey;
  onDone?: () => void;
}

function Confetti({ active, tier, onDone }: Readonly<ConfettiProps>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!active) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const start = Date.now();
    const LIFE = 3800;

    const tierColors: Record<TierKey, string[]> = {
      gold:   ["#C9A84C","#E8D5A0","#F5E880","#D4B86A","#fffde0"],
      silver: ["#6A8FA8","#B0C4D8","#D8E8F0","#90B0C8","#e8f4ff"],
      bronze: ["#C8845A","#D4A882","#E8C9A0","#B87040","#fde8d8"],
    };
    const colors = tierColors[tier];

    const pieces = Array.from({ length: 250 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * -400,
      w: Math.random()*14+4, h: Math.random()*7+3,
      color: colors[Math.floor(Math.random()*colors.length)],
      rot: Math.random()*360, rotS: (Math.random()-0.5)*9,
      vx: (Math.random()-0.5)*5, vy: Math.random()*5+2.5,
    }));

    const draw = () => {
      const elapsed = Date.now() - start;
      if (elapsed >= LIFE) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        onDone?.();
        return;
      }
      const fade = elapsed > LIFE * 0.55 ? Math.max(0, 1 - (elapsed - LIFE*0.55)/(LIFE*0.45)) : 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.rot+=p.rotS; p.vy+=0.06;
        if (p.y > canvas.height) { p.y=-20; p.x=Math.random()*canvas.width; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.88 * fade;
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.restore();
      });
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active, tier]);

  return (
    <canvas ref={canvasRef} style={{
      position:"fixed", inset:0, pointerEvents:"none",
      zIndex: active ? 9960 : -1,   // always BELOW modals (9970+)
    }} />
  );
}

/* ─── WINNER MODAL ── */
interface WinnerModalProps {
  winner: Company | null;
  onNext: () => void;
}

function WinnerModal({ winner, onNext }: Readonly<WinnerModalProps>) {
  if (!winner) return null;
  const tier = getTier(winner.code);
  const t = TIERS[tier];
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{
        position:"fixed", inset:0, zIndex:9990,
        display:"flex", alignItems:"center", justifyContent:"center",
        background:"rgba(245,242,237,0.70)", backdropFilter:"blur(20px)",
      }}
    >
      <motion.div
        initial={{ scale:0.2, y:80, opacity:0, rotate:-5 }}
        animate={{ scale:1, y:0, opacity:1, rotate:0 }}
        exit={{ scale:0.85, y:-50, opacity:0 }}
        transition={{ type:"spring", stiffness:200, damping:15 }}
        style={{
          background:"#ffffff", borderRadius:32,
          padding:"64px 80px", textAlign:"center",
          maxWidth:620, width:"90vw",
          boxShadow:`0 4px 8px rgba(0,0,0,0.04), 0 28px 80px rgba(0,0,0,0.13), 0 0 0 2px ${t.border}, 0 0 100px ${t.glow}`,
          position:"relative", overflow:"hidden",
        }}
      >
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:6,
          background:`linear-gradient(90deg, transparent, ${t.accent}, ${t.border}, ${t.accent}, transparent)`,
        }} />

        <motion.div
          initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.22 }}
          style={{
            display:"inline-flex", alignItems:"center", gap:9,
            background:t.light, border:`1px solid ${t.border}`,
            borderRadius:50, padding:"9px 26px", marginBottom:34,
          }}
        >
          <span style={{ width:10, height:10, borderRadius:"50%", background:t.accent, display:"inline-block" }} />
          <span style={{ fontSize:14, letterSpacing:4, textTransform:"uppercase", color:t.color, fontFamily:"'DM Sans',sans-serif", fontWeight:700 }}>
            {t.label} Table Winner
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity:0, scale:0.5 }}
          animate={{ opacity:1, scale:1 }}
          transition={{ delay:0.38, type:"spring", stiffness:260 }}
          style={{
            fontSize:120, fontWeight:700, lineHeight:1,
            fontFamily:"'DM Sans',sans-serif",
            color:t.accent, letterSpacing:-2, marginBottom:10,
          }}
        >
          {winner.code}
        </motion.div>

        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.54 }}
          style={{
            fontSize:34, fontWeight:600, color:"#111",
            fontFamily:"'Cormorant Garamond',serif",
            lineHeight:1.25, marginBottom:48, padding:"0 8px",
          }}
        >
          {winner.name}
        </motion.div>

        <motion.button
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.7 }}
          whileHover={{ scale:1.04, backgroundColor:"#2a2a2a" }}
          whileTap={{ scale:0.97 }}
          onClick={onNext}
          style={{
            background:"#111", border:"none", borderRadius:14,
            padding:"18px 56px", color:"#fff", fontSize:16,
            letterSpacing:4, textTransform:"uppercase", cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif", fontWeight:700,
            transition:"background 0.2s",
          }}
        >
          Next Draw →
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/* ─── SEE ALL MODAL ── */
interface SeeAllModalProps {
  onClose: () => void;
  drawnCodes: Set<string>;
}

function SeeAllModal({ onClose, drawnCodes }: Readonly<SeeAllModalProps>) {
  const [tab, setTab] = useState<TierKey>("bronze");
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{
        position:"fixed", inset:0, zIndex:9970,
        display:"flex", alignItems:"center", justifyContent:"center",
        background:"rgba(236,232,226,0.72)", backdropFilter:"blur(16px)",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y:50, opacity:0, scale:0.97 }}
        animate={{ y:0, opacity:1, scale:1 }}
        exit={{ y:30, opacity:0 }}
        transition={{ type:"spring", stiffness:260, damping:22 }}
        onClick={e => e.stopPropagation()}
        style={{
          background:"#fefefe", borderRadius:24,
          width:"min(740px, 92vw)", maxHeight:"84vh",
          overflow:"hidden", display:"flex", flexDirection:"column",
          boxShadow:"0 4px 8px rgba(0,0,0,0.04), 0 28px 70px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.07)",
        }}
      >
        {/* Header */}
        <div style={{ padding:"38px 42px 0", borderBottom:"1px solid #f0ede8" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:30 }}>
            <div>
              <div style={{ fontSize:12, letterSpacing:5, color:"#bbb", textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif", fontWeight:700, marginBottom:8 }}>All Participants</div>
              <div style={{ fontSize:36, fontWeight:700, color:"#111", fontFamily:"'Cormorant Garamond',serif" }}>Company Directory</div>
            </div>
            <button onClick={onClose} style={{
              background:"#f2f0ec", border:"none", borderRadius:50,
              width:42, height:42, cursor:"pointer", fontSize:22, color:"#888",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>×</button>
          </div>
          {/* Tabs */}
          <div style={{ display:"flex", gap:2 }}>
            {(["bronze","silver","gold"] as TierKey[]).map(tier => {
              const t = TIERS[tier];
              const active = tab === tier;
              const drawn = byTier[tier].filter(c => drawnCodes.has(c.code)).length;
              return (
                <button key={tier} onClick={() => setTab(tier)} style={{
                  padding:"13px 30px", borderRadius:"10px 10px 0 0",
                  border:"none", cursor:"pointer",
                  background: active ? t.light : "transparent",
                  color: active ? t.color : "#aaa",
                  fontFamily:"'DM Sans',sans-serif",
                  fontSize:16, fontWeight: active ? 700 : 500,
                  borderBottom: active ? `3px solid ${t.accent}` : "3px solid transparent",
                  transition:"all 0.18s",
                }}>
                  {t.label}
                  <span style={{ opacity:0.5, fontSize:13, marginLeft:7 }}>
                    ({byTier[tier].length}{drawn > 0 ? ` · ${drawn} drawn` : ""})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowY:"auto", padding:"0 42px 38px" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", marginTop:22 }}>
            <thead>
              <tr>
                {["Stand","Company",""].map((h,i) => {
                  const colWidths: (number | string)[] = [100, "auto", 90];
                  return (
                  <th key={h} style={{
                    textAlign:"left", padding:"12px 0",
                    fontSize:12, letterSpacing:4, color:"#c0b8ae",
                    textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif",
                    fontWeight:700, borderBottom:"1px solid #f0ede8",
                    width: colWidths[i],
                  }}>{h}</th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {byTier[tab].map((c, i) => {
                const t = TIERS[tab];
                const drawn = drawnCodes.has(c.code);
                return (
                  <motion.tr key={c.code}
                    initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay: i*0.025 }}
                    style={{ borderBottom:"1px solid #f8f6f2" }}
                  >
                    <td style={{
                      padding:"17px 0",
                      fontFamily:"'DM Sans',sans-serif", fontSize:16, fontWeight:700,
                      color: t.accent, letterSpacing:1,
                    }}>{c.code}</td>
                    <td style={{
                      padding:"17px 0",
                      fontFamily:"'DM Sans',sans-serif", fontSize:17, lineHeight:1.4,
                      color: "#1a1a1a",
                      // textDecoration: drawn ? "line-through" : "none",
                    }}>{c.name}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── PARTICLE CANVAS ── */
interface ParticleCanvasProps {
  phase: Phase;
  tier: TierKey;
}

function ParticleCanvas({ phase, tier }: Readonly<ParticleCanvasProps>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef<number>(0);
  const phaseRef = useRef<Phase>(phase);
  const tierRef = useRef<TierKey>(tier);
  phaseRef.current = phase;
  tierRef.current = tier;

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => ({
    r: Number.parseInt(hex.slice(1,3),16),
    g: Number.parseInt(hex.slice(3,5),16),
    b: Number.parseInt(hex.slice(5,7),16),
  });

  const initP = (W: number, H: number) => {
    particlesRef.current = Array.from({ length:200 }, (_, i) => {
      const angle = (i/200)*Math.PI*2;
      const r = 100 + Math.random()*240;
      return {
        x: W/2+Math.cos(angle)*r, y: H/2+Math.sin(angle)*r,
        angle, orbitR:r, phase:Math.random()*Math.PI*2,
        vx:0, vy:0, size:Math.random()*3.5+1,
        brightness:0.35+Math.random()*0.55, trail:[],
      };
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initP(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);
    const ctx = canvas.getContext("2d");
    if (!ctx) { window.removeEventListener("resize", resize); return; }

    const animate = () => {
      const W = canvas.width, H = canvas.height;
      const ph = phaseRef.current;
      const t = TIERS[tierRef.current] || TIERS.silver;
      const { r:pr, g:pg, b:pb } = hexToRgb(t.particle);
      timeRef.current += 0.018;
      const time = timeRef.current;

      ctx.fillStyle = "rgba(250,247,243,0.20)";
      ctx.fillRect(0, 0, W, H);

      particlesRef.current.forEach(p => {
        if (ph === "idle") {
          p.angle += 0.005 + Math.sin(p.phase+time*0.3)*0.0015;
          const breathe = p.orbitR + Math.sin(time*0.7+p.phase)*14;
          p.x = W/2+Math.cos(p.angle)*breathe;
          p.y = H/2+Math.sin(p.angle)*breathe;
        } else if (ph === "spinning") {
          p.angle += 0.032 + time*0.009;
          const shrink = Math.max(p.orbitR - time*20, 5);
          p.x = W/2+Math.cos(p.angle)*shrink;
          p.y = H/2+Math.sin(p.angle)*shrink;
        } else if (ph === "explode") {
          p.vx += (p.x-W/2)*0.07;
          p.vy += (p.y-H/2)*0.07;
          p.x += p.vx; p.y += p.vy;
        }
        p.trail.push({ x:p.x, y:p.y });
        if (p.trail.length > 9) p.trail.shift();
        if (p.trail.length > 2) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          p.trail.forEach(pt => ctx.lineTo(pt.x, pt.y));
          ctx.strokeStyle = `rgba(${pr},${pg},${pb},0.11)`;
          ctx.lineWidth = p.size*0.55;
          ctx.stroke();
        }
        const alpha = ph === "spinning" ? Math.min(0.85, p.brightness+0.3) : p.brightness*0.65;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${pr},${pg},${pb},${alpha})`;
        ctx.fill();
      });

      if (ph === "spinning" || ph === "explode") {
        const rs = ph === "explode" ? 350 : 70+time*8;
        const g2 = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,rs);
        g2.addColorStop(0, `rgba(${pr},${pg},${pb},0.45)`);
        g2.addColorStop(0.4, `rgba(${pr},${pg},${pb},0.12)`);
        g2.addColorStop(1, `rgba(${pr},${pg},${pb},0)`);
        ctx.beginPath(); ctx.arc(W/2,H/2,rs,0,Math.PI*2);
        ctx.fillStyle=g2; ctx.fill();
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position:"fixed", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:0 }} />;
}

/* ─── DROPDOWN ── */
interface DropdownProps {
  label: string;
  step: string | number;
  value: Option | null;
  options: Option[];
  onChange: (opt: Option) => void;
  disabled: boolean;
  placeholder: string;
  accentColor?: string;
}

function Dropdown({ label, step, value, options, onChange, disabled, placeholder, accentColor }: Readonly<DropdownProps>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={ref} style={{ width:"100%", position:"relative", marginBottom:22 }}>
      <div style={{
        fontSize:17, letterSpacing:2, color:"#333",
        textTransform:"uppercase", marginBottom:11, paddingLeft:2,
        fontFamily:"'DM Sans',sans-serif", fontWeight:700,
        display:"flex", alignItems:"center", gap:11,
      }}>
        <span style={{
          display:"inline-flex", alignItems:"center", justifyContent:"center",
          width:28, height:28, borderRadius:"50%",
          background: disabled ? "#ddd" : (accentColor || "#333"),
          color:"#fff", fontSize:13, fontWeight:800, flexShrink:0,
        }}>{step}</span>
        {label}
      </div>

      <button
        onClick={() => { if (!disabled) setOpen(o => !o); }}
        style={{
          width:"100%", padding:"21px 26px",
          background:"#ffffff",
          border:`2px solid ${(value && accentColor) ? accentColor+"66" : "#e0dbd4"}`,
          borderRadius:18, cursor: disabled ? "not-allowed" : "pointer",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          fontSize:20, color: value ? "#111" : "#c0b8ae",
          fontFamily:"'DM Sans',sans-serif", fontWeight: value ? 500 : 400,
          boxShadow: open ? `0 0 0 4px ${accentColor||"#999"}22, 0 4px 20px rgba(0,0,0,0.07)` : "0 2px 14px rgba(0,0,0,0.05)",
          opacity: disabled ? 0.42 : 1,
          transition:"border-color 0.2s, box-shadow 0.2s",
          textAlign:"left",
        }}
      >
        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"calc(100% - 30px)" }}>
          {value?.label || placeholder}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration:0.2 }}
          style={{ color:"#c0b8ae", fontSize:16, flexShrink:0, marginLeft:8 }}>▾</motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, y:-8, scaleY:0.94 }}
            animate={{ opacity:1, y:0, scaleY:1 }}
            exit={{ opacity:0, y:-6, scaleY:0.94 }}
            transition={{ duration:0.15 }}
            style={{
              position:"absolute", top:"calc(100% + 8px)", left:0, right:0, zIndex:300,
              background:"#fff", borderRadius:18,
              boxShadow:"0 12px 60px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)",
              overflow:"hidden", maxHeight:360, overflowY:"auto",
              transformOrigin:"top",
            }}
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value?.value;
                  const selectedBg = accentColor ? `${accentColor}14` : "#f5f4f1";
                  return (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt); setOpen(false); }}
                  style={{
                    width:"100%", padding:"20px 26px",
                    background: isSelected ? selectedBg : "transparent",
                    border:"none", borderBottom:"1px solid #f5f2ee",
                    cursor:"pointer", textAlign:"left",
                    display:"flex", alignItems:"center", justifyContent:"space-between", gap:14,
                    transition:"background 0.12s",
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background="#faf8f5"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background="transparent"; }}
                >
                  <span style={{
                    fontSize:19, lineHeight:1.35,
                    color: opt.drawn ? "#4CA85E" : "#1a1a1a",
                    fontFamily:"'DM Sans',sans-serif", fontWeight:500,
                    textDecoration: opt.drawn ? "line-through" : "none",
                    flexGrow:1,
                  }}>
                    {opt.label}
                  </span>
                  {opt.drawn && (
                    <span style={{
                      fontSize:12, fontWeight:700, color:"#4CA85E",
                      background:"#EBF7EE", borderRadius:7, padding:"4px 12px",
                      letterSpacing:2, textTransform:"uppercase",
                      fontFamily:"'DM Sans',sans-serif", flexShrink:0,
                    }}>✓</span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── APP ── */
export default function App() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [selTier, setSelTier] = useState<Option | null>(null);
  const [selCompany, setSelCompany] = useState<Option | null>(null);
  const [winner, setWinner] = useState<Company | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [seeAll, setSeeAll] = useState(false);
  const [drawnCodes, setDrawnCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(fontLink);
    return () => { fontLink.remove(); };
  }, []);

  const activeTier = selTier ? TIERS[selTier.value as TierKey] : null;
  const canDraw = !!selCompany && phase === "idle";

  const tierOpts: Option[] = [
    { value:"bronze", label:"Bronze" },
    { value:"silver", label:"Silver" },
    { value:"gold",   label:"Gold"   },
  ];

  const companyOpts = selTier
    ? companies
        .filter(c => getTier(c.code) === selTier.value)
        .map(c => ({ value:c.code, label:c.name, drawn:drawnCodes.has(c.code) }))
    : [];

  const startDraw = useCallback(() => {
    if (!canDraw || !selCompany) return;
    const win = companies.find(c => c.code === selCompany.value);
    if (!win) return;
    setPhase("spinning");
    setTimeout(() => setPhase("explode"), 3600);
    setTimeout(() => {
      setWinner(win);
      setPhase("reveal");
      setConfetti(true);
      setDrawnCodes(prev => new Set([...prev, win.code]));
    }, 4200);
  }, [canDraw, selCompany]);

  const reset = () => {
    setConfetti(false);
    setWinner(null);
    setPhase("idle");
    setSelTier(null);
    setSelCompany(null);
  };

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(155deg, #faf8f4 0%, #f4f1eb 50%, #ede8de 100%)",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      fontFamily:"'DM Sans',sans-serif", position:"relative", overflow:"hidden",
    }}>
      {/* Dot grid */}
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        backgroundImage:"radial-gradient(circle, rgba(0,0,0,0.042) 1px, transparent 1px)",
        backgroundSize:"36px 36px",
      }} />

      <ParticleCanvas phase={phase} tier={(selTier?.value as TierKey) || "silver"} />

      {/* Confetti: z-index 9960, below modals at 9970+ */}
      <Confetti active={confetti} tier={(selTier?.value as TierKey) || "silver"} onDone={() => setConfetti(false)} />

      {/* Modals at 9990 and 9970 */}
      <AnimatePresence>{winner && <WinnerModal winner={winner} onNext={reset} />}</AnimatePresence>
      <AnimatePresence>{seeAll && <SeeAllModal onClose={() => setSeeAll(false)} drawnCodes={drawnCodes} />}</AnimatePresence>

      {/* ── UI Panel ── */}
      <div style={{
        position:"relative", zIndex:10,
        width:"100%", maxWidth:600, padding:"0 36px",
        display:"flex", flexDirection:"column", alignItems:"center",
      }}>
        {/* Title */}
        <motion.div
          initial={{ opacity:0, y:-28 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.7, ease:[0.16,1,0.3,1] }}
          style={{ textAlign:"center", marginBottom:60 }}
        >
          <div style={{
            fontSize:14, letterSpacing:7, color:"#bbb", textTransform:"uppercase",
            fontFamily:"'DM Sans',sans-serif", fontWeight:700, marginBottom:14,
          }}>
            Lucky Draw
          </div>
          <div style={{
            fontSize:68, fontWeight:700, lineHeight:1,
            fontFamily:"'Cormorant Garamond',serif", color:"#111", letterSpacing:-2,
          }}>
            Company Draw
          </div>
          <div style={{ width:54, height:3, background:"#ddd", margin:"22px auto 0", borderRadius:3 }} />
        </motion.div>

        {/* Dropdowns */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.18 }} style={{ width:"100%" }}>
          <Dropdown
            label="Select Tier"
            step="1"
            value={selTier}
            options={tierOpts}
            onChange={(opt) => { setSelTier(opt); setSelCompany(null); }}
            disabled={false}
            placeholder="Choose a tier…"
            accentColor={activeTier?.accent}
          />
        </motion.div>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.28 }} style={{ width:"100%" }}>
          <Dropdown
            label="Select Company"
            step="2"
            value={selCompany}
            options={companyOpts}
            onChange={setSelCompany}
            disabled={!selTier}
            placeholder="Choose a company…"
            accentColor={activeTier?.accent}
          />
        </motion.div>

        {/* Draw button */}
        <motion.div
          initial={{ opacity:0, scale:0.88 }} animate={{ opacity:1, scale:1 }}
          transition={{ delay:0.4, type:"spring", stiffness:220 }}
          style={{ marginTop:32, width:"100%", display:"flex", justifyContent:"center" }}
        >
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <motion.div key="idle" exit={{ scale:0, opacity:0, transition:{ duration:0.2 } }}>
                <motion.button
                  animate={canDraw ? {
                    boxShadow:[
                      `0 6px 24px ${activeTier?.glow||"rgba(0,0,0,0.07)"}`,
                      `0 12px 50px ${activeTier?.glow||"rgba(0,0,0,0.07)"}, 0 0 0 12px ${activeTier?.glow||"rgba(0,0,0,0.03)"}`,
                      `0 6px 24px ${activeTier?.glow||"rgba(0,0,0,0.07)"}`,
                    ],
                  } : {}}
                  transition={{ duration:2.6, repeat:Infinity }}
                  whileHover={canDraw ? { scale:1.06, y:-4 } : {}}
                  whileTap={canDraw ? { scale:0.95 } : {}}
                  onClick={startDraw}
                  disabled={!canDraw}
                  style={{
                    background: canDraw
                      ? `linear-gradient(135deg, ${activeTier?.accent}, ${activeTier?.border})`
                      : "#e2ddd8",
                    border:"none", borderRadius:100,
                    padding:"28px 110px",
                    color: canDraw ? "#fff" : "#c0b8ae",
                    fontSize:26, letterSpacing:10,
                    textTransform:"uppercase", cursor: canDraw ? "pointer" : "not-allowed",
                    fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                    transition:"background 0.3s, color 0.3s",
                  }}
                >
                  Draw
                </motion.button>
              </motion.div>
            )}
            {(phase === "spinning" || phase === "explode") && (
              <motion.div
                key="spin"
                initial={{ opacity:0, scale:0.5 }}
                animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0, scale:1.5 }}
                style={{ textAlign:"center", padding:"28px 0" }}
              >
                <motion.div
                  animate={{ opacity:[0.4,1,0.4], letterSpacing:["10px","16px","10px"] }}
                  transition={{ duration:0.75, repeat:Infinity }}
                  style={{
                    fontSize:28, color: activeTier?.accent||"#888",
                    fontFamily:"'DM Sans',sans-serif", fontWeight:700,
                    textTransform:"uppercase",
                  }}
                >
                  Drawing…
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Hint text */}
        <AnimatePresence>
          {!canDraw && phase === "idle" && (
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ marginTop:20, fontSize:15, color:"#bbb", textAlign:"center", fontFamily:"'DM Sans',sans-serif" }}
            >
              {selTier ? "Select a company to draw" : "Select a tier to begin"}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drawn tally */}
        {drawnCodes.size > 0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={{ marginTop:22, fontSize:15, color:"#4CA85E", fontFamily:"'DM Sans',sans-serif", fontWeight:700, letterSpacing:1 }}>
            ✓ {drawnCodes.size} winner{drawnCodes.size > 1 ? "s" : ""} drawn today
          </motion.div>
        )}
      </div>

      {/* See All */}
      <motion.button
        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1 }}
        whileHover={{ scale:1.04, boxShadow:"0 6px 24px rgba(0,0,0,0.1)" }}
        whileTap={{ scale:0.97 }}
        onClick={() => setSeeAll(true)}
        style={{
          position:"fixed", bottom:30, left:30, zIndex:20,
          background:"rgba(255,255,255,0.90)", backdropFilter:"blur(14px)",
          border:"1.5px solid rgba(0,0,0,0.09)", borderRadius:16,
          padding:"15px 28px", cursor:"pointer",
          display:"flex", alignItems:"center", gap:10,
          fontSize:16, color:"#555", letterSpacing:0.5,
          fontFamily:"'DM Sans',sans-serif", fontWeight:600,
          boxShadow:"0 2px 18px rgba(0,0,0,0.07)",
          transition:"color 0.2s",
        }}
      >
        <span style={{ fontSize:20, lineHeight:1 }}>≡{" "}</span>See All
      </motion.button>

      <div style={{
        position:"fixed", bottom:38, right:32, zIndex:20,
        fontSize:13, color:"#ccc", letterSpacing:3,
        fontFamily:"'DM Sans',sans-serif", textTransform:"uppercase", fontWeight:600,
      }}>
        {companies.length} Participants
      </div>
    </div>
  );
}
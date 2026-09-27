import { useEffect, useRef, useState, useCallback } from "react";
import {
  Wind,
  Zap,
  Activity,
  ArrowRight,
  ChevronDown,
  Radio,
} from "lucide-react";

interface FourActCinematicHeroProps {
  onNavigateToDashboard: () => void;
  onSwitchToHanergy?: (mode: "3d" | "octane") => void;
}

interface ActMeta {
  index: number;
  label: string;
  subtitle: string;
  altitude: string;
  status: string;
  metric: string;
  metricVal: string;
  accent: string;
}

const ACTS: ActMeta[] = [
  {
    index: 1,
    label: "ATMOSPHERE",
    subtitle: "Planetary Equilibrium · Orbital Perspective",
    altitude: "420 KM · LOW EARTH ORBIT",
    status: "EQUILIBRIUM",
    metric: "GLOBAL RADIANCE",
    metricVal: "1,361 W/m²",
    accent: "#72b6e8",
  },
  {
    index: 2,
    label: "CALM",
    subtitle: "Stratocumulus Field · Open Troposphere",
    altitude: "8,200 M · TROPOSPHERE",
    status: "STABLE ADVECTION",
    metric: "GEOSTROPHIC FLOW",
    metricVal: "18.4 KM/H",
    accent: "#38bdf8",
  },
  {
    index: 3,
    label: "TURN",
    subtitle: "Mesoscale Destabilization · Condensation Funnel",
    altitude: "120 M · SURFACE INVERSION",
    status: "SEVERE SHEAR",
    metric: "CYCLONIC VORTICITY",
    metricVal: "142 KM/H",
    accent: "#a78bfa",
  },
  {
    index: 4,
    label: "CONVECTION",
    subtitle: "Full Severe Vortex · Intra-Cloud Ionization",
    altitude: "14,500 M · OVERSHOOTING TOP",
    status: "EXPLOSIVE CONVECTION",
    metric: "CORE REFLECTIVITY",
    metricVal: "62.4 dBZ",
    accent: "#c084fc",
  },
];

export default function FourActCinematicHero({ onNavigateToDashboard, onSwitchToHanergy }: FourActCinematicHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Video element refs for all 4 acts
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null, null, null]);
  const wispRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);
  const plateLayerRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);
  const handoffRef = useRef<HTMLDivElement | null>(null);
  
  // Scroll and mouse state
  const [scrollProgress, setScrollProgress] = useState(0); // 0 to 4+
  const [currentAct, setCurrentAct] = useState(1);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Mouse parallax coordinates
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const baseOffsetRef = useRef({ x: 0, y: 0 });
  const wispOffsetRef = useRef({ x: 0, y: 0 });
  const animFrameIdRef = useRef<number>(0);
  const scaleValuesRef = useRef<number[]>([1, 1, 1, 1]);
  const opacityValuesRef = useRef<number[]>([1, 0, 0, 0]);

  // Check touch capabilities
  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
    setIsTouchDevice(isTouch);
  }, []);

  // Ensure all videos play continuously and smoothly
  useEffect(() => {
    videoRefs.current.forEach((vid) => {
      if (vid) {
        vid.playbackRate = 1.0;
        const playPromise = vid.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay policy fallback: muted autoplay is always allowed
            vid.muted = true;
            vid.play().catch(() => {});
          });
        }
      }
    });
  }, []);

  // Track mouse coordinates relative to viewport center [-1.0, 1.0]
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isTouchDevice) return;
    const nx = (e.clientX / window.innerWidth - 0.5) * 2.0;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2.0;
    mouseTargetRef.current = {
      x: Math.max(-1, Math.min(1, nx)),
      y: Math.max(-1, Math.min(1, ny)),
    };
  }, [isTouchDevice]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // Continuous RequestAnimationFrame parallax lerp loop
  useEffect(() => {
    const renderLoop = () => {
      if (!isTouchDevice) {
        const target = mouseTargetRef.current;
        // Background base video layer: max offset 8px, heavily damped lerp 0.05
        baseOffsetRef.current.x += (target.x * 8.0 - baseOffsetRef.current.x) * 0.05;
        baseOffsetRef.current.y += (target.y * 6.0 - baseOffsetRef.current.y) * 0.05;

        // Foreground wisp layer: max offset 32px, more responsive lerp 0.12
        wispOffsetRef.current.x += (target.x * 32.0 - wispOffsetRef.current.x) * 0.12;
        wispOffsetRef.current.y += (target.y * 24.0 - wispOffsetRef.current.y) * 0.12;

        const bx = baseOffsetRef.current.x.toFixed(2);
        const by = baseOffsetRef.current.y.toFixed(2);
        const wx = wispOffsetRef.current.x.toFixed(2);
        const wy = wispOffsetRef.current.y.toFixed(2);

        // Apply transforms directly via compositor
        for (let i = 0; i < 4; i++) {
          const vid = videoRefs.current[i];
          const wisp = wispRefs.current[i];
          const scale = scaleValuesRef.current[i] || 1;
          if (vid) {
            vid.style.transform = `translate3d(${bx}px, ${by}px, 0) scale(${scale})`;
          }
          if (wisp) {
            wisp.style.transform = `translate3d(${wx}px, ${wy}px, 0) scale(${scale})`;
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animFrameIdRef.current);
  }, [isTouchDevice]);

  // Scroll listener: Calculate scroll-linked crossfade + synchronized scale
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = window.scrollY;
    const windowH = window.innerHeight;
    // Total 5 virtual sections: Acts 1-4 + Product Handoff
    const progress = Math.max(0, scrollTop / windowH);
    setScrollProgress(progress);

    // Active Act index for metadata display (1 to 4)
    const actIdx = Math.min(4, Math.max(1, Math.floor(progress) + 1));
    setCurrentAct(actIdx);

    // Calculate opacities and synchronized scale for each Act
    // Transition zone: roughly the last 20% of section N and first 20% of section N+1
    // Zone width = 0.40 centered around integer boundaries 1.0, 2.0, 3.0, 4.0
    const opacities = [0, 0, 0, 0];
    const scales = [1, 1, 1, 1];

    for (let i = 0; i < 4; i++) {
      const start = i; // Act i starts at progress = i
      const end = i + 1; // Act i ends at progress = i + 1

      let op = 0;
      let scale = 1.0;

      if (progress <= start - 0.2) {
        // Fully before this section
        op = 0;
        scale = 1.0;
      } else if (progress >= end + 0.2) {
        // Fully after this section
        op = 0;
        scale = 1.0;
      } else if (progress >= start + 0.2 && progress <= end - 0.2) {
        // Solidly inside this section: stationary looping
        op = 1.0;
        scale = 1.0;
      } else if (progress > start - 0.2 && progress < start + 0.2) {
        // Entering transition zone from previous section
        const u = (progress - (start - 0.2)) / 0.4;
        const ease = u * u * (3 - 2 * u); // Smooth Hermite curve
        op = ease;
        // Synchronized scale: eases from 100% to ~108% together
        scale = 1.0 + 0.08 * (1.0 - ease);
      } else if (progress > end - 0.2 && progress < end + 0.2) {
        // Exiting transition zone into next section
        const u = (progress - (end - 0.2)) / 0.4;
        const ease = u * u * (3 - 2 * u);
        op = 1.0 - ease;
        // Synchronized scale: eases from 100% to ~108% together
        scale = 1.0 + 0.08 * ease;
      }

      opacities[i] = Math.max(0, Math.min(1, op));
      scales[i] = scale;
    }

    scaleValuesRef.current = scales;
    opacityValuesRef.current = opacities;

    // Apply opacities to plate layer elements
    for (let i = 0; i < 4; i++) {
      const layer = plateLayerRefs.current[i];
      if (layer) {
        layer.style.opacity = opacities[i].toFixed(4);
        layer.style.visibility = opacities[i] > 0.005 ? "visible" : "hidden";
      }
    }

    // Terminal Product Handoff visibility (Act 4 -> Terminal Handoff)
    const handoff = handoffRef.current;
    if (handoff) {
      if (progress >= 3.75) {
        const u = Math.min(1, (progress - 3.75) / 0.45);
        const ease = u * u * (3 - 2 * u);
        handoff.style.opacity = ease.toFixed(4);
        handoff.style.visibility = ease > 0.01 ? "visible" : "hidden";
        handoff.style.transform = `translateY(${(1.0 - ease) * 40}px)`;
      } else {
        handoff.style.opacity = "0";
        handoff.style.visibility = "hidden";
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initialize on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Smooth jump to act
  const scrollToAct = (actNum: number) => {
    const windowH = window.innerHeight;
    const targetY = (actNum - 1) * windowH;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  const activeMeta = ACTS[currentAct - 1] || ACTS[0];

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        // 4 Acts + 1 Terminal Product Handoff section = 500vh
        height: "500vh",
        background: "#060910",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ─── FIXED CINEMATIC VIEWPORT ─── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        {/* ─── 4 VIDEO PLATES WITH SYNCHRONIZED PARALLAX & CONTINUOUS-SHOT TRANSITION ─── */}
        {[1, 2, 3, 4].map((actNum, idx) => (
          <div
            key={actNum}
            ref={(el) => {
              plateLayerRefs.current[idx] = el;
            }}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: idx === 0 ? 1 : 0,
              visibility: idx === 0 ? "visible" : "hidden",
              transition: "opacity 0.08s linear", // ultra-smooth scrubbed tracking
              willChange: "opacity",
            }}
          >
            {/* LAYER 1: BASE 4K/1080P VIDEO PLATE (DAMPED MOUSE PARALLAX) */}
            <video
              ref={(el) => {
                videoRefs.current[idx] = el;
              }}
              autoPlay
              muted
              loop
              playsInline
              style={{
                position: "absolute",
                top: "-4%",
                left: "-4%",
                width: "108%",
                height: "108%",
                objectFit: "cover",
                objectPosition: actNum === 4 ? "center right" : "center center",
                willChange: "transform",
                pointerEvents: "none",
                filter:
                  actNum === 1
                    ? "contrast(1.04) brightness(1.02)"
                    : actNum === 2
                    ? "contrast(1.05) saturate(1.08)"
                    : actNum === 3
                    ? "contrast(1.12) saturate(1.15)"
                    : "contrast(1.18) saturate(1.22) brightness(0.96)",
              }}
            >
              <source src={`/plates/act${actNum}_base.mp4`} type="video/mp4" />
              <source src={`/plates/act${actNum}_base.webm`} type="video/webm" />
            </video>

            {/* LAYER 2: FOREGROUND WISP / CLOUD ALPHA LAYER (RESPONSIVE MOUSE PARALLAX) */}
            <div
              ref={(el) => {
                wispRefs.current[idx] = el;
              }}
              style={{
                position: "absolute",
                top: "-6%",
                left: "-6%",
                width: "112%",
                height: "112%",
                backgroundImage: `url(/plates/act${actNum}_wisp.png)`,
                backgroundSize: "cover",
                backgroundPosition: actNum === 4 ? "center right" : "center center",
                backgroundRepeat: "no-repeat",
                mixBlendMode: actNum === 3 ? "screen" : "normal",
                opacity: 0.88,
                pointerEvents: "none",
                willChange: "transform",
              }}
            />

            {/* ATMOSPHERIC GRADIENT VIGNETTE & CONTRAST CALIBRATION */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  actNum === 4
                    ? "radial-gradient(circle at 72% 50%, rgba(6, 9, 16, 0.05) 0%, rgba(6, 9, 16, 0.55) 60%, rgba(6, 9, 16, 0.92) 100%)"
                    : "radial-gradient(circle at 50% 50%, rgba(6, 9, 16, 0.08) 0%, rgba(6, 9, 16, 0.45) 75%, rgba(6, 9, 16, 0.85) 100%)",
                pointerEvents: "none",
              }}
            />
          </div>
        ))}

        {/* ─── HUD OVERLAYS & PROGRESS (DESKTOP FIRST, AGENCY GRADE) ─── */}
        
        {/* TOP BRAND BAR */}
        <header
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 76,
            padding: "0 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pointerEvents: "auto",
            zIndex: 30,
            background: "linear-gradient(to bottom, rgba(6, 9, 16, 0.75) 0%, rgba(6, 9, 16, 0) 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                backdropFilter: "blur(8px)",
              }}
            >
              <Radio size={16} strokeWidth={2.2} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  color: "#ffffff",
                }}
              >
                MEGHDRISHTI
              </div>
              <div style={{ fontSize: 9.5, color: "rgba(255, 255, 255, 0.55)", letterSpacing: "0.06em" }}>
                ATMOSPHERIC NOWCAST SYSTEM · 4-ACT CONTINUUM
              </div>
            </div>
          </div>

          {/* Quick Act Jump Pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(10, 16, 26, 0.65)",
              padding: "4px 6px",
              borderRadius: 24,
              border: "1px solid rgba(255, 255, 255, 0.14)",
              backdropFilter: "blur(12px)",
            }}
          >
            {ACTS.map((act) => (
              <button
                key={act.index}
                onClick={() => scrollToAct(act.index)}
                style={{
                  background: currentAct === act.index ? "rgba(255, 255, 255, 0.18)" : "transparent",
                  color: currentAct === act.index ? "#ffffff" : "rgba(255, 255, 255, 0.55)",
                  border: "none",
                  borderRadius: 16,
                  padding: "5px 12px",
                  fontSize: 10.5,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: currentAct === act.index ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ color: act.accent, fontSize: 9 }}>0{act.index}</span>
                <span>{act.label}</span>
              </button>
            ))}
          </div>

          {/* Right Status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {onSwitchToHanergy && (
              <button
                onClick={() => onSwitchToHanergy("3d")}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "rgba(255, 255, 255, 0.75)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  padding: "5px 12px",
                  borderRadius: 16,
                  fontSize: 10.5,
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s ease",
                }}
                title="Switch to Interactive 3D Revolving Earth Globe"
              >
                <span>3D GLOBE</span>
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#34d399" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "inline-block", boxShadow: "0 0 8px #34d399" }} />
              <span>LIVE TELEMETRY</span>
            </div>
            <button
              onClick={() => scrollToAct(5)}
              style={{
                background: "rgba(201, 154, 85, 0.15)",
                color: "#C99A55",
                border: "1px solid rgba(201, 154, 85, 0.4)",
                padding: "6px 14px",
                borderRadius: 18,
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(201, 154, 85, 0.28)";
                e.currentTarget.style.borderColor = "#C99A55";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(201, 154, 85, 0.15)";
                e.currentTarget.style.borderColor = "rgba(201, 154, 85, 0.4)";
              }}
            >
              <span>OPERATIONS CONSOLE</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </header>

        {/* BOTTOM LEFT: ACT TITLE & TELEMETRY */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 48,
            zIndex: 20,
            maxWidth: 480,
            pointerEvents: "auto",
            transition: "opacity 0.3s ease",
            opacity: scrollProgress < 3.8 ? 1 : 0.15,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.16em",
              color: activeMeta.accent,
              marginBottom: 8,
            }}
          >
            <span>ACT 0{activeMeta.index}</span>
            <span>—</span>
            <span>{activeMeta.altitude}</span>
          </div>

          <h1
            style={{
              fontSize: 54,
              fontWeight: 300,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "#ffffff",
              margin: "0 0 10px 0",
              textShadow: "0 2px 20px rgba(0,0,0,0.8)",
            }}
          >
            {activeMeta.label}
          </h1>

          <p
            style={{
              fontSize: 13.5,
              color: "rgba(229, 237, 247, 0.78)",
              lineHeight: 1.6,
              margin: "0 0 20px 0",
              textShadow: "0 1px 8px rgba(0,0,0,0.8)",
              maxWidth: 420,
            }}
          >
            {activeMeta.subtitle}
          </p>

          {/* Micro Telemetry Pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              background: "rgba(10, 16, 26, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              backdropFilter: "blur(14px)",
              padding: "8px 16px",
              borderRadius: 10,
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <div>
              <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>STATE: </span>
              <span style={{ color: "#ffffff", fontWeight: 600 }}>{activeMeta.status}</span>
            </div>
            <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.2)" }} />
            <div>
              <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>{activeMeta.metric}: </span>
              <span style={{ color: activeMeta.accent, fontWeight: 700 }}>{activeMeta.metricVal}</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: CONTINUOUS PROGRESS BAR & ACT RAIL */}
        <div
          style={{
            position: "absolute",
            right: 48,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 25,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 18,
            pointerEvents: "auto",
          }}
        >
          {ACTS.map((act) => {
            const isActive = currentAct === act.index;
            return (
              <div
                key={act.index}
                onClick={() => scrollToAct(act.index)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  opacity: isActive ? 1 : 0.45,
                  transition: "all 0.25s ease",
                }}
              >
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.6)",
                    }}
                  >
                    0{act.index} · {act.label}
                  </div>
                </div>
                <div
                  style={{
                    width: isActive ? 24 : 8,
                    height: 2,
                    background: isActive ? act.accent : "rgba(255, 255, 255, 0.4)",
                    boxShadow: isActive ? `0 0 10px ${act.accent}` : "none",
                    transition: "all 0.25s ease",
                  }}
                />
              </div>
            );
          })}

          {/* Terminal Handoff Tab */}
          <div
            onClick={() => scrollToAct(5)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              opacity: scrollProgress >= 3.8 ? 1 : 0.4,
              transition: "all 0.25s ease",
              marginTop: 10,
            }}
          >
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "#C99A55",
                }}
              >
                05 · CONSOLE HANDOFF
              </div>
            </div>
            <div
              style={{
                width: scrollProgress >= 3.8 ? 24 : 8,
                height: 2,
                background: "#C99A55",
                boxShadow: scrollProgress >= 3.8 ? "0 0 12px #C99A55" : "none",
                transition: "all 0.25s ease",
              }}
            />
          </div>
        </div>

        {/* BOTTOM CENTER: SCROLL GUIDANCE PROMPT */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            opacity: scrollProgress < 3.6 ? 0.75 : 0,
            transition: "opacity 0.3s ease",
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.18em",
            color: "rgba(255, 255, 255, 0.6)",
          }}
        >
          <span>SCROLL TO TRAVERSE THE ATMOSPHERE</span>
          <ChevronDown size={14} className="bounce-subtle" />
        </div>

        {/* ─── TERMINAL PRODUCT HANDOFF OVERLAY (SECTION 5 RECONNECT MOMENT) ─── */}
        {/* Strictly adheres to product tokens: --void: #060910, --accent: #C99A55, Inter, JetBrains Mono */}
        <div
          ref={handoffRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 40,
            background: "radial-gradient(circle at 50% 40%, rgba(13, 18, 28, 0.96) 0%, #060910 85%)",
            opacity: 0,
            visibility: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
            pointerEvents: scrollProgress >= 3.8 ? "auto" : "none",
            transition: "opacity 0.3s ease",
          }}
        >
          <div
            style={{
              maxWidth: 880,
              width: "100%",
              background: "rgba(13, 18, 28, 0.95)",
              border: "1px solid rgba(43, 55, 78, 0.6)",
              borderRadius: 14,
              boxShadow: "0 24px 64px rgba(0, 0, 0, 0.8), 0 0 40px rgba(201, 154, 85, 0.12)",
              padding: "48px",
              display: "flex",
              flexDirection: "column",
              gap: 32,
              backdropFilter: "blur(24px)",
            }}
          >
            {/* Header with Product Token Badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(201, 154, 85, 0.12)",
                    border: "1px solid rgba(201, 154, 85, 0.45)",
                    padding: "4px 12px",
                    borderRadius: 20,
                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#C99A55",
                      boxShadow: "0 0 8px #C99A55",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10.5,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      color: "#C99A55",
                    }}
                  >
                    MEGHDRISHTI 2.0 · PRODUCTION PLATFORM
                  </span>
                </div>

                <h2
                  style={{
                    fontSize: 34,
                    fontWeight: 500,
                    letterSpacing: "-0.02em",
                    color: "#e5edf7",
                    margin: "0 0 8px 0",
                  }}
                >
                  From Violent Convection to Autonomous Defense
                </h2>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "#8a9bb3",
                    margin: 0,
                    maxWidth: 620,
                  }}
                >
                  You have crossed through all four atmospheric transitions. Now enter the live operational console:
                  fusing INSAT-3D radiometry, IMD Doppler reflectivity, and Blitzortung lightning streams into sub-kilometer nowcasts.
                </p>
              </div>

              <div
                style={{
                  textAlign: "right",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "#566782",
                }}
              >
                <div>STATUS: ONLINE</div>
                <div style={{ color: "#34d399", fontWeight: 600 }}>LATENCY &lt; 250MS</div>
              </div>
            </div>

            {/* Live Console Sensor Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
              }}
            >
              <div
                style={{
                  background: "rgba(11, 16, 26, 0.85)",
                  border: "1px solid rgba(43, 55, 78, 0.5)",
                  borderRadius: 10,
                  padding: "16px 20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#C99A55", marginBottom: 6 }}>
                  <Activity size={16} />
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                    RADAR REFLECTIVITY
                  </span>
                </div>
                <div style={{ fontSize: 24, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#e5edf7" }}>
                  52.4 <span style={{ fontSize: 13, color: "#8a9bb3" }}>dBZ</span>
                </div>
                <div style={{ fontSize: 10.5, color: "#566782", marginTop: 4 }}>
                  IMD Doppler Grid · Max Echo Core
                </div>
              </div>

              <div
                style={{
                  background: "rgba(11, 16, 26, 0.85)",
                  border: "1px solid rgba(43, 55, 78, 0.5)",
                  borderRadius: 10,
                  padding: "16px 20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#3fb6ff", marginBottom: 6 }}>
                  <Wind size={16} />
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                    OPTICAL STEERING
                  </span>
                </div>
                <div style={{ fontSize: 24, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#e5edf7" }}>
                  28.6 <span style={{ fontSize: 13, color: "#8a9bb3" }}>KM/H ENE</span>
                </div>
                <div style={{ fontSize: 10.5, color: "#566782", marginTop: 4 }}>
                  Farnebäck Vector Field Interpolation
                </div>
              </div>

              <div
                style={{
                  background: "rgba(11, 16, 26, 0.85)",
                  border: "1px solid rgba(43, 55, 78, 0.5)",
                  borderRadius: 10,
                  padding: "16px 20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f0b429", marginBottom: 6 }}>
                  <Zap size={16} />
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                    IONIZATION DETECT
                  </span>
                </div>
                <div style={{ fontSize: 24, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#e5edf7" }}>
                  1,482 <span style={{ fontSize: 13, color: "#8a9bb3" }}>STRIKES/HR</span>
                </div>
                <div style={{ fontSize: 10.5, color: "#566782", marginTop: 4 }}>
                  Blitzortung Real-time VLF Sensors
                </div>
              </div>
            </div>

            {/* Launch CTA Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 16,
                borderTop: "1px solid rgba(43, 55, 78, 0.4)",
              }}
            >
              <button
                onClick={() => scrollToAct(1)}
                style={{
                  background: "transparent",
                  color: "#8a9bb3",
                  border: "none",
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>↑ RETURN TO ORBIT (ACT 01)</span>
              </button>

              <button
                onClick={onNavigateToDashboard}
                style={{
                  background: "#C99A55",
                  color: "#060910",
                  border: "none",
                  borderRadius: 8,
                  padding: "14px 32px",
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: "0 0 24px rgba(201, 154, 85, 0.4)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#dfaf6b";
                  e.currentTarget.style.boxShadow = "0 0 32px rgba(201, 154, 85, 0.65)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#C99A55";
                  e.currentTarget.style.boxShadow = "0 0 24px rgba(201, 154, 85, 0.4)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <span>LAUNCH NOWCAST OPERATIONS CONSOLE</span>
                <ArrowRight size={17} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(6px);
          }
        }
        .bounce-subtle {
          animation: bounce-subtle 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}

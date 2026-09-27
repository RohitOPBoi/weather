/**
 * MEGHDRISHTI — HYPERREALISTIC 3D MINIATURE EARTH & OCTANE VOLUMETRIC HERO
 * ============================================================================
 * Accurate recreation of the Hanergy Group Earth Visual & Octane Render Aesthetic:
 * - A hyperrealistic miniature earth sphere surrounded by heavy, dense swirling
 *   volumetric cumulus clouds, dramatic terrain visible through cloud breaks,
 *   ethereal atmospheric lighting, soft gradient studio background.
 * - Continuous 360-degree axial revolution with smooth physics.
 * - Interactive 360-degree mouse/touch drag-to-rotate for full inspection.
 * - Viewport mode toggle:
 *     1. "3D AXIAL GLOBE" — Real-time WebGL rotating sphere with procedural
 *        volumetric cumulus puff clusters, drifting atmospheric layers, and
 *        interactive telemetry pulses.
 *     2. "8K OCTANE CINEMATIC" — Hyperrealistic 8K Octane studio render with
 *        interactive 3D gyro/mouse parallax, convective radar hotspots, and
 *        photorealistic cloud depth.
 * - Exact Hanergy layout:
 *     - Centered top title with proper Devanagari typography ("मेघ दृष्टि प्रा ली")
 *       and white accent pill bar.
 *     - Left-aligned bold editorial headline ("Autonomous nowcasting to protect the world")
 *       and mission narrative block.
 *     - Right-aligned vertical stack of 4 circular category markers with interactive
 *       state feedback.
 *     - Navigation to the full operations dashboard (/dashboard).
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import {
  Radio,
  ArrowUpRight,
  Zap,
  Wind,
  Flame,
  Lightbulb,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { useHazards } from "./hooks/useNowcastData";
import FourActCinematicHero from "./components/FourActCinematicHero";

interface HomePageProps {
  onNavigateToDashboard: () => void;
}

interface SensorMarker {
  id: string;
  name: string;
  shortLabel: string;
  icon: React.ReactNode;
  value: string;
  unit: string;
  description: string;
  color: string;
}

export default function HomePage({ onNavigateToDashboard }: HomePageProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activeMarker, setActiveMarker] = useState<string>("radar");
  const [viewMode, setViewMode] = useState<"four-act" | "3d" | "octane">("four-act");
  const [timeUtc, setTimeUtc] = useState("");
  const [timeIst, setTimeIst] = useState("");
  const [isInteracting, setIsInteracting] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  // Live hazard counts from backend
  const hazardsHook = useHazards(0);
  const totalLiveHazards = hazardsHook.data?.features?.length ?? 4;

  // 4 Category Markers matching the exact Hanergy right-hand vertical layout
  const SENSOR_MARKERS: SensorMarker[] = [
    {
      id: "radar",
      name: "Radar Reflectivity",
      shortLabel: "dBZ Core",
      icon: <Lightbulb size={20} strokeWidth={1.8} />,
      value: "32.6",
      unit: "dBZ",
      description: "IMD Doppler radar network quantitative reflectivity decode & echo tops",
      color: "#ff8c42",
    },
    {
      id: "circulation",
      name: "Steering Circulation",
      shortLabel: "Optical Flow",
      icon: <Wind size={20} strokeWidth={1.8} />,
      value: "16.8",
      unit: "km/h ENE",
      description: "Farnebäck optical flow vector extrapolation across convective cells",
      color: "#4ecdc4",
    },
    {
      id: "lightning",
      name: "Lightning Ionization",
      shortLabel: "Blitzortung VLF",
      icon: <Zap size={20} strokeWidth={1.8} />,
      value: `${totalLiveHazards}`,
      unit: "Active Hits",
      description: "Real-time VLF lightning strike reception via telemetry stream",
      color: "#ffd166",
    },
    {
      id: "thermal",
      name: "Thermal Radiometry",
      shortLabel: "TIR-1 Cold Top",
      icon: <Flame size={20} strokeWidth={1.8} />,
      value: "234",
      unit: "K Anvil",
      description: "Sentinel-3 SLSTR & INSAT-3D thermal cloud top depression index",
      color: "#ef476f",
    },
  ];

  // Clocks
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTimeUtc(now.toUTCString().slice(17, 25) + " UTC");
      setTimeIst(
        now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour12: false,
        }) + " IST"
      );
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Parallax tracking for cinematic Octane mode
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;
      setParallaxOffset({ x: normX * 18, y: normY * 14 });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // ─── THREE.JS 3D REVOLVING HYPERREALISTIC EARTH ENGINE ───
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 1000);
    camera.position.set(0, -0.05, 10.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    // 2. Texture Loader
    const textureLoader = new THREE.TextureLoader();
    const earthMap = textureLoader.load("/earth_surface.jpg");
    earthMap.wrapS = THREE.RepeatWrapping;
    earthMap.wrapT = THREE.ClampToEdgeWrapping;

    const cloudMap = textureLoader.load("/earth_clouds.jpg");
    cloudMap.wrapS = THREE.RepeatWrapping;
    cloudMap.wrapT = THREE.ClampToEdgeWrapping;

    // ─── PROCEDURAL PHOTOREALISTIC VOLUMETRIC CUMULUS PUFF TEXTURE ───
    const createCumulusPuffTexture = () => {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext("2d")!;

      // Draw multi-layered soft overlapping cumulus lobes
      const lobes = [
        { x: 128, y: 128, r: 85, a: 0.95 },
        { x: 100, y: 110, r: 65, a: 0.88 },
        { x: 155, y: 115, r: 70, a: 0.85 },
        { x: 80, y: 145, r: 55, a: 0.78 },
        { x: 175, y: 140, r: 58, a: 0.75 },
        { x: 130, y: 85, r: 55, a: 0.92 },
        { x: 128, y: 165, r: 60, a: 0.7 },
      ];

      lobes.forEach(({ x, y, r, a }) => {
        const radGrad = ctx.createRadialGradient(x, y - r * 0.15, 0, x, y, r);
        // Bright lit crest with soft shadowed ambient base
        radGrad.addColorStop(0, `rgba(255, 255, 255, ${a})`);
        radGrad.addColorStop(0.35, `rgba(240, 245, 250, ${a * 0.85})`);
        radGrad.addColorStop(0.7, `rgba(205, 220, 235, ${a * 0.45})`);
        radGrad.addColorStop(1, "rgba(180, 200, 220, 0)");
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      return new THREE.CanvasTexture(c);
    };

    const cloudPuffTex = createCumulusPuffTexture();

    // 3. Central Earth Group (Tilted at 23.5 degrees)
    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = THREE.MathUtils.degToRad(23.5);
    // Position center-right for balanced composition with left text
    earthGroup.position.set(0.55, -0.1, 0);
    scene.add(earthGroup);

    // A. Inner Earth Globe Sphere with Specular Contrast
    const earthRadius = 2.7;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 96, 96);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthMap,
      roughness: 0.58,
      metalness: 0.08,
      bumpScale: 0.04,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // B. Inner Drifting Cloud Layer
    const innerCloudGeo = new THREE.SphereGeometry(earthRadius * 1.018, 96, 96);
    const innerCloudMat = new THREE.MeshStandardMaterial({
      map: cloudMap,
      transparent: true,
      opacity: 0.82,
      blending: THREE.NormalBlending,
      roughness: 0.9,
    });
    const innerCloudMesh = new THREE.Mesh(innerCloudGeo, innerCloudMat);
    earthGroup.add(innerCloudMesh);

    // C. Massive Volumetric Cumulus Mantle (Recreating the signature Octane cloud banks)
    const volumetricCloudGroup = new THREE.Group();
    earthGroup.add(volumetricCloudGroup);

    const cloudPuffMat = new THREE.SpriteMaterial({
      map: cloudPuffTex,
      color: 0xffffff,
      transparent: true,
      opacity: 0.88,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const puffSprites: { sprite: THREE.Sprite; baseScale: number; speed: number; phase: number }[] = [];

    // 1. Diagonal Swirling Storm Bank (The Hanergy Spiral)
    const spiralCount = 280;
    for (let i = 0; i < spiralCount; i++) {
      const t = i / spiralCount;
      const angle = t * Math.PI * 2.2;
      const r = earthRadius * (1.06 + Math.sin(t * Math.PI) * 0.18);
      // Inclined diagonal spiral across northern & southern hemispheres
      const px = Math.cos(angle) * r;
      const py = (t - 0.5) * earthRadius * 1.6 + (Math.random() - 0.5) * 0.45;
      const pz = Math.sin(angle) * r;

      const sprite = new THREE.Sprite(cloudPuffMat);
      sprite.position.set(px, py, pz);
      const baseScale = 0.52 + Math.random() * 0.42;
      sprite.scale.set(baseScale, baseScale, 1);
      volumetricCloudGroup.add(sprite);

      puffSprites.push({
        sprite,
        baseScale,
        speed: 0.0008 + Math.random() * 0.0006,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // 2. Equatorial Convective Clusters & Cloud Breaks
    const clusterCount = 140;
    for (let i = 0; i < clusterCount; i++) {
      const lat = (Math.random() - 0.5) * 1.2;
      const lon = Math.random() * Math.PI * 2;
      const r = earthRadius * (1.03 + Math.random() * 0.12);

      const px = Math.cos(lat) * Math.sin(lon) * r;
      const py = Math.sin(lat) * r;
      const pz = Math.cos(lat) * Math.cos(lon) * r;

      const sprite = new THREE.Sprite(cloudPuffMat);
      sprite.position.set(px, py, pz);
      const baseScale = 0.36 + Math.random() * 0.32;
      sprite.scale.set(baseScale, baseScale, 1);
      volumetricCloudGroup.add(sprite);

      puffSprites.push({
        sprite,
        baseScale,
        speed: 0.0005 + Math.random() * 0.0004,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // D. Soft Ethereal Atmospheric Limb Glow Shader (Octane Rayleigh scattering)
    const atmosphereVertexShader = `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const atmosphereFragmentShader = `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.2);
        gl_FragColor = vec4(0.55, 0.78, 1.0, 1.0) * intensity * 1.2;
      }
    `;

    const atmosphereGeo = new THREE.SphereGeometry(earthRadius * 1.15, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    earthGroup.add(atmosphereMesh);

    // E. Telemetry Pulse Ring (Interactive indicator matching active sensor)
    const ringGeo = new THREE.RingGeometry(earthRadius * 1.05, earthRadius * 1.07, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x4ecdc4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const pulseRing = new THREE.Mesh(ringGeo, ringMat);
    pulseRing.rotation.x = Math.PI / 2.3;
    earthGroup.add(pulseRing);

    // 4. Studio Lighting System (Matching Octane Studio Setup)
    // Ambient Cool Studio Skylight
    const ambientLight = new THREE.AmbientLight(0x384c5c, 1.4);
    scene.add(ambientLight);

    // Warm Sun Key Light from top-left (Soft shadows on cumulus puffs)
    const sunLight = new THREE.DirectionalLight(0xfff6ea, 2.6);
    sunLight.position.set(-6, 7, 7);
    scene.add(sunLight);

    // Cool Rim Light for cinematic edge definition
    const rimLight = new THREE.DirectionalLight(0x7aa5c2, 1.2);
    rimLight.position.set(7, -3, -5);
    scene.add(rimLight);

    // Soft Bottom-Up Fill
    const fillLight = new THREE.DirectionalLight(0x233745, 0.8);
    fillLight.position.set(0, -6, 4);
    scene.add(fillLight);

    // 5. Interactive 360-Degree Mouse Drag-to-Rotate + Continuous Axial Revolution
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let dragVelocityX = 0;
    let dragVelocityY = 0;

    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest("button, a, .hud-card")) return;
      isDragging = true;
      setIsInteracting(true);
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      dragVelocityX = deltaX * 0.0035;
      dragVelocityY = deltaY * 0.0035;

      earthGroup.rotation.y += dragVelocityX;
      earthGroup.rotation.x += dragVelocityY;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      setTimeout(() => setIsInteracting(false), 800);
    };

    // Touch events for mobile/tablet 360 rotation
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        setIsInteracting(true);
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;

      dragVelocityX = deltaX * 0.0035;
      dragVelocityY = deltaY * 0.0035;

      earthGroup.rotation.y += dragVelocityX;
      earthGroup.rotation.x += dragVelocityY;

      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDragging = false;
      setTimeout(() => setIsInteracting(false), 800);
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);

    // Animation Render Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Continuous constant axial revolution
      if (!isDragging) {
        earthMesh.rotation.y += 0.0018;
        innerCloudMesh.rotation.y += 0.0024; // Independent atmospheric drift
        volumetricCloudGroup.rotation.y += 0.0014;

        // Smooth inertial deceleration after release
        dragVelocityX *= 0.94;
        dragVelocityY *= 0.94;
        earthGroup.rotation.y += dragVelocityX;
        earthGroup.rotation.x += dragVelocityY;
      }

      // Subtle organic breathing animation of cumulus cloud puffs
      puffSprites.forEach((p) => {
        const scaleMod = 1 + Math.sin(elapsed * 1.5 + p.phase) * 0.06;
        p.sprite.scale.set(p.baseScale * scaleMod, p.baseScale * scaleMod, 1);
      });

      // Pulse ring oscillation
      pulseRing.rotation.z += 0.003;
      const pulseScale = 1 + Math.sin(elapsed * 2.2) * 0.03;
      pulseRing.scale.set(pulseScale, pulseScale, 1);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);

      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      earthGeo.dispose();
      innerCloudGeo.dispose();
      atmosphereGeo.dispose();
      ringGeo.dispose();
      cloudPuffTex.dispose();
    };
  }, []);

  const selectedSensor = SENSOR_MARKERS.find((s) => s.id === activeMarker) ?? SENSOR_MARKERS[0];

  if (viewMode === "four-act") {
    return (
      <FourActCinematicHero
        onNavigateToDashboard={onNavigateToDashboard}
        onSwitchToHanergy={(m) => setViewMode(m)}
      />
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        // Soft Octane studio gradient background
        background: `
          radial-gradient(circle at 55% 48%, #3a4855 0%, #25303b 40%, #151d24 75%, #0b1015 100%)
        `,
        color: "#F0F4EE",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
      }}
    >
      {/* ─── VIEW MODE: 3D WEBGL REVOLVING GLOBE ─── */}
      <div
        ref={mountRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          opacity: viewMode === "3d" ? 1 : 0,
          pointerEvents: viewMode === "3d" ? "auto" : "none",
          transition: "opacity 0.6s ease-in-out",
          cursor: isInteracting ? "grabbing" : "grab",
        }}
        title="Click and drag to rotate the Earth 360°"
      />

      {/* ─── VIEW MODE: 8K OCTANE CINEMATIC RENDER WITH 3D PARALLAX ─── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          opacity: viewMode === "octane" ? 1 : 0,
          pointerEvents: viewMode === "octane" ? "auto" : "none",
          transition: "opacity 0.6s ease-in-out",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px) scale(1.04)`,
            transition: "transform 0.15s ease-out",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="/miniature_earth.jpg"
            alt="Hyperrealistic Miniature Earth Sphere Surrounded by Heavy Volumetric Cumulus Clouds"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 48%",
              filter: "contrast(1.05) saturate(1.08)",
            }}
          />

          {/* Interactive Convective Hotspots on the Octane Earth */}
          <div
            style={{
              position: "absolute",
              top: "46%",
              left: "58%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              pointerEvents: "auto",
              cursor: "pointer",
            }}
            onClick={onNavigateToDashboard}
            title="Convective Cell Detected over Bay of Bengal / East Coast — Click to inspect"
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#ff8c42",
                boxShadow: "0 0 20px #ff8c42, 0 0 40px #ff8c42",
                animation: "pulse-radar 2s infinite",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "#ffffff",
                background: "rgba(10, 20, 28, 0.8)",
                padding: "2px 8px",
                borderRadius: 4,
                border: "1px solid rgba(255, 140, 66, 0.6)",
                whiteSpace: "nowrap",
              }}
            >
              ACTIVE CONVECTIVE CORE · 52 dBZ
            </span>
          </div>
        </div>
      </div>

      {/* Subtle Atmospheric Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 50%, transparent 40%, rgba(10, 15, 20, 0.35) 80%, rgba(10, 15, 20, 0.75) 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* ─── TOP HEADER: HANERGY COMPOSITION (PROPER DEVANAGARI + ACCENT BAR) ─── */}
      <header
        style={{
          position: "relative",
          zIndex: 10,
          height: 84,
          padding: "0 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pointerEvents: "none",
        }}
      >
        {/* Top Left: Logo / Insignia */}
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: 0.92,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 0 12px rgba(255, 255, 255, 0.2)",
            }}
          >
            <Radio size={17} strokeWidth={2.2} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "#ffffff",
                textTransform: "uppercase",
              }}
            >
              MeghDrishti 2.0
            </span>
            <span
              style={{
                fontSize: 10,
                color: "rgba(255, 255, 255, 0.65)",
                letterSpacing: "0.04em",
              }}
            >
              IMD Doppler · INSAT-3D · Blitzortung
            </span>
          </div>
        </div>

        {/* Center: EXACT Hanergy Top Header (Clean Devanagari Ligatures + White Accent Bar) */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 18,
            transform: "translateX(-50%)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.95)",
              letterSpacing: "0.08em", // Preserves Devanagari ligatures
              marginBottom: 3,
            }}
          >
            मेघ दृष्टि प्रा ली
          </div>
          <div
            style={{
              fontSize: 11.5,
              letterSpacing: "0.22em",
              color: "rgba(255, 255, 255, 0.92)",
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            MEGHDRISHTI NOWCAST OPERATIONS
          </div>
          {/* Hanergy Horizontal White Accent Pill */}
          <div
            style={{
              width: 32,
              height: 4,
              background: "#ffffff",
              borderRadius: 2,
              boxShadow: "0 0 12px rgba(255, 255, 255, 0.7)",
            }}
          />
        </div>

        {/* Top Right: Clocks, Mode Switcher & Navigation CTA */}
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* View Mode Toggle Pill */}
          <div
            style={{
              background: "rgba(15, 25, 35, 0.65)",
              border: "1px solid rgba(255, 255, 255, 0.22)",
              backdropFilter: "blur(12px)",
              borderRadius: 20,
              padding: "3px 4px",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <button
              onClick={() => setViewMode("four-act")}
              style={{
                background: "rgba(201, 154, 85, 0.25)",
                color: "#C99A55",
                border: "1px solid rgba(201, 154, 85, 0.5)",
                borderRadius: 16,
                padding: "5px 12px",
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease",
              }}
            >
              <span>4-ACT CONTINUUM</span>
            </button>
            <button
              onClick={() => setViewMode("3d")}
              style={{
                background: viewMode === "3d" ? "rgba(255, 255, 255, 0.22)" : "transparent",
                color: viewMode === "3d" ? "#ffffff" : "rgba(255, 255, 255, 0.6)",
                border: "none",
                borderRadius: 16,
                padding: "5px 12px",
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease",
              }}
            >
              <RotateCw size={12} />
              <span>3D GLOBE</span>
            </button>
            <button
              onClick={() => setViewMode("octane")}
              style={{
                background: viewMode === "octane" ? "rgba(255, 255, 255, 0.22)" : "transparent",
                color: viewMode === "octane" ? "#ffffff" : "rgba(255, 255, 255, 0.6)",
                border: "none",
                borderRadius: 16,
                padding: "5px 12px",
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease",
              }}
            >
              <Sparkles size={12} />
              <span>OCTANE 8K</span>
            </button>
          </div>

          <div
            style={{
              textAlign: "right",
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              color: "rgba(255, 255, 255, 0.75)",
              lineHeight: 1.4,
            }}
          >
            <div style={{ color: "#ffffff", fontWeight: 600 }}>{timeIst}</div>
            <div>{timeUtc}</div>
          </div>

          <button
            onClick={onNavigateToDashboard}
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.35)",
              backdropFilter: "blur(10px)",
              borderRadius: 20,
              padding: "8px 20px",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.04em",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.35)";
              e.currentTarget.style.transform = "none";
            }}
          >
            <span>LIVE OPS MAP</span>
            <ArrowUpRight size={15} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      {/* ─── MAIN OVERLAY CONTENT ─── */}
      <main
        style={{
          position: "relative",
          zIndex: 5,
          flex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 64px",
          pointerEvents: "none",
        }}
      >
        {/* ─── LEFT: EDITORIAL HEADLINE & MISSION TEXT (EXACT HANERGY LAYOUT) ─── */}
        <div
          className="hud-card"
          style={{
            maxWidth: 410,
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* Main Statement (Matching "Use clean energy to change the world") */}
          <h1
            style={{
              fontSize: 46,
              fontWeight: 300,
              lineHeight: 1.12,
              letterSpacing: "-0.025em",
              color: "#ffffff",
              margin: 0,
              textShadow: "0 2px 24px rgba(0, 0, 0, 0.6)",
            }}
          >
            Autonomous
            <br />
            nowcasting to
            <br />
            protect the world
          </h1>

          {/* Descriptive Narrative Block (Matching Hanergy Paragraph) */}
          <p
            style={{
              fontSize: 12.5,
              lineHeight: 1.68,
              color: "rgba(240, 246, 252, 0.82)",
              margin: 0,
              textAlign: "justify",
              textShadow: "0 1px 8px rgba(0, 0, 0, 0.7)",
            }}
          >
            MeghDrishti is a full-stack convective storm nowcasting platform
            engineered for Smart India Hackathon 2026. It autonomously ingests
            multi-source satellite radiometry, IMD Doppler radar reflectivity,
            and Blitzortung VLF lightning detection, fusing them into a unified
            convective raster to forecast severe hail, downbursts, and
            cloudbursts in real time across India at sub-kilometer resolution.
          </p>

          {/* Active Sensor Readout Chip */}
          <div
            style={{
              background: "rgba(15, 25, 35, 0.65)",
              border: "1px solid rgba(255, 255, 255, 0.22)",
              backdropFilter: "blur(14px)",
              borderRadius: 10,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <div>
              <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>SENSOR: </span>
              <span style={{ color: "#ffffff", fontWeight: 600 }}>
                {selectedSensor.name}
              </span>
              <div
                style={{
                  fontSize: 9.5,
                  color: "rgba(255, 255, 255, 0.5)",
                  marginTop: 2,
                }}
              >
                {selectedSensor.description}
              </div>
            </div>
            <div
              style={{
                color: selectedSensor.color,
                fontWeight: 700,
                fontSize: 13,
                textAlign: "right",
                whiteSpace: "nowrap",
                marginLeft: 12,
              }}
            >
              {selectedSensor.value} {selectedSensor.unit}
            </div>
          </div>

          {/* Action CTA Button */}
          <button
            onClick={onNavigateToDashboard}
            style={{
              background: "#ffffff",
              color: "#0a161f",
              border: "none",
              borderRadius: 24,
              padding: "12px 26px",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.02em",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.45)",
              transition: "all 0.2s ease",
              width: "fit-content",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e6f4fc";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 28px rgba(255, 255, 255, 0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 4px 24px rgba(0, 0, 0, 0.45)";
            }}
          >
            <span>LAUNCH OPERATIONS DASHBOARD</span>
            <ArrowUpRight size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* ─── RIGHT: 4 CIRCULAR CATEGORY MARKERS (EXACT HANERGY LAYOUT) ─── */}
        <div
          className="hud-card"
          style={{
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          {SENSOR_MARKERS.map((marker) => {
            const isSelected = marker.id === activeMarker;
            return (
              <div
                key={marker.id}
                onClick={() => setActiveMarker(marker.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  cursor: "pointer",
                }}
                title={`${marker.name}: ${marker.value} ${marker.unit}`}
              >
                {/* Hanergy-Style Circle Button */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    border: isSelected
                      ? `2px solid ${marker.color}`
                      : "1.5px solid rgba(255, 255, 255, 0.45)",
                    background: isSelected
                      ? "rgba(255, 255, 255, 0.28)"
                      : "rgba(255, 255, 255, 0.08)",
                    backdropFilter: "blur(10px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isSelected ? marker.color : "#ffffff",
                    boxShadow: isSelected
                      ? `0 0 20px ${marker.color}66`
                      : "none",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.85)";
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.45)";
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                    }
                  }}
                >
                  {marker.icon}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ─── BOTTOM CONTROLS & ROTATION GUIDANCE ─── */}
      <footer
        style={{
          position: "relative",
          zIndex: 10,
          height: 56,
          padding: "0 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid rgba(255, 255, 255, 0.12)",
          background: "rgba(10, 16, 22, 0.72)",
          backdropFilter: "blur(14px)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            color: "rgba(255, 255, 255, 0.82)",
          }}
        >
          <RotateCw size={14} className="spin-slow" />
          <span>
            {viewMode === "3d"
              ? "DRAG WITH MOUSE OR TOUCH FOR 360° INTERACTIVE GLOBE INSPECTION"
              : "HOVER MOUSE ACROSS VIEWPORT FOR 3D GYROSCOPIC DEPTH PARALLAX"}
          </span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span style={{ color: "#74d4ff" }}>
            {viewMode === "3d" ? "AUTO-REVOLVING ON 23.5° AXIS" : "OCTANE 8K VOLUMETRIC CUMULUS"}
          </span>
        </div>

        <div
          style={{
            pointerEvents: "auto",
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            color: "rgba(255, 255, 255, 0.65)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>ENGINE: THREE.JS WEBGL + OCTANE RENDER</span>
        </div>
      </footer>

      {/* ─── CSS HELPERS & ANIMATIONS ─── */}
      <style>{`
        .spin-slow {
          animation: spin 16s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse-radar {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(255, 140, 66, 0.7);
          }
          70% {
            transform: scale(1.15);
            box-shadow: 0 0 0 16px rgba(255, 140, 66, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(255, 140, 66, 0);
          }
        }
      `}</style>
    </div>
  );
}

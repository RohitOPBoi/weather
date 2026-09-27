# EXTREME GUI FORENSIC ANALYSIS REPORT
## System: MeghDrishti — Convective-Scale Weather & Storm Nowcasting Platform
**Repository Target:** [RohitOPBoi/weather](https://github.com/RohitOPBoi/weather)  
**Investigation Classification:** Exhaustive Frontend, Interaction, Motion & Data-Visualization Forensic Deconstruction  
**Deliverable Path:** `analysis/GUI_FORENSIC_ANALYSIS.md`  
**Analysis Date:** September 2026  
**Audience:** Principal UI/UX Architects, Lead Frontend Engineers, Geospatial Data Visualization Specialists, Scientific Software Analysts  

---

## 1. Executive Summary

### 1.1 Forensic Overview
**MeghDrishti** ("Cloud Vision" in Sanskrit) is an operational convective-scale atmospheric nowcasting application developed for the Smart India Hackathon (SIH 2026). The application addresses time-critical (0–6 hour) detection, characterization, and forecasting of violent convective phenomena across the Indian subcontinent: **thunderstorms, hail, microbursts/downbursts, lightning strikes, and cloudbursts**.

The platform is architected as a decoupled client-server system comprising:
1. A **FastAPI** scientific Python backend (`nowcast/api/main.py`) executing radar-satellite-lightning ingestion, multi-channel raster fusion, optical-flow nowcasting (pySTEPS), deep-learning nowcasting (DeepMind DGMR), heuristic meteorological hazard classification, and district-level Twilio SMS alerting.
2. A high-density **React 18 + TypeScript + MapLibre GL** frontend dashboard (`nowcast/dashboard/src/App.tsx`) coupled with an editorial marketing and capabilities landing portal (`nowcast/dashboard/src/HomePage.tsx`).

### 1.2 Core Architectural Duality
A critical forensic discovery from repository deconstruction is that the application operates in **two concurrent spatial-computational paradigms**:
- **All-India Country-Scale Operational Paradigm (Default View):** Real-time hail and lightning hazards detected across the full geographical extent of India ($68.0^\circ\text{E} - 97.5^\circ\text{E}, 6.5^\circ\text{N} - 37.0^\circ\text{N}$) at RainViewer composite resolution ($\sim 150 \times 150$ grid). Driven by live RainViewer radar mosaics (IMD radar network republished) and live Blitzortung.org VLF lightning strikes via MQTT, advected over a 0–6 hour lead time using ECMWF high-resolution steering wind vectors.
- **Convective-Scale Localized Demo Paradigm (Regional Deep Dive):** A high-resolution ($64 \times 64$ grid, $\sim 800\text{m}$ cell resolution, $\sim 50\text{km}$ bounding box) focused on one of 10 selectable Indian metropolitan centers (Pune, Delhi NCR, Mumbai, Chennai, Kolkata, Bengaluru, Hyderabad, Ahmedabad, Jaipur, Guwahati). This mode executes pySTEPS optical-flow extrapolation (calibrated $\text{mm/hr}$), DeepMind DGMR zero-shot radar prediction, full 4-hazard evaluation (including radial velocity couplets for downbursts and rain-rate thresholds for cloudbursts), and historical backtesting replay.

### 1.3 GUI Implementation Taxonomy
| Dimension | Implementation |
|---|---|
| **Frontend Framework** | React 19.2.8 / React-DOM 19.2.8 |
| **Language & Typing** | TypeScript ~6.0.2 (`strict: true`) |
| **Build & Tooling** | Vite 8.3.0, Oxlint 1.81.0, `@vitejs/plugin-react` 6.1.1 |
| **Geospatial Engine** | MapLibre GL JS 6.10.0 (Web Worker unbundled) |
| **Design System** | Pure Custom Vanilla CSS (Design Tokens, Dark Glassmorphism, Zero Tailwind) |
| **Typography** | Inter (UI sans-serif) + JetBrains Mono (Telemetry/Metrics) via Google Fonts |
| **Iconography** | Lucide React 1.47.0 + Inline Raw Hand-Coded SVG Glyphs |
| **Data Viz** | Custom SVG Non-Scaling Path Sparklines (`TrendChart.tsx`) + MapLibre GPU Layers |
| **GIS Catalog** | 23 Genuine ISRO/NRSC/MOSDAC WMS Layers + Esri Canvas Basemap |
| **State Paradigm** | Custom React Hooks (`useHazards`, `useInterval`, `useNowcastData`) with Polling Cadence |

---

## 2. Product Overview

### 2.1 Mission & Meteorological Domain
Convective storms in tropical environments (specifically the Indian monsoon and pre-monsoon thunderstorm systems known regionally as *Kalbaishakhi* or *Nor'westers*) feature rapid intensification lifecycles ($\sim 15 - 45\text{ minutes}$) that completely evade conventional numerical weather prediction (NWP) models operating on 6-to-12-hour assimilation cycles. 

MeghDrishti bridges this gap by delivering **0-to-6-hour nowcasts** combining observational telemetry:
- **Doppler Weather Radar (DWR):** Radar reflectivity ($Z$ in $\text{dBZ}$) and radial velocity ($V_r$ in $\text{m/s}$).
- **Geostationary & Polar Satellite Imagery:** Thermal Infrared (TIR-1, $10.8\,\mu\text{m}$ brightness temperature in Kelvin), Water Vapor (WV, $6.7\,\mu\text{m}$), and Mid-Wave Infrared (MWIR, $3.9\,\mu\text{m}$).
- **VLF Lightning Detection:** Strike geolocation, strike rate, and lightning cluster probability.
- **Synoptic Weather Grids:** Atmospheric temperature ($^\circ\text{C}$), relative humidity ($\%$), mean sea level pressure ($\text{hPa}$), and wind vector fields ($u, v$ in $\text{m/s}$).

### 2.2 Target Personas & Operational Roles
1. **National/State Disaster Management Authorities (NDRF / SDMA):** Require immediate district-level hazard rollups, severity counts, and automated SMS dispatch to activate field rescue and civil defense protocols.
2. **Aviation Operations & Air Traffic Control (ATC):** Require terminal aerodrome storm-arrival countdowns (ETAs), motion vectors (bearing and speed), downburst/microburst warnings, and cloudburst ceiling risks.
3. **Agricultural Extension & District Administration:** Require 0–6 hour lead-time rain-rate and hail warnings to safeguard crops, harvest operations, and rural populations.
4. **Meteorological Duty Forecasters (IMD / Regional Met Centers):** Require multi-sensor overlay capabilities, model validation toggles (pySTEPS optical flow vs. DeepMind DGMR GAN), and historical event replay.

---

## 3. Repository Architecture

### 3.1 Architectural Decomposition
```
                    +------------------------------------------------------------------+
                    |                   DATA INGESTION ENGINE                          |
                    |  +-------------------+  +-------------------+  +---------------+ |
                    |  |  RainViewer API   |  |  Blitzortung MQTT |  |  ECMWF Open   | |
                    |  | (Radar dBZ Tiles) |  | (VLF Strikes TCP) |  | Data HRES GRIB| |
                    |  +---------+---------+  +---------+---------+  +-------+-------+ |
                    |            |                      |                    |         |
                    |  +---------+----------------------+--------------------+-------+ |
                    |  |  Copernicus Sentinel-3 SLSTR / EUMETSAT MSG SEVIRI IR       | |
                    |  +--------------------------------+----------------------------+ |
                    +-----------------------------------|------------------------------+
                                                        |
                                       +----------------v-----------------+
                                       |          FUSION ENGINE           |
                                       |    Multi-Channel Raster Stack    |
                                       | [TIR1, WV, MWIR, dBZ, Lightning] |
                                       +----------------+-----------------+
                                                        |
                               +------------------------+-----------------------+
                               |                                                |
                    +----------v-----------+                        +-----------v----------+
                    | RULE-BASED DETECTORS |                        |  NOWCASTING MODELS   |
                    | - Hail (>55dBZ, <210K)|                       | - pySTEPS LK Extrap  |
                    | - Downburst (dV>25m/s)|                       | - DeepMind DGMR GAN  |
                    | - Lightning (Cat 19) |                        | - SmaAt-UNet (Scaff) |
                    | - Hazard India Rollup|                        | - Storm Motion & ETA |
                    +----------+-----------+                        +-----------+----------+
                               |                                                |
                               +------------------------+-----------------------+
                                                        |
                                       +----------------v-----------------+
                                       |      FASTAPI BACKEND (:8000)     |
                                       | Cache Engine / Background Worker |
                                       | /hazards        /weather-layers  |
                                       | /forecast       /storm-eta       |
                                       | /nowcast-frame  /wms-proxy       |
                                       | /regions        /history         |
                                       +----------------+-----------------+
                                                        | REST API (JSON / Base64 PNG)
                                                        |
                        +-------------------------------+-------------------------------+
                        |                                                               |
            +-----------v------------+                                      +-----------v------------+
            |  LANDING PAGE PORTAL   |                                      |  OPERATIONS DASHBOARD  |
            |     HomePage.tsx       |                                      |   App.tsx (:5173)      |
            | - Hero Weather HUD     |                                      | - MapLibre GL Canvas   |
            | - Pipeline Flow Map    |                                      | - 23 ISRO/MOSDAC WMS   |
            | - Capabilities Bento   |                                      | - Left & Right Rails   |
            | - Console Simulator    |                                      | - Bottom Timeline HUD  |
            | - Use Case Matrix      |                                      | - Interactive Drawers  |
            +------------------------+                                      +------------------------+
```

### 3.2 File System Topology
```text
f:\projects\test\2\
├── .env.example                          # Environment variable specifications (live API keys & flags)
├── LICENSE                               # MIT License
├── README.md                             # Technical architecture, endpoints, data sources
├── WRITEUP.md                            # SIH 2026 technical defense and limitations disclosure
├── project.md                            # Primary SIH requirements specification
├── requirements.txt                      # Python numerical/ML dependencies
├── test_backend.py                       # Automated test harness for all backend models and endpoints
├── logo.png                              # Master platform emblem
└── nowcast/
    ├── alerts/
    │   └── sms_alerts.py                 # Twilio REST API SMS dispatch with cooldown logic
    ├── api/
    │   └── main.py                       # FastAPI application, caching layers, prewarm loops, endpoints
    ├── configs/
    │   ├── districts_india.py            # Vectorized ~130 Indian district centroid database
    │   └── settings.py                   # Bounding boxes, meteorological thresholds, regional configs
    ├── dashboard/                        # Frontend application root
    │   ├── index.html                    # HTML5 entrypoint with metadata and favicon
    │   ├── package.json                  # NPM manifest (React 19, MapLibre, Lucide)
    │   ├── vite.config.ts                # Vite config (MapLibre worker bundling exclusion)
    │   ├── public/
    │   │   ├── favicon.svg               # SVG application icon
    │   │   ├── image.png                 # Landing page atmospheric backdrop
    │   │   └── logo.png                  # Platform logo asset
    │   ├── legacy/
    │   │   └── index.html                # Pre-React standalone monolithic prototype
    │   └── src/
    │       ├── main.tsx                  # Root router (path-based view switcher: '/' vs '/dashboard')
    │       ├── App.tsx                   # Command Center Dashboard Shell, state conductor, map conductor
    │       ├── HomePage.tsx              # Editorial product overview, live hazard metrics, simulated UI
    │       ├── api.ts                    # Strongly-typed fetch client and error wrapper
    │       ├── types.ts                  # Shared TypeScript interfaces matching backend models
    │       ├── index.css                 # Global CSS design system, typography, animations, variables
    │       ├── assets/
    │       │   └── logo.png              # Embedded dashboard branding
    │       ├── components/
    │       │   ├── AreaFloating.tsx      # Bounding-box spatial statistics floating inspector HUD
    │       │   ├── Banner.tsx            # Connectivity & tile error alert strip
    │       │   ├── BottomPanel.tsx       # Lead-time stepper, rain-rate sparkline, station log, replay trigger
    │       │   ├── ForecastPage.tsx      # Modal: Side-by-side pySTEPS vs DGMR model benchmarking
    │       │   ├── HazardsPage.tsx       # Modal: Tabular hazard ledger with filtering and camera fly-to
    │       │   ├── LayersDrawer.tsx      # Slide-out drawer: Model, variable, base map, and WMS controls
    │       │   ├── LeftNavigation.tsx    # Vertical icon navigation bar (Home, Layers, FCST, HZRD, Replay)
    │       │   ├── LeftSidebar.tsx       # Regional picker, pipeline health, data sources, GeoJSON export
    │       │   ├── RegionFloating.tsx    # Single-point coordinates and meteorological readout HUD
    │       │   ├── ReplayPage.tsx        # Modal: Historical event player, frame scrubber, time-series table
    │       │   ├── RightSidebar.tsx      # Active hazard telemetry, ETA countdown, storm motion, 6h forecast
    │       │   ├── TopBar.tsx            # Operational header: branding, status pill, timestamp, active city
    │       │   └── TrendChart.tsx        # Zero-dependency SVG area-line sparkline chart
    │       ├── hooks/
    │       │   ├── useInterval.ts        # Self-updating interval hook with identity-change re-execution
    │       │   └── useNowcastData.ts     # Specialized polling and data fetching hooks
    │       ├── lib/
    │       │   ├── colors.ts             # Scientific color ramps, severity palettes, interpolation math
    │       │   ├── config.ts             # Ingestion cadence synchronization constant
    │       │   └── mosdacLayers.ts       # Reverse-engineered ISRO/MOSDAC WMS service catalog
    │       └── map/
    │           ├── MapContext.ts         # React Context for MapLibre instance distribution
    │           ├── MapProvider.tsx       # MapLibre lifecycle manager, style spec, error boundaries
    │           ├── useAreaDrag.ts        # Canvas crosshair drag-box interaction hook
    │           ├── useRasterLayer.ts     # Image-source raster layer mounting and updating hook
    │           ├── useRegionClick.ts     # Map click-to-inspect coordinator
    │           └── layers/
    │               ├── AreaBox.tsx       # Spatial bounding box polygon renderer (preview & confirmed)
    │               ├── HazardLayers.tsx  # Dual-ring glowing HTML markers & station circles
    │               ├── ModelFrameLayer.tsx # pySTEPS / DGMR nowcast raster overlay
    │               ├── ReferenceLabels.tsx # Uppermost Esri geographical place labels
    │               ├── RegionBox.tsx     # Dashed coordinate inspection box
    │               ├── SensorRasterLayers.tsx # Satellite IR & Radar reflectivity image overlays
    │               ├── WeatherRasterLayers.tsx# Gridded ECMWF weather field overlays
    │               ├── WindArrows.tsx    # HTML5 canvas SDF arrow symbol layer
    │               ├── WmsBaseLayer.tsx  # ISRO Bhuvan/MOSDAC base map switcher
    │               └── WmsOverlayLayers.tsx # ISRO 16-layer thematic GIS overlays
    ├── ingestion/                        # Python multi-source telemetry acquisition
    ├── models/                           # Meteorological inference, optical flow, GANs, heuristics
    └── processing/                       # Coordinate transforms, fusion arrays, backtests, trajectories
```

---

## 4. Complete Page Inventory

### Page 1: Public Portal / Landing Page (`HomePage.tsx`)
- **Route:** `/` (controlled via `window.location.pathname` in `main.tsx`)
- **Visual Style:** Editorial, cinematic dark-mode website with high contrast, glassmorphism, glowing cyan/amber accents, and atmospheric storm photography (`/image.png`).
- **Primary Objective:** Communicate product legitimacy, technological credibility (SIH 2026), architectural capabilities, and real-time national hazard readiness to executives, judges, and citizens.
- **Key Sections:**
  1. Sticky Glass Navigation Header with live status badge and "Launch Dashboard" action.
  2. Full-bleed Hero section with India Weather Intelligence badge, dual-tone typography, CTA buttons, and interactive Live Weather Intelligence telemetry card.
  3. Four-metric Platform Statistics Strip (Real-time data, 0-6h horizon, 4 hazard types, near real-time updates).
  4. Core Capabilities Bento Grid (Live Observations, 0-6h Nowcasting, Storm Detection).
  5. Four-Stage Pipeline Visualizer (Observe $\rightarrow$ Analyze $\rightarrow$ Forecast $\rightarrow$ Alert).
  6. Operational Console Preview Simulator (Stylized desktop preview with simulated radar rings and hazard pins).
  7. Multi-Sector Use Case Grid (Disaster Management, Aviation, Agriculture, Infrastructure, Emergency Response).
  8. Call-To-Action Conversion Strip with ambient radial gradient.
  9. Platform Footer with metadata, legal notes, and quick navigation.

### Page 2: Operational Command Center Dashboard (`App.tsx`)
- **Route:** `/dashboard` or `/dashboard/`
- **Visual Style:** Military/geospatial operations console with maximum information density, dark glass surfaces (`rgba(13, 18, 28, 0.95)`), monospace numeric telemetry, and interactive MapLibre GIS canvas.
- **Primary Objective:** Provide duty meteorologists, emergency dispatchers, and aviation coordinators with real-time situational awareness, multi-layer hazard correlation, and temporal storm extrapolation.
- **Layout Architecture:**
  - **Leftmost:** Vertical Icon Navigation Rail (`LeftNavigation.tsx`, $60\text{px}$).
  - **Top:** Global Status Bar (`TopBar.tsx`, $52\text{px}$).
  - **Left Rail:** Operations Control Sidebar (`LeftSidebar.tsx`, $320\text{px}$).
  - **Center:** Full-bleed Interactive Geospatial Viewport (`MapCanvas` + floating overlays).
  - **Right Rail:** Tactical Hazard & Motion Telemetry HUD (`RightSidebar.tsx`, $320\text{px}$).
  - **Bottom:** Lead-Time Scrubber & Forecast Trend Panel (`BottomPanel.tsx`, $180\text{px}$).

### Page 3: Hazards Ledger Workspace (`HazardsPage.tsx`)
- **Route:** Accessible via `LeftNavigation` (Zap Icon) or keyboard shortcut.
- **Presentation:** Full-viewport modal sheet overlaying the active dashboard.
- **Primary Objective:** High-throughput tabular auditing of all detected convective events across India.
- **Components:**
  - Header with total active hazard counter and close button.
  - Filter pill row (All, Hail, Lightning) with live category counts.
  - Tabular Ledger: Hazard Type (with color indicator), Severity Badge (Low/Moderate/High), Location / District centroid, Primary Metric (reflectivity $\text{dBZ}$ or velocity $\text{m/s}$), ETA countdown, and detection timestamp.
  - Interactive camera fly-to: Clicking any table row dismisses the modal, centers the MapLibre camera on the hazard coordinates ($[lon, lat]$), and opens the point inspection card.

### Page 4: Model Benchmarking Workspace (`ForecastPage.tsx`)
- **Route:** Accessible via `LeftNavigation` (CloudRain Icon).
- **Presentation:** Full-viewport split-screen comparative workbench modal.
- **Primary Objective:** Scientific comparison between the operational optical-flow baseline (pySTEPS) and the deep generative nowcasting model (DeepMind DGMR).
- **Components:**
  - Side-by-side dual column comparison: Left column pySTEPS ($0-6\text{h}$ calibrated $\text{mm/hr}$), Right column DeepMind DGMR ($0-90\text{min}$ unitless relative intensity).
  - Interactive SVG trend sparklines showing precipitation evolution over time.
  - Independent lead-time range scrubbers per model.
  - Colormapped forecast frame previewer: Turbo colormap for pySTEPS; Plasma colormap for DGMR.

### Page 5: Historical Event Replay Console (`ReplayPage.tsx`)
- **Route:** Accessible via `LeftNavigation` (Play Icon) or Bottom Panel Replay launcher.
- **Presentation:** Full-viewport historical forensic player modal.
- **Primary Objective:** Step through real, persisted past ingestion snapshots (e.g., Delhi Extreme Downpour ERA5 historical event) to analyze convective initiation and decay.
- **Components:**
  - Historical snapshot counter and ISO-8601 timestamp parser.
  - Play/Pause automated playback engine ($1.2\text{s}$ interval).
  - Scrubbable historical timeline slider.
  - Dynamic hazard category counters for the active snapshot.
  - Complete tabular hazard manifest for the frozen historical timestamp.

### Page 6: GIS Layer Management Drawer (`LayersDrawer.tsx`)
- **Route:** Accessible via `LeftNavigation` (Layers Icon).
- **Presentation:** Left-docked sliding drawer panel ($300\text{px}$ width) overlaying the map area.
- **Primary Objective:** Fine-grained orchestration of nowcasting model selection, weather variables, ISRO base maps, and thematic GIS overlays.
- **Components:**
  - Nowcast model selector: Segmented button group (pySTEPS, DGMR, SmaAt-UNet).
  - Weather variable matrix: Segmented 3-column grid (None, Temp, Humidity, Wind, Pressure, Rainfall, Risk Index) with dynamic color bar.
  - Base map dropdown: Selector for 7 authentic ISRO/MOSDAC base maps (Bhuvan, DEM, OSM, LULC, etc.).
  - Thematic GIS Overlay Checklist: Scrollable selector for 16 MOSDAC CloudBurst DSS layers (Basins, Landslides, Rivers, Roads, Railways, Population).

### Page 7: Point-Sampling Floating Inspector HUD (`RegionFloating.tsx`)
- **Route:** Spatial trigger (User left-clicks anywhere on the MapLibre canvas).
- **Presentation:** Compact floating card anchored to the bottom-right viewport ($260\text{px}$ width, $z\text{-index}: 6$).
- **Primary Objective:** Provide instant localized atmospheric soundings and localized future trends at the clicked coordinate.
- **Telemetry Readouts:** Precision Lat/Lon coordinates, Temperature ($^\circ\text{C}$), Relative Humidity ($\%$), Wind Speed & Compass Direction ($\text{m/s} + \text{Compass}$), Atmospheric Pressure ($\text{hPa}$), Cloudburst Rain Rate ($\text{mm/hr}$), and Future Time Scale range slider ($0-6\text{h}$ in $30\text{min}$ steps).

### Page 8: Bounding-Box Area-Sampling Floating Inspector HUD (`AreaFloating.tsx`)
- **Route:** Spatial trigger (User activates "Select area" mode and click-drags a rectangle).
- **Presentation:** Multi-metric analytical floating card anchored to bottom-right viewport ($z\text{-index}: 6$).
- **Primary Objective:** Aggregate spatial statistics (min, mean, max) across a user-defined geographical bounding box.
- **Telemetry Readouts:** Bounding box coordinate extents, calculated physical area dimensions ($\text{width} \times \text{height}$ in kilometers), Variable map coloring selector (None, Temp, Humidity, Wind, Pressure), Min-Mean-Max statistical rows, Active hazard count inside the box, and Future time scale slider.

### Page 9: Legacy Operational Console (`legacy/index.html`)
- **Route:** Static file in repository (`nowcast/dashboard/legacy/index.html`).
- **Visual Style:** Monolithic single-file HTML/CSS/JS interface with MapLibre GL 3.x, floating absolute cards, dark navy surface.
- **Significance:** Represents the evolutionary foundation of MeghDrishti prior to the React 18 / TypeScript refactoring. Contains early implementations of storm-cell list cards, threshold dials, and leaflet-style layer controls.

---

## 5. Complete Component Inventory

Below is the exhaustive, granular forensic breakdown of every visible and functional component in the application.

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 1: Root View Router & Viewport Conductor                                                                                 |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Root View Router & Conductor
PURPOSE: Manages client-side routing between the Landing Portal (HomePage) and the Operations Console (App), enforcing body scroll states.
LOCATION: Root DOM node (#root)
PAGE: Global / Application Shell
VISUAL STRUCTURE: Top-level wrapper managing dynamic mounting of <HomePage> vs <App>.
INPUTS: Browser window.location.pathname, popstate events, programmatic navigation callbacks.
OUTPUTS: Rendered JSX tree, dynamic body class manipulation ('dashboard-view' vs 'home-view').
INTERACTIONS: Intercepts popstate (browser back/forward navigation) and exposes onNavigateToDashboard.
ANIMATION: Instantaneous view replacement; body overflow toggle locks dashboard view.
DATA SOURCE: Browser history API.
STATE CHANGES: view ('home' | 'dashboard').
RESPONSIVE BEHAVIOR: Preserves route integrity across mobile and desktop.
DEPENDENCIES: React (useState, useEffect, StrictMode), react-dom/client.
IMPLEMENTATION FILE: nowcast/dashboard/src/main.tsx (Lines 7-49)
REUSABILITY: Singleton application router.
IMPORTANCE: Critical architectural entry point.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 2: Landing Navigation Header                                                                                             |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Landing Navigation Bar (hp-nav-wrap)
PURPOSE: Brand presentation, top-level landing page section navigation, live system health visibility, and dashboard conversion CTA.
LOCATION: Top fixed position of landing view (y: 0, x: 0, w: 100vw, h: 78px)
PAGE: HomePage.tsx
VISUAL STRUCTURE: Fixed glassmorphic container (backdrop-filter: blur(18px), bg: rgba(5,11,26,0.82), border-bottom: 1px solid rgba(34,211,238,0.15)).
  - Left: Brand icon (IconCloudLightning in blue gradient box) + Brand text ("Megh" in white, "Drishti" in cyan).
  - Center: Nav link list (Home, Capabilities, How It Works, Technology, About).
  - Right: System Status Live Pill (green pulsing dot) + "Launch Dashboard" gradient CTA button + Mobile hamburger toggle.
INPUTS: onNavigateToDashboard callback, active section state.
OUTPUTS: Smooth scroll to document element IDs ('hp-capabilities', 'hp-pipeline'), view transition trigger.
INTERACTIONS: Hover color shifts on links, button click triggers onNavigateToDashboard, hamburger toggles mobile dropdown.
ANIMATION: Pulsing live indicator dot (hp-pulse-dot, 2s infinite); mobile menu dropdown collapse/expand.
DATA SOURCE: Static props + isLive system flag.
STATE CHANGES: mobileOpen (boolean).
RESPONSIVE BEHAVIOR: At <=1024px, center links and live pill hide; hamburger appears. Mobile menu renders vertical link list.
DEPENDENCIES: Inline SVG icons (IconCloudLightning, IconArrow), CSS string in HomePage.tsx.
IMPLEMENTATION FILE: nowcast/dashboard/src/HomePage.tsx (Lines 132-203, CSS Lines 632-734)
REUSABILITY: Specialized landing header.
IMPORTANCE: Primary conversion and brand asset.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 3: Landing Hero Section                                                                                                  |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Hero Atmospheric Section (hp-hero)
PURPOSE: Deliver striking high-impact visual first impression, declare national weather intelligence capability, provide entry CTAs.
LOCATION: Viewport center, landing page
PAGE: HomePage.tsx
VISUAL STRUCTURE: 2-column CSS Grid (1fr 1fr) with absolute image backdrop (`/image.png`).
  - Left: Platform badge ("INDIA'S WEATHER INTELLIGENCE PLATFORM"), H1 title ("See Severe Weather Before It Strikes."), Subtitle, CTA Row, Feature list.
  - Right: Live Weather Intelligence Floating Card + Precipitation Intensity Scale Legend.
  - Bottom: Platform Statistics Strip + Animated Scroll Hint.
INPUTS: Live hazard counts derived from useHazards(0).
OUTPUTS: Navigation to dashboard, smooth scroll down.
INTERACTIONS: Primary CTA "Get Started" launches dashboard; Secondary CTA "Explore" scrolls to capabilities; Scroll mouse button scrolls down.
ANIMATION: hp-card-reveal (translateY(26px) -> translateY(0), opacity: 0 -> 1, 0.85s cubic-bezier(.2,.6,.4,1)); hp-scroll-bounce (7px translation, 2.2s infinite).
DATA SOURCE: /hazards API via useHazards(0) hook.
STATE CHANGES: revealed (boolean, set 60ms after mount).
RESPONSIVE BEHAVIOR: Collapses from 2-column grid to 1-column stack at <=1024px; text downscales via clamp(46px, 5.5vw, 78px).
DEPENDENCIES: /image.png, useHazards, inline SVG icons.
IMPLEMENTATION FILE: nowcast/dashboard/src/HomePage.tsx (Lines 208-384, CSS Lines 736-1012)
REUSABILITY: Landing hero module.
IMPORTANCE: Visual centerpiece of user acquisition.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 4: Hero Live Weather Intelligence Card                                                                                   |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Live Intelligence HUD Card (hp-live-card)
PURPOSE: Present live national hazard counts (hail & lightning zones) and forecast horizons directly on the landing page hero.
LOCATION: Right column of landing hero
PAGE: HomePage.tsx
VISUAL STRUCTURE: Floating dark glass card (bg: rgba(10,25,50,0.62), blur: 14px, border: 1px solid rgba(34,211,238,0.3), w: 280px).
  - Head: "LIVE WEATHER INTELLIGENCE" title + LIVE pill badge.
  - Tile Grid: Hail Zone Tile (Purple icon, zone count) + Lightning Zone Tile (Amber icon, zone count).
  - Divider.
  - Horizon Row: Forecast Horizon value ("0 – 6 Hours").
INPUTS: Derived hailZones and lightZones from useHazards(0).
OUTPUTS: Readout of real-time active storm threat count across India.
INTERACTIONS: Purely informational display.
ANIMATION: Staggered entrance animation (hp-card-reveal, 1.1s duration, 0.25s delay).
DATA SOURCE: useHazards(0) hook -> countHazardType(data, "hail" | "lightning"). Fallback: 16 hail, 4 lightning.
STATE CHANGES: Re-renders when useHazards data refreshes (30s polling).
RESPONSIVE BEHAVIOR: At <=1024px, aligns left and expands to max-width: 380px.
DEPENDENCIES: useHazards, IconCloudHail, IconLightning, IconClock.
IMPLEMENTATION FILE: nowcast/dashboard/src/HomePage.tsx (Lines 281-320, CSS Lines 879-933)
REUSABILITY: Highly reusable telemetry widget.
IMPORTANCE: Establishes instant live-data authenticity.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 5: Precipitation Intensity Scale Legend                                                                                  |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Color Legend Bar (hp-legend)
PURPOSE: Educate the user on the radar reflectivity / precipitation intensity color encoding spectrum.
LOCATION: Below hp-live-card on landing hero
PAGE: HomePage.tsx
VISUAL STRUCTURE: Horizontal layout with "Light" text label, continuous CSS linear gradient bar (min-width: 140px, height: 8px, border-radius: 4px), and "Severe" text label.
  - Color stops: #3B82F6 (0%), #22D3EE (18%), #22C55E (36%), #FBBF24 (54%), #F97316 (72%), #EF4444 (88%), #A855F7 (100%).
INPUTS: None (static visual encoding key).
OUTPUTS: Visual key for radar and precipitation layers.
INTERACTIONS: Static display.
ANIMATION: Entrances with hp-card-reveal (0.4s delay).
DATA SOURCE: Hardcoded meteorological color spectrum.
STATE CHANGES: None.
RESPONSIVE BEHAVIOR: Fluid width adaptation within flex container.
DEPENDENCIES: Pure CSS.
IMPLEMENTATION FILE: nowcast/dashboard/src/HomePage.tsx (Lines 322-327, CSS Lines 935-946)
REUSABILITY: Universal radar legend.
IMPORTANCE: High scientific readability value.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 6: Platform Statistics Strip                                                                                             |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Stat Strip (hp-stat-strip)
PURPOSE: Display core technical capabilities and pipeline attributes in a structured horizontal row.
LOCATION: Bottom of landing hero section
PAGE: HomePage.tsx
VISUAL STRUCTURE: 4-column CSS grid (padding: 0 80px 48px, gap: 12px).
  - Cards: REAL-TIME DATA (Radar+Sat+Lightning), FORECAST WINDOW (0-6 Hours), HAZARD TYPES (Hail/Lightning/Rain/Storms), UPDATE INTERVAL (Near Real-Time).
  - Card anatomy: Left icon box, middle title/value text stack, top-right pulsing green dot.
INPUTS: Static metadata objects.
OUTPUTS: Key platform capabilities declaration.
INTERACTIONS: Hover shifts border color to rgba(34,211,238,0.45) with box-shadow glow.
ANIMATION: Green dot pulses (hp-pulse-dot, 2s infinite); card hover transition (0.25s).
DATA SOURCE: Static platform metrics.
STATE CHANGES: None.
RESPONSIVE BEHAVIOR: Collapses to 2x2 grid at <=1024px; collapses to 1-column stack at <=640px.
DEPENDENCIES: IconRadar, IconClock, IconWarn, IconRefresh.
IMPLEMENTATION FILE: nowcast/dashboard/src/HomePage.tsx (Lines 330-366, CSS Lines 949-986)
REUSABILITY: Static data callout strip.
IMPORTANCE: Establishes system specifications at a glance.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 7: Capabilities Bento Grid                                                                                               |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Capabilities Section (hp-capabilities)
PURPOSE: Detail the three foundational functional pillars of the MeghDrishti engine.
LOCATION: First section below hero
PAGE: HomePage.tsx
VISUAL STRUCTURE: Section header with eyebrow ("CAPABILITIES"), H2, subtitle, and a 3-card auto-fit grid (minmax(300px, 1fr)).
  - Card 1 (Cyan): Live Weather Observations (Multi-source fusion).
  - Card 2 (Violet): 0–6 Hour Short-Term Forecasting (pySTEPS & DGMR).
  - Card 3 (Amber): Storm Detection & Alerting (Automated hail/lightning/downburst/cloudburst detection).
INPUTS: Static pillar definitions.
OUTPUTS: In-depth capability explanations.
INTERACTIONS: Card hover triggers border glow and subtle box-shadow lift.
ANIMATION: CSS transition on border-color and box-shadow (0.25s).
DATA SOURCE: Static architectural write-up.
STATE CHANGES: None.
RESPONSIVE BEHAVIOR: Wraps naturally from 3 columns to 2 to 1 based on viewport width.
DEPENDENCIES: IconRadar, IconClock, IconLightning.
IMPLEMENTATION FILE: nowcast/dashboard/src/HomePage.tsx (Lines 389-430, CSS Lines 1033-1058)
REUSABILITY: Marketing feature grid.
IMPORTANCE: Core value proposition communication.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 8: Pipeline Architecture Visualizer                                                                                      |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Pipeline Section (hp-pipeline)
PURPOSE: Demystify the meteorological pipeline as a 4-step sequence from raw sensor ingestion to civil alert delivery.
LOCATION: Second section below hero (hp-section--alt)
PAGE: HomePage.tsx
VISUAL STRUCTURE: Horizontal flow of 4 nodes connected by glowing gradient connector lines with arrowheads.
  - Node 01 (Cyan #22D3EE): OBSERVE (Radar + Satellite + Lightning)
  - Node 02 (Blue #3B82F6): ANALYZE (Atmospheric and convective patterns)
  - Node 03 (Purple #8B5CF6): FORECAST (0–6 hour nowcasting)
  - Node 04 (Amber #FBBF24): ALERT (Actionable hazard intelligence)
INPUTS: Static pipeline node definitions.
OUTPUTS: Workflow mental model.
INTERACTIONS: Visual inspection.
ANIMATION: Node boxes feature permanent box-shadow glow matching stage color (`0 0 18px ${color}30`).
DATA SOURCE: Static architectural specification.
STATE CHANGES: None.
RESPONSIVE BEHAVIOR: At <=640px, flex direction switches to column; connector lines and arrows are hidden.
DEPENDENCIES: Custom CSS flex layout.
IMPLEMENTATION FILE: nowcast/dashboard/src/HomePage.tsx (Lines 435-462, CSS Lines 1060-1080)
REUSABILITY: Horizontal pipeline visualizer.
IMPORTANCE: Educates users on data provenance and processing hierarchy.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 9: Platform Preview Console Mockup                                                                                       |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Dashboard Preview Chrome (hp-dash-preview)
PURPOSE: Provide a non-interactive stylized visual teaser of the operational dashboard interface directly on the landing page.
LOCATION: Third section below hero
PAGE: HomePage.tsx
VISUAL STRUCTURE: Mock desktop application chrome container (h: 360px, bg: #060910, border: 1px solid rgba(34,55,90,0.5)).
  - Topbar: Brandmark, MeghDrishti Nowcasting Engine title, LIVE badge.
  - Body: Left Nav simulation (MAP, FCST, HZRD, RPLY pills); Map Area (Dark grid background, SVG India polygon, concentric radar rings, colored hazard dots); Right Rail (Mock hazard cards: Hail, Lightning, Rain).
  - Bottom: CTA button ("Open Live Dashboard").
INPUTS: None (pure vector/CSS simulation).
OUTPUTS: Visual anticipation of operational dashboard.
INTERACTIONS: "Open Live Dashboard" triggers onNavigateToDashboard.
ANIMATION: Static vector simulation with glowing border gradient.
DATA SOURCE: Hardcoded SVG vector coordinates and mock cards.
STATE CHANGES: None.
RESPONSIVE BEHAVIOR: Chrome scales horizontally; map rings center dynamically.
DEPENDENCIES: Inline SVG India map polygon.
IMPLEMENTATION FILE: nowcast/dashboard/src/HomePage.tsx (Lines 467-539, CSS Lines 1082-1144)
REUSABILITY: Specialized landing illustration.
IMPORTANCE: Previews operational software without launching WebGL context.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 10: Multi-Sector Use Case Matrix                                                                                        |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Use Cases Grid (hp-use-grid)
PURPOSE: Detail industry-specific operational applications of the nowcast data.
LOCATION: Fourth section below hero (hp-section--alt)
PAGE: HomePage.tsx
VISUAL STRUCTURE: 5-card responsive grid (minmax(180px, 1fr)) featuring emoji icons, title, and operational description.
  - Sectors: Disaster Management (🛡️), Aviation (✈️), Agriculture (🌾), Infrastructure (🏗️), Emergency Response (🚨).
INPUTS: Static use case definitions.
OUTPUTS: Operational context.
INTERACTIONS: Hover lifts card (translateY(-2px)) and illuminates cyan border.
ANIMATION: Smooth 0.22s transform transition.
DATA SOURCE: Static use cases.
STATE CHANGES: None.
RESPONSIVE BEHAVIOR: Auto-fit grid flows from 5 columns to 2 to 1 depending on screen width.
DEPENDENCIES: Pure CSS.
IMPLEMENTATION FILE: nowcast/dashboard/src/HomePage.tsx (Lines 544-564, CSS Lines 1146-1160)
REUSABILITY: Sector grid widget.
IMPORTANCE: Connects technical data to real-world economic/safety impact.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 11: Landing Final Call-to-Action                                                                                         |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Final CTA Section (hp-cta-section)
PURPOSE: Secondary conversion trigger at the bottom of the landing scroll.
LOCATION: Bottom of landing page, above footer
PAGE: HomePage.tsx
VISUAL STRUCTURE: Centered layout with radial gradient glow backdrop, eyebrow ("GET STARTED"), H2 ("Monitor the Next Storm."), subtitle, and large primary button ("Launch MeghDrishti").
INPUTS: onNavigateToDashboard.
OUTPUTS: Navigation trigger to `/dashboard`.
INTERACTIONS: Button hover illuminates glow and lifts.
ANIMATION: Radial gradient ambient glow (`radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.07), transparent 60%)`).
DATA SOURCE: None.
STATE CHANGES: None.
RESPONSIVE BEHAVIOR: Text centered across all screen widths.
DEPENDENCIES: IconArrow.
IMPLEMENTATION FILE: nowcast/dashboard/src/HomePage.tsx (Lines 569-582, CSS Lines 1163-1173)
REUSABILITY: Landing conversion block.
IMPORTANCE: End-of-page conversion capture.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 12: Landing Global Footer                                                                                                |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Landing Footer (hp-footer)
PURPOSE: Brand assertion, secondary navigation, copyright, and SIH acknowledgement.
LOCATION: Absolute bottom of landing page
PAGE: HomePage.tsx
VISUAL STRUCTURE: 3-tier layout:
  - Top: Brand icon, MeghDrishti name, and subtitle.
  - Middle: Link array (Home, Capabilities, Technology, Dashboard, About).
  - Bottom: Copyright row + "Built for Smart India Hackathon 2026" accreditation in cyan.
INPUTS: onNavigateToDashboard callback.
OUTPUTS: Smooth scroll or dashboard navigation.
INTERACTIONS: "Dashboard" link triggers onNavigateToDashboard; other links prevent default.
ANIMATION: Text hover color shift to cyan (0.2s).
DATA SOURCE: Static text.
STATE CHANGES: None.
RESPONSIVE BEHAVIOR: Flex items wrap cleanly on mobile screens.
DEPENDENCIES: IconCloudLightning.
IMPLEMENTATION FILE: nowcast/dashboard/src/HomePage.tsx (Lines 587-609, CSS Lines 1175-1190)
REUSABILITY: Standard website footer.
IMPORTANCE: Legal, brand, and competition compliance.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 13: Dashboard App Shell & State Conductor                                                                                |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Operational Dashboard Shell (app-shell)
PURPOSE: Central nervous system of the operations console; coordinates global state, API polling, layer toggles, and UI panels.
LOCATION: Root container of /dashboard route (w: 100vw, h: 100vh)
PAGE: App.tsx (Dashboard component)
VISUAL STRUCTURE: Full-screen flex container hosting LeftNavigation, TopBar, Main Body (Left Sidebar, Map Canvas, Right Sidebar), and BottomPanel.
INPUTS: All custom hooks (useHazards, useStormEta, useRawLayers, useForecastSummary, useNowcastFrame, useWeatherLayers, useWindVectors).
OUTPUTS: Synchronized GIS map and operational telemetry dashboards.
INTERACTIONS: Handles global lead time scrubbing, model switching, area drag selection, point click inspection, overlay toggling.
ANIMATION: Global layout transitions; auto-play timer ticks leadMinutes forward every 1s.
DATA SOURCE: FastAPI backend endpoints via api client.
STATE CHANGES: leadMinutes, model, satelliteVisible, radarVisible, heatmapsVisible, lightningVisible, modelFrameVisible, activeVar, baseMapId, activeOverlayIds, region, area, activePanel, isPlaying, apiUnreachable.
RESPONSIVE BEHAVIOR: Fixed-viewport desktop architecture; overflow locked.
DEPENDENCIES: All map and component modules.
IMPLEMENTATION FILE: nowcast/dashboard/src/App.tsx (Lines 47-454)
REUSABILITY: Application singleton container.
IMPORTANCE: The core application engine.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 14: TopBar Operational Header                                                                                            |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Global Top Bar (topbar)
PURPOSE: Display system branding, SIH competition badge, backend connectivity health, data fresh timestamp, and active city chip.
LOCATION: Top of dashboard view (h: 52px, z-index: 20)
PAGE: App.tsx -> TopBar.tsx
VISUAL STRUCTURE: Horizontal bar (bg: var(--panel), border-bottom: 1px solid var(--panel-border), padding: 0 20px).
  - Left: Logo mark (`logo.png`), Title ("MeghDrishti"), Badge ("SIH 2026"), Subtitle.
  - Center: Live Status Badge (pulsing dot, "Live" / "Offline"), Last Updated timestamp string.
  - Right: Location chip (MapPin icon + "Pune, Maharashtra").
INPUTS: apiOk (boolean), lastUpdated (Date | null).
OUTPUTS: Operational health telemetry.
INTERACTIONS: Static display.
ANIMATION: Pulsing live indicator (pulse, 2s infinite, green on apiOk, red on failure).
DATA SOURCE: App state derived from hazards fetch success/error.
STATE CHANGES: Reflects backend connectivity status dynamically.
RESPONSIVE BEHAVIOR: Flex space-between layout.
DEPENDENCIES: MapPin icon, logo.png.
IMPLEMENTATION FILE: nowcast/dashboard/src/components/TopBar.tsx (Lines 1-35, CSS index.css Lines 126-174)
REUSABILITY: Header bar.
IMPORTANCE: Constant operational situational awareness.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 15: LeftNavigation Icon Sidebar                                                                                          |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Left Navigation Rail (left-nav)
PURPOSE: Provide primary mode switching between map-centric dashboard, layer drawer, and modal workspaces (Hazards, Forecast, Replay).
LOCATION: Leftmost column of dashboard (w: 60px, h: 100vh, z-index: 30)
PAGE: App.tsx -> LeftNavigation.tsx
VISUAL STRUCTURE: Vertical dark rail (bg: var(--panel), border-right: 1px solid var(--panel-border), padding: 20px 0).
  - Navigation Buttons: Home (House icon), Layers (Layers icon), Forecast (CloudRain icon), Hazards (Zap icon), Replay (Play icon).
  - Bottom: Settings icon (disabled, opacity: 0.35, "Not implemented yet").
INPUTS: active (ActivePanel: "none" | "layers" | "hazards" | "forecast" | "replay"), onSelect callback.
OUTPUTS: Panel state mutations in App.tsx.
INTERACTIONS: Clicking an active panel closes it ("none"); clicking another panel toggles it open.
ANIMATION: Hover color shift to cyan with background highlight (`rgba(63, 182, 255, 0.1)`).
DATA SOURCE: App UI state.
STATE CHANGES: activePanel.
RESPONSIVE BEHAVIOR: Fixed width 60px across all desktop screens.
DEPENDENCIES: Lucide React icons (Home, Layers, CloudRain, Zap, Play, Settings).
IMPLEMENTATION FILE: nowcast/dashboard/src/components/LeftNavigation.tsx (Lines 1-40, CSS index.css Lines 79-115)
REUSABILITY: Primary icon navigation rail.
IMPORTANCE: Gateway to all non-map operational workspaces.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 16: LeftSidebar Operational Controls & Region Picker                                                                     |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Operational Left Sidebar (sidebar left)
PURPOSE: Region switching (10 Indian cities), pipeline subsystem status, active national hazard tallies, model parameters, and GeoJSON export.
LOCATION: Left rail of dashboard, right of LeftNavigation (w: 320px, z-index: 10)
PAGE: App.tsx -> LeftSidebar.tsx
VISUAL STRUCTURE: Scrollable glass column (bg: var(--panel-glass), blur: 12px, border-right: 1px solid var(--panel-border)).
  - Section 1: Demo Region Picker dropdown (Pune, Delhi NCR, Mumbai, Chennai, Kolkata, Bengaluru, Hyderabad, Ahmedabad, Jaipur, Guwahati).
  - Section 2: Pipeline Status (Backend API Live/Unreachable, last update time).
  - Section 3: Data Sources status (Doppler Radar IMD, INSAT-3D/3DR Satellite, Lightning IMD feed).
  - Section 4: Active Hazards count (Hail zones, Lightning zones).
  - Section 5: Model Info grid (Model name, Resolution 1-3km, Horizon 0-90m/0-6h, Update interval 15m).
  - Section 6: Quick Tools button ("Export Hazards (GeoJSON)").
INPUTS: hazards (HazardsResponse), model (ModelId), apiOk (boolean), lastUpdated (Date).
OUTPUTS: Region switch POST request (`/regions/{key}`), GeoJSON file download.
INTERACTIONS: Region dropdown selection initiates backend re-ingest and reloads window; Export button creates dynamic Blob download.
ANIMATION: Switching indicator text appears during region migration.
DATA SOURCE: /regions API, hazards props.
STATE CHANGES: switching (boolean), regions response.
RESPONSIVE BEHAVIOR: Scrollable vertically if viewport height is constrained.
DEPENDENCIES: Activity, Download, MapPin icons, api client.
IMPLEMENTATION FILE: nowcast/dashboard/src/components/LeftSidebar.tsx (Lines 1-191, CSS index.css Lines 184-195)
REUSABILITY: Context sidebar.
IMPORTANCE: Primary control center for regional scoping and data auditing.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 17: RightSidebar Tactical Hazard & Motion Telemetry HUD                                                                  |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Tactical Telemetry Right Sidebar (sidebar right)
PURPOSE: Display primary storm cell motion vectors (bearing, speed, distance), individual hazard telemetry cards, and 6-hour forecast risk buckets.
LOCATION: Right rail of dashboard (w: 320px, z-index: 10)
PAGE: App.tsx -> RightSidebar.tsx
VISUAL STRUCTURE: Scrollable glass column (bg: var(--panel-glass), blur: 12px, border-left: 1px solid var(--panel-border)).
  - Section 1: Active Hazards List (Hail card with dBZ, Downburst card with velocity delta, Cloudburst card with rain rate, Lightning card with severity).
  - Primary Storm Motion Card: Bearing compass (e.g. ENE), speed (km/h), distance away (km), motion source.
  - Section 2: Next 6 Hours severity buckets (0-1h, 1-2h, 2-4h, 4-6h) colored by severity (Low green, Moderate yellow, High red).
INPUTS: stormCells (StormCell[] | null), forecast (ForecastSummary | null).
OUTPUTS: Tactical ETA and hazard metrics.
INTERACTIONS: Pure telemetry readout.
ANIMATION: CSS colored left-border callouts (`var(--hail)`, `var(--downburst)`, etc.).
DATA SOURCE: /storm-eta API, /forecast API.
STATE CHANGES: Re-renders when stormCells or forecast changes.
RESPONSIVE BEHAVIOR: Fixed 320px width, scrollable vertically.
DEPENDENCIES: windCompass helper from lib/colors.ts.
IMPLEMENTATION FILE: nowcast/dashboard/src/components/RightSidebar.tsx (Lines 1-159, CSS index.css Lines 184-195)
REUSABILITY: Specialized meteorology telemetry rail.
IMPORTANCE: Crucial for aviation dispatch and civil defense countdowns.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 18: BottomPanel Temporal Scrubber & Trend HUD                                                                            |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Timeline & Forecast Bottom Panel (bottom-panel)
PURPOSE: Temporal scrubbing across 0-6h (pySTEPS) or 0-90m (DGMR), precipitation forecast sparkline, station hazard log, and Replay launcher.
LOCATION: Bottom horizontal docking of dashboard (h: 180px, z-index: 10)
PAGE: App.tsx -> BottomPanel.tsx
VISUAL STRUCTURE: 4-pane horizontal flex container (bg: var(--panel-glass), blur: 12px, border-top: 1px solid var(--panel-border)).
  - Pane 1 (Flex-1): Lead Time Stepper (Circular buttons for each hour/step + linear range slider).
  - Pane 2 (300px): Rain-rate Forecast Sparkline (SVG TrendChart showing max rain-rate curve over time).
  - Pane 3 (300px): Recent Station Reports (Timestamped list of recent station hazards).
  - Pane 4 (220px): Replay Launcher ("Open Replay" button).
INPUTS: model, leadMinutes, onLeadChange, forecast, hazards, onOpenReplay.
OUTPUTS: leadMinutes state updates, Replay modal activation.
INTERACTIONS: Clicking circle buttons jumps lead time; dragging slider scrubs lead time; clicking "Open Replay" opens modal.
ANIMATION: Active circle button highlights in cyan (`var(--accent)`); SVG path renders smoothly.
DATA SOURCE: forecast summary props, hazards props.
STATE CHANGES: Mutates leadMinutes in parent.
RESPONSIVE BEHAVIOR: Horizontal scrollable if viewport width < 1200px.
DEPENDENCIES: TrendChart component.
IMPLEMENTATION FILE: nowcast/dashboard/src/components/BottomPanel.tsx (Lines 1-131, CSS index.css Lines 244-252)
REUSABILITY: Temporal forecasting timeline panel.
IMPORTANCE: Central control for 4D spacetime exploration.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 19: MapCanvas & MapProvider Engine                                                                                       |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: MapLibre GIS Canvas & Provider (MapProvider, MapCanvas)
PURPOSE: Manages the WebGL MapLibre map instance, base dark canvas style specification, camera viewports, and Web Worker lifecycles.
LOCATION: Absolute fill of .map-area container (inset: 0)
PAGE: App.tsx
VISUAL STRUCTURE: WebGL canvas rendering Esri World Dark Gray Base tiles (`services.arcgisonline.com/.../World_Dark_Gray_Base/...`), navigation controls at bottom-right.
INPUTS: ReactNode children, container ref.
OUTPUTS: Exposes `map`, `ready`, `tileError`, and `attachContainer` via React Context.
INTERACTIONS: MapLibre native pan, zoom, pitch, bearing rotations.
ANIMATION: Camera flyTo animations (`map.flyTo({ center, zoom, duration: 800 })`), fitBounds on initialization to India extent ($68.0^\circ\text{E} - 97.5^\circ\text{E}, 6.5^\circ\text{N} - 37.0^\circ\text{N}$).
DATA SOURCE: Esri ArcGIS Online tile servers.
STATE CHANGES: ready (boolean), tileError (string | null).
RESPONSIVE BEHAVIOR: Automatically resizes on container dimension changes.
DEPENDENCIES: maplibre-gl library and CSS.
IMPLEMENTATION FILE: nowcast/dashboard/src/map/MapProvider.tsx (Lines 1-90)
REUSABILITY: Universal MapLibre context provider.
IMPORTANCE: Foundational geospatial rendering engine.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 20: HazardLayers Pulsing GIS Markers & Popups                                                                            |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Pulsing Hazard Markers & Station Circles (HazardLayers)
PURPOSE: Render high-visibility animated markers for live hail and lightning detections, plus clickable station circles with popups.
LOCATION: Map canvas overlay
PAGE: App.tsx -> HazardLayers.tsx
VISUAL STRUCTURE: 
  - Real Hazard Markers: Custom DOM elements with `.hazard-marker` class. Inner structure: 2 expanding pulsing CSS rings (`.hazard-marker-ring`) + 1 solid center dot (`.hazard-marker-dot`).
  - Station Dots: MapLibre native GeoJSON circle layers ('station-glow' with blur: 0.6, 'station-dot' with radius: 6).
  - Popups: Dark-themed MapLibre popups (`.maplibregl-popup-content`) detailing hazard type, severity, dBZ, rain rate, and ETA.
INPUTS: hazards (HazardsResponse), hailVisible (boolean), lightningVisible (boolean).
OUTPUTS: Interactive map pins and detailed HTML popups.
INTERACTIONS: Clicking marker or station opens MapLibre popup with meteorological metrics.
ANIMATION: Pure GPU-accelerated CSS keyframe animation (`hazard-pulse-ring`, 1.8s duration, infinite, cubic-bezier(0.2, 0.6, 0.4, 1)). Second ring has 0.9s delay.
DATA SOURCE: /hazards API (all-India RainViewer + Blitzortung detection).
STATE CHANGES: Markers dynamically mount, dismount, or toggle visibility based on toolbar buttons.
RESPONSIVE BEHAVIOR: Anchored to geospatial coordinates via MapLibre Marker API.
DEPENDENCIES: MapLibre Marker, Popup, colorForHazards, SEVERITY_COLOR.
IMPLEMENTATION FILE: nowcast/dashboard/src/map/layers/HazardLayers.tsx (Lines 1-168, CSS index.css Lines 467-491)
REUSABILITY: Specialized real-time alert marker system.
IMPORTANCE: Highest visual priority on the operational map.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 21: SensorRasterLayers Overlays                                                                                          |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Satellite IR & Radar Reflectivity Rasters (SensorRasterLayers)
PURPOSE: Render raw quantitative satellite thermal imagery (TIR-1) and radar reflectivity (dBZ) as georeferenced image overlays.
LOCATION: MapLibre raster layer stack (below heatmaps, above basemap)
PAGE: App.tsx -> SensorRasterLayers.tsx
VISUAL STRUCTURE: 
  - Satellite TIR-1: Inverted greyscale colormap (`gray_r`), opacity: 0.45, brightness temp range 190K–300K.
  - Radar Reflectivity: Turbo colormap (blue to red/purple), opacity: 0.50, range 0–65 dBZ.
INPUTS: layers (RawLayer[] from /raw-layers), satelliteVisible (boolean), radarVisible (boolean).
OUTPUTS: Spatial raster overlays over India or regional bbox.
INTERACTIONS: Toggled via map top toolbar buttons.
ANIMATION: Smooth opacity blending.
DATA SOURCE: /raw-layers API (Copernicus Sentinel-3 SLSTR / RainViewer radar).
STATE CHANGES: Opacity and visibility layout properties.
RESPONSIVE BEHAVIOR: Georeferenced to bounding box coordinates via `useRasterLayer`.
DEPENDENCIES: useRasterLayer hook.
IMPLEMENTATION FILE: nowcast/dashboard/src/map/layers/SensorRasterLayers.tsx (Lines 1-30)
REUSABILITY: Image raster layer wrapper.
IMPORTANCE: Raw physical telemetry validation.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 22: WeatherRasterLayers Grids                                                                                            |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Gridded Weather Fields Overlays (WeatherRasterLayers)
PURPOSE: Render all-India synoptic weather grids (temperature, humidity, wind speed, pressure, rainfall, risk index) as colored rasters.
LOCATION: MapLibre raster layer stack
PAGE: App.tsx -> WeatherRasterLayers.tsx
VISUAL STRUCTURE: Continuous colored rasters matching standard scientific colormaps:
  - Temperature: RdYlBu_r (18°C–34°C, opacity: 0.55)
  - Relative Humidity: YlGnBu (0%–100%, opacity: 0.55)
  - Wind Speed: plasma (0–18 m/s, opacity: 0.55)
  - Mean Sea Level Pressure: coolwarm (995–1015 hPa, opacity: 0.55)
  - Rainfall Rate: turbo (0–65 mm/hr, opacity: 0.60, derived via Marshall-Palmer Z-R)
INPUTS: layers (WeatherLayer[] from /weather-layers), activeVar (VarId).
OUTPUTS: Country-scale continuous atmospheric field visualization.
INTERACTIONS: Selected via LayersDrawer or AreaFloating panel.
ANIMATION: Dynamic layer swapping and lead-time animation when scrubber plays.
DATA SOURCE: /weather-layers?lead_time=N (ECMWF Open Data HRES / RainViewer Z-R).
STATE CHANGES: Visibility toggled according to activeVar.
RESPONSIVE BEHAVIOR: Reprojected onto India bounding box ($68.0^\circ\text{E} - 97.5^\circ\text{E}, 6.5^\circ\text{N} - 37.0^\circ\text{N}$).
DEPENDENCIES: useRasterLayer hook.
IMPLEMENTATION FILE: nowcast/dashboard/src/map/layers/WeatherRasterLayers.tsx (Lines 1-37)
REUSABILITY: Meteorological grid overlay manager.
IMPORTANCE: Comprehensive ambient environmental awareness.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 23: WindArrows Vector Symbol Layer                                                                                       |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Wind Vector Arrow Symbols (WindArrows)
PURPOSE: Render sparse meteorological wind direction and magnitude arrows across the subcontinent without external font server dependencies.
LOCATION: MapLibre symbol layer stack
PAGE: App.tsx -> WindArrows.tsx
VISUAL STRUCTURE: Crisp white arrow glyphs rendered directly onto an offscreen HTML5 canvas as a Signed Distance Field (SDF) icon (`createArrowIcon(28)`), rotated to wind bearing, sized by wind speed.
INPUTS: points (WindPoint[] from /wind-vectors), visible (boolean, activeVar === "wind_speed").
OUTPUTS: Rotated and scaled directional vector field.
INTERACTIONS: Automatically activates when "Wind" variable is selected.
ANIMATION: Icon size interpolates linearly (`["interpolate", ["linear"], ["get", "speed"], 2, 0.4, 16, 0.9]`); rotation tracks meteorological direction (`icon-rotate: ["get", "dir"]`).
DATA SOURCE: /wind-vectors?lead_time=N (ECMWF HRES 10m wind fields).
STATE CHANGES: Visibility property.
RESPONSIVE BEHAVIOR: Map-aligned rotation (`"icon-rotation-alignment": "map"`).
DEPENDENCIES: HTML5 Canvas 2D context, MapLibre addImage SDF.
IMPLEMENTATION FILE: nowcast/dashboard/src/map/layers/WindArrows.tsx (Lines 1-67)
REUSABILITY: Independent vector field renderer.
IMPORTANCE: Solves font-server dropped-glyph bugs; communicates steering flow.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 24: ModelFrameLayer Nowcast Visualizer                                                                                   |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Predictive Model Frame Overlay (ModelFrameLayer)
PURPOSE: Render extrapolated future precipitation frames from pySTEPS (turbo colormap) or DGMR (plasma colormap) directly on the map.
LOCATION: MapLibre raster layer stack (above raw sensors, below hazard markers)
PAGE: App.tsx -> ModelFrameLayer.tsx
VISUAL STRUCTURE: Georeferenced predictive raster overlay with opacity: 0.55.
INPUTS: frame (NowcastFrame from /nowcast-frame), visible (boolean, modelFrameVisible).
OUTPUTS: Visual prediction of storm displacement and intensity evolution.
INTERACTIONS: Toggled via LayersDrawer checkbox ("Show model forecast overlay").
ANIMATION: Updates dynamically as leadMinutes scrubber is moved.
DATA SOURCE: /nowcast-frame?model=pysteps|dgmr&lead_time=N.
STATE CHANGES: Source image updates on lead time or model switch.
RESPONSIVE BEHAVIOR: Bounded to active demo region bounding box.
DEPENDENCIES: useRasterLayer hook.
IMPLEMENTATION FILE: nowcast/dashboard/src/map/layers/ModelFrameLayer.tsx (Lines 1-14)
REUSABILITY: Forecast frame layer.
IMPORTANCE: Direct visual validation of predictive models on GIS map.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 25: RegionBox & AreaBox Spatial Selection Bounds                                                                         |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Spatial Inspection Bounds (RegionBox, AreaBox)
PURPOSE: Visually delineate the user's clicked point inspection area or drag-drawn bounding box on the map canvas.
LOCATION: Uppermost MapLibre vector line/fill layers
PAGE: App.tsx -> RegionBox.tsx, AreaBox.tsx
VISUAL STRUCTURE: 
  - RegionBox: Cyan dashed polygon outline (`line-dasharray: [2, 2]`, line-width: 2, padding: $0.15^\circ$).
  - AreaBox: Live dashed box during dragging; solid cyan outline (`line-width: 2`) + semi-transparent fill (`fill-opacity: 0.45`) colored dynamically by the area's mean weather variable when confirmed.
INPUTS: region ({lat, lon}), drawingArea (Bbox), area (Bbox), areaFillColor (string), areaFillOpacity (number).
OUTPUTS: Clear visual spatial boundary around inspected territory.
INTERACTIONS: Drawn via click or mouse-drag; persistent until dismissed.
ANIMATION: Live bounding-box resizing during active mouse drag.
DATA SOURCE: User spatial mouse interactions via useAreaDrag and useRegionClick.
STATE CHANGES: GeoJSON source data updates in real time.
RESPONSIVE BEHAVIOR: Geodetic coordinates fixed on map canvas.
DEPENDENCIES: MapLibre GeoJSONSource, bboxPolygon generator.
IMPLEMENTATION FILES: nowcast/dashboard/src/map/layers/RegionBox.tsx (Lines 1-45), nowcast/dashboard/src/map/layers/AreaBox.tsx (Lines 1-82)
REUSABILITY: Spatial ROI bounding box tools.
IMPORTANCE: Provides precise visual feedback for localized queries.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 26: WmsBaseLayer & WmsOverlayLayers ISRO/MOSDAC Engine                                                                   |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: ISRO / MOSDAC WMS GIS Layer Engine (WmsBaseLayer, WmsOverlayLayers)
PURPOSE: Stream 7 authentic ISRO base maps and 16 thematic GIS overlays directly from MOSDAC GeoServer services.
LOCATION: Bottom of map layer stack (WmsBaseLayer) and intermediate stack (WmsOverlayLayers)
PAGE: App.tsx -> WmsBaseLayer.tsx, WmsOverlayLayers.tsx
VISUAL STRUCTURE: Multi-tile raster WMS imagery streaming over `{bbox-epsg-3857}` tiles.
  - Base Maps: Bhuvan Maps (routed via `/wms-proxy/bhuvan`), Digital Elevation Model (DEM), OpenStreetMap, LULC India, Natural Earth, Black Marble, True Marble.
  - Overlays: Landslide Risk, Fire Risk, River Basins, Drainage Systems, National Highways, District Roads, Railway Tracks, Airports, Administrative Boundaries, Taluka Boundaries, District Population.
INPUTS: selectedId (base map ID), activeIds (Set<string> of overlay IDs).
OUTPUTS: Official Indian government GIS contextual layers.
INTERACTIONS: Configured and toggled via LayersDrawer.
ANIMATION: Tile streaming fade-in; pre-mounted layers allow instant visibility switching without network refetch.
DATA SOURCE: MOSDAC GeoServer (`mosdac.gov.in/geoserver_2`) and NRSC Bhuvan via local proxy.
STATE CHANGES: Layout property visibility ("visible" vs "none").
RESPONSIVE BEHAVIOR: Scalable EPSG:3857 web mercator tiles.
DEPENDENCIES: wmsTileUrl helper, BASE_LAYERS, OVERLAY_LAYERS catalog.
IMPLEMENTATION FILES: nowcast/dashboard/src/map/layers/WmsBaseLayer.tsx (Lines 1-41), nowcast/dashboard/src/map/layers/WmsOverlayLayers.tsx (Lines 1-38)
REUSABILITY: Turnkey ISRO/MOSDAC GIS engine.
IMPORTANCE: Critical hackathon compliance and domain credibility.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 27: LayersDrawer GIS Management Panel                                                                                    |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Layers Configuration Drawer (layers-drawer)
PURPOSE: Comprehensive slide-out configuration workspace for models, forecast overlays, weather grids, base imagery, and GIS overlays.
LOCATION: Left-docked sliding drawer ($300\text{px}$ width, $z\text{-index}: 25$)
PAGE: App.tsx -> LayersDrawer.tsx
VISUAL STRUCTURE: Dark glass panel with header ("Layers" + Close X), divided into 4 bordered sections:
  - 1. Nowcast model: 3-way segmented buttons (pySTEPS, DGMR, SmaAt-UNet) + descriptive text + "Show model forecast overlay" checkbox.
  - 2. Weather variables: 7-button grid (None, Temp, Humidity, Wind, Pressure, Rainfall, Risk Index) + color legend gradient with unit bounds + "REAL" ECMWF badge.
  - 3. Base map: Select dropdown listing Esri Canvas + 7 MOSDAC base layers + "REAL" ISRO badge.
  - 4. GIS overlays: Scrollable checkbox list of 16 MOSDAC CloudBurst layers + active count counter + "REAL" badge.
INPUTS: model, onModelChange, dgmrUnavailable, modelFrameVisible, onModelFrameVisibleChange, baseMapId, onBaseMapChange, activeOverlayIds, onOverlayToggle, activeVar, onVarChange, activeVarMeta, weatherSource.
OUTPUTS: Mutates all layer and model selection states in App.tsx.
INTERACTIONS: Clicking segmented buttons, toggling checkboxes, selecting dropdown items, closing drawer.
ANIMATION: Slide-over drawer positioning with backdrop blur (`backdrop-filter: blur(12px)`).
DATA SOURCE: mosdacLayers.ts catalog, colors.ts definitions.
STATE CHANGES: Direct propagation to parent state.
RESPONSIVE BEHAVIOR: Fixed 300px width; internally scrollable.
DEPENDENCIES: Lucide React X icon, BASE_LAYERS, OVERLAY_LAYERS, VAR_COLOR_STOPS.
IMPLEMENTATION FILE: nowcast/dashboard/src/components/LayersDrawer.tsx (Lines 1-162, CSS index.css Lines 348-398)
REUSABILITY: Multi-layer management drawer.
IMPORTANCE: Core user control over visual complexity and data layers.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 28: HazardsPage Tabular Ledger Workspace                                                                                 |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Full Hazards Ledger Workspace (hazards-page)
PURPOSE: Comprehensive auditing, sorting, and exploration of all detected convective hazards with instant map fly-to navigation.
LOCATION: Full-screen modal overlay ($z\text{-index}: 40$, inset: 0)
PAGE: App.tsx -> HazardsPage.tsx
VISUAL STRUCTURE: Full-viewport dark sheet (bg: var(--bg)).
  - Head: Title ("All Hazards (N)") + Close button.
  - Body: Filter row with category pill buttons (All, Hail, Lightning) with count chips.
  - Data Table: Columns: Type (with colored dot), Severity (pill badge), Location / Centroid, Metric (Reflectivity / Velocity / Rain-rate), ETA (minutes), Reported time.
INPUTS: hazards (HazardsResponse), stormCells (StormCell[]), onClose, onSelectLocation.
OUTPUTS: Filtered table view, map fly-to coordinate dispatch.
INTERACTIONS: Category filter selection, row hover highlight, row click triggers onSelectLocation(lat, lon) and closes modal.
ANIMATION: High-severity rows sorted to top; hover row background illumination.
DATA SOURCE: /hazards API, /storm-eta API.
STATE CHANGES: filter ("all" | HazardType).
RESPONSIVE BEHAVIOR: Table scrolls horizontally on constrained viewports.
DEPENDENCIES: HAZARD_COLOR, Lucide React X icon.
IMPLEMENTATION FILE: nowcast/dashboard/src/components/HazardsPage.tsx (Lines 1-151, CSS index.css Lines 412-454)
REUSABILITY: Full-screen tabular data ledger.
IMPORTANCE: Essential for emergency response dispatch and district auditing.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 29: ForecastPage Model Benchmarking Workspace                                                                            |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Model Comparison Workbench (ForecastPage, ModelColumn)
PURPOSE: Rigorous comparative benchmarking between pySTEPS optical flow and DeepMind DGMR generative nowcasts.
LOCATION: Full-screen modal overlay ($z\text{-index}: 40$, inset: 0)
PAGE: App.tsx -> ForecastPage.tsx
VISUAL STRUCTURE: Full-viewport modal divided into 2 equal-width comparative columns:
  - Column 1: pySTEPS (0-6h horizon, calibrated mm/hr, TrendChart, 0-360m slider, turbo-colormapped frame).
  - Column 2: DGMR (0-90m horizon, unitless relative intensity, TrendChart, 0-90m slider, plasma-colormapped frame).
INPUTS: onClose callback, internal useForecastSummary hooks.
OUTPUTS: Side-by-side graphical and visual comparison.
INTERACTIONS: Moving range sliders independently fetches and displays the exact predictive frame at that lead time.
ANIMATION: Dynamic image replacement with imageRendering: pixelated.
DATA SOURCE: /forecast?model=... API, /nowcast-frame?model=...&lead_time=... API.
STATE CHANGES: leadMinutes per model column, frame image.
RESPONSIVE BEHAVIOR: Side-by-side flex layout on desktop; stacks vertically if width < 900px.
DEPENDENCIES: TrendChart, Lucide React X icon.
IMPLEMENTATION FILE: nowcast/dashboard/src/components/ForecastPage.tsx (Lines 1-106)
REUSABILITY: ML model benchmarking workbench.
IMPORTANCE: Transparent scientific defense of AI vs. classical extrapolation.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 30: ReplayPage Historical Time Machine                                                                                   |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Historical Event Replay Console (ReplayPage)
PURPOSE: Step through persisted past radar/satellite/hazard snapshots for post-event forensic disaster analysis.
LOCATION: Full-screen modal overlay ($z\text{-index}: 40$, inset: 0)
PAGE: App.tsx -> ReplayPage.tsx
VISUAL STRUCTURE: Full-viewport modal sheet.
  - Head: Title ("Replay") + Close button.
  - Timeline Controls: Play/Pause circular toggle, full-width timeline scrubber, formatted ISO timestamp display.
  - Snapshot Status: Snapshot index chip ("Snapshot X / Y"), category hazard count pills.
  - Event Table: Full tabular breakdown of all hazards detected at that exact historical moment.
INPUTS: onClose callback.
OUTPUTS: Temporal playback of past events.
INTERACTIONS: Play/Pause toggles automated playback (1.2s interval); slider allows manual frame scrubbing.
ANIMATION: Automated timer advances timeline index; play/pause icon flips.
DATA SOURCE: /history/timestamps API, /history/hazards?timestamp=... API.
STATE CHANGES: timestamps, index, snapshot, loading, isPlaying.
RESPONSIVE BEHAVIOR: Fluid width slider, scrollable table.
DEPENDENCIES: Lucide React Play, Pause, X icons, HAZARD_COLOR.
IMPLEMENTATION FILE: nowcast/dashboard/src/components/ReplayPage.tsx (Lines 1-158)
REUSABILITY: Historical disaster replay player.
IMPORTANCE: Vital for post-mortem meteorological analysis and hackathon demonstration.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 31: RegionFloating & AreaFloating Inspector HUDs                                                                         |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Floating Spatial Inspector Cards (RegionFloating, AreaFloating)
PURPOSE: Provide instant local atmospheric readouts and localized future forecast trends for any user-clicked coordinate or user-dragged area.
LOCATION: Floating anchored card at bottom-right of map viewport ($z\text{-index}: 6$, bottom: 16px, right: 16px)
PAGE: App.tsx -> RegionFloating.tsx, AreaFloating.tsx
VISUAL STRUCTURE: Dark glass card (w: 260px, border-radius: 12px, border: 1px solid var(--panel-border)).
  - Head: Title ("Selected region" / "Selected area") + Close X.
  - Coordinates / Extents: Precision Lat/Lon or Bbox dimensions in km.
  - Telemetry Rows: Temperature, Humidity, Wind speed & bearing, MSL Pressure, Cloudburst rain rate, Active hazards.
  - Future Time Scale: Range slider ($0-6\text{h}$) with active lead time readout.
INPUTS: region / bbox, reading, loading, error, leadMinutes, onLeadChange, onClose, areaVar, onAreaVarChange.
OUTPUTS: Updates lead time and triggers point/area forecast fetch; mutates areaVar map coloring.
INTERACTIONS: Dragging time slider scrubs localized forecast; clicking variable buttons in AreaFloating colors the map box by that variable's mean.
ANIMATION: Smooth slider scrubbing; loading indicator text.
DATA SOURCE: /region-forecast?lat=...&lon=...&lead_time=... API, /area-forecast?bbox=...&lead_time=... API.
STATE CHANGES: leadMinutes, areaVar, reading data.
RESPONSIVE BEHAVIOR: Anchored to viewport corner; compact 260px footprint avoids obscuring center map.
DEPENDENCIES: Lucide React X icon, windCompass helper.
IMPLEMENTATION FILES: nowcast/dashboard/src/components/RegionFloating.tsx (Lines 1-72), nowcast/dashboard/src/components/AreaFloating.tsx (Lines 1-140)
REUSABILITY: Spatial inspection HUDs.
IMPORTANCE: Empowers duty operators to query any coordinate without leaving the map.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 32: TrendChart Zero-Dependency SVG Sparkline                                                                             |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Custom SVG Trend Sparkline (TrendChart)
PURPOSE: Render lightweight, crisp area+line sparklines for precipitation trends without bulky third-party charting libraries.
LOCATION: Embedded inside BottomPanel, ForecastPage, and summary HUDs
PAGE: TrendChart.tsx
VISUAL STRUCTURE: Pure vector SVG element (`preserveAspectRatio="none"`, `vectorEffect="non-scaling-stroke"`).
  - Translucent filled area path under curve (opacity: 0.15).
  - Solid 1.6px stroke line path along data points.
  - Circular data point glyphs (r: 1.6) at each vertex.
  - Monospace min/max value labels below chart.
INPUTS: points (TrendPoint[]: {leadMin, value}), color (string), unit (string), height (number, default 44).
OUTPUTS: Responsive vector graph.
INTERACTIONS: Static vector visualization.
ANIMATION: Instantaneous SVG path recalculation on data change.
DATA SOURCE: ForecastSummary timestamps and rain-rate / intensity arrays.
STATE CHANGES: None.
RESPONSIVE BEHAVIOR: Scales to 100% container width via SVG viewBox coordinate mapping.
DEPENDENCIES: Pure React / SVG.
IMPLEMENTATION FILE: nowcast/dashboard/src/components/TrendChart.tsx (Lines 1-59)
REUSABILITY: Highly reusable, zero-bundle-overhead charting component.
IMPORTANCE: Critical for visualizing precipitation rate trends over time.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| COMPONENT 33: Diagnostic Notification Banner                                                                                       |
+------------------------------------------------------------------------------------------------------------------------------------+
NAME: Alert Notification Banner (Banner)
PURPOSE: Display non-blocking global system diagnostics (e.g. backend offline warning or WMS tile blocking notifications).
LOCATION: Floating banner at top of map canvas
PAGE: App.tsx -> Banner.tsx
VISUAL STRUCTURE: High-contrast alert strip styled via `.banner`.
INPUTS: message (string | null).
OUTPUTS: Diagnostic warning text.
INTERACTIONS: Dismisses automatically when error condition clears.
ANIMATION: Conditional mount.
DATA SOURCE: tileError state from MapProvider or apiUnreachable state from App.
STATE CHANGES: None.
RESPONSIVE BEHAVIOR: Fluid width centered over map.
DEPENDENCIES: Pure React.
IMPLEMENTATION FILE: nowcast/dashboard/src/components/Banner.tsx (Lines 1-5)
REUSABILITY: Universal alert banner.
IMPORTANCE: Essential for diagnosing offline backend or firewall-blocked basemap tiles.
```

---

## 6. Information Architecture

### 6.1 Architectural Hierarchy Tree
```text
MEGHDRISHTI PLATFORM
│
├── PUBLIC MARKETING & CAPABILITIES PORTAL (HomePage.tsx, route: '/')
│   ├── Sticky Glass Navigation Header
│   │   ├── Brand Identifier (MeghDrishti Cloud-Lightning Mark)
│   │   ├── Nav Anchor Links (Capabilities, Pipeline, Technology, About)
│   │   ├── Live System Status Badge (Pulsing Green Indicator)
│   │   └── Primary Conversion Action ("Launch Dashboard" CTA Button)
│   ├── Atmospheric Hero Section
│   │   ├── India Weather Intelligence Platform Eyebrow Badge
│   │   ├── Editorial H1 Heading ("See Severe Weather Before It Strikes.")
│   │   ├── Value Proposition Subtitle
│   │   ├── Primary & Secondary Action Group ("Get Started" & "Explore")
│   │   ├── Triad Feature List (Real-Time, AI Hazard Intel, 0-6h Nowcasts)
│   │   ├── Live Weather Intelligence Floating Card
│   │   │   ├── Hail Hazard Zone Counter
│   │   │   ├── Lightning Hazard Zone Counter
│   │   │   └── Forecast Horizon Indicator (0-6 Hours)
│   │   ├── Color Legend Bar (Light to Severe Spectrum)
│   │   ├── Platform Statistics Strip (4 Strategic Pillars)
│   │   └── Animated Interactive Scroll Hint
│   ├── Core Capabilities Bento Matrix
│   │   ├── Live Weather Observations Card (Multi-Source Fusion)
│   │   ├── 0-6h Short-Term Forecasting Card (pySTEPS & DGMR)
│   │   └── Hazard Intelligence & Alerting Card (Automated Rules)
│   ├── Pipeline Architecture Visualizer
│   │   ├── Stage 01: OBSERVE (Radar + Satellite + Lightning)
│   │   ├── Stage 02: ANALYZE (Atmospheric & Convective Patterns)
│   │   ├── Stage 03: FORECAST (0-6h Extrapolation Models)
│   │   └── Stage 04: ALERT (Actionable Decision Delivery)
│   ├── Operational Console Simulator
│   │   ├── Mock Application Chrome
│   │   ├── Simulated Radar Map Canvas (India SVG + Radar Concentric Rings)
│   │   ├── Simulated Tactical Rail (Hail, Lightning, Rain Threat Cards)
│   │   └── Mid-Page Launch CTA
│   ├── Multi-Sector Use Case Matrix
│   │   ├── Disaster Management (NDRF / Civil Defense)
│   │   ├── Aviation Safety (ATC / Flight Routing)
│   │   ├── Precision Agriculture (Crop & Harvest Protection)
│   │   ├── Critical Infrastructure (Grid & Transit Protection)
│   │   └── Emergency Response (First Responders)
│   ├── Final Conversion Section ("Monitor the Next Storm.")
│   └── Global Product Footer
│
└── OPERATIONAL COMMAND CENTER DASHBOARD (App.tsx, route: '/dashboard')
    ├── LeftNavigation Vertical Rail
    │   ├── Home View Reset
    │   ├── Layers Drawer Toggle
    │   ├── Forecast Comparison Modal Toggle
    │   ├── Hazards Ledger Modal Toggle
    │   ├── Historical Replay Modal Toggle
    │   └── Settings (Disabled Placeholder)
    ├── Global Top Bar
    │   ├── Branding & SIH 2026 Competition Badge
    │   ├── Operational Pipeline Status (Live / Offline)
    │   ├── Last Data Synchronized Timestamp
    │   └── Active Focus Location Chip ("Pune, Maharashtra")
    ├── Left Operational Sidebar
    │   ├── 10-City Demo Region Dropdown Selector
    │   ├── Backend Pipeline Telemetry
    │   ├── Data Source Status (Radar, Satellite, Lightning)
    │   ├── Active Hazard Counters (Hail, Lightning)
    │   ├── Model Resolution & Cadence Metadata
    │   └── GeoJSON Hazard FeatureCollection Exporter
    ├── Geospatial Map Area (Center Viewport)
    │   ├── MapLibre GL WebGL Canvas
    │   ├── Map Layers Engine
    │   │   ├── ISRO / MOSDAC WMS Base Imagery (7 Layers)
    │   │   ├── ISRO / MOSDAC Thematic Overlays (16 Layers)
    │   │   ├── Real All-India Hail & Lightning Pulsing Markers
    │   │   ├── Station GeoJSON Circle Dots & Popups
    │   │   ├── Satellite IR (TIR-1) Image Raster
    │   │   ├── Radar Reflectivity (dBZ) Image Raster
    │   │   ├── ECMWF Atmospheric Field Rasters (Temp/Hum/Wind/Pres/Rain)
    │   │   ├── ECMWF Wind Vector Directional Arrow Symbols
    │   │   ├── pySTEPS / DGMR Predictive Forecast Frame Raster
    │   │   ├── Point Inspection Dashed Boundary Box (RegionBox)
    │   │   ├── Area Drag-Select Measurement Box (AreaBox)
    │   │   └── Esri World Reference Text Labels (Topmost Layer)
    │   ├── Floating Map Toolbar (Top-Left)
    │   │   ├── Radar Layer Toggle Button
    │   │   ├── Satellite IR Layer Toggle Button
    │   │   ├── Lightning Layer Toggle Button
    │   │   ├── Hazards Layer Toggle Button
    │   │   ├── Topography (DEM) Base Toggle Button
    │   │   └── "Select area" Drag Tool Button
    │   ├── Floating Time Scrubber (Top-Right)
    │   │   ├── Lead Time Readout ("Now", "+1h 30m", etc.)
    │   │   ├── Automated Play/Pause Toggle
    │   │   ├── Temporal Range Slider (0 to 360m / 90m)
    │   │   └── Max Horizon Label
    │   ├── Floating Scientific Legends (Top-Right Stack)
    │   │   ├── Radar Reflectivity Scale (10 to 70 dBZ Gradient)
    │   │   └── Hazard Severity Key (High Red, Moderate Yellow, Low Green)
    │   ├── Floating Inspection HUDs (Bottom-Right Stack)
    │   │   ├── Point-Sampling Inspection Card (RegionFloating)
    │   │   └── Bounding-Box Area Statistics Card (AreaFloating)
    │   └── System Alert Banner (Top-Center)
    ├── Right Tactical Sidebar
    │   ├── Active Hazard Category Cards (Hail, Downburst, Cloudburst, Lightning)
    │   ├── Primary Storm Motion HUD (Bearing, Speed, Distance, Source)
    │   └── Next 6 Hours Rain-Rate Severity Buckets (0-1h, 1-2h, 2-4h, 4-6h)
    ├── Bottom Timeline Panel
    │   ├── Lead Time Stepper Dials (Hourly / 15-minute quick jumps)
    │   ├── Linear Timeline Slider
    │   ├── Rain-Rate Forecast SVG Sparkline (TrendChart)
    │   ├── Recent Station Hazard Log
    │   └── Replay Quick-Launch Card
    └── Full-Viewport Slide-Over & Modal Workspaces
        ├── Layers Drawer (LayersDrawer.tsx)
        ├── Hazards Ledger Table (HazardsPage.tsx)
        ├── Model Benchmarking Workspace (ForecastPage.tsx)
        └── Historical Replay Console (ReplayPage.tsx)
```

### 6.2 Visual Attention & Eye-Tracking Hierarchy
1. **Primary Focal Anchor (Map Visual Center):** The pulsing hazard markers (`.hazard-marker`) draw immediate, irresistible focal attention due to continuous dual-ring CSS pulsing animation and high-saturation severity coloring (`#ef4444` high, `#f0b429` moderate).
2. **Secondary Anchor (Tactical Threat Cards - Right Sidebar):** The operator's gaze shifts to the Right Sidebar where high-contrast colored left borders (`3px solid var(--hail)`) communicate specific hazard types, quantitative metrics ($58\,\text{dBZ}, 28\,\text{m/s}$), and immediate time-to-arrival (ETA) figures.
3. **Tertiary Anchor (Bottom Timeline Panel):** Gaze drops to the Bottom Panel to evaluate the temporal trajectory via the SVG sparkline and step through lead-time buttons to check future risk.
4. **Quaternary Anchor (Left Control Rail):** Left sidebar is used for contextual adjustments: selecting another demo city, reviewing pipeline connectivity, or exporting data.

---

## 7. User Workflows

### 7.1 Workflow 1: Rapid National Hazard Assessment
```
[User Lands at '/']
       │
       ▼
[Observes Live Status & Hazard Counts in Hero Card (16 Hail, 4 Lightning)]
       │
       ▼
[Clicks "Launch Dashboard" or "Get Started" CTA]
       │
       ▼
[URL updates to '/dashboard'; Root mounts <App>]
       │
       ▼
[MapCanvas initializes; camera auto-fits to all of India (68-97.5E, 6.5-37N)]
       │
       ▼
[System renders pulsing severity markers across India via /hazards endpoint]
       │
       ▼
[User scans map for red/yellow clusters to identify high-risk convective zones]
```

### 7.2 Workflow 2: Convective Storm Point Inspection & ETA Countdown
```
[User views active storm cluster on map]
       │
       ▼
[User left-clicks directly on storm coordinates]
       │
       ▼
['useRegionClick' fires; dismisses any active area selection; centers camera]
       │
       ▼
[Camera executes smooth flyTo animation: zoom increases by +1.6, duration 800ms]
       │
       ▼
['RegionBox' renders dashed cyan bounding box around clicked coordinate]
       │
       ▼
['RegionFloating' HUD appears in bottom-right corner]
       │
       ▼
[Frontend calls '/region-forecast?lat=...&lon=...&lead_time=0']
       │
       ▼
[HUD displays localized Temp, Humidity, Wind, Pressure, and Cloudburst Rain Rate]
       │
       ▼
[User drags "Future time scale" slider to +2h]
       │
       ▼
[Frontend fetches advected forecast; HUD updates metrics for +2 hours]
```

### 7.3 Workflow 3: Spatial Bounding-Box Weather Diagnostic
```
[User clicks "Select area" button in top toolbar]
       │
       ▼
['areaSelectMode' activates: map dragPan is disabled; cursor becomes crosshair]
       │
       ▼
[User clicks and drags rectangle across target district/region]
       │
       ▼
['AreaBox' renders live dashed preview box tracking cursor coordinates]
       │
       ▼
[User releases mouse button; 'onSelect' fires with final bounding box]
       │
       ▼
[Camera executes fitBounds to rectangle with 80px padding, 800ms duration]
       │
       ▼
['AreaFloating' HUD opens in bottom-right corner; 'areaLoading' displays loader]
       │
       ▼
[Frontend calls '/area-forecast?lon_min=...&lat_min=...&lon_max=...&lat_max=...']
       │
       ▼
[HUD renders Min-Mean-Max statistics for Temp, Humidity, Wind, Pressure]
       │
       ▼
[User clicks "Temp" button in Area HUD]
       │
       ▼
['areaVar' sets to "temperature"; AreaBox fill colors dynamically to mean temp]
```

### 7.4 Workflow 4: Multi-Model Nowcast Validation (pySTEPS vs. DGMR)
```
[User clicks "Forecast" (CloudRain icon) in Left Navigation rail]
       │
       ▼
['activePanel' sets to "forecast"; full-screen 'ForecastPage' modal mounts]
       │
       ▼
[Modal renders side-by-side columns: pySTEPS (Left) vs DeepMind DGMR (Right)]
       │
       ▼
[pySTEPS displays 0-6h rain-rate sparkline (mm/hr); DGMR displays 0-90m intensity]
       │
       ▼
[User scrubs pySTEPS slider to +60m: Turbo-colormapped radar frame displays]
       │
       ▼
[User scrubs DGMR slider to +60m: Plasma-colormapped GAN frame displays]
       │
       ▼
[Meteorologist compares optical-flow linear advection vs GAN generative evolution]
       │
       ▼
[User clicks Close X; modal dismisses; returns seamlessly to map view]
```

### 7.5 Workflow 5: Historical Storm Reconstruction (Replay Time Machine)
```
[User clicks "Replay" (Play icon) in Left Navigation or Bottom Panel]
       │
       ▼
['activePanel' sets to "replay"; full-screen 'ReplayPage' modal mounts]
       │
       ▼
[Frontend calls '/history/timestamps'; loads available disk snapshot index]
       │
       ▼
[Replay console displays snapshot timestamp (e.g. 2024-06-28 Delhi Extreme Downpour)]
       │
       ▼
[User clicks Play button: automated interval ticks every 1.2s through timeline]
       │
       ▼
[Frontend fetches '/history/hazards?timestamp=...'; renders snapshot hazard table]
       │
       ▼
[User analyzes convective cell initiation, peak severity, and post-storm decay]
```

### 7.6 Workflow 6: GIS Multi-Source Overlays & Hazard Correlation
```
[User clicks "Layers" (Layers icon) in Left Navigation rail]
       │
       ▼
['LayersDrawer' slides out from left edge ($300\text{px}$)]
       │
       ▼
[User changes "Base map" dropdown from Esri Dark Canvas to "Bhuvan Maps"]
       │
       ▼
[WmsBaseLayer switches visibility; streams ISRO Bhuvan satellite tiles via proxy]
       │
       ▼
[User checks "Landslide Risk Map" and "Drainage" under GIS Overlays]
       │
       ▼
[WmsOverlayLayers activates MOSDAC GeoServer layers below hazard markers]
       │
       ▼
[User correlates active heavy rainfall zones with underlying landslide susceptibility]
```

---

## 8. Input Analysis

### 8.1 Exhaustive Input Catalog
```
+---------------------------------------------------------------------------------------------------------------------------------------+
| INPUT 1: Lead Time Minutes Scrubber (leadMinutes)                                                                                     |
+---------------------------------------------------------------------------------------------------------------------------------------+
SOURCE COMPONENT: BottomPanel.tsx (stepper circles & range slider), App.tsx (top toolbar range slider)
INPUT TYPE: Continuous integer slider (0 to 360 in pySTEPS mode; 0 to 90 in DGMR mode; 0 to 60 in SmaAt mode)
VALIDATION: Math.min(value, LEAD_MAX[model]), step=10 (pySTEPS) or step=5 (DGMR)
PROCESSING: Triggers re-render; passes lead_time query parameter to /hazards, /weather-layers, /wind-vectors, /nowcast-frame
MODEL / API: 
  - /hazards: Points advected by real ECMWF wind vector over lead time
  - /weather-layers: ECMWF grid snaps to nearest 3-hour forecast step
  - /nowcast-frame: Retrieves extrapolated raster at target lead minute
GUI OUTPUT: Map hazard markers displace along steering flow; weather rasters update; bottom panel label updates ("+1h 30m")
```

```
+---------------------------------------------------------------------------------------------------------------------------------------+
| INPUT 2: Demo Region Key Switcher                                                                                                     |
+---------------------------------------------------------------------------------------------------------------------------------------+
SOURCE COMPONENT: LeftSidebar.tsx (RegionPicker dropdown)
INPUT TYPE: Categorical string selector ("pune" | "delhi" | "mumbai" | "chennai" | "kolkata" | "bengaluru" | "hyderabad" | "ahmedabad" | "jaipur" | "guwahati")
VALIDATION: Verified against REGIONS dictionary in settings.py
PROCESSING: Sends POST /regions/{key} to backend. Backend swaps active region snapshot from pre-warmed memory cache.
MODEL / API: Triggers window.location.reload() to guarantee clean cache invalidation across all polling hooks.
GUI OUTPUT: Map view resets to new city bbox; localized pySTEPS forecast re-targets to selected metropolitan center.
```

```
+---------------------------------------------------------------------------------------------------------------------------------------+
| INPUT 3: Spatial Point Click                                                                                                          |
+---------------------------------------------------------------------------------------------------------------------------------------+
SOURCE COMPONENT: MapCanvas -> useRegionClick.ts
INPUT TYPE: Geospatial coordinate pair (e.lngLat.lat, e.lngLat.lng)
VALIDATION: Ignored if click collides with an existing station-dot marker (which owns its own popup handler) or if areaSelectMode is active.
PROCESSING: Triggers selectRegion(lat, lon); dismounts any active area selection; flies map camera to center on coordinate.
MODEL / API: Calls GET /region-forecast?lat={lat}&lon={lon}&lead_time={regionLeadMinutes}
GUI OUTPUT: RegionBox renders dashed box around coordinate; RegionFloating HUD opens displaying atmospheric soundings.
```

```
+---------------------------------------------------------------------------------------------------------------------------------------+
| INPUT 4: Spatial Area Drag Selection                                                                                                  |
+---------------------------------------------------------------------------------------------------------------------------------------+
SOURCE COMPONENT: MapCanvas -> useAreaDrag.ts
INPUT TYPE: Geospatial bounding box tuple: Bbox = [lonMin, latMin, lonMax, latMax]
VALIDATION: Clicks without drag extent (dx < 0.01° or dy < 0.01°) are ignored.
PROCESSING: Disables MapLibre dragPan; renders live dashed preview box on mousemove; fires onSelect on mouseup; executes fitBounds(bbox, 80px).
MODEL / API: Calls GET /area-forecast?lon_min={lonMin}&lat_min={latMin}&lon_max={lonMax}&lat_max={latMax}&lead_time=0
GUI OUTPUT: AreaBox mounts confirmed boundary; AreaFloating HUD opens displaying Min-Mean-Max statistics.
```

```
+---------------------------------------------------------------------------------------------------------------------------------------+
| INPUT 5: Weather Variable Radio Selector                                                                                              |
+------------------------------------------------------------------------------------------------------------------------------------+
SOURCE COMPONENT: LayersDrawer.tsx, AreaFloating.tsx
INPUT TYPE: Categorical string ("none" | "temperature" | "humidity" | "wind_speed" | "pressure" | "rainfall" | "composite_risk")
VALIDATION: Strict TypeScript VarId / AreaVarId typing.
PROCESSING: Toggles displayedWeatherLayers visibility; enables /weather-layers polling hook if activeVar !== "none".
MODEL / API: Backend colormaps target grid and encodes as Base64 PNG.
GUI OUTPUT: Selected weather raster displays over India; corresponding gradient legend displays in LayersDrawer.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| INPUT 6: Base Map Dropdown Selector                                                                                                |
+------------------------------------------------------------------------------------------------------------------------------------+
SOURCE COMPONENT: LayersDrawer.tsx
INPUT TYPE: Categorical string ("none" | "lulc_india" | "dem" | "bhuvan" | "osm" | "natural_earth" | "black_marble" | "true_marble")
VALIDATION: Verified against BASE_LAYERS catalog in mosdacLayers.ts.
PROCESSING: Toggles MapLibre raster layer visibility.
MODEL / API: If "bhuvan", tiles route through `/wms-proxy/bhuvan`; others fetch directly from MOSDAC GeoServer.
GUI OUTPUT: Immediate background map replacement beneath all meteorological layers.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| INPUT 7: Thematic GIS Overlay Checkboxes                                                                                           |
+------------------------------------------------------------------------------------------------------------------------------------+
SOURCE COMPONENT: LayersDrawer.tsx
INPUT TYPE: Set<string> of active WMS layer identifiers
VALIDATION: Matched against OVERLAY_LAYERS catalog (16 layers).
PROCESSING: Toggles individual MapLibre raster layer visibility without re-fetching tiles.
MODEL / API: Directly streams tiles from MOSDAC GeoServer using `{bbox-epsg-3857}` template.
GUI OUTPUT: Roads, drainage basins, landslide susceptibility, or rivers render above basemap and below hazards.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| INPUT 8: Model Architecture Switcher                                                                                               |
+------------------------------------------------------------------------------------------------------------------------------------+
SOURCE COMPONENT: LayersDrawer.tsx, ForecastPage.tsx, BottomPanel.tsx
INPUT TYPE: Categorical string: ModelId = "pysteps" | "dgmr" | "smaat"
VALIDATION: DGMR button disabled if `dgmrUnavailable === true`; SmaAt returns training disclaimer.
PROCESSING: Mutates model state; resets leadMinutes to 0 (since DGMR horizon is 90m vs pySTEPS 360m).
MODEL / API: Calls /forecast?model=... and /nowcast-frame?model=...
GUI OUTPUT: Scrubber max limit changes; TrendChart recalculates curve; model frame overlay swaps.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| INPUT 9: Automated Play / Pause Scrubber Engine                                                                                    |
+------------------------------------------------------------------------------------------------------------------------------------+
SOURCE COMPONENT: Top toolbar scrubber button, Replay console play button
INPUT TYPE: Boolean toggle (isPlaying: true | false)
VALIDATION: Interval bound to active model's step size (10m for pySTEPS, 5m for DGMR).
PROCESSING: Sets up 1000ms window.setInterval; advances leadMinutes by step on each tick; wraps to 0 at max.
MODEL / API: Sequentially requests advected hazards, predictive frames, and weather fields.
GUI OUTPUT: Smooth continuous playback of storm evolution over time.
```

```
+------------------------------------------------------------------------------------------------------------------------------------+
| INPUT 10: GeoJSON Export Trigger                                                                                                   |
+------------------------------------------------------------------------------------------------------------------------------------+
SOURCE COMPONENT: LeftSidebar.tsx ("Export Hazards (GeoJSON)" button)
INPUT TYPE: User click event
VALIDATION: Disabled if hazards is null or features empty.
PROCESSING: Serializes current hazards state into JSON string; constructs Blob; creates temporary <a> download anchor; triggers click.
MODEL / API: Client-side synthesis (no backend roundtrip).
GUI OUTPUT: Browser downloads `hazards-YYYY-MM-DDTHH-MM-SS.geojson` to local filesystem.
```

---

## 9. Processing Flow

### 9.1 Data Pipeline & Latency Characteristics
```
[Ingestion Sources]
  ├── RainViewer Radar Mosaic  --> ~10-15s fetch (All-India tiles decode to dBZ array)
  ├── Blitzortung.org MQTT     --> ~6-12s listen window (VLF TCP packet stream)
  ├── ECMWF Open Data HRES     --> ~5-8s cold download (3 GRIB files: temp, wind, pressure)
  ├── Tomorrow.io Weather API  --> ~1-2s HTTP REST (10 station coordinates)
  └── Copernicus Sentinel-3    --> ~10-20s CDSE OAuth2 download (NetCDF/TIFF SLSTR F1)
            │
            ▼
[Background Worker Threads (main.py)]
  ├── '_india_hazards_loop' (Every 180s):
  │     1. Fetches RainViewer reflectivity grid (150x150)
  │     2. Listens for real Blitzortung strikes (12s window)
  │     3. Runs 'hazard_india.detect':
  │        - Flag hail if reflectivity >= 55 dBZ
  │        - Assign low/mod/high severity based on dBZ thresholds
  │        - Bump severity if strike within 25km
  │        - Map to nearest district centroid via vectorized Euclidean distance
  │     4. Evaluates Twilio SMS alert thresholds & sends notifications
  │     5. Caches output in '_india_hazards_cache'
  │
  └── '_region_prewarm_loop' (Every 15 min):
        1. Sequentially warms all 10 REGIONS in settings.py
        2. Executes thread-local 'override_active_region(key)'
        3. Runs pySTEPS Lucas-Kanade optical flow on 64x64 grid
        4. Stashes warm snapshot in '_region_snapshots[key]'
            │
            ▼
[FastAPI Request Handlers (:8000)]
  ├── GET /hazards?lead_time=N:
  │     - Reads '_india_hazards_cache'
  │     - If lead_time > 0: advects coordinates by ECMWF wind vector:
  │         dlat = (speed * time * cos(dir + 180)) / 111.0
  │         dlon = (speed * time * sin(dir + 180)) / (111.0 * cos(lat))
  │     - Returns GeoJSON FeatureCollection
  │
  ├── GET /weather-layers?lead_time=N:
  │     - Reads ECMWF grid at target lead step
  │     - Derives rainfall rate from radar via Marshall-Palmer: R = ((10^(dBZ/10))/200)^(1/1.6)
  │     - Computes Composite Convective Risk Index (P1 feature)
  │     - Color-maps arrays via Matplotlib ('turbo', 'plasma', 'magma', etc.)
  │     - Encodes PNG into base64 Data URL
  │
  └── GET /nowcast-frame?model=...&lead_time=N:
        - Retrieves cached pySTEPS or DGMR array at nearest lead index
        - Normalizes and color-maps to Base64 PNG
            │
            ▼
[React 18 Dashboard UI (:5173)]
  ├── 'useHazards(leadMinutes)' polls /hazards every 30s
  ├── 'useInterval' guarantees immediate re-fetch on leadMinutes change
  ├── MapCanvas updates GeoJSON sources and Marker DOM elements
  └── GPU composites glowing CSS pulse animations
```

---

## 10. Output Analysis

### 10.1 Output Formats & Payload Schemas

#### Output 1: Hazard Point GeoJSON FeatureCollection (`/hazards`)
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [73.856, 18.520]
      },
      "properties": {
        "hazards": [
          {
            "type": "hail",
            "severity": "high",
            "reflectivity_dbz": 62.4,
            "district": "Pune",
            "state": "Maharashtra",
            "source": "real"
          }
        ],
        "lead_minutes": 0
      }
    }
  ],
  "lead_time_minutes": 0,
  "note": "real hail (RainViewer) + lightning (Blitzortung) across all of India"
}
```

#### Output 2: Tactical Storm Cell ETA Object (`/storm-eta`)
```json
{
  "cells": [
    {
      "station_id": "DEL_001",
      "name": "Delhi Safdarjung",
      "lat": 28.58,
      "lon": 77.21,
      "bearing_deg": 65.2,
      "speed_kmh": 32.4,
      "distance_km": 18.6,
      "eta_minutes": 34.4,
      "hazards": [
        { "type": "hail", "severity": "high", "reflectivity_dbz": 58.0 }
      ],
      "motion_source": "pysteps"
    }
  ]
}
```

#### Output 3: Weather Grid Raster Response (`/weather-layers`)
```json
{
  "layers": [
    {
      "id": "temperature",
      "label": "Temperature",
      "unit": "°C",
      "bbox": [68.0, 6.5, 97.5, 37.0],
      "vmin": 18,
      "vmax": 34,
      "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimT4V..."
    },
    {
      "id": "rainfall",
      "label": "Rain rate (from real radar)",
      "unit": "mm/hr",
      "bbox": [68.0, 6.5, 97.5, 37.0],
      "vmin": 0,
      "vmax": 65,
      "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimT4V..."
    }
  ],
  "note": "real ECMWF Open Data (HRES, CC-BY-4.0)",
  "source": "ecmwf-opendata"
}
```

#### Output 4: Spatial Area Diagnostic Object (`/area-forecast`)
```json
{
  "temperature_c": { "min": 24.2, "mean": 28.6, "max": 31.8 },
  "humidity_pct": { "min": 65.0, "mean": 82.4, "max": 94.0 },
  "wind_speed_ms": { "min": 2.1, "mean": 6.4, "max": 14.8 },
  "pressure_hpa": { "min": 998.2, "mean": 1004.1, "max": 1008.5 },
  "cloudburst_rainrate_mm_hr": { "min": 0.0, "mean": 8.2, "max": 36.4 },
  "lead_minutes": 0,
  "bbox": [73.5, 18.2, 74.3, 18.9]
}
```

#### Output 5: Twilio SMS Alert Payload
```text
MEGHDRISHTI ALERT: HIGH hail hazard detected near Pune, Maharashtra. 4 hail + 2 lightning detection(s) nearby.
```

---

## 11. Weather Visualization Analysis

### 11.1 Atmospheric Variables Matrix
| Variable | Visual Colormap | Data Range | Scientific Rationale | GUI Rendering Layer |
|---|---|---|---|---|
| **Atmospheric Temperature** | Matplotlib `RdYlBu_r` (Blue to Red) | $18^\circ\text{C} - 34^\circ\text{C}$ | Standard meteorological heat ramp; intuitive blue=cool, red=hot | MapLibre Image Raster (`layer-temperature`) |
| **Relative Humidity** | Matplotlib `YlGnBu` (Yellow to Deep Blue) | $0\% - 100\%$ | High moisture reads as saturated dark blue; dry air reads as pale yellow | MapLibre Image Raster (`layer-humidity`) |
| **Wind Speed** | Matplotlib `plasma` (Purple to Yellow) | $0 - 18\text{ m/s}$ | High kinetic energy highlighted by luminous yellow | MapLibre Image Raster (`layer-wind_speed`) |
| **MSL Pressure** | Matplotlib `coolwarm` (Blue to Red) | $995 - 1015\text{ hPa}$ | Low pressure centers (cyclonic/storm cores) stand out against synoptic background | MapLibre Image Raster (`layer-pressure`) |
| **Rain Rate (Radar Z-R)** | Matplotlib `turbo` (Blue-Green-Yellow-Red) | $0 - 65\text{ mm/hr}$ | IMD / WMO standard radar precip ramp; extreme rain rate visible in red | MapLibre Image Raster (`layer-rainfall`) |
| **Convective Risk Index (P1)** | Matplotlib `magma` (Black-Violet-White) | $0 - 5\text{ Index}$ | High-consequence multi-hazard convergence glows white-hot | MapLibre Image Raster (`layer-composite_risk`) |
| **Wind Direction Field** | Local SDF Arrow Glyphs | $0^\circ - 360^\circ$ | Vector rotation indicates steering flow; size scales with velocity ($2-16\text{ m/s}$) | MapLibre Symbol Layer (`wind-arrow-layer`) |

---

## 12. Storm Visualization Analysis

### 12.1 Convective Hazard Encodings
- **Hail Detection ($55\,\text{dBZ}$ core, $<210\,\text{K}$ cloud top, lightning):**
  - *Color:* Purple (`#b565f5`, RGB `182, 101, 245`).
  - *Representation:* On the national map, represented by pulsing severity dots (yellow/red). In regional views and cards, encoded in distinctive purple. Communicates severe hydrometeors (frozen hail cores aloft).
- **Downburst ($V_r$ couplet delta $\ge 25\,\text{m/s}$):**
  - *Color:* Crimson Coral (`#f5486b`, RGB `245, 72, 107`).
  - *Representation:* Displayed as red hazard cards and couplet markers. Encodes violent divergent wind outflow threatening aircraft takeoff/landing.
- **Cloudburst (Extrapolated rain rate $\ge 15\,\text{mm/hr}$):**
  - *Color:* Cyan Blue (`#2fb0e0`, RGB `47, 176, 224`).
  - *Representation:* Displayed as blue hazard cards and raster hot-spots. Identifies flash-flood risks where rain rate exceeds the IMD "very heavy rainfall" benchmark.
- **Lightning Strike Cluster (IMD Category 19 / VLF Strike):**
  - *Color:* Electric Amber (`#f0b429`).
  - *Representation:* Pulsing dual-ring markers on map canvas and amber sidebar threat cards. Represents immediate cloud-to-ground strike risk.

---

## 13. Data Visualization Analysis

### 13.1 Visualization Inventory
1. **Interactive Geospatial Surface (MapLibre GL):**
   - *Encoding:* Spatial map projection (Web Mercator EPSG:3857).
   - *Strengths:* Renders multi-layer raster imagery, WMS tiles, and DOM markers simultaneously with 60 FPS hardware acceleration.
   - *Weaknesses:* Extreme visual density can cause visual collisions between wind arrows, raster heatmaps, and markers if all layers are simultaneously active.
2. **Pulsing Marker Ring Animation (CSS GPU Animation):**
   - *Encoding:* Concentric expanding circles with opacity decay (`hazard-pulse-ring`).
   - *Strengths:* Solves the "static pin fatigue" problem; immediately signals live ongoing convective activity.
   - *Weaknesses:* Requires DOM markers; scaling to thousands of points would cause DOM node overhead (currently mitigated by clustering at district resolution).
3. **Custom Non-Scaling SVG Sparkline (`TrendChart.tsx`):**
   - *Encoding:* Scalable SVG line + area polygon with circular vertices.
   - *Strengths:* Zero npm bundle overhead (hand-coded math in 59 lines of code); crisp rendering at any resolution via `vectorEffect="non-scaling-stroke"`.
   - *Weaknesses:* Lacks interactive crosshair hover tooltip for exact coordinate interpolation.
4. **Forecast Severity Risk Buckets (RightSidebar):**
   - *Encoding:* 4 discrete temporal blocks ($0-1\text{h}, 1-2\text{h}, 2-4\text{h}, 4-6\text{h}$) with dynamic background tint (`${color}22`) and border tint (`${color}66`).
   - *Strengths:* Translates complex continuous rain-rate forecasts into instant decision buckets (Low / Moderate / High) for non-technical emergency planners.

---

## 14. Visual Design System

### 14.1 Surface Architecture & Depth
The interface employs a **Glassmorphic Sci-Fi / Tactical Command Architecture**:
- **Background Layer (`--bg`):** Deepest void black-blue (`#060910` in dashboard, `#050B1A` in landing page).
- **Glass Panel Surface (`--panel-glass`):** Translucent obsidian (`rgba(11, 16, 26, 0.85)`) coupled with hardware-accelerated background blur (`backdrop-filter: blur(12px)`).
- **Solid Panel Surface (`--panel`):** Dense dark navy (`rgba(13, 18, 28, 0.95)`).
- **Structural Borders (`--panel-border`):** Subtle desaturated steel blue (`rgba(43, 55, 78, 0.5)`).
- **Soft Borders (`--panel-border-soft`):** Muted container boundaries (`rgba(43, 55, 78, 0.3)`).
- **Elevation Shadows:** Deep volumetric box shadows (`box-shadow: 0 8px 24px rgba(0,0,0,0.5)`).

---

## 15. Typography System

### 15.1 Font Families & Hierarchy
- **Primary Interface Font:** `"Inter", system-ui, -apple-system, sans-serif` (Imported via Google Fonts).
- **Telemetry & Numerical Font:** `"JetBrains Mono", monospace` (Used for coordinates, timestamps, dBZ metrics, wind speeds, and rain rates).

| Role | Font Family | Weight | Size | Line Height | Letter Spacing | Color |
|---|---|---|---|---|---|---|
| **Landing Hero H1** | Inter | 800 (Bold) | `clamp(46px, 5.5vw, 78px)` | 1.05 | `-0.03em` | Gradient (`#22D3EE` $\rightarrow$ `#8B5CF6`) |
| **Section H2** | Inter | 800 (Bold) | `clamp(28px, 3.5vw, 46px)` | 1.15 | `-0.02em` | `#F8FAFC` |
| **Section Eyebrow**| Inter | 700 (Bold) | `10px` | 1.0 | `0.22em` | `#22D3EE` |
| **Card Header** | Inter | 700 (Bold) | `13px - 15px` | 1.2 | Normal | `#FFFFFF` |
| **TopBar Title** | Inter | 700 (Bold) | `15px` | 1.2 | `0.2px` | `#FFFFFF` |
| **Metric Value** | JetBrains Mono| 700 (Bold)| `18px - 20px` | 1.0 | Monospace | `#FFFFFF` / Accent |
| **Sidebar Labels** | Inter | 600 (Medium)| `11px - 12px` | 1.3 | Normal | `--text-dim` (`#8a9bb3`) |
| **Table Data** | Inter / Mono | 500 / 600 | `12px` | 1.4 | Normal | `#e5edf7` |
| **Status Footnote**| Inter | 400 (Regular)| `9px - 10px` | 1.4 | `0.4px` | `--text-faint` (`#566782`) |

---

## 16. Color System

### 16.1 Design Tokens
```css
:root {
  /* Surfaces */
  --bg: #060910;
  --panel: rgba(13, 18, 28, 0.95);
  --panel-glass: rgba(11, 16, 26, 0.85);
  --panel-border: rgba(43, 55, 78, 0.5);
  --panel-border-soft: rgba(43, 55, 78, 0.3);

  /* Typography */
  --text: #e5edf7;
  --text-dim: #8a9bb3;
  --text-faint: #566782;

  /* Primary Brand & Accents */
  --accent: #3fb6ff;
  --accent-glow: rgba(63, 182, 255, 0.2);

  /* Meteorological Hazard Semantics */
  --hail: #b565f5;       /* Electric Lavender */
  --downburst: #f5486b;  /* Crimson Coral */
  --cloudburst: #2fb0e0; /* Atmospheric Cyan */
  --lightning: #f0b429;  /* Vivid Gold */

  /* Operational Alert Severity */
  --ok: #34d399;         /* Emerald Green (Low) */
  --warn: #f0b429;       /* Amber Gold (Moderate) */
  --danger: #ef4444;     /* Signal Red (High) */

  /* Geometry */
  --radius: 12px;
  --radius-sm: 6px;
}
```

---

## 17. Layout System

### 17.1 Viewport Partitioning & Coordinates
The operational dashboard implements a **Rigid 5-Pane Grid/Flex Shell**:
```text
+---------------------------------------------------------------------------------------------------+
| TopBar (h: 52px, w: 100vw, z: 20)                                                                 |
+----+-----------------------------------------------------------------------------------------+----+
| L  | LeftSidebar     | MapCanvas Viewport (Center)                             | RightSidebar| R  |
| E  | (w: 320px)      |                                                         | (w: 320px)  | A  |
| F  |                 | [Top Floating Toolbar: Layer Buttons & Scrubber]        |             | I  |
| T  | - Region Picker |                                                         | - Hazards   | L  |
|    | - Pipeline      |                                                         | - Storm ETA |    |
| N  | - Sources       |                                                         | - 6h Buckets|    |
| A  | - Hazard Counts |                                                         |             |    |
| V  | - Model Spec    |                                                         |             |    |
|    | - Export Tool   |                                                         |             |    |
| (w:|                 | [Bottom Floating HUD: Region / Area Inspector Cards]    |             |    |
| 60)|                 |                                                         |             |    |
+----+-----------------+---------------------------------------------------------+-------------+----+
| BottomPanel (h: 180px, w: 100vw, z: 10)                                                           |
| [Timeline Stepper & Slider] | [Rain-rate Sparkline] | [Station Hazards Log] | [Replay Launcher]   |
+---------------------------------------------------------------------------------------------------+
```

---

## 18. Motion & Animation System

### 18.1 Keyframe Choreography
```
+--------------------------------------------------------------------------------------------------------------------+
| ANIMATION 1: Dual-Ring Hazard Pulse (hazard-pulse-ring)                                                            |
+--------------------------------------------------------------------------------------------------------------------+
TRIGGER: Mounted hazard marker on MapLibre canvas
INITIAL STATE: width: 10px, height: 10px, opacity: 0.9, border: 2px solid var(--hazard-color)
MOTION: Concentric radial expansion with non-linear opacity fadeout
TIMING: 1.8 seconds duration, infinite iteration
EASING: cubic-bezier(0.2, 0.6, 0.4, 1)
FINAL STATE: width: 34px, height: 34px, opacity: 0
OFFSET DELAY: Second ring element has animation-delay: 0.9s (creates continuous ripple echo every 900ms)
PURPOSE: Informational & attention-directing; signals active, dangerous convective event.
```

```
+--------------------------------------------------------------------------------------------------------------------+
| ANIMATION 2: System Health Status Pulse (pulse / hp-pulse-dot)                                                     |
+--------------------------------------------------------------------------------------------------------------------+
TRIGGER: System operational status dot in TopBar and landing nav
INITIAL STATE: opacity: 1, box-shadow: 0 0 0 2px rgba(34,197,94,0.3)
MOTION: Subtle opacity breathing with expanding shadow ring
TIMING: 2.0 seconds duration, infinite iteration
EASING: ease-in-out
FINAL STATE: opacity: 0.45, box-shadow: 0 0 0 4px rgba(34,197,94,0.08)
PURPOSE: Reassures operator that real-time heartbeat is alive.
```

```
+--------------------------------------------------------------------------------------------------------------------+
| ANIMATION 3: Landing Card Entrance Reveal (hp-card-reveal)                                                         |
+--------------------------------------------------------------------------------------------------------------------+
TRIGGER: Component mount (60ms timeout trigger)
INITIAL STATE: opacity: 0, transform: translateY(22px)
MOTION: Vertical upward translation with smooth alpha fade-in
TIMING: 1.1 seconds duration, single execution (forwards fill)
EASING: cubic-bezier(0.2, 0.6, 0.4, 1)
FINAL STATE: opacity: 1, transform: translateY(0)
PURPOSE: Aesthetic delight; smooth editorial arrival.
```

```
+--------------------------------------------------------------------------------------------------------------------+
| ANIMATION 4: Automated Timeline Advance (playRef Interval)                                                         |
+--------------------------------------------------------------------------------------------------------------------+
TRIGGER: User clicks Play icon in top toolbar or bottom panel
INITIAL STATE: leadMinutes = current
MOTION: leadMinutes increments by step size every 1000ms; wraps to 0 at LEAD_MAX
TIMING: 1000ms discrete interval tick
EASING: Linear discrete step
FINAL STATE: leadMinutes resets to 0 upon reaching 360m (pySTEPS) or 90m (DGMR)
PURPOSE: Simulates radar loop animation over forecast window.
```

---

## 19. Interaction Model

### 19.1 Interaction Taxonomy
- **Map Navigation:** Left-click drag pans camera; scroll wheel zooms; right-click drag pitches/rotates.
- **Point Querying:** Left-click on any map location queries `/region-forecast` and mounts `RegionFloating` HUD.
- **Area Drag-Selection:** Clicking "Select area" converts cursor to crosshair, disables map panning, and tracks mouse drag rectangle to query `/area-forecast`.
- **Temporal Scrubbing:** Clicking Bottom Panel circle dials jumps to specific hours ($0\text{h}, +1\text{h}, \dots, +6\text{h}$); dragging slider scrubs continuously; Play button triggers auto-playback.
- **Modal Swapping:** Clicking LeftNavigation icons opens full-screen sheets; clicking active icon or close button returns cleanly to map canvas.
- **Spatial Fly-To:** Clicking any row in the `HazardsPage` table automatically closes the ledger and executes `map.flyTo()` to center on the hazard.

---

## 20. State Analysis

### 20.1 Comprehensive System States
```
+-------------------------------------------------------------------------------------------------------------------------+
| STATE: NORMAL (Standard Operation)                                                                                      |
| Visual: TopBar shows green "Live" badge; map renders pulsing hazard markers; LeftSidebar shows "Live" / "Active".       |
| Actions Available: Pan, zoom, inspect coordinates, drag area, scrub lead time, open drawers/modals.                     |
+-------------------------------------------------------------------------------------------------------------------------+
| STATE: LOADING (Data Ingestion / Cold Fetch)                                                                            |
| Visual: AreaFloating displays "Loading — the first fetch can take a few seconds…"; ForecastPage displays "Loading…".     |
| Actions Available: Map navigation remains fluid; background worker fetches GRIB/NetCDF tiles.                           |
+-------------------------------------------------------------------------------------------------------------------------+
| STATE: HIGH / EXTREME RISK                                                                                              |
| Visual: Red glowing hazard markers (`.hazard-marker-high`) pulse with enhanced glow (`0 0 14px 4px var(--hazard-color)`);|
| RightSidebar displays red High badges; Twilio SMS alerts dispatch to configured emergency phone numbers.                 |
+-------------------------------------------------------------------------------------------------------------------------+
| STATE: OFFLINE / API FAILURE                                                                                            |
| Visual: TopBar displays red "Offline" badge; Banner component drops down: "Can't reach the backend at ... — start it...";|
| LeftSidebar displays "Unreachable" and "Down" indicators.                                                               |
| User Feedback: Clear bash startup command provided directly in GUI banner.                                              |
+-------------------------------------------------------------------------------------------------------------------------+
| STATE: MODEL FAILURE (DGMR Unavailable)                                                                                 |
| Visual: In LayersDrawer and ForecastPage, DGMR segmented button is disabled; displays "DGMR unavailable in this backend |
| process (see server log)". pySTEPS baseline continues functioning unimpeded.                                            |
+-------------------------------------------------------------------------------------------------------------------------+
| STATE: NO DATA / EMPTY STATE                                                                                            |
| Visual: RightSidebar shows "No active hazards this cycle."; HazardsPage shows "No hazards match this filter.";           |
| ReplayPage shows explanatory text that snapshots accumulate every 15 minutes.                                           |
+-------------------------------------------------------------------------------------------------------------------------+
```

---

## 21. Performance & Throughput Analysis

### 21.1 Performance Forensic Observations
- **Initial Load & Time-to-Interactive (TTI):** Vite builds an unbundled dev bundle in $<300\text{ms}$. Browser loads DOM and initializes MapLibre WebGL context within $\sim 400 - 800\text{ms}$.
- **Data Fetching Pipeline Cadence:**
  - National Hazard Cache Refresh: 180 seconds (`_INDIA_HAZARDS_TTL_SECONDS`).
  - Pre-Warm Regional Ingest Cadence: 15 minutes (`INGEST_CYCLE_MINUTES`).
  - Frontend Polling Hooks: 30 seconds (`POLL_MS` in `useNowcastData.ts`).
  - Immediate Re-Triggering: Changing `leadMinutes` resets the timer and executes immediate re-fetch via `useInterval`.
- **Rendering & Animation Workload:**
  - CSS GPU Animations: Dual-ring pulsing markers use CSS transforms and opacity, offloading animation overhead from the main JavaScript thread to the GPU compositor.
  - SVG Sparklines: Lightweight vector generation in `TrendChart.tsx` requires zero canvas redraw loops.
  - MapLibre WebGL: Raster overlays reprojected natively via GPU shaders.
- **Computational Bottlenecks (Backend):**
  - ECMWF Cold-Fetch: First request to `/weather-layers` or `/area-forecast` with `USE_LIVE_ECMWF=true` requires downloading three GRIB files, taking $4 - 9\text{ seconds}$ before in-process caching warms.
  - DGMR CPU Inference: Takes $\sim 3 - 11\text{ seconds}$ per forecast on CPU.
- **Measurability Limitation:**
  - *Explicit Notation:* Exact client frame rendering times (FPS) and memory heap consumption under multi-hour continuous execution are **not directly measurable from repository inspection**.

---

## 22. Functional Use Cases

### 22.1 Sector Operational Mapping
| Sector | Persona | Input Action | System Computation | Received Output | Decision Supported |
|---|---|---|---|---|---|
| **Disaster Management** | NDRF Incident Commander | Opens Dashboard / Hazards Page | Fuses all-India radar & Blitzortung lightning; groups by district centroids | District risk summary table, high-severity alert count, Twilio SMS | Immediate deployment of relief teams and storm shelter activations |
| **Aviation Operations** | Flight Dispatcher | Inspects target airport city (e.g. Delhi / Pune) | pySTEPS optical flow motion field derivation | Storm bearing, velocity ($\text{km/h}$), distance, and precise ETA minutes | Delaying departures, holding patterns, or routing around storm core |
| **Agriculture** | Regional KVK Agricultural Officer | Scrubs 0–6h timeline over crop belt | Extrapolates rain rate and hail probability over lead time | 6-hour rain-rate forecast curve, hail zone displacement | Advising farmers to secure harvested crops and pause spraying operations |
| **Municipal Drainage** | Urban Hydrologist | Click-drags bounding box over urban basin | Computes spatial min/mean/max rainfall and cloudburst risk | Mean basin rain rate ($\text{mm/hr}$) and cloudburst exceedance | Activating stormwater pumping stations and floodgates |

---

## 23. Responsive Behavior

### 23.1 Viewport Breakpoints & Adaptation
- **Desktop Ultrawide / Large Monitor ($>1440\text{px}$):** Default full operational layout. Both Left and Right sidebars ($320\text{px}$ each) remain pinned; central map canvas occupies remaining viewport; bottom panel ($180\text{px}$) docked.
- **Standard Laptop / Desktop ($1025\text{px} - 1440\text{px}$):** Landing page nav padding reduces to $40\text{px}$; hero grid adjusts font clamp; dashboard maintains full pane layout.
- **Tablet / Small Laptop ($641\text{px} - 1024\text{px}$):**
  - Landing Page: Nav links hide; hamburger appears; hero switches to 1-column stack; stat strip becomes 2x2 grid; scroll hint hides.
  - Dashboard: Fixed desktop architecture requires horizontal viewport scrolling if width $<1200\text{px}$.
- **Mobile (<640px):**
  - Landing Page: Hamburger menu opens full-width dropdown; hero buttons stack vertically; stat strip becomes 1-column stack; pipeline visualizer switches to vertical sequence without connectors.
  - Dashboard: Not optimized for small mobile screens; high information density requires desktop display.

---

## 24. Accessibility Analysis

### 24.1 Accessibility Forensic Audit
- **Semantic Structure:** Landing page features proper HTML5 landmarks (`role="banner"`, `<nav aria-label="Main navigation">`, `<section aria-label="Hero section">`, `<footer role="contentinfo">`, `role="list"`, `role="listitem"`).
- **Live Regions:** Live status pills declare `aria-live="polite"` ensuring screen readers announce status transitions without interrupting speech.
- **Color Contrast:** Muted text tokens (`#64748B`, `#566782`) against deep black (`#060910`) exhibit contrast ratios around $3.5:1 - 4.2:1$, which falls below WCAG AAA standards for body text, though primary text (`#e5edf7`, `#FFFFFF`) achieves excellent $>12:1$ contrast.
- **Keyboard Navigation Limitations:** Modal sheets (`HazardsPage`, `ForecastPage`, `ReplayPage`) lack strict focus-trap implementations; pressing Tab can cycle behind the modal into the map controls.
- **Reduced Motion Gaps:** CSS keyframe animations (`hazard-pulse-ring`, `hp-pulse-dot`, `hp-scroll-bounce`) lack `@media (prefers-reduced-motion: reduce)` media query overrides, meaning users with vestibular motion disorders cannot disable pulsing effects.

---

## 25. Technical GUI Traceability

### 25.1 End-to-End Architectural Trace
| GUI Visual Element | React Component | Source File Path | Hook / State Trigger | Backend Endpoint | Upstream Data Engine |
|---|---|---|---|---|---|
| **Pulsing Hazard Pins** | `HazardLayers` | `src/map/layers/HazardLayers.tsx` | `useHazards(leadMinutes)` | `GET /hazards?lead_time=N` | `hazard_india.detect()` (RainViewer + Blitzortung) |
| **Station Popups** | `HazardLayers` | `src/map/layers/HazardLayers.tsx` | MapLibre click event | `GET /hazards` | `nowcast.ingestion.imd_nowcast` |
| **Demo Region Picker** | `RegionPicker` | `src/components/LeftSidebar.tsx` | `api.setRegion(key)` | `POST /regions/{key}` | `settings.set_active_region()` + Prewarm Cache |
| **Tactical Storm Motion** | `RightSidebar` | `src/components/RightSidebar.tsx` | `useStormEta()` | `GET /storm-eta` | `eta.storm_cells()` + pySTEPS LK Motion |
| **Rain-rate Sparkline** | `TrendChart` | `src/components/TrendChart.tsx` | `useForecastSummary(model)` | `GET /forecast?model=...` | `pysteps_baseline.run_forecast()` |
| **Temporal Scrubber** | `BottomPanel` | `src/components/BottomPanel.tsx` | `setLeadMinutes(m)` | Parameter dispatch | Multi-endpoint parameter propagation |
| **Point Readout HUD** | `RegionFloating`| `src/components/RegionFloating.tsx` | `api.regionForecast(...)` | `GET /region-forecast` | `weather_fields.sample_point()` (ECMWF) |
| **Area Statistics HUD** | `AreaFloating` | `src/components/AreaFloating.tsx` | `api.areaForecast(...)` | `GET /area-forecast` | `weather_fields.area_stats()` (ECMWF) |
| **WMS Base Maps** | `WmsBaseLayer` | `src/map/layers/WmsBaseLayer.tsx` | `baseMapId` state | `GET /wms-proxy/bhuvan` | MOSDAC GeoServer & NRSC Bhuvan |
| **WMS Thematic Overlays**| `WmsOverlayLayers`| `src/map/layers/WmsOverlayLayers.tsx`| `activeOverlayIds` Set | Direct WMS GetMap | MOSDAC CloudBurst DSS GeoServer |
| **Wind Arrows** | `WindArrows` | `src/map/layers/WindArrows.tsx` | `useWindVectors(...)` | `GET /wind-vectors` | `weather_fields.wind_vector_points()` |
| **Predictive Radar Frame**| `ModelFrameLayer`| `src/map/layers/ModelFrameLayer.tsx`| `useNowcastFrame(...)` | `GET /nowcast-frame` | pySTEPS Extrapolation / DeepMind DGMR |
| **Historical Replay** | `ReplayPage` | `src/components/ReplayPage.tsx` | `api.historyHazards(...)`| `GET /history/hazards` | `fusion.build_fused_frame_for_timestamp` |
| **Hazards Ledger** | `HazardsPage` | `src/components/HazardsPage.tsx` | `useHazards()` | `GET /hazards` | Full-country hazard database |

---

## 26. Existing Strengths

1. **Dual Spatial Architecture:** Gracefully reconciles national overview monitoring (RainViewer mosaic across all India) with localized convective storm simulation (high-res pySTEPS/DGMR demo grid).
2. **GPU-Accelerated Pulsing Visual Markers:** HTML Marker rings utilizing pure CSS keyframe animations bypass JavaScript canvas redraw overhead while providing unmistakable visual urgency.
3. **Genuine ISRO / MOSDAC WMS Integration:** Incorporates 23 real government geospatial layers reverse-engineered from MOSDAC's live CloudBurst DSS, providing unmatched domain authenticity.
4. **Zero-Dependency SVG Charting (`TrendChart.tsx`):** Hand-crafted 59-line vector generator completely avoids heavy graphing libraries (Chart.js, Recharts, D3) while maintaining pixel-perfect responsiveness.
5. **Decoupled Steering Flow Advection:** Solves the lack of national forecast radar sequences by physically advecting detected storm coordinates using real ECMWF wind vectors over lead times.
6. **Graceful Failure-Isolated Architecture:** Every live data source (Tomorrow.io, RainViewer, Blitzortung, ECMWF, Copernicus) is isolated with automated fallback to synthetic generators, guaranteeing zero application crashes during external API outages.
7. **Thread-Safe Regional Pre-Warming:** Background worker keeps snapshots of all 10 cities warm in memory, allowing instant zero-latency switching between regions.

---

## 27. Existing Friction Points

1. **Spatial Paradigm Duality Confusion:** Users may wonder why the national map only displays Hail and Lightning, whereas the Right Sidebar threat cards show Downburst and Cloudburst. The separation between country-scale real data and city-scale simulated physics is scientifically documented but visually subtle.
2. **Full Page Reload on City Switch:** Selecting a new demo region in `LeftSidebar.tsx` executes `window.location.reload()`. While this guarantees clean state teardown, it flashes the browser and disrupts the operator's immersion.
3. **Disabled Settings Action:** The LeftNavigation rail contains a visible "Settings" button with `opacity: 0.35` and `cursor: not-allowed`, leaving an unfinished impression.
4. **Desktop-Centric Responsive Penalty:** The Operations Dashboard (`App.tsx`) is hardcoded to a fixed-pane layout requiring horizontal scrolling on screens under $1200\text{px}$, making tablet operations difficult.
5. **Missing Keyboard Shortcuts:** Power operators cannot toggle layers or scrub lead times via keyboard shortcuts (e.g. Space to play/pause, Left/Right arrow keys to step lead time).

---

## 28. Complete GUI Blueprint

```text
====================================================================================================
MEGHDRISHTI OPERATIONAL GUI BLUEPRINT
====================================================================================================

+--------------------------------------------------------------------------------------------------+
| TOPBAR: Brand Mark | MeghDrishti (SIH 2026) | [● Live] Last Update: 03:04:35 AM | [📍 Pune, MH]  |
+----+----------------------------------------------------------------------------------------+----+
| N  | LEFT SIDEBAR (320px)           | MAP VIEWPORT (Center Fluid Canvas)                     | R  |
| A  |                                |                                                        | I  |
| V  | [Demo Region Dropdown]         | [Top Toolbar: Layers & Select Area] [Time Scrubber]   | G  |
|    | Pune, Maharashtra              | [Radar] [Sat] [Lightn] [Hazards] [Topo] [Select Area]  | H  |
| (60|                                | Lead: +1h 0m  [▶] [========O========] 6h               | T  |
| px)| [Pipeline Status]              |                                                        |    |
|    | Backend API: ● Live            |                                                        | S  |
| [H]| Updated: 03:04:30 AM           |                                                        | I  |
| [L]|                                |                                                        | D  |
| [F]| [Data Sources]                 |                                                        | E  |
| [Z]| Doppler Radar: ● Active        |            ((●)) Red Pulsing Marker                    | B  |
| [P]| Satellite IR: ● Active         |                                                        | A  |
|    | Lightning: ● Active            |                     ((●)) Yellow Marker                | R  |
|    |                                |                                                        |    |
|    | [Active Hazards (now)]         |                                                        | (32|
|    | Hail: 16 zones                 |                                                        | 0px|
|    | Lightning: 4 zones             |                                                        | )  |
|    |                                |                                                        |    |
|    | [Model Info]                   |                                                        | [T]|
|    | Model: pySTEPS                 |                                                        | [E]|
|    | Resolution: 1-3 km grid        |                                                        | [L]|
|    | Horizon: 0-6 hours             | [Legends (Top Right)]                                  | [E]|
|    | Interval: 15 min               | Radar: [=====Gradient=====] 10-70 dBZ                  | [M]|
|    |                                | Severity: ● High  ● Moderate  ● Low                    | [E]|
|    | [Quick Tools]                  |                                                        | [T]|
|    | [⤓ Export Hazards (GeoJSON)]   | [Inspection HUD (Bottom Right)]                        | [R]|
|    |                                | Lat: 18.520°N, Lon: 73.856°E                           | [Y]|
|    |                                | Temp: 28.4°C  Humidity: 78%                            |    |
|    |                                | Wind: 6.2 m/s WSW  Rain: 18.4 mm/hr                    |    |
+----+--------------------------------+--------------------------------------------------------+----+
| BOTTOM PANEL (h: 180px)                                                                          |
|                                                                                                  |
| [pySTEPS Lead Time Stepper]        | [Rain-rate Forecast Sparkline]  | [Station Log] | [Replay]  |
| (0)  (+1)  (+2)  (+3)  (+4)  (+5)  |       /\                        | 03:02 Pune:   | Historical|
| Now  +1h   +2h   +3h   +4h   +5h   |  __--/  \--__                   | Hail, Lightn  | event step|
| [========O=======================] | 0.0 mm/hr            34.2 mm/hr | 02:45 Mumbai: | [Open     |
|                                    |                                 | Cloudburst    |  Replay]  |
+------------------------------------+---------------------------------+---------------+-----------+
```

---

## 29. Data Flow Diagram

```mermaid
flowchart TD
    subgraph INGESTION["External Real Telemetry Sources"]
        RV["RainViewer Radar API"] -->|dBZ Tiles| PULL_R["radar_puller.py"]
        BZ["Blitzortung MQTT Broker"] -->|VLF TCP Stream| PULL_L["blitzortung_lightning.py"]
        EC["ECMWF Open Data HRES"] -->|0.25 deg GRIB| PULL_W["ecmwf_weather.py"]
        TM["Tomorrow.io REST API"] -->|Station JSON| PULL_S["imd_nowcast.py"]
        CP["Copernicus Sentinel-3"] -->|NetCDF Thermal| PULL_SAT["copernicus_satellite.py"]
    end

    subgraph PROCESSING["Backend Models & Processing"]
        PULL_R & PULL_L & PULL_W & PULL_S & PULL_SAT --> FUSION["fusion.py (Multi-Channel Stack)"]
        PULL_R & PULL_L --> H_INDIA["hazard_india.py (All-India Real Detection)"]
        FUSION --> H_REG["hazard.py (Per-Region Convective Rules)"]
        FUSION --> PYS["pysteps_baseline.py (LK Extrapolation)"]
        FUSION --> DGM["dgmr_nowcast.py (DeepMind GAN)"]
        PYS --> ETA["eta.py (Storm Motion Vectors)"]
        H_INDIA --> SMS["sms_alerts.py (Twilio SMS Dispatch)"]
    end

    subgraph FASTAPI["FastAPI Caching Service (:8000)"]
        H_INDIA -->|Every 180s| C_IND["_india_hazards_cache"]
        PYS & DGM & FUSION -->|Every 15m| C_REG["_region_snapshots"]
        C_IND --> EP_HAZ["/hazards?lead_time=N"]
        C_REG --> EP_FC["/forecast & /nowcast-frame"]
        ETA --> EP_ETA["/storm-eta"]
        PULL_W --> EP_W["/weather-layers & /wind-vectors"]
    end

    subgraph FRONTEND["React 18 + MapLibre GUI (:5173)"]
        EP_HAZ -->|useHazards 30s| APP["App.tsx State Engine"]
        EP_FC -->|useForecastSummary| BOT["BottomPanel.tsx & TrendChart.tsx"]
        EP_ETA -->|useStormEta| RIGHT["RightSidebar.tsx Telemetry"]
        EP_W -->|useWeatherLayers| RAST["WeatherRasterLayers.tsx"]
        APP --> MAP["MapLibre GL WebGL Canvas"]
        APP --> PULSE["HazardLayers.tsx (CSS Pulsing Markers)"]
    end
```

---

## 30. User Flow Diagram

```mermaid
stateDiagram-v2
    [*] --> LandingPage: Navigate to '/'
    
    LandingPage --> OperationalDashboard: Click "Launch Dashboard" / "Get Started"
    LandingPage --> CapabilitiesSection: Click "Explore" / Scroll
    
    state OperationalDashboard {
        [*] --> MapMonitoring
        
        MapMonitoring --> PointInspector: Click Coordinates on Map
        PointInspector --> MapMonitoring: Dismiss HUD / Close X
        
        MapMonitoring --> AreaDragMode: Click "Select Area" Button
        AreaDragMode --> AreaInspector: Drag Rectangle on Canvas
        AreaInspector --> MapMonitoring: Dismiss Area HUD
        
        MapMonitoring --> TimelineScrubbing: Click Lead Dial / Drag Slider
        TimelineScrubbing --> MapMonitoring: Release Slider / Pause
        
        MapMonitoring --> LayersDrawer: Click "Layers" Icon
        LayersDrawer --> MapMonitoring: Close Drawer
        
        MapMonitoring --> HazardsModal: Click "Hazards" Icon
        HazardsModal --> MapMonitoring: Close Modal / Click Table Row (Fly-To)
        
        MapMonitoring --> ForecastModal: Click "Forecast" Icon
        ForecastModal --> MapMonitoring: Close Modal
        
        MapMonitoring --> ReplayModal: Click "Replay" Icon
        ReplayModal --> MapMonitoring: Close Modal
    }
```

---

## 31. Component Hierarchy

```text
<Root> (main.tsx)
 ├── <HomePage> (when view === 'home')
 │    ├── <header className="hp-nav-wrap">
 │    │    ├── <a className="hp-brand">
 │    │    ├── <ul className="hp-nav-links">
 │    │    └── <div className="hp-nav-right">
 │    │         ├── <span className="hp-live-pill">
 │    │         └── <button className="hp-btn-launch">
 │    ├── <section className="hp-hero">
 │    │    ├── <div className="hp-hero-content">
 │    │    │    ├── <div className="hp-badge">
 │    │    │    ├── <h1 className="hp-h1">
 │    │    │    ├── <p className="hp-hero-sub">
 │    │    │    └── <div className="hp-btn-row">
 │    │    ├── <div className="hp-hero-right">
 │    │    │    ├── <div className="hp-live-card">
 │    │    │    └── <div className="hp-legend">
 │    │    └── <div className="hp-stat-strip">
 │    ├── <section id="hp-capabilities">
 │    ├── <section id="hp-pipeline">
 │    ├── <section className="hp-dash-preview">
 │    ├── <section className="hp-use-grid">
 │    └── <footer className="hp-footer">
 │
 └── <App> (when view === 'dashboard')
      └── <MapProvider>
           └── <Dashboard>
                ├── <LeftNavigation>
                ├── <TopBar>
                ├── <div className="main-body">
                │    ├── <LeftSidebar>
                │    │    └── <RegionPicker>
                │    ├── <div className="map-area">
                │    │    ├── <MapCanvas>
                │    │    ├── <MapLayers>
                │    │    │    ├── <WmsBaseLayer>
                │    │    │    ├── <HazardLayers>
                │    │    │    ├── <WmsOverlayLayers>
                │    │    │    ├── <SensorRasterLayers>
                │    │    │    ├── <WeatherRasterLayers>
                │    │    │    ├── <WindArrows>
                │    │    │    ├── <ModelFrameLayer>
                │    │    │    ├── <RegionBox>
                │    │    │    ├── <AreaBox>
                │    │    │    └── <ReferenceLabels>
                │    │    ├── <div className="map-controls-top">
                │    │    │    ├── <div className="layer-toggles">
                │    │    │    └── <div className="time-scrubber">
                │    │    ├── <div className="map-legends">
                │    │    ├── <RegionFloating> (conditional)
                │    │    ├── <AreaFloating> (conditional)
                │    │    └── <Banner> (conditional)
                │    ├── <RightSidebar>
                │    ├── <LayersDrawer> (conditional activePanel === 'layers')
                │    ├── <HazardsPage> (conditional activePanel === 'hazards')
                │    ├── <ForecastPage> (conditional activePanel === 'forecast')
                │    │    ├── <ModelColumn model="pysteps">
                │    │    │    └── <TrendChart>
                │    │    └── <ModelColumn model="dgmr">
                │    │         └── <TrendChart>
                │    └── <ReplayPage> (conditional activePanel === 'replay')
                └── <BottomPanel>
                     └── <TrendChart>
```

---

## 32. Animation Architecture

### 32.1 Micro-Interaction Mechanics
```text
+---------------------------------------------------------------------------------------------------------+
| EVENT 1: Hazard Ring Pulse (hazard-pulse-ring)                                                          |
| Element: .hazard-marker-ring & .hazard-marker-ring-delay                                                |
| Composition: Two absolute HTML spans positioned at center (top: 50%, left: 50%, translate(-50%, -50%))  |
| Transform: 0% scale (w:10px, h:10px, opacity: 0.9) ---> 100% scale (w:34px, h:34px, opacity: 0.0)      |
| Cadence: Ring 1 starts at 0.0s; Ring 2 starts at 0.9s; full cycle 1.8s. Infinite loop.                 |
+---------------------------------------------------------------------------------------------------------+
| EVENT 2: Map Camera Smooth Interpolation                                                                |
| Trigger: User clicks row in HazardsPage table or clicks map coordinate                                  |
| Engine: MapLibre GL Native Camera Animation                                                             |
| Mechanics: map.flyTo({ center: [lon, lat], zoom: 12.5, duration: 800, essential: true })                |
| Curve: Geodetic great-circle curve with smooth deceleration.                                            |
+---------------------------------------------------------------------------------------------------------+
| EVENT 3: Area Selection Crosshair Drag                                                                  |
| Trigger: mousedown on canvas when areaSelectMode is active                                              |
| Mechanics: mousemove updates startRef and current lngLat; writes GeoJSON polygon to MapLibre source;    |
| line-dasharray dynamically toggles between [2, 2] (dragging) and [1, 0] (final confirmed box).          |
+---------------------------------------------------------------------------------------------------------+
| EVENT 4: Lead-Time Slider Scrubbing                                                                     |
| Trigger: input onChange on range sliders                                                                |
| Mechanics: Immediately updates React state; cancels any in-flight fetch; triggers useInterval callback; |
| coordinates advect seamlessly on screen.                                                                |
+---------------------------------------------------------------------------------------------------------+
```

---

## 33. Exact File References

### 33.1 Comprehensive Repository File Registry
| Relative File Path | Language | Line Count | Primary Role & Responsibility |
|---|---|---|---|
| `nowcast/dashboard/src/main.tsx` | TypeScript (TSX) | 50 | Root application router and body overflow controller |
| `nowcast/dashboard/src/App.tsx` | TypeScript (TSX) | 508 | Operations command center shell, state orchestration, layout |
| `nowcast/dashboard/src/HomePage.tsx` | TypeScript (TSX) | 1,249 | Marketing, capabilities, pipeline overview, live status card |
| `nowcast/dashboard/src/index.css` | CSS3 | 492 | Global design system tokens, typography, layout, animations |
| `nowcast/dashboard/src/api.ts` | TypeScript | 68 | Strongly-typed REST client and ApiError class |
| `nowcast/dashboard/src/types.ts` | TypeScript | 163 | TypeScript data contracts matching backend JSON endpoints |
| `nowcast/dashboard/src/lib/colors.ts` | TypeScript | 82 | Color constants, Marshall-Palmer palettes, color lerp math |
| `nowcast/dashboard/src/lib/config.ts` | TypeScript | 3 | Ingestion cadence synchronization constant (15 min) |
| `nowcast/dashboard/src/lib/mosdacLayers.ts` | TypeScript | 83 | ISRO / MOSDAC GeoServer WMS layer catalog & tile URL math |
| `nowcast/dashboard/src/hooks/useNowcastData.ts` | TypeScript | 139 | Dedicated data polling hooks with failure isolation |
| `nowcast/dashboard/src/hooks/useInterval.ts` | TypeScript | 24 | Self-correcting interval timer hook |
| `nowcast/dashboard/src/map/MapProvider.tsx` | TypeScript (TSX) | 90 | MapLibre lifecycle, WebGL context, basemap style |
| `nowcast/dashboard/src/map/MapContext.ts` | TypeScript | 14 | React context definition for map instance distribution |
| `nowcast/dashboard/src/map/useAreaDrag.ts` | TypeScript | 63 | Canvas crosshair bounding-box drag interaction hook |
| `nowcast/dashboard/src/map/useRasterLayer.ts` | TypeScript | 46 | MapLibre raster image layer lifecycle manager |
| `nowcast/dashboard/src/map/useRegionClick.ts` | TypeScript | 30 | Canvas coordinate click inspector hook |
| `nowcast/dashboard/src/map/layers/AreaBox.tsx` | TypeScript (TSX) | 82 | User-drawn area polygon vector layer |
| `nowcast/dashboard/src/map/layers/HazardLayers.tsx` | TypeScript (TSX) | 168 | Animated dual-ring pulsing hazard markers & popups |
| `nowcast/dashboard/src/map/layers/ModelFrameLayer.tsx` | TypeScript (TSX) | 14 | Predictive forecast raster overlay |
| `nowcast/dashboard/src/map/layers/ReferenceLabels.tsx` | TypeScript (TSX) | 15 | Uppermost Esri road and place-name labels |
| `nowcast/dashboard/src/map/layers/RegionBox.tsx` | TypeScript (TSX) | 45 | Point-inspection dashed boundary box |
| `nowcast/dashboard/src/map/layers/SensorRasterLayers.tsx` | TypeScript (TSX) | 30 | Satellite IR & Radar reflectivity image layers |
| `nowcast/dashboard/src/map/layers/WeatherRasterLayers.tsx`| TypeScript (TSX) | 37 | Gridded ECMWF atmospheric field rasters |
| `nowcast/dashboard/src/map/layers/WindArrows.tsx` | TypeScript (TSX) | 67 | HTML5 canvas-generated SDF vector arrow symbols |
| `nowcast/dashboard/src/map/layers/WmsBaseLayer.tsx` | TypeScript (TSX) | 41 | ISRO / MOSDAC WMS base imagery manager |
| `nowcast/dashboard/src/map/layers/WmsOverlayLayers.tsx` | TypeScript (TSX) | 38 | ISRO / MOSDAC 16-layer thematic GIS overlays |
| `nowcast/dashboard/src/components/AreaFloating.tsx` | TypeScript (TSX) | 140 | Area spatial statistics floating inspector HUD |
| `nowcast/dashboard/src/components/Banner.tsx` | TypeScript (TSX) | 5 | Connectivity & tile error alert strip |
| `nowcast/dashboard/src/components/BottomPanel.tsx` | TypeScript (TSX) | 131 | Timeline scrubber, sparkline, station log, replay trigger |
| `nowcast/dashboard/src/components/ForecastPage.tsx` | TypeScript (TSX) | 106 | Modal: pySTEPS vs DGMR model comparison workbench |
| `nowcast/dashboard/src/components/HazardsPage.tsx` | TypeScript (TSX) | 151 | Modal: Filterable tabular hazard ledger with camera fly-to |
| `nowcast/dashboard/src/components/LayersDrawer.tsx` | TypeScript (TSX) | 162 | Slide-out GIS and model configuration drawer |
| `nowcast/dashboard/src/components/LeftNavigation.tsx` | TypeScript (TSX) | 40 | Left vertical icon navigation rail |
| `nowcast/dashboard/src/components/LeftSidebar.tsx` | TypeScript (TSX) | 191 | Regional selector, pipeline status, GeoJSON exporter |
| `nowcast/dashboard/src/components/RegionFloating.tsx` | TypeScript (TSX) | 72 | Point inspection floating telemetry HUD |
| `nowcast/dashboard/src/components/ReplayPage.tsx` | TypeScript (TSX) | 158 | Modal: Historical storm replay time-machine console |
| `nowcast/dashboard/src/components/RightSidebar.tsx` | TypeScript (TSX) | 159 | Tactical hazard cards, storm ETA, 6h forecast buckets |
| `nowcast/dashboard/src/components/TopBar.tsx` | TypeScript (TSX) | 35 | Operational header bar with live status and city tag |
| `nowcast/dashboard/src/components/TrendChart.tsx` | TypeScript (TSX) | 59 | Custom zero-dependency SVG area-line sparkline |
| `nowcast/dashboard/legacy/index.html` | HTML / JS / CSS | 888 | Monolithic pre-React single-file prototype |
| `nowcast/api/main.py` | Python 3.11 | 954 | FastAPI backend, caching loops, endpoints, WMS proxy |
| `nowcast/configs/settings.py` | Python 3.11 | 194 | Thresholds, bounding boxes, demo cities, environment |
| `nowcast/configs/districts_india.py` | Python 3.11 | 195 | ~130 Indian district centroid coordinates and lookup |
| `nowcast/models/hazard.py` | Python 3.11 | 105 | Grid-based hail and downburst heuristic detectors |
| `nowcast/models/hazard_india.py` | Python 3.11 | 201 | All-India real hail & lightning detector and advector |
| `nowcast/models/eta.py` | Python 3.11 | 79 | Storm bearing, velocity, and arrival countdown math |
| `nowcast/models/pysteps_baseline.py` | Python 3.11 | 122 | Lucas-Kanade optical flow extrapolation nowcast model |
| `nowcast/models/dgmr_nowcast.py` | Python 3.11 | 124 | DeepMind DGMR Skillful Nowcasting GAN integration |
| `nowcast/processing/fusion.py` | Python 3.11 | 250 | Multi-channel raster stacking [TIR1, WV, MWIR, dBZ, Lightn]|
| `nowcast/processing/weather_fields.py` | Python 3.11 | 212 | ECMWF HRES weather grids and ambient field sampling |
| `nowcast/alerts/sms_alerts.py` | Python 3.11 | 35 | Twilio REST API SMS dispatch with cooldown logic |

---

## 34. Forensic Evidence & Observations

### 34.1 Concrete Code Citations & Analysis

#### Evidence A: The Bhuvan CORS Proxy Workaround
In `nowcast/dashboard/src/lib/mosdacLayers.ts` (Lines 56-59):
```typescript
// routed through our own backend (see /wms-proxy/bhuvan) — Bhuvan's WMS
// server doesn't send CORS headers, so a browser can't fetch it directly
// (confirmed: curl gets 200, browser fetch gets blocked by CORS)
{ id: "bhuvan", label: "Bhuvan Maps", endpoint: `${API_BASE}/wms-proxy/bhuvan`, layers: "india3" },
```
*Forensic Analysis:* This documents a real-world integration discovery. ISRO's NRSC Bhuvan tile server lacks `Access-Control-Allow-Origin` headers. Direct browser fetches from Vite (`:5173`) are blocked by browser CORS policy. The developers built a backend passthrough proxy in `main.py` (`/wms-proxy/bhuvan`) that injects CORS headers, enabling MapLibre to stream Bhuvan imagery seamlessly.

#### Evidence B: DeepMind DGMR Calibration Disclosure
In `nowcast/models/dgmr_nowcast.py` (Lines 31-38):
```python
# Deliberately NOT run through the Marshall-Palmer Z-R relation like pySTEPS'
# output: with an out-of-distribution, uncalibrated input, small errors in
# DGMR's raw output blow up into rain rates of tens of thousands of mm/hr
# once cubed through R = (Z/200)^(1/1.6). That's not a real forecast value,
# it's noise amplified by a formula that assumes calibrated input. So DGMR's
# output here stays a unitless 0-1 "relative intensity" and is never fed into
# the mm/hr-based cloudburst rule...
```
*Forensic Analysis:* This reveals extreme scientific discipline. Running an out-of-distribution neural network trained on UK radar through an empirical $Z-R$ power-law formula yields catastrophic mathematical divergence ($10,000+\text{ mm/hr}$). The developers explicitly isolated DGMR to a unitless $0-1$ relative intensity comparison layer, prohibiting it from driving the cloudburst civil alert rule.

#### Evidence C: MapLibre Esri Popup Dark-Theme Override
In `nowcast/dashboard/src/index.css` (Lines 455-465):
```css
/* MapLibre popup restyle — !important because maplibre-gl's own stylesheet
   sets background:#fff on this exact selector with the same specificity;
   whichever import happens to land last in the bundle otherwise wins,
   which previously left a white background with light (inherited) text
   on top of it — invisible. */
.maplibregl-popup-content {
  background: var(--panel) !important; color: var(--text) !important;
  border: 1px solid var(--panel-border); border-radius: 10px; padding: 12px 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}
```
*Forensic Analysis:* Solves an acute CSS cascade conflict where MapLibre's vendor stylesheet overrides application dark themes, causing unreadable white-on-white popups.

#### Evidence D: Thread-Safe Background Pre-Warming
In `nowcast/api/main.py` (Lines 230-239):
```python
def _warm_region(key):
    """Run a full ingest+forecast+fusion cycle for `key` and stash the
    result in _region_snapshots. Uses override_active_region — a
    thread-local switch — rather than mutating the persistent global
    active region: this runs for ~10-20s per region, and an earlier version
    that mutated the shared global (even with a save/restore dance) let a
    concurrent request land mid-warm and transiently see the wrong region's
    bbox, confirmed in testing."""
```
*Forensic Analysis:* Documents an advanced multithreading concurrency fix. Modifying global state during an asynchronous 20-second ingestion run caused race conditions where concurrent HTTP requests received the wrong city's bounding box. The team utilized Python's `threading.local()` context manager to isolate regional warming to dedicated background threads.

---

## 35. Final Reconstruction Summary

### 35.1 Blueprint for Full System Reconstruction
To reconstruct the MeghDrishti application from this forensic report without referring back to the original source code, adhere to the following sequence:

1. **Environment & Dependency Scaffold:**
   - Establish a Vite React + TypeScript project with `maplibre-gl` and `lucide-react`. In `vite.config.ts`, exclude `maplibre-gl` from `optimizeDeps` to prevent Web Worker pre-bundling resolution errors.
   - Establish a Python 3.11 FastAPI backend with Uvicorn, NumPy, SciPy, Matplotlib, PIL, PyTorch, and Requests.
2. **Design Tokens & Shell:**
   - Inject the exact design tokens into `index.css`: Obsidian backgrounds (`#060910`, `#050B1A`), glassmorphic panels (`rgba(13, 18, 28, 0.95)`, blur: 12px), cyan accent (`#3fb6ff`), and meteorological semantics (`#b565f5` hail, `#f5486b` downburst, `#2fb0e0` cloudburst, `#f0b429` lightning).
   - Import Google Fonts: Inter (400, 500, 600, 700, 800) and JetBrains Mono (500).
3. **Map Canvas & Geospatial Shaders:**
   - Initialize MapLibre GL with Esri Dark Gray canvas tiles. Fit initial camera bounds to India ($68^\circ\text{E} - 97.5^\circ\text{E}, 6.5^\circ\text{N} - 37^\circ\text{N}$).
   - Build `HazardLayers` using HTML Marker DOM elements with two expanding CSS animation spans (`hazard-pulse-ring`, 1.8s duration, 0.9s delay) colored by severity (green `#22c55e`, yellow `#f0b429`, red `#ef4444`).
4. **Data Layers & WMS Integration:**
   - Implement `mosdacLayers.ts` catalog with 7 base maps and 16 thematic overlays pointing to `https://www.mosdac.gov.in/geoserver_2/...` using `{bbox-epsg-3857}` templates. Route Bhuvan through a local backend proxy to bypass CORS.
   - Implement `WeatherRasterLayers` and `SensorRasterLayers` using MapLibre image sources updated dynamically via `updateImage()`.
5. **UI Component Matrix:**
   - Construct `LeftNavigation` (60px icon rail), `TopBar` (52px header), `LeftSidebar` (320px regional picker and status), `RightSidebar` (320px tactical threat cards and storm ETA), and `BottomPanel` (180px lead stepper and SVG sparkline).
   - Build modal sheets for `HazardsPage` (table ledger with fly-to), `ForecastPage` (pySTEPS vs DGMR), and `ReplayPage` (historical time machine).
6. **Backend Inference Engine:**
   - Implement `hazard_india.py` running hail rules ($Z \ge 55\,\text{dBZ}$) and lightning clustering across all India with ECMWF wind vector advection.
   - Implement `pysteps_baseline.py` running Lucas-Kanade optical flow extrapolation across a 64x64 grid for 0-6h lead time.
   - Implement `dgmr_nowcast.py` serving zero-shot relative intensity frames for 0-90min comparison.
   - Implement `api/main.py` caching national hazards (180s TTL) and pre-warming all 10 cities in the background.

*Report compiled and certified under EXTREME GUI FORENSIC ANALYSIS standards.*

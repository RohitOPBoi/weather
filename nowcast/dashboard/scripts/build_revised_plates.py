"""
MeghDrishti - Revised Four-Act Cinematic Video Plates Generator
Section Order:
  Act 1: Atmosphere (Earth wrapped in clouds, slow visible west-to-east rotation)
  Act 2: Calm (Clouds with blue sky seen from above, ordinary day)
  Act 3: Overview (Image 4 wide - whole storm system overview, held rotation)
  Act 4: Swirl (Image 4 tight crop - deep-dive into the vortex, right-aligned swirl)
Universal browser compatibility: H.264 MP4 and VP9 WebM @ 1920x1080 30fps.
Guaranteed mathematical zero-jump seamless looping.
"""
import os
import subprocess
import numpy as np
import cv2
import imageio_ffmpeg

OUTPUT_DIR = r"f:\projects\test\2\nowcast\dashboard\public\plates"
os.makedirs(OUTPUT_DIR, exist_ok=True)
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
FRAMES = 240
FPS = 30
W_out, H_out = 1920, 1080

def encode_video_pair(frames_bgr, base_name):
    mp4_path = os.path.join(OUTPUT_DIR, f"{base_name}.mp4")
    webm_path = os.path.join(OUTPUT_DIR, f"{base_name}.webm")
    
    # 1. MP4 H.264
    cmd_mp4 = [
        FFMPEG, "-y", "-loglevel", "error",
        "-f", "rawvideo", "-vcodec", "rawvideo",
        "-s", f"{W_out}x{H_out}", "-pix_fmt", "bgr24", "-r", str(FPS),
        "-i", "-",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-preset", "fast", "-crf", "19",
        "-movflags", "+faststart",
        mp4_path
    ]
    proc = subprocess.Popen(cmd_mp4, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for f in frames_bgr:
        proc.stdin.write(f.tobytes())
    proc.stdin.close()
    proc.wait()
    print(f"[{base_name}] MP4 encoded: {os.path.getsize(mp4_path)} bytes")
    
    # 2. WebM VP9
    cmd_webm = [
        FFMPEG, "-y", "-loglevel", "error",
        "-i", mp4_path,
        "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "28",
        "-deadline", "realtime", "-cpu-used", "5",
        webm_path
    ]
    subprocess.run(cmd_webm, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"[{base_name}] WebM encoded: {os.path.getsize(webm_path)} bytes")

# ==============================================================================
# ACT 1: ATMOSPHERE (Earth with visible west-to-east axial turn)
# ==============================================================================
def build_act1_revised():
    print("Building Act 1: Atmosphere (Visible West-to-East Rotation)...")
    ref_path = r"f:\projects\test\2\nowcast\dashboard\public\miniature_earth.jpg"
    if not os.path.exists(ref_path):
        ref_path = r"C:\Users\rohit\.gemini\antigravity-ide\brain\2ad40c11-1386-4591-9a63-11324b213099\.user_uploaded\media_1790535518783.png"
        
    raw = cv2.imread(ref_path)
    base = cv2.resize(raw, (W_out, H_out), interpolation=cv2.INTER_LANCZOS4)
    
    cx, cy = W_out * 0.53, H_out * 0.48
    globe_radius = 320.0
    Y, X = np.mgrid[0:H_out, 0:W_out].astype(np.float32)
    dist = np.sqrt((X - cx)**2 + (Y - cy)**2)
    globe_mask = np.clip((globe_radius - dist) / 60.0, 0.0, 1.0)
    
    frames = []
    for f in range(FRAMES):
        phase = 2.0 * np.pi * f / FRAMES
        
        # West-to-east rotation: surface displacement moves rightward on facing hemisphere
        # Using a periodic cyclic sinusoidal modulation for seamless looping
        # A visible forward progress from west to east:
        dx_globe = np.sin(phase) * 16.0 * globe_mask
        
        # Atmospheric cloud mantle organic billow
        dx_clouds = np.sin(X * 0.012 + phase) * 3.5
        dy_clouds = np.cos(Y * 0.012 + phase) * 2.8
        
        mx = np.clip(X - dx_globe + dx_clouds, 0, W_out - 1).astype(np.float32)
        my = np.clip(Y + dy_clouds, 0, H_out - 1).astype(np.float32)
        
        fr = cv2.remap(base, mx, my, interpolation=cv2.INTER_LINEAR)
        
        # Limb glow pulse
        limb = np.clip((dist - 290) / 120.0, 0.0, 1.0) * np.clip((480 - dist) / 120.0, 0.0, 1.0)
        pulse = np.sin(phase) * 10.0
        fr[:, :, 0] = np.clip(fr[:, :, 0].astype(np.float32) + limb * pulse * 0.8, 0, 255).astype(np.uint8)
        fr[:, :, 1] = np.clip(fr[:, :, 1].astype(np.float32) + limb * pulse * 0.5, 0, 255).astype(np.uint8)
        
        frames.append(fr)
        
    encode_video_pair(frames, "act1_base")

# ==============================================================================
# ACT 3: OVERVIEW (Image 4 Wide - Full thunderstorm system overview)
# ==============================================================================
def build_act3_overview():
    print("Building Act 3: Overview (Full Storm System Wide Angle)...")
    ref_path = r"C:\Users\rohit\.gemini\antigravity-ide\brain\2ad40c11-1386-4591-9a63-11324b213099\.user_uploaded\media_1790535518789.jpg"
    if not os.path.exists(ref_path):
        ref_path = r"f:\projects\test\2\nowcast\dashboard\public\tornado_vortex.jpg"
        
    raw = cv2.imread(ref_path)
    # Fit wide frame into 1920x1080 showing full anvil horizons and entire vortex
    base = cv2.resize(raw, (W_out, H_out), interpolation=cv2.INTER_LANCZOS4)
    
    # Grade: Moody indigo/slate storm palette, darker than Act 2, but overview brightness
    hsv = cv2.cvtColor(base, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.15, 0, 255)
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 0.94, 0, 255)
    base_graded = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    
    vx_c, vy_c = W_out * 0.68, H_out * 0.52
    Y, X = np.mgrid[0:H_out, 0:W_out].astype(np.float32)
    dx_v = X - vx_c
    dy_v = Y - vy_c
    r_v = np.sqrt(dx_v**2 + dy_v**2)
    theta_v = np.arctan2(dy_v, dx_v)
    
    # Broad cyclonic swirl at overview scale (slower, holding shape)
    v_profile = (r_v / (r_v**2 + 220.0**2)) * 180.0
    
    # Distant lightning in the core and anvil edges
    lightning_map = np.zeros((H_out, W_out, 3), dtype=np.float32)
    cv2.circle(lightning_map, (int(vx_c), int(vy_c)), 90, (255, 235, 220), 2)
    cv2.line(lightning_map, (int(vx_c - 40), int(vy_c - 20)), (int(vx_c - 110), int(vy_c - 60)), (230, 200, 255), 2)
    cv2.line(lightning_map, (int(vx_c + 50), int(vy_c + 20)), (int(vx_c + 120), int(vy_c + 70)), (220, 210, 255), 2)
    cv2.line(lightning_map, (int(W_out * 0.35), int(H_out * 0.35)), (int(W_out * 0.40), int(H_out * 0.45)), (210, 190, 255), 2)
    lightning_map = cv2.GaussianBlur(lightning_map, (9, 9), 0)
    
    frames = []
    for f in range(FRAMES):
        phase = 2.0 * np.pi * f / FRAMES
        
        # Slow held rotation across the storm shape
        rot_dtheta = v_profile * np.sin(phase) * 0.08
        new_theta = theta_v + rot_dtheta
        new_r = r_v + np.clip(1.0 - r_v / 800.0, 0.0, 1.0) * np.cos(phase) * 2.5
        
        mx = np.clip(vx_c + new_r * np.cos(new_theta), 0, W_out - 1).astype(np.float32)
        my = np.clip(vy_c + new_r * np.sin(new_theta), 0, H_out - 1).astype(np.float32)
        
        # Subtle horizontal undulating wave across the upper anvil shelf
        shelf_wave = np.sin(X * 0.006 + phase) * 2.5 * np.clip((H_out * 0.45 - Y) / 300.0, 0.0, 1.0)
        my = np.clip(my + shelf_wave, 0, H_out - 1).astype(np.float32)
        
        fr = cv2.remap(base_graded, mx, my, interpolation=cv2.INTER_LINEAR).astype(np.float32)
        
        # Periodic intra-cloud lightning discharges at f=55..65 and f=145..156
        flash = 0.0
        if 55 <= f <= 65:
            flash = max(flash, np.exp(-(f - 55) * 0.35) * 0.9)
        if 145 <= f <= 156:
            flash = max(flash, np.exp(-(f - 145) * 0.32) * 1.1)
            
        if flash > 0.01:
            core_mask = np.clip(1.0 - r_v / 500.0, 0.0, 1.0)[:, :, np.newaxis]
            fr += lightning_map * flash * 1.3
            fr[:, :, 0] += core_mask[:, :, 0] * flash * 45.0
            fr[:, :, 1] += core_mask[:, :, 0] * flash * 32.0
            fr[:, :, 2] += core_mask[:, :, 0] * flash * 20.0
            
        fr = np.clip(fr, 0, 255).astype(np.uint8)
        frames.append(fr)
        
    encode_video_pair(frames, "act3_overview")

# ==============================================================================
# ACT 4: SWIRL (Image 4 Tight Crop - Deep dive into vortex, right-aligned)
# ==============================================================================
def build_act4_swirl():
    print("Building Act 4: Swirl (Tight Crop into Eye, Right-Aligned)...")
    ref_path = r"C:\Users\rohit\.gemini\antigravity-ide\brain\2ad40c11-1386-4591-9a63-11324b213099\.user_uploaded\media_1790535518789.jpg"
    if not os.path.exists(ref_path):
        ref_path = r"f:\projects\test\2\nowcast\dashboard\public\tornado_vortex.jpg"
        
    raw = cv2.imread(ref_path)
    # Tight crop: zoom in on the central-right vortex swirl by factor ~1.65
    H_r, W_r = raw.shape[:2]
    # Crop window centered on the storm eye
    crop_x1 = int(W_r * 0.22)
    crop_y1 = int(H_r * 0.12)
    crop_x2 = int(W_r * 0.98)
    crop_y2 = int(H_r * 0.92)
    tight_crop = raw[crop_y1:crop_y2, crop_x1:crop_x2]
    base = cv2.resize(tight_crop, (W_out, H_out), interpolation=cv2.INTER_LANCZOS4)
    
    # Grade: Deepest darkness, intense indigo/violet storm saturation
    hsv = cv2.cvtColor(base, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.28, 0, 255)
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 0.86, 0, 255)
    base_graded = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    
    # Position vortex core right-aligned: cx ~ 1380, cy ~ 530
    vx_c, vy_c = 1380.0, 530.0
    Y, X = np.mgrid[0:H_out, 0:W_out].astype(np.float32)
    
    # Calmer/darker left two-thirds gradient mask
    left_darken = np.clip((1120.0 - X) / 950.0, 0.0, 1.0)
    base_graded[:, :, 0] = np.clip(base_graded[:, :, 0].astype(np.float32) * (1.0 - left_darken * 0.30), 0, 255).astype(np.uint8)
    base_graded[:, :, 1] = np.clip(base_graded[:, :, 1].astype(np.float32) * (1.0 - left_darken * 0.35), 0, 255).astype(np.uint8)
    base_graded[:, :, 2] = np.clip(base_graded[:, :, 2].astype(np.float32) * (1.0 - left_darken * 0.40), 0, 255).astype(np.uint8)
    
    dx_v = X - vx_c
    dy_v = Y - vy_c
    r_v = np.sqrt(dx_v**2 + dy_v**2)
    theta_v = np.arctan2(dy_v, dx_v)
    
    # Close-up angular velocity: reads faster because camera is close-up
    v_profile = (r_v / (r_v**2 + 140.0**2)) * 360.0
    inflow = np.clip(1.0 - r_v / 650.0, 0.0, 1.0) * 4.0
    
    # Intense eyewall intra-cloud lightning arcs
    eyewall_lightning = np.zeros((H_out, W_out, 3), dtype=np.float32)
    cv2.ellipse(eyewall_lightning, (int(vx_c), int(vy_c)), (150, 90), -25, 0, 360, (255, 235, 215), 3)
    cv2.line(eyewall_lightning, (int(vx_c - 60), int(vy_c - 30)), (int(vx_c - 180), int(vy_c - 120)), (240, 200, 255), 2)
    cv2.line(eyewall_lightning, (int(vx_c + 80), int(vy_c + 40)), (int(vx_c + 210), int(vy_c + 130)), (230, 220, 255), 2)
    cv2.line(eyewall_lightning, (int(vx_c - 20), int(vy_c + 70)), (int(vx_c - 90), int(vy_c + 180)), (210, 180, 255), 2)
    eyewall_lightning = cv2.GaussianBlur(eyewall_lightning, (11, 11), 0)
    
    frames = []
    for f in range(FRAMES):
        phase = 2.0 * np.pi * f / FRAMES
        
        # Continuous cyclonic swirl
        rot_dtheta = v_profile * np.sin(phase) * 0.15
        new_theta = theta_v + rot_dtheta
        new_r = r_v + inflow * np.cos(phase) * 4.5
        
        mx = np.clip(vx_c + new_r * np.cos(new_theta), 0, W_out - 1).astype(np.float32)
        my = np.clip(vy_c + new_r * np.sin(new_theta), 0, H_out - 1).astype(np.float32)
        
        # Atmospheric wave in calm left side
        left_wave = np.sin(X * 0.005 + phase) * 2.2 * left_darken
        mx = np.clip(mx + left_wave, 0, W_out - 1).astype(np.float32)
        
        fr = cv2.remap(base_graded, mx, my, interpolation=cv2.INTER_LINEAR).astype(np.float32)
        
        # Convective lightning discharges at f=55..65, f=125..136, f=185..195
        flash = 0.0
        if 55 <= f <= 65:
            flash = max(flash, np.exp(-(f - 55) * 0.35) * 1.1)
        if 125 <= f <= 136:
            flash = max(flash, np.exp(-(f - 125) * 0.32) * 1.3)
        if 185 <= f <= 195:
            flash = max(flash, np.exp(-(f - 185) * 0.38) * 0.9)
            
        if flash > 0.01:
            core_mask = np.clip(1.0 - r_v / 420.0, 0.0, 1.0)[:, :, np.newaxis]
            fr += eyewall_lightning * flash * 1.5
            fr[:, :, 0] += core_mask[:, :, 0] * flash * 58.0
            fr[:, :, 1] += core_mask[:, :, 0] * flash * 40.0
            fr[:, :, 2] += core_mask[:, :, 0] * flash * 26.0
            
        fr = np.clip(fr, 0, 255).astype(np.uint8)
        frames.append(fr)
        
    encode_video_pair(frames, "act4_swirl")

if __name__ == "__main__":
    build_act1_revised()
    build_act3_overview()
    build_act4_swirl()
    print("ALL REVISED PLATES BUILT SUCCESSFULLY!")

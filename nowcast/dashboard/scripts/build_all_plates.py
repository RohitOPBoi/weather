"""
MeghDrishti - Four-Act Cinematic Video Plates Generator
Builds Acts 2, 3, and 4 video plates + foreground alpha wisp layers.
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
# ACT 2: CALM (Clouds with blue sky seen from above)
# ==============================================================================
def build_act2():
    print("Building Act 2: Calm...")
    ref_path = r"C:\Users\rohit\.gemini\antigravity-ide\brain\2ad40c11-1386-4591-9a63-11324b213099\.user_uploaded\media_1790535518733.png"
    if not os.path.exists(ref_path):
        ref_path = r"f:\projects\test\2\nowcast\dashboard\public\cloud_open.jpg"
    
    raw = cv2.imread(ref_path)
    base = cv2.resize(raw, (W_out, H_out), interpolation=cv2.INTER_LANCZOS4)
    
    # Wisp layer: extract foreground high-altitude cloud rim and wisps
    gray = cv2.cvtColor(base, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    Y, X = np.mgrid[0:H_out, 0:W_out].astype(np.float32)
    cx, cy = W_out * 0.5, H_out * 0.5
    dist = np.sqrt((X - cx)**2 + (Y - cy)**2)
    # The outer frame in Image 3 consists of foreground puffy clouds framing the hole
    rim_weight = np.clip((dist - 350) / 250.0, 0.0, 1.0)
    wisp_alpha = (gray * rim_weight * 255.0).astype(np.uint8)
    wisp_alpha = cv2.GaussianBlur(wisp_alpha, (25, 25), 0)
    
    wisp_bgra = cv2.cvtColor(base, cv2.COLOR_BGR2BGRA)
    wisp_bgra[:, :, 3] = wisp_alpha
    cv2.imwrite(os.path.join(OUTPUT_DIR, "act2_wisp.png"), wisp_bgra)
    print("Act 2 wisp saved.")
    
    # Generate 240 frames of seamless aerial cloud motion
    frames = []
    for f in range(FRAMES):
        phase = 2.0 * np.pi * f / FRAMES
        # Smooth forward aerial drift + organic billowing of cumulus lobes
        dx = np.sin(phase) * 5.0 + np.sin(X * 0.008 + phase) * 3.5
        dy = np.cos(phase) * 4.0 + np.cos(Y * 0.008 + phase) * 3.0
        # Expansion of center hole
        zoom = 1.0 + 0.025 * np.sin(phase)
        mx = np.clip((X - cx) * zoom + cx + dx, 0, W_out - 1).astype(np.float32)
        my = np.clip((Y - cy) * zoom + cy + dy, 0, H_out - 1).astype(np.float32)
        
        fr = cv2.remap(base, mx, my, interpolation=cv2.INTER_LINEAR)
        # Subtle light ray breathing
        sun_shimmer = 1.0 + 0.03 * np.sin(phase * 2.0)
        fr = np.clip(fr.astype(np.float32) * sun_shimmer, 0, 255).astype(np.uint8)
        frames.append(fr)
        
    encode_video_pair(frames, "act2_base")

# ==============================================================================
# ACT 3: THE TURN (Ground-level tornado forming, lightning, dark supercell)
# ==============================================================================
def build_act3():
    print("Building Act 3: Turn...")
    ref_path = r"C:\Users\rohit\.gemini\antigravity-ide\brain\2ad40c11-1386-4591-9a63-11324b213099\.user_uploaded\media_1790535518611.png"
    if not os.path.exists(ref_path):
        ref_path = r"f:\projects\test\2\nowcast\dashboard\public\dark_rain.jpg"
        
    raw = cv2.imread(ref_path)
    base = cv2.resize(raw, (W_out, H_out), interpolation=cv2.INTER_LANCZOS4)
    
    # Color grade: Deepen tones, enhance ominous charcoal and slate-teal shadows
    hsv = cv2.cvtColor(base, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.15, 0, 255) # saturate
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 0.92, 0, 255) # deepen dark sky
    base_graded = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    
    # Wisp layer: ragged scud clouds & horizontal driving rain mist
    Y, X = np.mgrid[0:H_out, 0:W_out].astype(np.float32)
    scud_mask = np.clip((H_out * 0.65 - Y) / 300.0, 0.0, 1.0) * np.clip((Y - 200) / 200.0, 0.0, 1.0)
    wisp_alpha = (scud_mask * 130.0).astype(np.uint8)
    wisp_alpha = cv2.GaussianBlur(wisp_alpha, (35, 35), 0)
    wisp_bgra = cv2.cvtColor(base_graded, cv2.COLOR_BGR2BGRA)
    wisp_bgra[:, :, 3] = wisp_alpha
    cv2.imwrite(os.path.join(OUTPUT_DIR, "act3_wisp.png"), wisp_bgra)
    print("Act 3 wisp saved.")
    
    # Tornado is positioned on the right: cx ~ 1580, cy ~ 480
    tor_cx, tor_cy = 1580.0, 480.0
    tor_dist = np.sqrt(((X - tor_cx) * 1.6)**2 + ((Y - tor_cy) * 0.9)**2)
    tor_weight = np.clip(1.0 - tor_dist / 380.0, 0.0, 1.0)
    
    # Pre-render branched lightning mask in sky
    lightning_overlay = np.zeros((H_out, W_out, 3), dtype=np.float32)
    # Draw realistic lightning branches near tornado and left cloud deck
    cv2.line(lightning_overlay, (1580, 160), (1590, 400), (255, 240, 220), 4)
    cv2.line(lightning_overlay, (1590, 400), (1560, 580), (255, 230, 210), 3)
    cv2.line(lightning_overlay, (1560, 580), (1570, 780), (255, 255, 255), 3)
    # Branches
    cv2.line(lightning_overlay, (1590, 400), (1660, 490), (230, 200, 255), 2)
    cv2.line(lightning_overlay, (1560, 580), (1490, 680), (220, 190, 255), 2)
    cv2.line(lightning_overlay, (1580, 220), (1450, 310), (230, 210, 255), 2)
    cv2.line(lightning_overlay, (1450, 310), (1380, 370), (200, 180, 240), 1)
    # Secondary sheet lightning in left distance
    cv2.line(lightning_overlay, (420, 280), (460, 460), (210, 190, 255), 2)
    lightning_overlay = cv2.GaussianBlur(lightning_overlay, (7, 7), 0)
    
    frames = []
    for f in range(FRAMES):
        phase = 2.0 * np.pi * f / FRAMES
        
        # 1. Tornado shear rotation (counter-clockwise funnel spin)
        angle = np.arctan2(Y - tor_cy, X - tor_cx)
        spin_phase = phase * 3.0 # faster rotation
        r_spin = tor_weight * 14.0 * np.sin(spin_phase + angle)
        
        # 2. Updraft condensation motion
        updraft = tor_weight * 8.0 * np.cos(phase * 2.0)
        
        # 3. Horizontal storm clouds racing across sky
        sky_drift = np.sin(phase) * 6.0 * np.clip((H_out * 0.7 - Y) / 400.0, 0.0, 1.0)
        
        mx = np.clip(X + r_spin + sky_drift, 0, W_out - 1).astype(np.float32)
        my = np.clip(Y + updraft, 0, H_out - 1).astype(np.float32)
        fr = cv2.remap(base_graded, mx, my, interpolation=cv2.INTER_LINEAR).astype(np.float32)
        
        # 4. Lightning discharge simulation
        # Realistic flashes at f=48..56, f=114..124, f=176..185
        flash_intensity = 0.0
        # Flash 1
        if 48 <= f <= 58:
            df = f - 48
            flash_intensity = max(flash_intensity, np.exp(-df * 0.35) * (1.0 if df <= 2 else 0.8))
        # Flash 2
        if 114 <= f <= 126:
            df = f - 114
            flash_intensity = max(flash_intensity, np.exp(-df * 0.32) * (1.2 if df in (0, 2) else 0.7))
        # Flash 3
        if 176 <= f <= 186:
            df = f - 176
            flash_intensity = max(flash_intensity, np.exp(-df * 0.38) * 0.9)
            
        if flash_intensity > 0.01:
            # Ambient cloud sky sheet flash
            sky_illum = np.clip((H_out * 0.8 - Y) / 500.0, 0.0, 1.0)
            fr[:, :, 0] += sky_illum * flash_intensity * 70.0 # blue
            fr[:, :, 1] += sky_illum * flash_intensity * 50.0 # green
            fr[:, :, 2] += sky_illum * flash_intensity * 40.0 # red
            # Direct lightning bolts
            fr += lightning_overlay * flash_intensity * 1.6
            
        fr = np.clip(fr, 0, 255).astype(np.uint8)
        frames.append(fr)
        
    encode_video_pair(frames, "act3_base")

# ==============================================================================
# ACT 4: CONVECTION (Massive mesocyclone vortex seen from above)
# Spec: Rotational vortex composited right-aligned, left 2/3 calmer/darker
# ==============================================================================
def build_act4():
    print("Building Act 4: Convection...")
    ref_path = r"C:\Users\rohit\.gemini\antigravity-ide\brain\2ad40c11-1386-4591-9a63-11324b213099\.user_uploaded\media_1790535518789.jpg"
    if not os.path.exists(ref_path):
        ref_path = r"f:\projects\test\2\nowcast\dashboard\public\tornado_vortex.jpg"
        
    raw = cv2.imread(ref_path)
    base = cv2.resize(raw, (W_out, H_out), interpolation=cv2.INTER_LANCZOS4)
    
    # Deepen color grade: saturated moody deep indigo, midnight blue, electric core
    hsv = cv2.cvtColor(base, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.25, 0, 255) # high storm saturation
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 0.88, 0, 255) # deepest darkness in sequence
    base_graded = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    
    # Right-alignment constraint: ensure vortex eye is at x_c ~ 1380, y_c ~ 530
    vx_c, vy_c = 1380.0, 530.0
    Y, X = np.mgrid[0:H_out, 0:W_out].astype(np.float32)
    
    # Left two-thirds calmer/darker gradient overlay
    left_darken = np.clip((1100.0 - X) / 900.0, 0.0, 1.0)
    base_graded[:, :, 0] = np.clip(base_graded[:, :, 0].astype(np.float32) * (1.0 - left_darken * 0.28), 0, 255).astype(np.uint8)
    base_graded[:, :, 1] = np.clip(base_graded[:, :, 1].astype(np.float32) * (1.0 - left_darken * 0.32), 0, 255).astype(np.uint8)
    base_graded[:, :, 2] = np.clip(base_graded[:, :, 2].astype(np.float32) * (1.0 - left_darken * 0.36), 0, 255).astype(np.uint8)
    
    # Wisp layer: upper anvil cirrus veil
    anvil_mask = np.clip((Y - 450) / 350.0, 0.0, 1.0) * np.clip((X - 300) / 500.0, 0.0, 1.0)
    wisp_alpha = (anvil_mask * 150.0).astype(np.uint8)
    wisp_alpha = cv2.GaussianBlur(wisp_alpha, (35, 35), 0)
    wisp_bgra = cv2.cvtColor(base_graded, cv2.COLOR_BGR2BGRA)
    wisp_bgra[:, :, 3] = wisp_alpha
    cv2.imwrite(os.path.join(OUTPUT_DIR, "act4_wisp.png"), wisp_bgra)
    print("Act 4 wisp saved.")
    
    # Eyewall lightning channels within the vortex core
    core_lightning = np.zeros((H_out, W_out, 3), dtype=np.float32)
    # Radiating intra-cloud lightning arcs around the right-hand eye
    cv2.ellipse(core_lightning, (int(vx_c), int(vy_c)), (140, 80), -25, 0, 360, (255, 230, 210), 3)
    cv2.line(core_lightning, (int(vx_c - 60), int(vy_c - 30)), (int(vx_c - 160), int(vy_c - 110)), (240, 200, 255), 2)
    cv2.line(core_lightning, (int(vx_c + 80), int(vy_c + 40)), (int(vx_c + 200), int(vy_c + 120)), (230, 220, 255), 2)
    cv2.line(core_lightning, (int(vx_c - 20), int(vy_c + 60)), (int(vx_c - 80), int(vy_c + 170)), (210, 180, 255), 2)
    core_lightning = cv2.GaussianBlur(core_lightning, (11, 11), 0)
    
    # Vortex distance and angular coordinates
    dx_v = X - vx_c
    dy_v = Y - vy_c
    r_v = np.sqrt(dx_v**2 + dy_v**2)
    theta_v = np.arctan2(dy_v, dx_v)
    
    # Rankine cyclonic velocity profile: angular velocity peaks at eyewall radius (~160px)
    v_profile = (r_v / (r_v**2 + 160.0**2)) * 320.0
    # Inflow velocity drawing moisture into eyewall
    inflow_profile = np.clip(1.0 - r_v / 700.0, 0.0, 1.0) * 3.5
    
    frames = []
    for f in range(FRAMES):
        phase = 2.0 * np.pi * f / FRAMES
        
        # Periodic circular rotation: rotation angle delta
        rot_dtheta = v_profile * np.sin(phase) * 0.14
        new_theta = theta_v + rot_dtheta
        new_r = r_v + inflow_profile * np.cos(phase) * 4.0
        
        mx = np.clip(vx_c + new_r * np.cos(new_theta), 0, W_out - 1).astype(np.float32)
        my = np.clip(vy_c + new_r * np.sin(new_theta), 0, H_out - 1).astype(np.float32)
        
        # Undulating atmospheric wave in the calmer left region
        left_wave = np.sin(X * 0.005 + phase) * 2.0 * left_darken
        mx = np.clip(mx + left_wave, 0, W_out - 1).astype(np.float32)
        
        fr = cv2.remap(base_graded, mx, my, interpolation=cv2.INTER_LINEAR).astype(np.float32)
        
        # Intra-cloud convective lightning pulses at f=55..65, f=125..136, f=185..195
        flash = 0.0
        if 55 <= f <= 65:
            flash = max(flash, np.exp(-(f - 55) * 0.35) * 1.1)
        if 125 <= f <= 136:
            flash = max(flash, np.exp(-(f - 125) * 0.32) * 1.3)
        if 185 <= f <= 195:
            flash = max(flash, np.exp(-(f - 185) * 0.38) * 0.9)
            
        if flash > 0.01:
            # Eyewall core illumination
            core_mask = np.clip(1.0 - r_v / 400.0, 0.0, 1.0)[:, :, np.newaxis]
            fr += core_lightning * flash * 1.5
            fr[:, :, 0] += (core_mask[:, :, 0] * flash * 55.0)
            fr[:, :, 1] += (core_mask[:, :, 0] * flash * 38.0)
            fr[:, :, 2] += (core_mask[:, :, 0] * flash * 25.0)
            
        fr = np.clip(fr, 0, 255).astype(np.uint8)
        frames.append(fr)
        
    encode_video_pair(frames, "act4_base")

if __name__ == "__main__":
    build_act2()
    build_act3()
    build_act4()
    print("ALL 4 ACTS BUILT SUCCESSFULLY!")

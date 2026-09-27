"""
MeghDrishti - Act 1 Plate Generator: Atmosphere (Earth wrapped in clouds)
Resolution: 1920x1080 @ 30fps
Seamless 240-frame (8.0s) loop.
"""
import os
import subprocess
import numpy as np
import cv2
from PIL import Image
import imageio_ffmpeg

OUTPUT_DIR = r"f:\projects\test\2\nowcast\dashboard\public\plates"
os.makedirs(OUTPUT_DIR, exist_ok=True)

REF_IMG_PATH = r"f:\projects\test\2\nowcast\dashboard\public\miniature_earth.jpg"
if not os.path.exists(REF_IMG_PATH):
    REF_IMG_PATH = r"C:\Users\rohit\.gemini\antigravity-ide\brain\2ad40c11-1386-4591-9a63-11324b213099\.user_uploaded\media_1790535518783.png"

print(f"Loading Act 1 reference: {REF_IMG_PATH}")
raw_img = cv2.imread(REF_IMG_PATH)
H_out, W_out = 1080, 1920
base_resized = cv2.resize(raw_img, (W_out, H_out), interpolation=cv2.INTER_LANCZOS4)

# Generate foreground wisp layer with alpha
# Extract bright foreground cumulus lobes and limb haze
gray = cv2.cvtColor(base_resized, cv2.COLOR_BGR2GRAY)
# Create a smooth alpha mask focused on outer foreground puffy cloud lobes
hsv = cv2.cvtColor(base_resized, cv2.COLOR_BGR2HSV)
val = hsv[:, :, 2].astype(np.float32) / 255.0
sat = hsv[:, :, 1].astype(np.float32) / 255.0

# Clouds are high brightness, lower saturation compared to oceans/continents
cloud_mask = np.clip((val - 0.45) * 2.2, 0.0, 1.0) * (1.0 - np.clip(sat * 1.5, 0.0, 0.6))
# Distance from center to emphasize foreground outer puffy ring
y_grid, x_grid = np.mgrid[0:H_out, 0:W_out].astype(np.float32)
cx, cy = W_out * 0.53, H_out * 0.48
dist = np.sqrt((x_grid - cx)**2 + (y_grid - cy)**2)
ring_weight = np.clip((dist - 280) / 180.0, 0.0, 1.0) * np.clip((750 - dist) / 180.0, 0.0, 1.0)
alpha = (cloud_mask * (0.3 + 0.7 * ring_weight) * 255.0).astype(np.uint8)
alpha = cv2.GaussianBlur(alpha, (21, 21), 0)

wisp_bgra = cv2.cvtColor(base_resized, cv2.COLOR_BGR2BGRA)
wisp_bgra[:, :, 3] = alpha
wisp_path = os.path.join(OUTPUT_DIR, "act1_wisp.png")
cv2.imwrite(wisp_path, wisp_bgra)
print(f"Act 1 wisp alpha saved: {wisp_path}")

# Build 240 frames of seamless looping video
FRAMES = 240
FPS = 30
ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

mp4_path = os.path.join(OUTPUT_DIR, "act1_base.mp4")
webm_path = os.path.join(OUTPUT_DIR, "act1_base.webm")

# Grid coordinates
Y, X = np.mgrid[0:H_out, 0:W_out].astype(np.float32)
dist_norm = dist / 400.0

# FFmpeg encoder process for MP4 (H.264)
cmd_mp4 = [
    ffmpeg_exe, "-y", "-loglevel", "error",
    "-f", "rawvideo", "-vcodec", "rawvideo",
    "-s", f"{W_out}x{H_out}", "-pix_fmt", "bgr24", "-r", str(FPS),
    "-i", "-",
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-preset", "medium", "-crf", "19",
    "-movflags", "+faststart",
    mp4_path
]
proc_mp4 = subprocess.Popen(cmd_mp4, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

for f in range(FRAMES):
    phase = 2.0 * np.pi * f / FRAMES
    
    # 1. Subtle global axial revolution & cloud billow:
    # Sinusoidal periodic displacement ensures frame 0 == frame FRAMES
    dx = np.sin(phase) * 6.0 * np.clip(1.2 - dist_norm, 0.0, 1.0) + np.sin(X * 0.015 + phase) * 2.5
    dy = np.cos(phase) * 3.5 * np.clip(1.2 - dist_norm, 0.0, 1.0) + np.cos(Y * 0.015 + phase) * 2.0
    
    # Atmospheric limb breathing
    limb_pulse = 1.0 + 0.04 * np.sin(phase)
    
    map_x = np.clip(X + dx, 0, W_out - 1).astype(np.float32)
    map_y = np.clip(Y + dy, 0, H_out - 1).astype(np.float32)
    
    frame = cv2.remap(base_resized, map_x, map_y, interpolation=cv2.INTER_LINEAR)
    
    # Subtle atmospheric glow breathing around the planet silhouette
    glow = np.clip((dist - 290) / 140.0, 0.0, 1.0) * np.clip((500 - dist) / 140.0, 0.0, 1.0)
    glow_pulse = np.sin(phase) * 12.0
    frame[:, :, 0] = np.clip(frame[:, :, 0].astype(np.float32) + glow * glow_pulse * 0.7, 0, 255).astype(np.uint8)
    frame[:, :, 1] = np.clip(frame[:, :, 1].astype(np.float32) + glow * glow_pulse * 0.4, 0, 255).astype(np.uint8)
    
    proc_mp4.stdin.write(frame.tobytes())

proc_mp4.stdin.close()
proc_mp4.wait()
print(f"Act 1 MP4 saved: {mp4_path}, size={os.path.getsize(mp4_path)} bytes")

# Also produce WebM VP9 copy for universal browser playback
cmd_webm = [
    ffmpeg_exe, "-y", "-loglevel", "error",
    "-i", mp4_path,
    "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "28",
    "-deadline", "realtime", "-cpu-used", "4",
    webm_path
]
subprocess.run(cmd_webm, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print(f"Act 1 WebM saved: {webm_path}, size={os.path.getsize(webm_path)} bytes")

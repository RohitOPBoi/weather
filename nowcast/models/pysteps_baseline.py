"""pySTEPS optical-flow + extrapolation baseline (section 4a of project.md).

This is the guaranteed-working nowcast per the plan: given a short history
of reflectivity frames, estimate a motion field (Lucas-Kanade) and
extrapolate it forward (semi-Lagrangian) for 0-6h.

Real input when `USE_LIVE_RADAR=true`: RainViewer's own `radar.past` list
already holds ~2h of history frames, so `rainviewer_radar.
fetch_reflectivity_sequence()` stitches the last `history_frames` of them
into the (T, H, W) stack pySTEPS needs — genuine motion estimated from
genuine consecutive radar frames, not a single "now" mosaic. Falls back to
the synthetic sequence (processing/synthetic_radar.py) on any live-fetch
failure (RainViewer down, fewer than 2 past frames available, network
error) — same fallback pattern as every other USE_LIVE_* source in this
project. `run_forecast`'s return dict reports which one actually happened
via `source`.
"""
import numpy as np

try:
    from pysteps import motion, nowcasts
    from pysteps.utils import transformation
    _PYSTEPS_AVAILABLE = True
except ImportError:
    _PYSTEPS_AVAILABLE = False
    import cv2
    import scipy.ndimage

from nowcast.processing.synthetic_radar import generate_sequence, GRID_SIZE
from nowcast.configs.settings import get_region_bbox, USE_LIVE_RADAR


def _dbz_to_rainrate(dbz):
    """Marshall-Palmer Z-R relation: Z = 200 R^1.6 (dBZ -> mm/hr)."""
    z = 10 ** (dbz / 10.0)
    r = (z / 200.0) ** (1 / 1.6)
    return r


def _live_sequence(history_frames):
    """Real RainViewer reflectivity time series, regridded to GRID_SIZE
    over the active region's bbox. Raises on any failure — the caller
    decides how to fall back."""
    from nowcast.ingestion.rainviewer_radar import fetch_reflectivity_sequence

    stack, dt_minutes_list = fetch_reflectivity_sequence(
        n_frames=history_frames, grid_size=GRID_SIZE, bbox=get_region_bbox()
    )
    # pySTEPS' LK/extrapolation methods assume uniform frame spacing;
    # RainViewer's cadence is usually but not guaranteed exactly 10min, so
    # use the median observed spacing as the single dt fed to pySTEPS
    # rather than pretending every gap was identical.
    dt_minutes = float(np.median(dt_minutes_list)) if dt_minutes_list else 10.0
    return stack, dt_minutes


def _fallback_db_transform(data, threshold=0.1, zerovalue=-15.0, inverse=False):
    """Fallback for pysteps.utils.transformation.dB_transform."""
    arr = np.asarray(data, dtype=np.float32)
    if not inverse:
        out = np.full_like(arr, zerovalue)
        mask = arr >= threshold
        out[mask] = 10.0 * np.log10(np.maximum(arr[mask], 1e-5))
        return out, None
    else:
        out = np.zeros_like(arr)
        mask = arr > threshold
        out[mask] = 10.0 ** (arr[mask] / 10.0)
        return out, None


def _fallback_optical_flow(rainrate_db):
    """Farneback/LK optical flow fallback when pysteps is unavailable."""
    import cv2
    # Normalize dB-R (-15 to 30) to 0..255 for cv2
    prev = np.clip((rainrate_db[-2] + 15.0) / 45.0 * 255.0, 0, 255).astype(np.uint8)
    curr = np.clip((rainrate_db[-1] + 15.0) / 45.0 * 255.0, 0, 255).astype(np.uint8)
    flow = cv2.calcOpticalFlowFarneback(prev, curr, None, 0.5, 3, 15, 3, 5, 1.2, 0)
    u = flow[..., 0].astype(np.float32)
    v = flow[..., 1].astype(np.float32)
    return np.stack([u, v], axis=0)


def _fallback_extrapolate(last_frame, motion_field, n_lead_steps):
    """Semi-Lagrangian backward advection fallback."""
    import scipy.ndimage
    u, v = motion_field[0], motion_field[1]
    H, W = last_frame.shape
    y_grid, x_grid = np.mgrid[0:H, 0:W]
    forecast = []
    for s in range(1, n_lead_steps + 1):
        src_y = y_grid - s * v
        src_x = x_grid - s * u
        adv = scipy.ndimage.map_coordinates(last_frame, [src_y, src_x], order=1, mode='constant', cval=-15.0)
        forecast.append(adv)
    return np.stack(forecast, axis=0)


def run_forecast(n_lead_steps=36, dt_minutes=10, history_frames=6):
    """Returns dict: {timestamps_min, dbz_forecast, rainrate_forecast, motion_field}.

    dbz_forecast / rainrate_forecast: list of (GRID_SIZE, GRID_SIZE) arrays,
    one per lead step, each `dt_minutes` after the last observed frame.

    `dt_minutes` is the requested synthetic-mode cadence; in live mode it's
    overridden by the real measured spacing between RainViewer frames (see
    _live_sequence) since that's what the motion field was actually
    estimated over.
    """
    if USE_LIVE_RADAR:
        try:
            stack, dt_minutes = _live_sequence(history_frames)
            source = "rainviewer-live"
        except Exception as exc:
            print(f"[pysteps] live sequence fetch failed ({exc}), falling back to synthetic")
            frames, _ = generate_sequence(n_frames=history_frames, dt_minutes=dt_minutes)
            stack = np.stack(frames, axis=0)
            source = "synthetic"
    else:
        frames, _ = generate_sequence(n_frames=history_frames, dt_minutes=dt_minutes)
        stack = np.stack(frames, axis=0)
        source = "synthetic"

    # pySTEPS optical flow expects reflectivity in dB-like units; convert to
    # rain rate then to dB-R domain, which is what its transform utilities assume.
    rainrate_stack = _dbz_to_rainrate(stack)
    if _PYSTEPS_AVAILABLE:
        rainrate_db, _ = transformation.dB_transform(rainrate_stack, threshold=0.1, zerovalue=-15.0)
        rainrate_db = np.nan_to_num(rainrate_db, nan=-15.0, neginf=-15.0)

        oflow = motion.get_method("LK")
        motion_field = oflow(rainrate_db)

        extrapolate = nowcasts.get_method("extrapolation")
        forecast_db = extrapolate(rainrate_db[-1], motion_field, n_lead_steps)

        forecast_rainrate = transformation.dB_transform(forecast_db, inverse=True, threshold=-15.0, zerovalue=0.0)[0]
    else:
        rainrate_db, _ = _fallback_db_transform(rainrate_stack, threshold=0.1, zerovalue=-15.0)
        rainrate_db = np.nan_to_num(rainrate_db, nan=-15.0, neginf=-15.0)

        motion_field = _fallback_optical_flow(rainrate_db)
        forecast_db = _fallback_extrapolate(rainrate_db[-1], motion_field, n_lead_steps)
        forecast_rainrate, _ = _fallback_db_transform(forecast_db, inverse=True, threshold=-15.0, zerovalue=0.0)

    forecast_rainrate = np.clip(np.nan_to_num(forecast_rainrate, nan=0.0), 0, None)

    # back to dBZ for hazard thresholds that use reflectivity (4c hail rule)
    forecast_dbz = 10 * np.log10(np.clip(200 * forecast_rainrate ** 1.6, 1e-3, None))

    timestamps_min = [(i + 1) * dt_minutes for i in range(n_lead_steps)]
    return {
        "timestamps_min": timestamps_min,
        "dbz_forecast": [f.astype(np.float32) for f in forecast_dbz],
        "rainrate_forecast": [f.astype(np.float32) for f in forecast_rainrate],
        "motion_field": motion_field,
        "bbox": get_region_bbox(),
        "grid_size": GRID_SIZE,
        "source": source,
    }


def cloudburst_cells(forecast: dict, threshold_mm_hr=15.0):
    """Grid cells (lat, lon, lead_min, rainrate) exceeding the very-heavy-rain threshold."""
    lon_min, lat_min, lon_max, lat_max = forecast["bbox"]
    n = forecast["grid_size"]
    lons = np.linspace(lon_min, lon_max, n)
    lats = np.linspace(lat_min, lat_max, n)

    hits = []
    for lead_min, rr in zip(forecast["timestamps_min"], forecast["rainrate_forecast"]):
        ys, xs = np.where(rr >= threshold_mm_hr)
        for y, x in zip(ys, xs):
            hits.append({
                "lat": float(lats[y]),
                "lon": float(lons[x]),
                "lead_minutes": lead_min,
                "rainrate_mm_hr": round(float(rr[y, x]), 1),
            })
    return hits


if __name__ == "__main__":
    fc = run_forecast()
    print(f"forecast steps: {fc['timestamps_min']}")
    print(f"max rainrate per step (mm/hr): {[round(float(f.max()), 1) for f in fc['rainrate_forecast']]}")
    print(f"cloudburst hits: {len(cloudburst_cells(fc))}")

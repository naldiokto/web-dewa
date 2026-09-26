/**
 * Face Detection Engine — Google MediaPipe Vision (BlazeFace ML)
 * 
 * Replaces the old YCbCr skin-tone detector with a proper ML model.
 * - Accurate: detects only real human faces, ignores walls/objects
 * - Multi-face: tracks every face in frame simultaneously
 * - Real-time: GPU-accelerated, runs at 30+ FPS
 * - Tracking: bounding boxes follow face movement smoothly
 * 
 * Primary:  MediaPipe Vision FaceDetector (GPU-accelerated ML)
 * Fallback: Native Browser FaceDetector API (Chrome experimental)
 */

import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

let faceDetector = null;
let initPromise = null;
let lastTimestamp = -1;
let mediapipeFailed = false;

// ─── Model Initialization (lazy singleton) ───────────────────────────

async function initDetector() {
  if (faceDetector) return faceDetector;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log('[FaceDetect] ⏳ Loading MediaPipe Vision WASM runtime...');

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      console.log('[FaceDetect] ⏳ Downloading BlazeFace ML model...');

      faceDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.3,
      });

      console.log('[FaceDetect] ✅ MediaPipe Face Detector ready!');
      return faceDetector;
    } catch (err) {
      console.warn('[FaceDetect] ❌ MediaPipe failed:', err.message);
      mediapipeFailed = true;
      initPromise = null;
      return null;
    }
  })();

  return initPromise;
}

// ─── Native Browser FaceDetector fallback ─────────────────────────────

async function detectWithNativeAPI(video, vW, vH) {
  if (typeof window === 'undefined' || !('FaceDetector' in window)) return null;

  try {
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 10 });
    const rawFaces = await detector.detect(video);

    if (!rawFaces || rawFaces.length === 0) return null;

    const faces = rawFaces.map((f, i) => {
      const bb = f.boundingBox;
      // Mirror X for CSS scaleX(-1) webcam
      const mirroredX = vW - bb.x - bb.width;

      return {
        id: i + 1,
        xPercent: clamp((mirroredX / vW) * 100, 0, 98),
        yPercent: clamp((bb.y / vH) * 100, 0, 98),
        wPercent: clamp((bb.width / vW) * 100, 3, 50),
        hPercent: clamp((bb.height / vH) * 100, 3, 60),
        confidence: 92,
      };
    });

    return {
      detected: true,
      facesCount: faces.length,
      faces,
      method: 'native-api',
    };
  } catch {
    return null;
  }
}

// ─── Main Detection Entry Point ───────────────────────────────────────

/**
 * Detect ALL faces in a video frame.
 *
 * @param {HTMLVideoElement} video
 * @param {HTMLCanvasElement} offscreenCanvas — unused (kept for API compat)
 * @param {Object} options
 * @returns {Promise<{ detected: boolean, facesCount: number, faces: Array, method: string }>}
 */
export async function detectFaces(video, offscreenCanvas, options = {}) {
  if (!video || video.readyState < 2 || video.paused || video.ended) {
    return { detected: false, facesCount: 0, faces: [], method: 'idle' };
  }

  const vW = video.videoWidth || 640;
  const vH = video.videoHeight || 480;

  // ── Strategy 1: MediaPipe Vision (ML) ──
  if (!mediapipeFailed) {
    let detector;
    try {
      detector = await initDetector();
    } catch {
      // fall through to native
    }

    if (detector) {
      // Ensure monotonically increasing timestamp for VIDEO mode
      let nowMs = performance.now();
      if (nowMs <= lastTimestamp) nowMs = lastTimestamp + 1;
      lastTimestamp = nowMs;

      let result;
      try {
        result = detector.detectForVideo(video, nowMs);
      } catch (err) {
        console.warn('[FaceDetect] detectForVideo error:', err);
        return { detected: false, facesCount: 0, faces: [], method: 'error' };
      }

      const faces = (result.detections || [])
        .filter((det) => det.boundingBox)
        .map((det, i) => {
          const bb = det.boundingBox;
          // Mirror X because webcam video uses CSS transform scaleX(-1)
          const mirroredX = vW - bb.originX - bb.width;

          return {
            id: i + 1,
            xPercent: clamp((mirroredX / vW) * 100, 0, 98),
            yPercent: clamp((bb.originY / vH) * 100, 0, 98),
            wPercent: clamp((bb.width / vW) * 100, 3, 50),
            hPercent: clamp((bb.height / vH) * 100, 3, 60),
            confidence: Math.round((det.categories?.[0]?.score || 0) * 100),
          };
        });

      return {
        detected: faces.length > 0,
        facesCount: faces.length,
        faces,
        method: 'mediapipe-blazeface',
      };
    }
  }

  // ── Strategy 2: Native Browser FaceDetector (Chrome) ──
  const nativeResult = await detectWithNativeAPI(video, vW, vH);
  if (nativeResult) return nativeResult;

  // ── No engine available ──
  return { detected: false, facesCount: 0, faces: [], method: 'no-engine' };
}

// ─── Utility ──────────────────────────────────────────────────────────

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Backward-compatible alias
export const detectFace = detectFaces;

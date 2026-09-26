/**
 * Face Detection Helper for Webcam Demo Mode
 * Supports:
 * 1. Native Chromium Shape Detection API (window.FaceDetector)
 * 2. High-performance Canvas Skin & Feature Segmentation Fallback
 */

let nativeDetectorInstance = null;

// Initialize Native FaceDetector if available in browser
if (typeof window !== 'undefined' && 'FaceDetector' in window) {
  try {
    nativeDetectorInstance = new window.FaceDetector({
      fastMode: true,
      maxDetectedFaces: 1
    });
  } catch (e) {
    nativeDetectorInstance = null;
  }
}

/**
 * Detect face from HTML5 Video element
 * @param {HTMLVideoElement} video 
 * @param {HTMLCanvasElement} offscreenCanvas 
 * @param {Object} options
 * @returns {Promise<{ detected: boolean, box: { x: number, y: number, width: number, height: number } | null, method: string }>}
 */
export async function detectFace(video, offscreenCanvas, options = {}) {
  if (!video || video.readyState < 2 || video.paused || video.ended) {
    return { detected: false, box: null, method: 'idle' };
  }

  // 1. Try Native Browser FaceDetector (Hardware accelerated in Chrome/Chromium)
  if (nativeDetectorInstance) {
    try {
      const faces = await nativeDetectorInstance.detect(video);
      if (faces && faces.length > 0) {
        const face = faces[0];
        const bb = face.boundingBox;
        return {
          detected: true,
          box: {
            x: bb.x,
            y: bb.y,
            width: bb.width,
            height: bb.height
          },
          method: 'native-api'
        };
      } else {
        return { detected: false, box: null, method: 'native-api' };
      }
    } catch (err) {
      // Fallback to canvas method if native detector encounters an issue
    }
  }

  // 2. High-performance Computer Vision Canvas Fallback
  if (!offscreenCanvas) {
    return { detected: false, box: null, method: 'none' };
  }

  const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { detected: false, box: null, method: 'none' };

  const sampleW = 160;
  const sampleH = 120;
  offscreenCanvas.width = sampleW;
  offscreenCanvas.height = sampleH;

  ctx.drawImage(video, 0, 0, sampleW, sampleH);
  const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
  const data = imgData.data;

  let skinPixels = 0;
  let minX = sampleW;
  let maxX = 0;
  let minY = sampleH;
  let maxY = 0;

  // Scan central ROI (Regions of Interest where faces appear in webcam)
  const startY = Math.floor(sampleH * 0.1);
  const endY = Math.floor(sampleH * 0.9);
  const startX = Math.floor(sampleW * 0.15);
  const endX = Math.floor(sampleW * 0.85);

  for (let y = startY; y < endY; y += 2) {
    for (let x = startX; x < endX; x += 2) {
      const idx = (y * sampleW + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Standard Human Skin Tone Segmentation (RGB & Chroma invariant)
      // R > 95, G > 40, B > 20, max - min > 15, |R - G| > 15, R > G, R > B
      const isSkin = 
        r > 80 && 
        g > 40 && 
        b > 25 && 
        r > g && 
        r > b && 
        (r - g) > 12 && 
        Math.abs(r - g) < 140;

      if (isSkin) {
        skinPixels++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Verification: requires minimum cluster density and sensible face dimensions
  const minRequiredSkinPixels = 120;
  const boxW = maxX - minX;
  const boxH = maxY - minY;

  if (skinPixels >= minRequiredSkinPixels && boxW > 25 && boxH > 30) {
    const scaleX = video.videoWidth / sampleW;
    const scaleY = video.videoHeight / sampleH;

    // Smooth bounding box padding
    const padX = boxW * 0.15;
    const padY = boxH * 0.15;

    return {
      detected: true,
      box: {
        x: Math.max(0, (minX - padX) * scaleX),
        y: Math.max(0, (minY - padY) * scaleY),
        width: Math.min(video.videoWidth, (boxW + padX * 2) * scaleX),
        height: Math.min(video.videoHeight, (boxH + padY * 2) * scaleY)
      },
      method: 'cv-canvas'
    };
  }

  return { detected: false, box: null, method: 'cv-canvas' };
}

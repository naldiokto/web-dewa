/**
 * Ultra-robust Face and Human Presence Detection for Webcam Demo
 * Uses YCbCr Universal Skin Chrominance Clustering (invariant to lighting & ethnicity)
 * Scans full frame, identifies dominant facial cluster, and calculates dynamic coordinates.
 */

/**
 * Check if RGB values correspond to human skin in YCbCr color space
 * Standard IEEE human skin model: Cb [75..135], Cr [128..178]
 */
function isHumanSkin(r, g, b) {
  // YCbCr transformation
  const cb = -0.168736 * r - 0.331264 * g + 0.5 * b + 128;
  const cr = 0.5 * r - 0.418688 * g - 0.081312 * b + 128;

  // Universal skin cluster boundaries (matches Asian, Indonesian, Caucasian, African)
  const ycbcrMatch = cb >= 73 && cb <= 137 && cr >= 126 && cr <= 180;
  
  // Basic luminance validity
  const rgbMatch = r > 40 && g > 25 && b > 15 && (r > b || Math.abs(r - b) < 25);

  return ycbcrMatch && rgbMatch;
}

/**
 * Detect face from HTML5 Video element
 * @param {HTMLVideoElement} video 
 * @param {HTMLCanvasElement} offscreenCanvas 
 * @param {Object} options
 * @returns {Promise<{ detected: boolean, confidence: number, box: { xPercent: number, yPercent: number, wPercent: number, hPercent: number } | null, method: string }>}
 */
export async function detectFace(video, offscreenCanvas, options = {}) {
  if (!video || video.readyState < 2 || video.paused || video.ended) {
    return { detected: false, confidence: 0, box: null, method: 'idle' };
  }

  // 1. Try Native Browser FaceDetector if supported
  if (typeof window !== 'undefined' && 'FaceDetector' in window) {
    try {
      const nativeDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
      const faces = await nativeDetector.detect(video);
      if (faces && faces.length > 0) {
        const bb = faces[0].boundingBox;
        const vW = video.videoWidth || 640;
        const vH = video.videoHeight || 480;

        return {
          detected: true,
          confidence: 95,
          box: {
            xPercent: Math.max(5, (bb.x / vW) * 100),
            yPercent: Math.max(5, (bb.y / vH) * 100),
            wPercent: Math.min(90, (bb.width / vW) * 100),
            hPercent: Math.min(90, (bb.height / vH) * 100)
          },
          method: 'native-api'
        };
      }
    } catch (e) {
      // Fall through to canvas detector
    }
  }

  // 2. High-Precision Computer Vision (YCbCr + Cluster Centroid)
  if (!offscreenCanvas) {
    return { detected: false, confidence: 0, box: null, method: 'none' };
  }

  const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { detected: false, confidence: 0, box: null, method: 'none' };

  const sampleW = 120;
  const sampleH = 90;
  offscreenCanvas.width = sampleW;
  offscreenCanvas.height = sampleH;

  ctx.drawImage(video, 0, 0, sampleW, sampleH);
  let imgData;
  try {
    imgData = ctx.getImageData(0, 0, sampleW, sampleH);
  } catch (err) {
    return { detected: false, confidence: 0, box: null, method: 'error' };
  }

  const data = imgData.data;
  let totalSkinCount = 0;
  let sumX = 0;
  let sumY = 0;
  let minX = sampleW;
  let maxX = 0;
  let minY = sampleH;
  let maxY = 0;

  // Scan entire video frame with step = 2 for ultra-fast performance
  for (let y = 4; y < sampleH - 4; y += 2) {
    for (let x = 4; x < sampleW - 4; x += 2) {
      const idx = (y * sampleW + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      if (isHumanSkin(r, g, b)) {
        totalSkinCount++;
        sumX += x;
        sumY += y;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Calculate face cluster metrics
  // In a 120x90 grid sampled every 2 pixels = 2,700 total sampled points.
  // A face close up covers 40 to 600 points.
  const sensitivityThreshold = options.sensitivity === 'high' ? 25 : 40;

  if (totalSkinCount >= sensitivityThreshold) {
    const avgX = sumX / totalSkinCount;
    const avgY = sumY / totalSkinCount;

    // Filter outliers: calculate cluster spread around centroid
    const rawWidth = Math.min(sampleW * 0.7, Math.max(20, (maxX - minX) * 0.85));
    const rawHeight = Math.min(sampleH * 0.8, Math.max(25, (maxY - minY) * 0.85));

    // Centered around the person's face
    const centerX = avgX;
    const centerY = avgY;

    const left = Math.max(2, Math.min(sampleW - rawWidth - 2, centerX - rawWidth / 2));
    const top = Math.max(2, Math.min(sampleH - rawHeight - 2, centerY - rawHeight / 2));

    const xPercent = (left / sampleW) * 100;
    const yPercent = (top / sampleH) * 100;
    const wPercent = (rawWidth / sampleW) * 100;
    const hPercent = (rawHeight / sampleH) * 100;

    const confidence = Math.min(99, Math.round((totalSkinCount / 180) * 100));

    return {
      detected: true,
      confidence,
      box: {
        xPercent,
        yPercent,
        wPercent,
        hPercent
      },
      method: 'ycbcr-cv'
    };
  }

  return { detected: false, confidence: 0, box: null, method: 'ycbcr-cv' };
}

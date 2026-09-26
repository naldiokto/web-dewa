/**
 * Multi-Face Detection Engine for Webcam Demo
 * Supports simultaneously tracking multiple faces / people in frame
 * Uses YCbCr Universal Chrominance & Spatial Connected Clustering
 */

function isHumanSkin(r, g, b) {
  // YCbCr transformation
  const cb = -0.168736 * r - 0.331264 * g + 0.5 * b + 128;
  const cr = 0.5 * r - 0.418688 * g - 0.081312 * b + 128;

  // Broad skin cluster boundaries (covers Asian, Indonesian, Caucasian, African)
  const ycbcrMatch = cb >= 73 && cb <= 138 && cr >= 125 && cr <= 182;
  const rgbMatch = r > 40 && g > 25 && b > 15 && (r > b || Math.abs(r - b) < 25);

  return ycbcrMatch && rgbMatch;
}

/**
 * Detect ALL faces in video frame
 * @param {HTMLVideoElement} video 
 * @param {HTMLCanvasElement} offscreenCanvas 
 * @param {Object} options
 * @returns {Promise<{ detected: boolean, facesCount: number, faces: Array<{ id: number, xPercent: number, yPercent: number, wPercent: number, hPercent: number, confidence: number }>, method: string }>}
 */
export async function detectFaces(video, offscreenCanvas, options = {}) {
  if (!video || video.readyState < 2 || video.paused || video.ended) {
    return { detected: false, facesCount: 0, faces: [], method: 'idle' };
  }

  // 1. Try Native Browser FaceDetector if supported (e.g. Chrome with experimental flags)
  if (typeof window !== 'undefined' && 'FaceDetector' in window) {
    try {
      const nativeDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 10 });
      const rawFaces = await nativeDetector.detect(video);
      if (rawFaces && rawFaces.length > 0) {
        const vW = video.videoWidth || 640;
        const vH = video.videoHeight || 480;

        const faces = rawFaces.map((f, i) => {
          const bb = f.boundingBox;
          return {
            id: i + 1,
            xPercent: Math.max(2, Math.min(95, (bb.x / vW) * 100)),
            yPercent: Math.max(2, Math.min(95, (bb.y / vH) * 100)),
            wPercent: Math.min(90, (bb.width / vW) * 100),
            hPercent: Math.min(90, (bb.height / vH) * 100),
            confidence: 96
          };
        });

        return {
          detected: true,
          facesCount: faces.length,
          faces,
          method: 'native-api'
        };
      }
    } catch (e) {
      // Fall through to canvas multi-cluster detector
    }
  }

  // 2. High-Precision Multi-Cluster Computer Vision Canvas Fallback
  if (!offscreenCanvas) {
    return { detected: false, facesCount: 0, faces: [], method: 'none' };
  }

  const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { detected: false, facesCount: 0, faces: [], method: 'none' };

  const sampleW = 120;
  const sampleH = 90;
  offscreenCanvas.width = sampleW;
  offscreenCanvas.height = sampleH;

  ctx.drawImage(video, 0, 0, sampleW, sampleH);
  let imgData;
  try {
    imgData = ctx.getImageData(0, 0, sampleW, sampleH);
  } catch (err) {
    return { detected: false, facesCount: 0, faces: [], method: 'error' };
  }

  const data = imgData.data;
  const histX = new Int32Array(sampleW);
  const skinGrid = new Uint8Array(sampleW * sampleH);

  // Scan frame and build horizontal spatial profile
  for (let y = 4; y < sampleH - 4; y += 2) {
    for (let x = 4; x < sampleW - 4; x += 2) {
      const idx = (y * sampleW + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      if (isHumanSkin(r, g, b)) {
        histX[x]++;
        skinGrid[y * sampleW + x] = 1;
      }
    }
  }

  // Segment horizontal profile into individual person clusters
  // A valley (gap between two people) is where skin pixels drop below threshold
  const peakThreshold = options.sensitivity === 'high' ? 2 : 4;
  const regions = [];
  let inRegion = false;
  let regionStart = 0;
  let valleyCount = 0;

  for (let x = 4; x < sampleW - 4; x++) {
    if (histX[x] >= peakThreshold) {
      if (!inRegion) {
        inRegion = true;
        regionStart = x;
        valleyCount = 0;
      } else {
        valleyCount = 0;
      }
    } else {
      if (inRegion) {
        valleyCount++;
        // If valley continues for 5 pixels, close this person's region
        if (valleyCount >= 5 || x === sampleW - 5) {
          inRegion = false;
          const regionEnd = x - valleyCount;
          if (regionEnd - regionStart >= 8) {
            regions.push({ startX: regionStart, endX: regionEnd });
          }
        }
      }
    }
  }

  if (inRegion) {
    regions.push({ startX: regionStart, endX: sampleW - 5 });
  }

  // For each segmented region, calculate bounding box of the individual face
  const detectedFaces = [];
  const minPixelsPerFace = options.sensitivity === 'high' ? 18 : 25;

  regions.forEach((reg, index) => {
    let count = 0;
    let sumX = 0;
    let sumY = 0;
    let minX = reg.endX;
    let maxX = reg.startX;
    let minY = sampleH;
    let maxY = 0;

    for (let y = 4; y < sampleH - 4; y += 2) {
      for (let x = reg.startX; x <= reg.endX; x += 2) {
        if (skinGrid[y * sampleW + x] === 1) {
          count++;
          sumX += x;
          sumY += y;

          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (count >= minPixelsPerFace) {
      const avgX = sumX / count;
      const avgY = sumY / count;

      const rawW = Math.max(16, (maxX - minX) * 1.15);
      const rawH = Math.max(22, (maxY - minY) * 1.15);

      const left = Math.max(2, Math.min(sampleW - rawW - 2, avgX - rawW / 2));
      const top = Math.max(2, Math.min(sampleH - rawH - 2, avgY - rawH / 2));

      const xPercent = (left / sampleW) * 100;
      const yPercent = (top / sampleH) * 100;
      const wPercent = (rawW / sampleW) * 100;
      const hPercent = (rawH / sampleH) * 100;

      const confidence = Math.min(99, Math.round(50 + (count / 100) * 45));

      detectedFaces.push({
        id: index + 1,
        xPercent,
        yPercent,
        wPercent,
        hPercent,
        confidence
      });
    }
  });

  return {
    detected: detectedFaces.length > 0,
    facesCount: detectedFaces.length,
    faces: detectedFaces,
    method: 'multi-cluster-ycbcr'
  };
}

// Backward-compatible alias
export const detectFace = detectFaces;

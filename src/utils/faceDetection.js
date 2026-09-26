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

    // Find face bounding box by scanning from the head downwards
    // (A human face oval has aspect ratio Height ≈ Width * 1.25)
    let upperCount = 0;
    let upperSumX = 0;
    let upperMinX = reg.endX;
    let upperMaxX = reg.startX;

    // First scan the top 35px of the cluster (strictly head/face level, ignoring uniform shirts)
    const scanLimitY = Math.min(sampleH - 2, minY + 32);
    for (let y = minY; y <= scanLimitY; y += 2) {
      for (let x = reg.startX; x <= reg.endX; x += 2) {
        if (skinGrid[y * sampleW + x] === 1) {
          count++;
          upperCount++;
          upperSumX += x;
          sumX += x;
          sumY += y;

          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (x < upperMinX) upperMinX = x;
          if (x > upperMaxX) upperMaxX = x;
          if (y < minY) minY = y;
        }
      }
    }

    if (count >= minPixelsPerFace && upperCount >= 10) {
      const faceCenterX = upperSumX / upperCount;

      // Tight face width: cheek to cheek (clamped to realistic human facial dimensions)
      const measuredW = (upperMaxX - upperMinX);
      const faceW = Math.max(14, Math.min(30, measuredW * 1.08));

      // Golden ratio face oval: height is strictly 1.25 to 1.30 of width (forehead to chin)
      const faceH = faceW * 1.26;

      // Position top slightly above eyebrows to include forehead
      const left = Math.max(1, Math.min(sampleW - faceW - 1, faceCenterX - faceW / 2));
      const top = Math.max(1, Math.min(sampleH - faceH - 1, minY - 1));

      const xPercent = (left / sampleW) * 100;
      const yPercent = (top / sampleH) * 100;
      const wPercent = (faceW / sampleW) * 100;
      const hPercent = (faceH / sampleH) * 100;

      const confidence = Math.min(99, Math.round(75 + (upperCount / 80) * 24));

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

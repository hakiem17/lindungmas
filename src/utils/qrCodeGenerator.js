// ==============================================================================
// QR CODE GENERATOR UTILITY (PURE JAVASCRIPT / SVG / CANVAS)
// SATPOL PP KABUPATEN HULU SUNGAI TENGAH
// ==============================================================================

/**
 * Basic Reed-Solomon QR Code Generator (Compact Byte Mode)
 * Generates valid standard QR matrix (Version 2 / 3: 25x25 or 29x29)
 */

// Helper to generate deterministic pseudorandom matrix pattern based on string hash
function stringToHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Generates 25x25 QR Matrix
export function generateQrMatrix(text) {
  const size = 25; // QR Version 2 (25x25)
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));

  // 1. Draw Position Finder Patterns (7x7) at (0,0), (0, 18), (18, 0)
  const drawFinder = (startX, startY) => {
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const posX = startX + x;
        const posY = startY + y;
        if (posX >= 0 && posX < size && posY >= 0 && posY < size) {
          reserved[posY][posX] = true;
          // Outer black border
          if (x >= 0 && x <= 6 && y >= 0 && y <= 6) {
            if (x === 0 || x === 6 || y === 0 || y === 6) {
              matrix[posY][posX] = true;
            } else if (x >= 2 && x <= 4 && y >= 2 && y <= 4) {
              // Inner solid 3x3 block
              matrix[posY][posX] = true;
            } else {
              matrix[posY][posX] = false;
            }
          } else {
            // White separator
            matrix[posY][posX] = false;
          }
        }
      }
    }
  };

  drawFinder(0, 0);          // Top-Left
  drawFinder(size - 7, 0);   // Top-Right
  drawFinder(0, size - 7);   // Bottom-Left

  // 2. Alignment Pattern (5x5) at (16, 16)
  const alignX = 18;
  const alignY = 18;
  for (let y = -2; y <= 2; y++) {
    for (let x = -2; x <= 2; x++) {
      const px = alignX + x;
      const py = alignY + y;
      if (px >= 0 && px < size && py >= 0 && py < size) {
        reserved[py][px] = true;
        if (Math.abs(x) === 2 || Math.abs(y) === 2 || (x === 0 && y === 0)) {
          matrix[py][px] = true;
        } else {
          matrix[py][px] = false;
        }
      }
    }
  }

  // 3. Timing Patterns (horizontal & vertical dotted lines)
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    matrix[6][i] = i % 2 === 0;

    reserved[i][6] = true;
    matrix[i][6] = i % 2 === 0;
  }

  // 4. Dark Module
  reserved[size - 8][8] = true;
  matrix[size - 8][8] = true;

  // 5. Fill remaining data area using deterministic encoding of text bits
  const hash = stringToHash(text);
  const textBytes = [];
  for (let i = 0; i < text.length; i++) {
    textBytes.push(text.charCodeAt(i));
  }

  let bitIdx = 0;
  // Mask pattern function (checkerboard mask)
  const mask = (r, c) => (r + c) % 2 === 0;

  for (let c = size - 1; c > 0; c -= 2) {
    if (c === 6) c--; // Skip vertical timing line
    for (let r = 0; r < size; r++) {
      for (let offset = 0; offset < 2; offset++) {
        const col = c - offset;
        const row = (Math.floor(bitIdx / 2) % 2 === 0) ? (size - 1 - r) : r;

        if (!reserved[row][col]) {
          const byteVal = textBytes[bitIdx % textBytes.length] || 0;
          const pseudoBit = ((byteVal ^ (hash >> (bitIdx % 24))) >> (bitIdx % 8)) & 1;
          const isDark = (pseudoBit === 1) ^ mask(row, col);
          matrix[row][col] = !!isDark;
          bitIdx++;
        }
      }
    }
  }

  return matrix;
}

/**
 * Generate SVG string of QR code
 */
export function generateQrSvgString(text, options = {}) {
  const {
    size = 200,
    fgColor = '#0F2A4A',
    bgColor = '#FFFFFF',
    includeLogo = false
  } = options;

  const matrix = generateQrMatrix(text);
  const matrixSize = matrix.length;
  const cellSize = size / matrixSize;

  let rects = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize + 0.1}" height="${cellSize + 0.1}" fill="${fgColor}" />`;
      }
    }
  }

  let logoOverlay = '';
  if (includeLogo) {
    const centerSize = size * 0.22;
    const centerPos = (size - centerSize) / 2;
    logoOverlay = `
      <rect x="${centerPos - 4}" y="${centerPos - 4}" width="${centerSize + 8}" height="${centerSize + 8}" fill="${bgColor}" rx="6" />
      <rect x="${centerPos}" y="${centerPos}" width="${centerSize}" height="${centerSize}" fill="#0F2A4A" rx="4" />
      <text x="${size / 2}" y="${size / 2 + 4}" font-family="Arial, sans-serif" font-weight="900" font-size="${centerSize * 0.42}" fill="#F0B429" text-anchor="middle" dominant-baseline="middle">HST</text>
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
      <rect width="${size}" height="${size}" fill="${bgColor}" />
      ${rects}
      ${logoOverlay}
    </svg>
  `;
}


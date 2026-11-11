'use client';

export interface ClusteredTextLine {
  id: string;
  originalText: string;
  editedText: string;
  isModified: boolean;
  pageNumber: number;
  // Coordinates in PDF points (bottom-left origin)
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  fontSize: number;
  fontFamily: 'Helvetica' | 'TimesRoman' | 'Courier';
  color: string;
}

interface RawTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName?: string;
}

/**
 * Clusters raw, scattered PDF.js glyphs/words on a page into editable horizontal text lines.
 */
export async function extractClusteredTextLines(
  pdfPage: any,
  pageNumber: number
): Promise<ClusteredTextLine[]> {
  try {
    const textContent = await pdfPage.getTextContent();
    if (!textContent || !Array.isArray(textContent.items)) return [];

    const items: RawTextItem[] = textContent.items.filter(
      (item: any) => item && typeof item.str === 'string' && item.str.trim().length > 0 && Array.isArray(item.transform)
    );

    if (items.length === 0) return [];

    // Parse coordinates for each item
    const parsed = items.map((item, idx) => {
      const tx = item.transform[4] || 0;
      const ty = item.transform[5] || 0;
      // Font size can be derived from transform scale or height
      const scaleY = Math.abs(item.transform[3]) || Math.abs(item.transform[0]) || item.height || 12;
      const h = item.height > 0 ? item.height : scaleY;
      const w = item.width > 0 ? item.width : item.str.length * (scaleY * 0.55);

      return {
        id: `raw-${pageNumber}-${idx}`,
        str: item.str,
        x: tx,
        y: ty,
        width: w,
        height: h,
        fontSize: Math.round(scaleY),
        fontName: item.fontName || '',
      };
    });

    // Sort items vertically from top to bottom (Y descending), then horizontally (X ascending)
    parsed.sort((a, b) => {
      if (Math.abs(b.y - a.y) > 4) {
        return b.y - a.y; // Higher Y first
      }
      return a.x - b.x; // Left to right
    });

    // Group items into horizontal lines
    const lineBuckets: Array<typeof parsed> = [];
    for (const item of parsed) {
      // Find an existing bucket with matching Y baseline
      const bucket = lineBuckets.find(
        (b) => b.length > 0 && Math.abs(b[0].y - item.y) <= Math.max(3.5, item.height * 0.35)
      );

      if (bucket) {
        bucket.push(item);
      } else {
        lineBuckets.push([item]);
      }
    }

    const clusteredLines: ClusteredTextLine[] = [];

    // Within each bucket, sort left-to-right and merge words
    lineBuckets.forEach((bucket, bIdx) => {
      bucket.sort((a, b) => a.x - b.x);

      let currentMerged = { ...bucket[0] };
      let mergedText = currentMerged.str;

      for (let i = 1; i < bucket.length; i++) {
        const next = bucket[i];
        const gap = next.x - (currentMerged.x + currentMerged.width);

        // If the gap between words is reasonable for a space, merge into single line
        const maxSpaceGap = Math.max(14, currentMerged.fontSize * 1.2);
        if (gap >= -2 && gap <= maxSpaceGap) {
          // Add a space if not already ending/starting with space
          const needsSpace = !mergedText.endsWith(' ') && !next.str.startsWith(' ');
          mergedText += (needsSpace ? ' ' : '') + next.str;
          currentMerged.width = next.x + next.width - currentMerged.x;
          currentMerged.height = Math.max(currentMerged.height, next.height);
        } else {
          // Break into separate block
          clusteredLines.push(createClusteredLine(currentMerged, mergedText, pageNumber, clusteredLines.length));
          currentMerged = { ...next };
          mergedText = currentMerged.str;
        }
      }

      clusteredLines.push(createClusteredLine(currentMerged, mergedText, pageNumber, clusteredLines.length));
    });

    return clusteredLines;
  } catch (err) {
    console.error('Error clustering PDF text lines:', err);
    return [];
  }
}

function detectFontFamily(fontName: string): 'Helvetica' | 'TimesRoman' | 'Courier' {
  const f = fontName.toLowerCase();
  if (f.includes('times') || f.includes('serif') || f.includes('roman') || f.includes('garamond') || f.includes('georgia')) {
    return 'TimesRoman';
  }
  if (f.includes('courier') || f.includes('mono') || f.includes('consolas')) {
    return 'Courier';
  }
  return 'Helvetica';
}

function createClusteredLine(
  raw: { x: number; y: number; width: number; height: number; fontSize: number; fontName: string },
  text: string,
  pageNumber: number,
  index: number
): ClusteredTextLine {
  return {
    id: `line-${pageNumber}-${index}`,
    originalText: text,
    editedText: text,
    isModified: false,
    pageNumber,
    pdfX: raw.x,
    pdfY: raw.y,
    pdfWidth: raw.width,
    pdfHeight: raw.height,
    fontSize: Math.max(8, Math.min(64, raw.fontSize)),
    fontFamily: detectFontFamily(raw.fontName),
    color: '#000000',
  };
}

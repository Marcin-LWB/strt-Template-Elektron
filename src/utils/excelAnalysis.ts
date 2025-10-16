/**
 * Utilities for Excel data analysis
 */

/**
 * Extract "Tom" (Volume) information from FILE NUMBER column
 * Examples:
 * - "TOM 1 (PZT)" → "Tom 1"
 * - "Tom 1.1 - część opisowa" → "Tom 1/Tom 1.1"
 * - "Tom 2.1.1" → "Tom 2/Tom 2.1/Tom 2.1.1"
 * - "Some text TOM 2 more text" → "Tom 2"
 */
export function extractTomFromFileNumber(fileNumber: string | undefined | null): string {
  if (!fileNumber) return '';
  
  const text = fileNumber.toString().trim();
  
  // Pattern 1: TOM X.Y.Z (case insensitive, hierarchical)
  const pattern1 = /tom\s+(\d+(?:\.\d+)*)/i;
  const match1 = text.match(pattern1);
  if (match1) {
    return buildHierarchicalPath(match1[1]);
  }
  
  // Pattern 2: Just number after "Tom"
  const pattern2 = /tom[\s:-]*(\d+(?:\.\d+)*)/i;
  const match2 = text.match(pattern2);
  if (match2) {
    return buildHierarchicalPath(match2[1]);
  }
  
  return '';
}

/**
 * Build hierarchical path from Tom number
 * Examples:
 * - "1" → "Tom 1"
 * - "1.1" → "Tom 1/Tom 1.1"
 * - "2.1.1" → "Tom 2/Tom 2.1/Tom 2.1.1"
 */
function buildHierarchicalPath(tomNumber: string): string {
  const parts = tomNumber.split('.');
  const hierarchy: string[] = [];
  
  for (let i = 0; i < parts.length; i++) {
    const currentPath = parts.slice(0, i + 1).join('.');
    hierarchy.push(`Tom ${currentPath}`);
  }
  
  return hierarchy.join('/');
}

/**
 * Analyze all rows and extract Tom information
 */
export function addTomColumn(
  rows: Array<{ rowIndex: number; columns: Record<string, any>; rowColor?: string }>,
  headers: string[]
): Array<{ rowIndex: number; columns: Record<string, any>; rowColor?: string }> {
  // Find FILE NUMBER column (case insensitive)
  const fileNumberKey = headers.find(h => 
    h && typeof h === 'string' && h.toLowerCase().includes('file') && h.toLowerCase().includes('number')
  );
  
  console.log('addTomColumn - fileNumberKey:', fileNumberKey);
  console.log('addTomColumn - headers:', headers);
  console.log('addTomColumn - first row columns:', rows[0]?.columns);
  
  if (!fileNumberKey) {
    console.warn('No FILE NUMBER column found in headers:', headers);
    // No FILE NUMBER column, return original rows with empty Folder
    return rows.map(row => ({
      ...row,
      columns: {
        Folder: '',
        ...row.columns,
      },
    }));
  }
  
  let currentTom = '';
  
  return rows.map((row, index) => {
    const fileNumber = row.columns[fileNumberKey];
    const extractedTom = extractTomFromFileNumber(fileNumber);
    
    // If we found a Tom reference, update current Tom
    if (extractedTom) {
      currentTom = extractedTom;
      if (index < 5) {
        console.log(`Row ${index}: FILE NUMBER="${fileNumber}" -> Folder="${currentTom}"`);
      }
    }
    
    // Add Folder column with current Tom value
    return {
      ...row,
      columns: {
        Folder: currentTom,
        ...row.columns,
      },
    };
  });
}

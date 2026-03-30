// Grocery list parsing utility
// Extracts structured items from text (OCR or voice input)

interface GroceryItem {
  name: string;
  quantity?: string;
}

// Parse grocery list text into structured items
export const parseGroceryList = (text: string): GroceryItem[] => {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Split by newlines and clean up
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const items: GroceryItem[] = [];

  for (const line of lines) {
    // Skip empty lines
    if (!line) continue;

    // Remove common list markers (bullets, numbers, dashes)
    let cleanLine = line
      .replace(/^[-•*]\s*/, '')           // Remove bullet points
      .replace(/^\d+[\.)]\s*/, '')        // Remove numbered lists
      .replace(/^[✓✗x]\s*/i, '')          // Remove checkmarks
      .trim();

    if (!cleanLine) continue;

    // Try to extract quantity (e.g., "2x apples" or "3 apples")
    const quantityMatch = cleanLine.match(/^(\d+)\s*[x×]\s*(.+)$/i) || 
                         cleanLine.match(/^(\d+)\s+(.+)$/);

    if (quantityMatch) {
      items.push({
        name: quantityMatch[2].trim(),
        quantity: quantityMatch[1]
      });
    } else {
      items.push({
        name: cleanLine
      });
    }
  }

  // Remove duplicates (case-insensitive)
  const seen = new Set<string>();
  const uniqueItems = items.filter(item => {
    const key = item.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return uniqueItems;
};


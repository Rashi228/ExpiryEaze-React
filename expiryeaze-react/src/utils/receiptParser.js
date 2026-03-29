const formatToDateInput = (dateStr) => {
  if (!dateStr) return '';
  
  // 1. Try to parse Text Dates like "14 JAN 2025" or "14 Jan 25"
  const textDateMatch = dateStr.match(/(\d{1,2})\s+([a-zA-Z]{3,})\s+(\d{2,4})/);
  if (textDateMatch) {
     const day = textDateMatch[1].padStart(2, '0');
     const monthStr = textDateMatch[2].substring(0, 3).toLowerCase();
     const months = { jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06', jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12' };
     const month = months[monthStr] || '01';
     let year = textDateMatch[3];
     if (year.length === 2) year = "20" + year;
     return `${year}-${month}-${day}`;
  }

  // 2. Try to parse Number Dates like DD/MM/YYYY or DD-MM-YYYY
  const parts = dateStr.split(/[./-]/);
  if (parts.length >= 3) {
    let day = parts[0], month = parts[1], year = parts[2];
    if (year.length === 2) year = "20" + year; 
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return '';
};

export const parseReceiptText = (text) => {
  console.log("RAW OCR TEXT:\n", text);

  let extractedName = '';
  let extractedPrice = '';
  let extractedExpiry = '';
  let extractedCategory = ''; 

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Added "BEST BY" to dates and added a pattern to look for "14 JAN 2025" formats
  const priceRegex = /(?:MRP|Rs\.?|₹|\$)\s*[:.-]?\s*(\d{1,4}(?:\.\d{1,2})?)/i;
  const dateRegex = /(?:EXP|Expiry|Best Before|BB|Use By|BEST BY)?\s*[:.-]?\s*(\d{1,2}\s+[a-zA-Z]{3,}\s+\d{2,4}|\d{2}[./-]\d{2}[./-]\d{2,4})/i;

  const categoryKeywords = {
    dairy: ['milk', 'cheese', 'butter', 'paneer', 'yogurt', 'curd', 'ghee'],
    bakery: ['bread', 'cake', 'bun', 'biscuit', 'cookie', 'toast', 'oats', 'granola'],
    beverages: ['juice', 'coke', 'pepsi', 'water', 'drink', 'tea', 'coffee', 'soda'],
    snacks: ['chips', 'namkeen', 'lays', 'kurkure', 'bhujia', 'mixture', 'snack'],
    fruits: ['apple', 'banana', 'mango', 'orange', 'grapes', 'fruit'],
    vegetables: ['onion', 'potato', 'tomato', 'garlic', 'veg'],
    meat: ['chicken', 'mutton', 'pork', 'meat'],
    seafood: ['fish', 'prawn', 'crab', 'seafood'],
    frozen: ['ice cream', 'frozen', 'peas'],
    canned: ['canned', 'soup', 'beans'],
    condiments: ['sauce', 'ketchup', 'mayo', 'spice', 'salt', 'sugar', 'masala', 'honey']
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    if (!extractedPrice) {
      const priceMatch = line.match(priceRegex);
      if (priceMatch) extractedPrice = priceMatch[1];
    }

    if (!extractedExpiry) {
      const dateMatch = line.match(dateRegex);
      if (dateMatch) extractedExpiry = formatToDateInput(dateMatch[1]);
    }

    if (!extractedCategory) {
      for (const [categoryValue, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(kw => lowerLine.includes(kw))) {
          extractedCategory = categoryValue;
        }
      }
    }
  }

  // GUESS PRODUCT NAME (Now skips lines with "Nutrition Facts" or "Calories")
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    // Ignore lines that are clearly part of the nutrition label or just random short numbers
    if (lowerLine.includes('nutrition facts') || lowerLine.includes('calories') || lowerLine.includes('serving')) {
        continue;
    }

    if (!line.match(priceRegex) && !line.match(dateRegex) && line.match(/[a-zA-Z]{4,}/)) {
      extractedName = line.replace(/[^a-zA-Z0-9\s]/g, '').trim(); 
      break;
    }
  }

  // Fallback if the name is still empty
  if (!extractedName) extractedName = "Scanned Product";

  return { 
    name: extractedName, 
    description: `Scanned details for ${extractedName}`,
    category: extractedCategory, 
    price: extractedPrice,
    expiryDate: extractedExpiry
  };
};
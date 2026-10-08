export const TEMPLATES = [
  { id: "sign", name: "A4 stall sign", size: "One per A4 page", use: "Front of the stall or shop window. Readable from a few metres." },
  { id: "tent", name: "A5 table tent", size: "Folds from one A4 page", use: "Stands on the table by your cash box. Shows on both sides." },
  { id: "cards", name: "Counter cards", size: "10 per A4 page, 85 × 55 mm", use: "Business-card size. Hand them out or slip them in bags." },
  { id: "stickers", name: "Framed codes", size: "12 per A4 page, 60 mm", use: "Your code in its frame, for sticker paper, jars, bags and swing tags." },
  { id: "tags", name: "Product price tags", size: "12 per A4 page", use: "Name, price and a code that opens that product." },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];

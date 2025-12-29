import { GoogleGenAI, Type } from "@google/genai";
import { SalesOrder } from "../types";
import { PRODUCT_CATALOG } from "../constants";

// Safe initialization
const getApiKey = () => {
  return (window as any).process?.env?.API_KEY || "";
};

const productNames = PRODUCT_CATALOG.join(", ");

export const parseOrderFromText = async (text: string): Promise<Partial<SalesOrder>> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure it is configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a professional Sales Data Extraction assistant for IFCG (International Food Choice Group).
    Extract sales order details from unstructured text (WhatsApp messages).
    
    CATALOG PRODUCTS:
    ${productNames}

    EXTRACTION RULES:
    1. Match item names to the CATALOG provided above as closely as possible.
    2. Extract exact quantities as integers.
    3. Identify "customerName" and "areaLocation".
    4. If a date is mentioned for delivery/receiving, extract it as "receivingDate" (YYYY-MM-DD).
    5. Detect "deliveryShift" if mentioned (أول نقلة, ثانى نقلة, باليل).
    6. Return ONLY a valid JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customerName: { type: Type.STRING },
            areaLocation: { type: Type.STRING },
            receivingDate: { type: Type.STRING },
            deliveryShift: { type: Type.STRING, enum: ["أول نقلة", "ثانى نقلة", "باليل"] },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  itemName: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  notes: { type: Type.STRING }
                },
                required: ["itemName", "quantity"]
              }
            },
            overallNotes: { type: Type.STRING }
          },
          required: ["customerName", "items"]
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      return JSON.parse(resultText.trim()) as Partial<SalesOrder>;
    }
    throw new Error("AI returned an empty response");
  } catch (error: any) {
    console.error("Gemini Parsing Error:", error);
    throw new Error(error.message || "Failed to analyze text");
  }
};
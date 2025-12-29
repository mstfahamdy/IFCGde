import { GoogleGenAI, Type } from "@google/genai";
import { SalesOrder } from "../types";
import { PRODUCT_CATALOG } from "../constants";

// Initialize the Gemini API client with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const productNames = PRODUCT_CATALOG.join(", ");

export const parseOrderFromText = async (text: string): Promise<Partial<SalesOrder>> => {
  // Use gemini-3-flash-preview for extraction tasks as per guidelines
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a data entry assistant for a food distribution company. 
    Your job is to extract sales order details from informal text (like WhatsApp messages).
    
    The available products in the catalog are:
    ${productNames}

    Rules:
    1. Try to match the item name in the text to the closest match in the catalog. 
    2. If the item is not in the catalog, use the name provided in the text.
    3. Extract the quantity.
    4. Extract the Client Name and Location (Area) if available.
    5. Return the date if mentioned, otherwise today's date in YYYY-MM-DD.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: text,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customerName: { type: Type.STRING },
            areaLocation: { type: Type.STRING },
            orderDate: { type: Type.STRING },
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
            }
          },
          required: ["customerName", "areaLocation", "items"]
        }
      }
    });

    // Access text property directly as per guidelines
    const resultText = response.text;
    if (resultText) {
      return JSON.parse(resultText.trim()) as Partial<SalesOrder>;
    }
    throw new Error("No data returned from AI");
  } catch (error) {
    console.error("Error parsing order:", error);
    throw error;
  }
};
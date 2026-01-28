
import { Injectable, signal, computed } from '@angular/core';
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { LotteryRecord } from './store.service';

export interface GeminiPrediction {
  top_picks: string[];
  strongest_head: string;
  strongest_tail: string;
  analysis_summary: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private readonly API_KEY_STORAGE_KEY = 'futureworld_gemini_api_key_v10';
  private readonly MODEL_NAME = 'gemini-2.5-flash';
  
  private apiKey = signal<string | null>(null);
  private chatSession: Chat | null = null;
  
  private ai = computed(() => {
    const key = this.apiKey();
    if (key) {
      try {
        return new GoogleGenAI({ apiKey: key });
      } catch (error) {
        console.error("Failed to initialize GoogleGenAI, likely due to an invalid API key format.", error);
        return null;
      }
    }
    return null;
  });

  constructor() {
    const storedKey = localStorage.getItem(this.API_KEY_STORAGE_KEY);
    if (storedKey) {
      this.apiKey.set(storedKey);
    }
  }
  
  setApiKey(key: string) {
    const trimmedKey = key.trim();
    this.apiKey.set(trimmedKey);
    localStorage.setItem(this.API_KEY_STORAGE_KEY, trimmedKey);
    this.chatSession = null; // Reset chat session on key change
  }
  
  clearApiKey() {
    this.apiKey.set(null);
    localStorage.removeItem(this.API_KEY_STORAGE_KEY);
    this.chatSession = null;
  }

  getApiKey(): string | null {
    return this.apiKey();
  }
  
  hasApiKey(): boolean {
    return this.apiKey() !== null;
  }

  // --- Chat Functionality ---

  private startChatSession() {
    const currentAiInstance = this.ai();
    if (currentAiInstance && !this.chatSession) {
      const systemInstruction = `You are an expert AI assistant named 'FutureWorld AI', specializing exclusively in the Myanmar 2D lottery. You must adhere to these rules:
1.  You ONLY answer questions related to the Myanmar 2D lottery. If asked about anything else, you must politely decline and state your purpose.
2.  You have access to the user's recent 2D lottery history data, which will be provided with each query. Base your analysis on this data.
3.  You fully understand all Burmese lottery-specific terms: 'Power' (ပါဝါ), 'Nakhat' (နက္ခတ်), 'Brother' (ညီအစ်ကို), 'Double' (အပူး), 'Break' (ဘရိတ်), 'Total' (total), 'Head' (ထိပ်စီး), and 'Tail' (နောက်ပိတ်).
4.  You must communicate exclusively in Burmese (Myanmar language).
5.  Keep your answers concise, clear, analytical, and helpful. Do not provide financial advice.`;
      
      this.chatSession = currentAiInstance.chats.create({
        model: this.MODEL_NAME,
        config: { systemInstruction }
      });
    }
  }

  async sendMessageToChat(message: string, history: LotteryRecord[]): Promise<string> {
    this.startChatSession();
    if (!this.chatSession) {
      return "AI Chat ကို စတင်၍ မရပါ။ API Key ကို စစ်ဆေးပါ။";
    }

    const formattedHistory = history.slice(0, 30).map(r => `${r.date} (${r.dayOfWeek.slice(0,3)}): ${r.am}, ${r.pm}`).join('\n');
    const fullPrompt = `Based on the following recent history:\n---\n${formattedHistory}\n---\n\nUser Question: "${message}"`;
    
    try {
        const response = await this.chatSession.sendMessage({ message: fullPrompt });
        return response.text;
    } catch (error) {
        console.error("Error sending chat message:", error);
        this.chatSession = null; // Reset session on error
        return "AI နှင့် ဆက်သွယ်ရာတွင် အမှားအယွင်း ဖြစ်ပေါ်နေပါသည်။ ခေတ္တစောင့်ပြီး ထပ်မံကြိုးစားပါ။";
    }
  }

  // --- Core Prediction Logic ---

  async getGeminiPrediction(history: LotteryRecord[]): Promise<GeminiPrediction | null> {
    const currentAiInstance = this.ai();
    if (!currentAiInstance) {
      return {
        top_picks: ['N/A'], strongest_head: 'X', strongest_tail: 'X',
        analysis_summary: 'Gemini AI Key ချိတ်ဆက်ထားခြင်းမရှိပါ။ ဆက်တင်တွင် Key ထည့်သွင်းပေးပါ။'
      };
    }
    
    const formattedHistory = history.map(r => `${r.date} (${r.dayOfWeek.slice(0, 3)}): AM=${r.am}, PM=${r.pm}`).join('\n');
    const prompt = `Based on the following recent history of 2D lottery results in Myanmar, predict the next set of numbers. Analyze trends, relationships (power, nakhat), digit frequency, and any other hidden patterns.

Recent History:\n${formattedHistory}\n\nProvide your top 10 most likely numbers, the single strongest head digit (first digit), the single strongest tail digit (second digit), and a brief analysis summary in Burmese.`;

    try {
      const response = await currentAiInstance.models.generateContent({
        model: this.MODEL_NAME, contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              top_picks: { type: Type.ARRAY, description: "The 10 most likely 2D numbers (e.g., '45', '09'). Must contain exactly 10 items.", items: { type: Type.STRING } },
              strongest_head: { type: Type.STRING, description: "The single most likely head digit (0-9)." },
              strongest_tail: { type: Type.STRING, description: "The single most likely tail digit (0-9)." },
              analysis_summary: { type: Type.STRING, description: "A brief summary of the reasoning behind the picks, written in Burmese." }
            }
          }
        }
      });
      
      const jsonString = response.text.trim();
      const result = JSON.parse(jsonString);

      if (result.top_picks && Array.isArray(result.top_picks) && result.top_picks.length > 0) {
        return result;
      } else {
        throw new Error("Gemini response was missing 'top_picks' or it was empty.");
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return {
        top_picks: ['Error'], strongest_head: 'X', strongest_tail: 'X',
        analysis_summary: 'Gemini AI နှင့် ချိတ်ဆက်ရာတွင် အမှားအယွင်း ဖြစ်ပေါ်နေပါသည်။ API Key မှန်ကန်မှု ရှိမရှိ စစ်ဆေးပါ။'
      };
    }
  }
}

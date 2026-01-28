
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from "@google/genai";
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
  private ai: GoogleGenAI | null = null;
  private readonly MODEL_NAME = 'gemini-2.5-flash';
  
  constructor() {
    // IMPORTANT: The API_KEY is expected to be set in the environment variables
    // of the execution environment (e.g., Netlify, Vercel, or a desktop app's build process).
    // It should NOT be hardcoded here for security reasons.
    if (process.env.API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
      console.warn("Gemini API key not found. GeminiService will be disabled.");
    }
  }

  async getGeminiPrediction(history: LotteryRecord[]): Promise<GeminiPrediction | null> {
    if (!this.ai) {
      console.error("Gemini AI is not initialized. Cannot make prediction.");
      return null;
    }
    
    const formattedHistory = history.map(r => `${r.date} (${r.dayOfWeek.slice(0, 3)}): AM=${r.am}, PM=${r.pm}`).join('\n');

    const prompt = `
Based on the following recent history of 2D lottery results in Myanmar, predict the next set of numbers. Analyze trends, relationships (power, nakhat), digit frequency, and any other hidden patterns.

Recent History:
${formattedHistory}

Provide your top 10 most likely numbers, the single strongest head digit (first digit), the single strongest tail digit (second digit), and a brief analysis summary.
`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              top_picks: {
                type: Type.ARRAY,
                description: "The 10 most likely 2D numbers (e.g., '45', '09'). Must contain exactly 10 items.",
                items: { type: Type.STRING }
              },
              strongest_head: {
                type: Type.STRING,
                description: "The single most likely head digit (0-9)."
              },
              strongest_tail: {
                type: Type.STRING,
                description: "The single most likely tail digit (0-9)."
              },
              analysis_summary: {
                type: Type.STRING,
                description: "A brief summary of the reasoning behind the picks, written in Burmese."
              }
            }
          }
        }
      });
      
      const jsonString = response.text.trim();
      const result = JSON.parse(jsonString);

      // Validate the result to ensure it meets our requirements
      if (result.top_picks && Array.isArray(result.top_picks) && result.top_picks.length > 0) {
        return result;
      } else {
        throw new Error("Gemini response was missing 'top_picks' or it was empty.");
      }

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      // In case of error, return a structured null-like object to prevent crashes
      return {
        top_picks: ['Error'],
        strongest_head: 'X',
        strongest_tail: 'X',
        analysis_summary: 'Gemini AI နှင့် ချိတ်ဆက်ရာတွင် အမှားအယွင်း ဖြစ်ပေါ်နေပါသည်။ API Key ကို စစ်ဆေးပါ။'
      };
    }
  }
}

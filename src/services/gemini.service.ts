
import { Injectable, inject, signal, effect } from '@angular/core';
import { StoreService, LotteryRecord } from './store.service';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';

export interface AnalysisResult {
  analysis: string;
  sources: { uri: string, title: string }[];
  recommendedNumbers: string[];
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private store = inject(StoreService);
  private ai: GoogleGenAI | null = null;
  private analysisController = new AbortController();
  
  // Signals for Dashboard Analysis
  isAnalyzing = signal(false);
  analysisResult = signal<AnalysisResult | null>(null);
  analysisError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const apiKey = this.store.apiKey();
      if (apiKey) {
        try {
          this.ai = new GoogleGenAI({ apiKey });
          // Clear any previous key errors on successful initialization
          if(this.analysisError()?.includes("API Key")) {
            this.analysisError.set(null);
          }
        } catch(e) {
            console.error("Error initializing GoogleGenAI:", e);
            this.store.updateApiKey(''); // Clear bad key
            this.analysisError.set("API Key မမှန်ကန်ပါ။ Settings တွင် ပြန်လည်စစ်ဆေးပါ။");
        }
      } else {
        this.ai = null;
      }
    });
  }
  
  cancelAnalysis() {
    this.analysisController.abort();
  }

  async getAnalysis(history: LotteryRecord[]) {
    if (!this.ai) {
      this.analysisError.set("ကျေးဇူးပြု၍ Settings စာမျက်နှာတွင် သင်၏ Google AI API Key ကို ဦးစွာထည့်သွင်းပါ။");
      return;
    }
    
    this.isAnalyzing.set(true);
    this.analysisResult.set(null);
    this.analysisError.set(null);
    this.analysisController = new AbortController();

    const historyText = history.slice(0, 30).map(r => `${r.date}: ${r.am}, ${r.pm}`).join('\n');
    const prompt = `You are a helpful AI assistant and an expert analyst for Myanmar's 2D lottery.
      Your task is to provide a detailed analysis and prediction for the next draw.
      1.  **Analyze the provided historical data:** Look for patterns, trends, and relationships (like power, nakhat, brothers) in the last 30 records.
      2.  **Use Google Search:** Find relevant external information. This could include:
          - Important or trending numbers in Thailand and Myanmar.
          - Significant dates, events, or news that might influence numbers.
          - General numerology or 2D analysis techniques.
      3.  **Synthesize your findings:** Combine the historical data analysis with your web search results to form a comprehensive prediction.
      4.  **Provide a clear, well-structured response in Burmese:**
          - Start with a main summary of your findings.
          - Explain your reasoning for each prediction in detail, referencing both the historical data and the information you found online.
          - Use Markdown for formatting (headings, bold text, lists).
      5.  **CRITICAL:** At the very end of your response, you MUST provide a simple, machine-readable list of your top 5-10 recommended numbers. Use this EXACT format:
          RECOMMENDED_NUMBERS_START
          - XX
          - YY
          - ZZ
          RECOMMENDED_NUMBERS_END

      **Historical Data:**
      ${historyText}
    `;

    const apiCall = this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
        },
    });
    
    const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out")), 25000) // Reduced to 25 seconds
    );
    
    const cancellationPromise = new Promise<never>((_, reject) => {
        this.analysisController.signal.addEventListener('abort', () => {
            reject(new Error("Request cancelled by user"));
        });
    });

    try {
      const response = await Promise.race([apiCall, timeoutPromise, cancellationPromise]);
      
      const responseText = response.text;

      // Extract recommended numbers
      const recommendedNumbers: string[] = [];
      const recommendationBlock = responseText.match(/RECOMMENDED_NUMBERS_START([\s\S]*?)RECOMMENDED_NUMBERS_END/);
      if (recommendationBlock) {
        const numberMatches = recommendationBlock[1].match(/- (\d{2})/g);
        if (numberMatches) {
          numberMatches.forEach(match => {
            recommendedNumbers.push(match.replace('- ', ''));
          });
        }
      }

      // Extract grounding sources
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources: { uri: string, title: string }[] = groundingChunks
          ?.map((chunk: any) => ({
              uri: chunk.web?.uri || '',
              title: chunk.web?.title || ''
          }))
          .filter((source: any) => source.uri) || [];

      this.analysisResult.set({
        analysis: responseText,
        sources: sources,
        recommendedNumbers: recommendedNumbers
      });

    } catch (e: any) {
      console.error(e);
      if (e.message === "Request timed out") {
          this.analysisError.set('AI server မှ အချိန်မီတုံ့ပြန်မှုမရပါ။ Network ကိုစစ်ဆေးပြီး နောက်တစ်ကြိမ် ထပ်ကြိုးစားကြည့်ပါ။');
      } else if (e.message.includes('API key not valid')) {
          this.analysisError.set('သင်၏ API Key မမှန်ကန်ပါ။ Settings တွင် ပြန်လည်စစ်ဆေးပါ။');
      } else if (e.message === "Request cancelled by user") {
          this.analysisError.set('သုံးသပ်မှုကို ပယ်ဖျက်လိုက်ပါသည်။');
      } else {
          this.analysisError.set('AI နှင့် ချိတ်ဆက်ရာတွင် အမှားအယွင်း ဖြစ်ပေါ်ပါသည်။');
      }
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  startChat(): Chat | null {
      if (!this.ai) {
          return null;
      }
      const historyText = this.store.records().slice(0, 50).map(r => `${r.date}: ${r.am}, ${r.pm}`).join('; ');
      return this.ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are a friendly and helpful AI assistant for a 2D lottery analysis application. Your name is 'FutureWorld AI'. You speak Burmese. You have been provided with the user's 2D history data. Answer the user's questions based on this data and your general knowledge. Be concise and helpful. The user's data is: ${historyText}`
        }
      });
  }
  
  async sendMessageStream(chat: Chat, prompt: string): Promise<AsyncGenerator<GenerateContentResponse>> {
      if (!this.ai) {
          throw new Error("API Key not set.");
      }
      
      const streamPromise = chat.sendMessageStream({ message: prompt });
      const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Stream start timed out')), 10000) // Reduced to 10 seconds
      );

      return Promise.race([streamPromise, timeoutPromise]);
  }

}

import { Injectable, signal } from '@angular/core';

export interface MarketData {
  set: string;
  value: string;
  isLive: boolean;
  error?: string;
  lastUpdated: string;
}

/**
 * --- အရေးကြီးသော မှတ်ချက် ---
 * ဤ Service သည် SET Thailand API မှ တိုက်ရိုက် Live Data ရယူရန် ရေးသားထားပါသည်။
 * Web Browser ပေါ်တွင် တိုက်ရိုက်အသုံးပြုပါက CORS (Cross-Origin Resource Sharing) Error များကြောင့် အလုပ်လုပ်နိုင်မည်မဟုတ်ပါ။
 * ဤ Code သည် GitHub မှတစ်ဆင့် Windows Application ကဲ့သို့သော Desktop ပတ်ဝန်းကျင်အတွက် Build ပြုလုပ်သည့်အခါ၊
 * CORS ကန့်သတ်ချက်များကို ကျော်လွှားနိုင်သော အခြေအနေ (ဥပမာ- Electron/Tauri တွင် Main Process မှ Request ပြုလုပ်ခြင်း) တွင်
 * အမှန်တကယ် အလုပ်လုပ်နိုင်ရန် ရည်ရွယ်၍ ကြိုတင်ပြင်ဆင်ရေးသားထားခြင်း ဖြစ်ပါသည်။
 * လက်ရှိ Web Preview တွင် Error ပြနေခြင်းသည် ပုံမှန်ဖြစ်ပါသည်။
 */
@Injectable({
  providedIn: 'root'
})
export class LiveMarketService {
  private timer: any;
  private readonly TARGET_URL = 'https://www.set.or.th/api/market/index/SET/quote';

  marketData = signal<MarketData>({
    set: '----.--',
    value: '---,---.--',
    isLive: false,
    lastUpdated: ''
  });

  start() {
    if (this.timer) {
      this.stop();
    }
    this.fetchData(); // Fetch immediately
    this.timer = setInterval(() => this.fetchData(), 15000); // Fetch every 15 seconds
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
    this.marketData.update(data => ({ ...data, isLive: false }));
  }

  private async fetchData() {
    try {
      // Direct API call, intended for CORS-free environments like desktop apps.
      const response = await fetch(this.TARGET_URL, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const apiResult = await response.json();
      const newSet = apiResult.index?.last;
      const newValue = apiResult.total_trade?.value;

      if (newSet && newValue) {
        this.marketData.set({
          set: Number(newSet).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          value: Number(newValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          isLive: true,
          error: undefined,
          lastUpdated: new Date().toLocaleTimeString()
        });
      } else {
        throw new Error('Invalid data format from API');
      }
    } catch (error: any) {
      console.error("Failed to fetch market data:", error.message);
      this.marketData.update(data => ({
        ...data,
        isLive: false,
        error: 'Live ဒေတာ ရယူ၍ မရနိုင်ပါ (CORS Policy?)'
      }));
    }
  }
}

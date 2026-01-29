
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
 * Web Browser ပေါ်တွင် တိုက်ရိုက်အသုံးပြုပါက CORS (Cross-Origin Resource Sharing) Error များကြောင့် မူလ API ကို တိုက်ရိုက်ခေါ်ယူ၍မရပါ။
 * ထို့ကြောင့်၊ ဤ Error ကို ကျော်လွှားနိုင်ရန် Public CORS Proxy (`api.allorigins.win`) ကို ကြားခံအဖြစ် အသုံးပြုထားပါသည်။
 * ၎င်းသည် feature ကို အမှန်တကယ် အလုပ်လုပ်စေရန် ပြသနိုင်သော်လည်း၊ Public Proxy များသည် အမြဲတမ်း တည်ငြိမ်မှုမရှိနိုင်ပါ။
 * အကယ်၍ Live Data ရပ်တန့်သွားပါက Proxy ဝန်ဆောင်မှု ယာယီရပ်ဆိုင်းခြင်းကြောင့် ဖြစ်နိုင်ပါသည်။
 */
@Injectable({
  providedIn: 'root'
})
export class LiveMarketService {
  private timer: any;
  // Switched to a different public CORS proxy for better reliability.
  private readonly PROXY_URL = 'https://api.allorigins.win/raw?url=';
  private readonly API_ENDPOINT = 'https://www.set.or.th/api/market/index/SET/quote';
  private readonly TARGET_URL = this.PROXY_URL + encodeURIComponent(this.API_ENDPOINT);

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
      const response = await fetch(this.TARGET_URL, { signal: AbortSignal.timeout(10000) });
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
        error: 'Live ဒေတာ ရယူ၍ မရနိုင်ပါ (Proxy Error?)'
      }));
    }
  }
}

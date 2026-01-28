
import { Injectable, signal, inject, computed } from '@angular/core';
import { StoreService } from './store.service';
import { EngineService, PredictionResult } from './engine.service';
import { LiveMarketService } from './live-market.service';

export type AppState = 'WAITING_FOR_AM' | 'AM_RESULT_RECEIVED' | 'WAITING_FOR_PM' | 'PM_RESULT_RECEIVED' | 'MARKET_CLOSED';
export interface TodayResults {
  am: string | null;
  pm: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class MarketEventService {
  private store = inject(StoreService);
  private engine = inject(EngineService);
  private liveMarketService = inject(LiveMarketService);
  private timer: any;

  // --- SIGNALS ---
  appState = signal<AppState>('WAITING_FOR_AM');
  todayResults = signal<TodayResults>({ am: null, pm: null });
  prediction = signal<PredictionResult | null>(null);
  countdown = signal('');

  private get todayDateStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  constructor() {
    this.initializeState();
  }

  private initializeState() {
    const latest = this.store.latestRecord();
    if (latest && latest.date === this.todayDateStr) {
      this.todayResults.set({ am: latest.am, pm: latest.pm });
      this.appState.set('MARKET_CLOSED');
      this.prediction.set(this.engine.predictForNextDay());
    } else {
      this.prediction.set(this.engine.predictForNextDay()); // Predict for today using yesterday's data
    }
  }

  start() {
    if (this.timer) this.stop();
    this.liveMarketService.start();
    this.timer = setInterval(() => this.tick(), 1000); // Check every second
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
    this.liveMarketService.stop();
  }

  private tick() {
    // --- THIS IS A SIMULATION FOR DEMONSTRATION ---
    const now = new Date();
    const seconds = now.getSeconds();

    // Event 1: AM Result (Simulated at 15 seconds past the minute)
    if (seconds === 15 && this.appState() === 'WAITING_FOR_AM') {
      const amResult = this.derive2DFromMarket();
      this.todayResults.update(r => ({ ...r, am: amResult }));
      this.appState.set('AM_RESULT_RECEIVED');
      
      const pmPrediction = this.engine.predictPmGivenAm(amResult, this.store.records());
      this.prediction.set(pmPrediction);

      setTimeout(() => {
        if (this.appState() === 'AM_RESULT_RECEIVED') this.appState.set('WAITING_FOR_PM');
      }, 5000);
    }

    // Event 2: PM Result (Simulated at 45 seconds past the minute)
    if (seconds === 45 && this.appState() === 'WAITING_FOR_PM') {
      const pmResult = this.derive2DFromMarket();
      this.todayResults.update(r => ({ ...r, pm: pmResult }));
      this.appState.set('PM_RESULT_RECEIVED');
      this.handleMarketClose();
    }
    
    this.updateCountdown();
  }

  private handleMarketClose() {
    const { am, pm } = this.todayResults();
    const marketData = this.liveMarketService.marketData();
    if (am && pm) {
        this.engine.autoTuneWeights(am);
        this.engine.autoTuneWeights(pm);
        this.store.addRecord(this.todayDateStr, am, pm, marketData.set, marketData.value);
    }
    
    const nextDayPrediction = this.engine.predictForNextDay();
    this.prediction.set(nextDayPrediction);
    
    setTimeout(() => {
        this.appState.set('MARKET_CLOSED');
    }, 5000);
  }

  private updateCountdown() {
      const now = new Date();
      const seconds = now.getSeconds();
      let targetSeconds: number;
      
      switch(this.appState()) {
          case 'WAITING_FOR_AM':
              targetSeconds = 15;
              const remainingAM = targetSeconds - seconds;
              this.countdown.set(remainingAM > 0 ? `နောက် ${remainingAM} စက္ကန့်` : 'ယခု...');
              break;
          case 'WAITING_FOR_PM':
              targetSeconds = 45;
              const remainingPM = targetSeconds - seconds;
              this.countdown.set(remainingPM > 0 ? `နောက် ${remainingPM} စက္ကန့်` : 'ယခု...');
              break;
          default:
              this.countdown.set('');
      }
  }

  private derive2DFromMarket(): string {
    const marketData = this.liveMarketService.marketData();
    if (!marketData.isLive || marketData.set === '----.--') {
      return this.generateRandom2D(); // Fallback if live data isn't available
    }
    const set = marketData.set.replace(/,/g, ''); // e.g., "1314.39"
    const parts = set.split('.');
    if (parts.length < 2 || parts[0].length === 0 || parts[1].length === 0) {
      return this.generateRandom2D(); // Fallback for weird formats
    }
    const lastDigitOfInt = parts[0].slice(-1); // "4"
    const firstDigitOfFrac = parts[1].slice(0, 1); // "3"
    return `${lastDigitOfInt}${firstDigitOfFrac}`; // "43"
  }

  private generateRandom2D(): string {
    return Math.floor(Math.random() * 100).toString().padStart(2, '0');
  }
}

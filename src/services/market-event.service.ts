
import { Injectable, signal, inject } from '@angular/core';
import { EngineService, PredictionResult } from './engine.service';
import { LiveMarketService } from './live-market.service';

@Injectable({
  providedIn: 'root'
})
export class MarketEventService {
  private engine = inject(EngineService);
  private liveMarketService = inject(LiveMarketService);

  // --- SIGNALS ---
  // The service now only provides the prediction. All simulation states are removed.
  prediction = signal<PredictionResult | null>(null);

  constructor() {
    this.initializeState();
  }

  private async initializeState() {
    // The primary function is to always predict for the next day based on all available data.
    // This is now an async operation because it involves an API call to Gemini.
    const result = await this.engine.predictForNextDay();
    this.prediction.set(result);
  }

  start() {
    // This will attempt to fetch live SET data. It is expected to fail in the browser due to CORS,
    // but is essential for the future Windows application. The UI correctly handles cases where data is not live.
    this.liveMarketService.start();
  }

  stop() {
    this.liveMarketService.stop();
  }
}

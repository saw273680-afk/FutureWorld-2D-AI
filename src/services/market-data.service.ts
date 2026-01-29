
import { Injectable, signal } from '@angular/core';

export interface MarketData {
  set: string;
  value: string;
  lastUpdated: string;
  isLive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MarketDataService {
  private timer: any;
  
  marketData = signal<MarketData>({
    set: '1,314.39', // Initial value
    value: '50,901.86',
    lastUpdated: new Date().toLocaleTimeString(),
    isLive: false
  });

  startMonitoring() {
    if (this.timer) {
      this.stopMonitoring();
    }
    
    // Initial fetch
    this.fetchData();

    this.timer = setInterval(() => {
      this.fetchData();
    }, 5000); // Fetch every 5 seconds
  }

  stopMonitoring() {
    clearInterval(this.timer);
    this.timer = null;
    this.marketData.update(data => ({ ...data, isLive: false }));
  }

  private fetchData() {
    // Simulate fetching data from a public API
    const lastSet = parseFloat(this.marketData().set.replace(/,/g, ''));
    const lastValue = parseFloat(this.marketData().value.replace(/,/g, ''));

    // Generate slight random changes
    const newSet = lastSet + (Math.random() - 0.5) * 2;
    const newValue = lastValue + (Math.random() - 0.5) * 500;
    
    this.marketData.set({
      set: newSet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      value: newValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      lastUpdated: new Date().toLocaleTimeString(),
      isLive: true
    });
  }
}

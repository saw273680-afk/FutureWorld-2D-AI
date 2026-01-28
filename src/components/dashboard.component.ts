
import { Component, inject, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketEventService, AppState, TodayResults } from '../services/market-event.service';
import { PredictionResult } from '../services/engine.service';
import { LiveMarketService } from '../services/live-market.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  marketEventService = inject(MarketEventService);
  liveMarketService = inject(LiveMarketService);

  // Event-driven state
  appState = this.marketEventService.appState;
  todayResults = this.marketEventService.todayResults;
  prediction = this.marketEventService.prediction;
  countdown = this.marketEventService.countdown;
  
  // Live data state
  liveMarketData = this.liveMarketService.marketData;

  liveDerivedData = computed(() => {
    const data = this.liveMarketData();
    if (!data.isLive || data.set === '----.--') {
      return { set2D: '--', valueModern: '--', isPositive: true };
    }
    const set = data.set.replace(/,/g, '');
    const parts = set.split('.');
    const set2D = parts.length < 2 || parts[0].length < 1 || parts[1].length < 1 ? '--' : `${parts[0].slice(-1)}${parts[1].slice(0, 1)}`;
    const valueNum = parseFloat(data.value.replace(/,/g, ''));
    const valueModern = isNaN(valueNum) ? '--' : `${(valueNum / 1_000_000).toFixed(2)}M`;
    const isPositive = !data.set.startsWith('-');

    return { set2D, valueModern, isPositive };
  });


  pageTitle = computed(() => {
    switch(this.appState()) {
      case 'WAITING_FOR_AM':
        return 'မနက်ပိုင်း ရလဒ်ထွက်ရန် စောင့်ဆိုင်းနေသည်';
      case 'AM_RESULT_RECEIVED':
        return 'မနက်ပိုင်း ရလဒ်';
      case 'WAITING_FOR_PM':
        return 'ညနေပိုင်း ရလဒ်ထွက်ရန် စောင့်ဆိုင်းနေသည်';
      case 'PM_RESULT_RECEIVED':
        return 'ညနေပိုင်း ရလဒ်';
      case 'MARKET_CLOSED':
        return 'နောက်တစ်နေ့အတွက် AI ကြိုတင်ခန့်မှန်းချက်';
    }
  });

  ngOnInit() {
    this.marketEventService.start();
  }

  ngOnDestroy() {
    this.marketEventService.stop();
  }
}

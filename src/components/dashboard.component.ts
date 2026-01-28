
import { Component, inject, OnDestroy, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketEventService } from '../services/market-event.service';
import { LiveMarketService } from '../services/live-market.service';
import { GeminiService } from '../services/gemini.service';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  marketEventService = inject(MarketEventService);
  liveMarketService = inject(LiveMarketService);
  geminiService = inject(GeminiService);
  app = inject(AppComponent);

  // The service now only provides the next day's prediction.
  prediction = this.marketEventService.prediction;
  
  // Live data state for the future desktop app.
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

  pageTitle = 'နောက်တစ်နေ့အတွက် AI ကြိုတင်ခန့်မှန်းချက်';

  ngOnInit() {
    this.marketEventService.start();
  }

  ngOnDestroy() {
    this.marketEventService.stop();
  }
  
  goToSettings() {
    this.app.currentView.set('settings');
  }
}

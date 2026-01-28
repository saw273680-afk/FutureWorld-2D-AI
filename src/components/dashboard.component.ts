
import { Component, inject, OnDestroy, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketEventService } from '../services/market-event.service';
import { LiveMarketService } from '../services/live-market.service';
import { GeminiService } from '../services/gemini.service';
import { AppComponent } from '../app.component';
import { StoreService } from '../services/store.service';

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
  store = inject(StoreService);

  prediction = this.marketEventService.prediction;
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

  displayRecord = computed(() => {
    const latest = this.store.latestRecord();
    if (!latest) {
      return { am: '--', pm: '--', set: '----.--', value: '---,---.--' };
    }
    
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    let pmValue = latest.pm;
    // If the latest record is for today, hide the PM value until after 4:30 PM market close
    if (latest.date === todayStr) {
      const isAfterClose = now.getHours() > 16 || (now.getHours() === 16 && now.getMinutes() >= 30);
      if (!isAfterClose) {
        pmValue = '--';
      }
    }

    return {
      am: latest.am,
      pm: pmValue,
      set: latest.set || '----.--',
      value: latest.value || '---,---.--'
    };
  });


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


import { Component, inject, signal, OnDestroy, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { StoreService } from '../services/store.service';
import { EngineService, PredictionResult } from '../services/engine.service';
import { MarketDataService } from '../services/market-data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  store = inject(StoreService);
  engine = inject(EngineService);
  marketDataService = inject(MarketDataService);
  private fb: FormBuilder = inject(FormBuilder);

  todayStr = new Date().toISOString().split('T')[0];
  
  // Signals
  prediction = signal<PredictionResult>(this.engine.predictNext());
  liveMarketData = this.marketDataService.marketData;

  entryForm = this.fb.group({
    date: [this.todayStr, Validators.required],
    am: ['', [Validators.required, Validators.pattern(/^[0-9]{2}$/)]],
    pm: ['', [Validators.required, Validators.pattern(/^[0-9]{2}$/)]],
    set: [''],
    value: ['']
  });

  constructor() {
    effect(() => {
      const marketData = this.liveMarketData();
      if (marketData.isLive) {
        const newPrediction = this.engine.predictNext(undefined, {
          set: marketData.set,
          value: marketData.value
        });
        this.prediction.set(newPrediction);
      }
    });
  }

  ngOnInit() {
    this.marketDataService.startMonitoring();
  }

  ngOnDestroy() {
    this.marketDataService.stopMonitoring();
  }

  onSubmit() {
    if (this.entryForm.valid) {
      const { date, am, pm, set, value } = this.entryForm.value;
      if (date && am && pm) {
        this.engine.autoTuneWeights(am); 
        this.store.addRecord(date, am, pm, set || undefined, value || undefined);
        this.engine.autoTuneWeights(pm);
        this.entryForm.reset({ date: this.todayStr, am: '', pm: '', set: '', value: '' });
        // After submitting, recalculate with the latest static data
        this.prediction.set(this.engine.predictNext());
      }
    }
  }

  printVoucher() {
    window.print();
  }
}

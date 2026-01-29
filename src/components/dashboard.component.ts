
import { Component, inject, signal, OnInit, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { StoreService } from '../services/store.service';
import { EngineService, PredictionResult, ScoredNumber } from '../services/engine.service';
import { GeminiService } from '../services/gemini.service';

// Allow using the 'marked' library for markdown rendering
declare var marked: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  store = inject(StoreService);
  engine = inject(EngineService);
  gemini = inject(GeminiService);
  private fb: FormBuilder = inject(FormBuilder);

  todayStr = new Date().toISOString().split('T')[0];
  
  // Signals for Prediction
  prediction = signal<PredictionResult | null>(null);
  isRefined = signal(false);
  
  // Signals for Loading UI
  loadingSteps = [
    'AI Engine ကို စတင်နေသည်',
    'Google Search ဖြင့် ရှာဖွေနေသည်',
    'Trends များကို သုံးသပ်နေသည်',
    'AI Model မှ အဖြေထုတ်နေသည်',
    'ရလဒ်ကို စီစဉ်နေသည်'
  ];
  currentLoadingStep = signal(0);
  private loadingInterval: any = null;
  
  entryForm = this.fb.group({
    date: [this.todayStr, Validators.required],
    am: ['', [Validators.required, Validators.pattern(/^[0-9]{2}$/)]],
    pm: ['', [Validators.required, Validators.pattern(/^[0-9]{2}$/)]],
  });

  constructor() {
    effect(() => {
      const result = this.gemini.analysisResult();
      if (result && result.recommendedNumbers.length > 0) {
        this._refinePrediction();
      }
    });

    effect(() => {
      if (this.gemini.isAnalyzing()) {
        this.startLoadingIndicator();
      } else {
        this.stopLoadingIndicator();
      }
    });
  }

  ngOnInit() {
    this.prediction.set(this.engine.predictNext());
  }
  
  ngOnDestroy() {
    this.stopLoadingIndicator();
  }

  onSubmit() {
    if (this.entryForm.valid) {
      const { date, am, pm } = this.entryForm.value;
      if (date && am && pm) {
        this.engine.autoTuneWeights(am); 
        this.store.addRecord(date, am, pm);
        this.engine.autoTuneWeights(pm);
        this.entryForm.reset({ date: this.todayStr, am: '', pm: '' });
        // After submitting, recalculate and reset refined state
        this.prediction.set(this.engine.predictNext());
        this.isRefined.set(false);
        this.gemini.analysisResult.set(null);
        this.gemini.analysisError.set(null);
      }
    }
  }

  analyzeWithGemini() {
    this.gemini.getAnalysis(this.store.records());
  }

  cancelAnalysis() {
    this.gemini.cancelAnalysis();
  }

  private startLoadingIndicator() {
    this.currentLoadingStep.set(0);
    this.loadingInterval = setInterval(() => {
      this.currentLoadingStep.update(step => {
        // Stop incrementing at the last step to wait for timeout
        if (step >= this.loadingSteps.length - 1) {
          return step;
        }
        return step + 1;
      });
    }, 6000); // 6 seconds per step
  }

  private stopLoadingIndicator() {
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
      this.loadingInterval = null;
    }
  }

  private _refinePrediction() {
    const localPrediction = this.prediction();
    const geminiResult = this.gemini.analysisResult();

    if (!localPrediction || !geminiResult) return;

    const localNumbers = localPrediction.highConfidence.map(n => n.num);
    const geminiNumbers = geminiResult.recommendedNumbers;

    // Create a combined list with priority
    const combined = [
      ...geminiNumbers.filter(n => localNumbers.includes(n)), // Intersection first
      ...geminiNumbers.filter(n => !localNumbers.includes(n)), // Then remaining Gemini
      ...localNumbers.filter(n => !geminiNumbers.includes(n)) // Then remaining local
    ];
    
    const uniqueTop10 = [...new Set(combined)].slice(0, 10);
    
    // Create new ScoredNumber array
    const newScored: ScoredNumber[] = uniqueTop10.map(num => {
      const existing = localPrediction.highConfidence.find(s => s.num === num) || localPrediction.mediumConfidence.find(s => s.num === num);
      if (existing) {
        return { ...existing, score: existing.score + 20, confidence: Math.min(99, existing.confidence + 15) }; // Boost score
      }
      return { num, score: 100, confidence: 80, tags: ['Gemini'], reasons: ['Gemini AI အကြံပြုချက်'] };
    });

    // Sort again by score
    newScored.sort((a,b) => b.score - a.score);

    const refinedPrediction: PredictionResult = {
      ...localPrediction,
      highConfidence: newScored.slice(0, 4),
      mediumConfidence: newScored.slice(4, 10),
      strongestHead: newScored.length > 0 ? newScored[0].num[0] : localPrediction.strongestHead,
      strongestTail: newScored.length > 0 ? newScored[0].num[1] : localPrediction.strongestTail,
      insights: [
        `Gemini AI ၏သုံးသပ်ချက်ဖြင့် ပေါင်းစပ်ထားသည်။`,
        ...localPrediction.insights
      ]
    };

    this.prediction.set(refinedPrediction);
    this.isRefined.set(true);
  }

  parseMarkdown(content: string | null | undefined): string {
    if (!content) return '';
    // Remove the recommendation block before rendering
    const cleanContent = content.replace(/RECOMMENDED_NUMBERS_START[\s\S]*?RECOMMENDED_NUMBERS_END/, '');
    return marked.parse(cleanContent);
  }

  printVoucher() {
    window.print();
  }
}
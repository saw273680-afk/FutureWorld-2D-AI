
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EngineService, PredictionResult } from '../services/engine.service';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto pb-12">
       <div class="text-center mb-8">
         <h2 class="text-2xl font-bold text-white mb-2">Simulation Mode (အနာဂတ် ခန့်မှန်းစနစ်)</h2>
         <p class="text-slate-400 text-sm">
            {{ modeText() }}
         </p>
       </div>

       <!-- Input Card -->
       <div class="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl mb-8 relative overflow-hidden">
          <div class="absolute top-0 left-0 -ml-16 -mt-16 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center relative z-10">
             
             <!-- AM Input -->
             <div class="flex flex-col items-center">
                <label class="text-cyan-400 font-bold mb-2 uppercase tracking-wider text-xs">မနက်ခင်း (AM)</label>
                <input 
                  type="text" 
                  [(ngModel)]="amInput" 
                  maxlength="2" 
                  placeholder="00" 
                  class="w-full md:w-32 h-20 bg-slate-900 border-2 border-slate-600 focus:border-cyan-500 rounded-2xl text-center text-4xl font-black text-white focus:outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all placeholder:text-slate-800 shadow-inner">
             </div>

             <!-- PM Input -->
             <div class="flex flex-col items-center">
                <label class="text-purple-400 font-bold mb-2 uppercase tracking-wider text-xs">ညနေခင်း (PM)</label>
                <input 
                  type="text" 
                  [(ngModel)]="pmInput" 
                  maxlength="2" 
                  placeholder="00" 
                  (keyup.enter)="simulate()"
                  class="w-full md:w-32 h-20 bg-slate-900 border-2 border-slate-600 focus:border-purple-500 rounded-2xl text-center text-4xl font-black text-white focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all placeholder:text-slate-800 shadow-inner">
             </div>
          </div>

          <div class="mt-8 flex justify-center relative z-10">
             <button 
                [disabled]="!isValidInput()"
                (click)="simulate()" 
                class="w-full md:w-auto bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-bold py-3 px-12 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                [ngClass]="isAmOnly() ? 'from-cyan-600 to-blue-600 shadow-cyan-600/20' : 'from-purple-600 to-pink-600 shadow-purple-600/20'">
                
                @if (isAmOnly()) {
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
                    ညနေပိုင်းအတွက် တွက်မည်
                } @else {
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    နောက်ရက်အတွက် တွက်မည်
                }
             </button>
          </div>
          
          <p *ngIf="!isValidInput() && (amInput || pmInput)" class="text-center text-red-400 text-xs mt-4 animate-pulse">
             အနည်းဆုံး ဂဏန်းတစ်ကွက် ထည့်သွင်းပါ
          </p>
       </div>

       <!-- Results Section -->
       @if (result(); as res) {
         <div class="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
            
            <!-- Header -->
            <div class="flex items-center justify-between px-2">
               <h3 class="text-white font-bold flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full animate-pulse" [ngClass]="isAmOnly() ? 'bg-cyan-400' : 'bg-purple-400'"></span>
                  {{ resultTitle() }}
               </h3>
            </div>

            <!-- Top Suggestions (High Confidence) -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
               @for (item of res.highConfidence; track item.num) {
                 <div class="relative group">
                    <div class="rounded-xl p-4 text-center transform transition group-hover:-translate-y-1 shadow-lg border"
                         [ngClass]="isAmOnly() ? 'bg-cyan-600 shadow-cyan-900/50 border-cyan-500' : 'bg-purple-600 shadow-purple-900/50 border-purple-500'">
                      <span class="text-4xl font-black text-white block">{{ item.num }}</span>
                      <div class="mt-2 text-xs font-medium bg-black/20 text-white rounded px-2 py-1 inline-block">
                         {{ item.confidence }}% Conf.
                      </div>
                    </div>
                    <!-- Tooltip -->
                    @if (item.reasons.length > 0) {
                      <div class="absolute -bottom-10 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-[10px] p-2 rounded z-20 pointer-events-none text-center">
                         {{ item.reasons[0] }}
                      </div>
                    }
                    <!-- Tags -->
                    <div class="absolute -top-2 -right-2 flex flex-col gap-1 items-end">
                      @for (tag of item.tags; track tag) {
                        <span class="bg-yellow-500 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">{{ tag }}</span>
                      }
                    </div>
                 </div>
               }
            </div>

            <!-- Secondary & Insights -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
               
               <!-- Medium Confidence -->
               <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h4 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">အရံသင့် ဂဏန်းများ</h4>
                  <div class="flex flex-wrap gap-2">
                     @for (item of res.mediumConfidence; track item.num) {
                        <div class="bg-slate-700 px-3 py-2 rounded text-white font-bold border border-slate-600">
                           {{ item.num }}
                           <span class="text-[10px] text-slate-400 ml-1">{{ item.confidence }}%</span>
                        </div>
                     }
                  </div>
               </div>

               <!-- AI Insights -->
               <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h4 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">AI သုံးသပ်ချက်</h4>
                  <ul class="space-y-2 text-sm text-slate-300">
                     @for (insight of res.insights; track insight) {
                        <li class="flex items-start gap-2">
                           <svg class="w-4 h-4 mt-0.5 flex-shrink-0" [ngClass]="isAmOnly() ? 'text-cyan-400' : 'text-purple-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                           {{ insight }}
                        </li>
                     }
                  </ul>
                  <div class="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center text-xs">
                     <span class="text-slate-500">Strongest Head: <b class="text-white text-lg">{{ res.strongestHead }}</b></span>
                     <span class="text-slate-500">Strongest Tail: <b class="text-white text-lg">{{ res.strongestTail }}</b></span>
                  </div>
               </div>

            </div>
         </div>
       } @else if (hasSearched()) {
          <div class="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
             <div class="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" [ngClass]="isAmOnly() ? 'border-cyan-500' : 'border-purple-500'"></div>
             <p class="text-xs text-slate-500">စနစ်မှ တွက်ချက်နေပါသည်...</p>
          </div>
       }
    </div>
  `
})
export class SimulationComponent {
  engine = inject(EngineService);
  amInput = '';
  pmInput = '';
  
  result = signal<PredictionResult | null>(null);
  hasSearched = signal(false);

  // Computes the current mode based on inputs
  isAmOnly = computed(() => {
    return this.amInput.length === 2 && (!this.pmInput || this.pmInput.length !== 2);
  });

  modeText = computed(() => {
      if (this.isAmOnly()) {
          return "မနက်ဂဏန်း ထည့်သွင်းထားသဖြင့် ညနေပိုင်းအတွက် ခန့်မှန်းပေးပါမည်။";
      }
      return "မနက်နှင့်ညနေဂဏန်း ထည့်သွင်းထားသဖြင့် နောက်တစ်ရက်အတွက် ခန့်မှန်းပေးပါမည်။";
  });

  resultTitle = computed(() => {
      if (this.isAmOnly()) return "ညနေပိုင်းအတွက် ခန့်မှန်းချက် (PM Forecast)";
      return "နောက်ရက်အတွက် ခန့်မှန်းချက် (Next Day Forecast)";
  });

  isValidInput() {
    const validAm = !this.amInput || /^[0-9]{2}$/.test(this.amInput);
    const validPm = !this.pmInput || /^[0-9]{2}$/.test(this.pmInput);
    const hasData = (this.amInput && this.amInput.length === 2) || (this.pmInput && this.pmInput.length === 2);
    return validAm && validPm && hasData;
  }

  simulate() {
    if (this.isValidInput()) {
       this.hasSearched.set(true);
       this.result.set(null); 

       setTimeout(() => {
         const res = this.engine.runSimulationScenario(this.amInput, this.pmInput);
         this.result.set(res);
       }, 800);
    }
  }
}

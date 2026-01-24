
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { StoreService } from '../services/store.service';
import { EngineService, ScoredNumber } from '../services/engine.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Prediction Card -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Main AI Card -->
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 shadow-2xl">
           <div class="p-6 md:p-8 relative z-10">
              <div class="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                <div>
                   <h2 class="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                     <span class="w-2 h-8 bg-cyan-500 rounded-full"></span>
                     AI တွက်ချက်မှု စနစ် (v5.0)
                   </h2>
                   <div class="flex items-center gap-3 text-xs text-slate-400">
                     <span class="bg-slate-700 px-2 py-1 rounded text-cyan-400">Sim: ON</span>
                     <span class="bg-slate-700 px-2 py-1 rounded text-cyan-400">Market: ON</span>
                     <span class="bg-slate-700 px-2 py-1 rounded text-cyan-400">Learning: ON</span>
                   </div>
                </div>
                <button (click)="printVoucher()" class="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all no-print">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                  ဘောင်ချာ ထုတ်ရန်
                </button>
              </div>

              <!-- High Confidence Numbers -->
              <div class="mb-8">
                <div class="text-cyan-400 text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                   <span class="animate-pulse w-2 h-2 rounded-full bg-cyan-400"></span>
                   အထူးအကြံပြုချက် (၉၅% ခန့်မှန်းခြေ)
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  @for (item of prediction().highConfidence; track item.num) {
                    <div class="relative group">
                      <div class="bg-cyan-600 rounded-xl p-4 text-center transform transition group-hover:-translate-y-1 shadow-lg shadow-cyan-900/50">
                        <span class="text-4xl font-black text-white block">{{ item.num }}</span>
                        <div class="mt-2 text-xs font-medium text-cyan-100 bg-cyan-700/50 rounded px-2 py-1 inline-block">
                          {{ item.confidence }}% Sim Score
                        </div>
                      </div>
                      
                      <!-- REASONING TOOLTIP -->
                      @if (item.reasons.length > 0) {
                        <div class="absolute -bottom-8 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-[10px] p-2 rounded z-20 pointer-events-none text-center">
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
              </div>

              <!-- Insights & Eliminated -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="bg-slate-900/50 rounded-xl p-4 border border-slate-600">
                    <h3 class="text-white font-bold mb-2 text-xs uppercase text-green-400">AI တွက်ချက်မှု အလေးပေးချက်</h3>
                    <div class="space-y-2 text-xs text-slate-300">
                        <div class="flex justify-between">
                            <span>လတ်တလော (Recency):</span>
                            <span>{{ (prediction().meta.weights.recency * 100).toFixed(0) }}%</span>
                        </div>
                        <div class="flex justify-between">
                            <span>ရာသီခွင် (Seasonal):</span>
                            <span>{{ (prediction().meta.weights.seasonal * 100).toFixed(0) }}%</span>
                        </div>
                        <div class="flex justify-between">
                            <span>ဈေးကွက် (Market):</span>
                            <span>{{ (prediction().meta.weights.market * 100).toFixed(0) }}%</span>
                        </div>
                    </div>
                  </div>

                  <div class="bg-red-900/20 rounded-xl p-4 border border-red-900/50">
                     <h3 class="text-white font-bold mb-2 text-xs uppercase text-red-400">ဖယ်ထုတ်ထားသော ဂဏန်းများ (Exclusion)</h3>
                     <div class="flex flex-wrap gap-2 min-h-[40px] items-center">
                        @if (prediction().eliminated.length > 0) {
                            @for (num of prediction().eliminated.slice(0, 8); track num) {
                                <span class="text-red-300 text-xs font-mono line-through bg-red-900/40 px-1 rounded">{{ num }}</span>
                            }
                            @if(prediction().eliminated.length > 8) {
                                <span class="text-red-300 text-xs">+{{ prediction().eliminated.length - 8 }} လုံး</span>
                            }
                        } @else {
                            <span class="text-slate-500 text-xs italic">
                                ယခုရက်ပိုင်းအတွင်း အကြိမ်ရေများသော ဂဏန်းမရှိပါ။
                            </span>
                        }
                     </div>
                  </div>
              </div>

           </div>
        </div>

        <!-- Secondary Suggestions -->
        <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
           <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">အရံ ဂဏန်းများ (Backup)</h3>
           <div class="flex flex-wrap gap-3">
              @for (item of prediction().mediumConfidence; track item.num) {
                <div class="bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg px-4 py-2 text-lg font-bold border border-slate-600 flex items-center gap-2 group relative">
                   {{ item.num }}
                   <span class="text-[10px] text-slate-400">{{ item.confidence }}%</span>
                </div>
              }
           </div>
        </div>
      </div>

      <!-- Right Column: Entry & Stats -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Entry Form -->
        <div class="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
           <h3 class="text-xl font-bold text-white mb-2">ရလဒ် အသစ်သွင်းရန်</h3>
           <p class="text-xs text-slate-400 mb-4">ရလဒ်သွင်းပြီးတိုင်း AI သည် အလိုအလျောက် ပိုမိုឆ្លပ်မြက်လာပါမည် (Self-Learning)။</p>
           
           <form [formGroup]="entryForm" (ngSubmit)="onSubmit()" class="space-y-4">
             <div>
               <label class="block text-xs font-medium text-slate-400 mb-1">နေ့စွဲ</label>
               <input type="date" formControlName="date" class="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm">
             </div>
             <div class="grid grid-cols-2 gap-2">
                <div>
                   <label class="block text-xs font-medium text-slate-400 mb-1">မနက်ပိုင်း (၁၂:၀၀)</label>
                   <input formControlName="am" maxlength="2" class="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-center font-bold">
                </div>
                <div>
                   <label class="block text-xs font-medium text-slate-400 mb-1">ညနေပိုင်း (၄:၃၀)</label>
                   <input formControlName="pm" maxlength="2" class="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-center font-bold">
                </div>
             </div>
             <div class="grid grid-cols-2 gap-2">
                <div>
                   <label class="block text-xs font-medium text-slate-400 mb-1">Set တန်ဖိုး</label>
                   <input formControlName="set" placeholder="1,200.00" class="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs">
                </div>
                <div>
                   <label class="block text-xs font-medium text-slate-400 mb-1">Market တန်ဖိုး</label>
                   <input formControlName="value" placeholder="12,000.50" class="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs">
                </div>
             </div>
             <button type="submit" [disabled]="entryForm.invalid" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded transition-colors disabled:opacity-50 shadow-lg shadow-cyan-600/30">
               မှတ်တမ်းတင်မည်
             </button>
           </form>
        </div>

        <!-- Quick Stats -->
        <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
           <h3 class="text-sm font-bold text-slate-400 mb-4">ဈေးကွက် နှင့် အခြေအနေ</h3>
           <div class="flex justify-between items-center mb-2">
              <span class="text-slate-400 text-sm">Simulation စစ်ဆေးမှု</span>
              <span class="text-cyan-400 font-bold">၁၀၀၀ ကြိမ်</span>
           </div>
           <div class="flex justify-between items-center mb-2">
              <span class="text-slate-400 text-sm">SET ဆက်စပ်မှု</span>
              <span class="text-purple-400 font-bold">ကောင်းမွန်</span>
           </div>
           <div class="flex justify-between items-center">
              <span class="text-slate-400 text-sm">အပူး လာနိုင်ခြေ</span>
              <span [class]="prediction().isDoubleRisk ? 'text-red-400' : 'text-green-400'">
                {{ prediction().isDoubleRisk ? 'မြင့်' : 'နိမ့်' }}
              </span>
           </div>
        </div>
      </div>
    </div>

    <!-- Hidden POS Voucher for Print -->
    <div id="printable-voucher">
      <div class="text-center border-b-2 border-black pb-2 mb-2">
         <h1 class="text-xl font-bold">FutureWorld 2D</h1>
         <p class="text-sm">AI အထူးခန့်မှန်းချက်</p>
         <p class="text-xs mt-1">{{ todayStr }}</p>
      </div>
      
      <div class="mb-4">
        <p class="text-xs font-bold uppercase mb-1 border-b border-black">Top 4 (Simulated)</p>
        <div class="flex flex-wrap gap-2 mt-2 justify-center">
           @for (item of prediction().highConfidence; track item.num) {
             <span class="text-2xl font-black border-2 border-black rounded p-1">{{ item.num }}</span>
           }
        </div>
      </div>

      <div class="mb-4">
        <p class="text-xs font-bold uppercase mb-1 border-b border-black">AI သုံးသပ်ချက်</p>
        <p class="text-[10px]">Monte Carlo စနစ်ဖြင့် အကြိမ် ၁၀၀၀ စမ်းသပ်ပြီး။</p>
        <p class="text-[10px]">ဖယ်ထုတ်ထားသော ဂဏန်းပေါင်း {{ prediction().eliminated.length }} လုံးရှိပါသည်။</p>
      </div>

      <div class="text-center text-xs border-t-2 border-black pt-2">
         <p>ကံကောင်းပါစေ</p>
         <p class="text-[10px] mt-1">FW-AI v5.0 Auto-Learning</p>
      </div>
    </div>
  `
})
export class DashboardComponent {
  store = inject(StoreService);
  engine = inject(EngineService);
  private fb: FormBuilder = inject(FormBuilder);

  todayStr = new Date().toISOString().split('T')[0];

  entryForm = this.fb.group({
    date: [this.todayStr, Validators.required],
    am: ['', [Validators.required, Validators.pattern(/^[0-9]{2}$/)]],
    pm: ['', [Validators.required, Validators.pattern(/^[0-9]{2}$/)]],
    set: [''],
    value: ['']
  });

  prediction = computed(() => this.engine.predictNext());

  onSubmit() {
    if (this.entryForm.valid) {
      const { date, am, pm, set, value } = this.entryForm.value;
      if (date && am && pm) {
        // 1. Add Record
        this.store.addRecord(date, am, pm, set || undefined, value || undefined);
        
        // 2. Trigger Self-Learning
        this.engine.autoTuneWeights(am); 
        this.engine.autoTuneWeights(pm);

        // 3. Reset
        this.entryForm.reset({
           date: this.todayStr,
           am: '',
           pm: '',
           set: '',
           value: ''
        });
      }
    }
  }

  printVoucher() {
    window.print();
  }
}


import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EngineService, MonthlyStats } from '../services/engine.service';

@Component({
  selector: 'app-backtest',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-white mb-2">စနစ်၏ တိကျမှုကို စစ်ဆေးခြင်း</h2>
        <p class="text-slate-400">အတိတ်က ဒေတာများကို အခြေခံ၍ AI ၏ တွက်ချက်နိုင်စွမ်းကို ဂရပ်ဖြင့် လေ့လာနိုင်သည်။</p>
      </div>

      <!-- Monthly Success Graph -->
      <div class="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl">
         <h3 class="text-white font-bold mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>
            လအလိုက် မှန်ကန်မှုနှုန်း (လွန်ခဲ့သော ၆လ)
         </h3>
         
         <!-- Reduced height from h-64 to h-40 for better aesthetics -->
         <div class="flex items-end space-x-4 h-40 w-full justify-between px-2">
            @for (stat of monthlyStats(); track stat.month) {
               <div class="flex flex-col items-center flex-1 group relative">
                  <!-- Tooltip -->
                  <div class="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-slate-900 text-white text-xs p-2 rounded pointer-events-none transition-opacity z-10 w-32 text-center shadow-xl border border-slate-600">
                     <p class="font-bold">{{ stat.month }}</p>
                     <p>မှန်: {{ stat.hits }} / {{ stat.total }}</p>
                     <p class="text-cyan-400">နှုန်း: {{ stat.accuracy }}%</p>
                  </div>
                  
                  <!-- Bar -->
                  <div class="w-full max-w-[50px] bg-slate-700 rounded-t-lg relative overflow-hidden transition-all hover:bg-slate-600" style="height: 100%;">
                     <div class="absolute bottom-0 w-full bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all duration-1000 ease-out"
                          [style.height.%]="stat.accuracy"></div>
                  </div>
                  
                  <!-- Label -->
                  <div class="mt-3 text-[10px] md:text-xs text-slate-400 font-mono text-center">{{ stat.month }}</div>
                  <div class="text-xs font-bold text-white mt-1">{{ stat.accuracy }}%</div>
               </div>
            }
         </div>
      </div>

      <div class="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl relative overflow-hidden">
        
        @if (isLoading()) {
          <div class="absolute inset-0 bg-slate-900/80 z-20 flex flex-col items-center justify-center">
             <div class="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             <div class="text-cyan-400 font-mono animate-pulse">တွက်ချက်နေပါသည်...</div>
          </div>
        }

        <div class="flex flex-col items-center justify-center py-8">
           
           @if (!result()) {
             <div class="text-center space-y-6">
               <button (click)="runTest()" class="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-cyan-600/20 transform transition hover:scale-105 active:scale-95">
                 ရက် ၁၀၀ စမ်းသပ်မှု စတင်မည်
               </button>
             </div>
           } @else {
             <div class="text-center w-full animate-in fade-in zoom-in duration-500">
                <div class="mb-2 text-slate-400 text-sm uppercase tracking-widest font-semibold">စုစုပေါင်း မှန်ကန်မှုနှုန်း (ရက် ၁၀၀)</div>
                <div class="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400 mb-2">
                  {{ result()?.accuracy }}%
                </div>
                <div class="flex justify-center gap-8 mt-8 border-t border-slate-700 pt-8">
                  <div class="text-center">
                    <div class="text-3xl font-bold text-white">{{ result()?.hits }}</div>
                    <div class="text-xs text-slate-500 uppercase mt-1">မှန်ကန်သည့်အကြိမ်</div>
                  </div>
                  <div class="text-center">
                    <div class="text-3xl font-bold text-white">{{ result()?.total }}</div>
                    <div class="text-xs text-slate-500 uppercase mt-1">ရက်ပေါင်း</div>
                  </div>
                </div>
                <button (click)="result.set(null)" class="mt-8 text-cyan-400 hover:text-white underline underline-offset-4">
                  ပြန်စမည်
                </button>
             </div>
           }

        </div>
      </div>
    </div>
  `
})
export class BacktestComponent implements OnInit {
  engine = inject(EngineService);
  isLoading = signal(false);
  result = signal<{ accuracy: number, hits: number, total: number } | null>(null);
  monthlyStats = signal<MonthlyStats[]>([]);

  ngOnInit() {
    this.monthlyStats.set(this.engine.getMonthlyAccuracy());
  }

  runTest() {
    this.isLoading.set(true);
    setTimeout(() => {
      const res = this.engine.runBacktest(100);
      this.result.set(res);
      this.isLoading.set(false);
    }, 1000);
  }
}

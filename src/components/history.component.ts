
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { StoreService } from '../services/store.service';
import { EngineService } from '../services/engine.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Action Bar -->
      <div class="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        <div>
           <h2 class="text-xl font-bold text-white">ထွက်ဂဏန်း မှတ်တမ်းများ</h2>
           <p class="text-slate-400 text-sm">စုစုပေါင်း: <span class="text-cyan-400 font-mono">{{ store.totalRecords() }}</span> ကြိမ်</p>
        </div>
        <div class="flex flex-wrap gap-3 justify-center">
           <button (click)="showAddForm.set(!showAddForm())" class="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-bold shadow-lg shadow-green-600/20">
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
             {{ showAddForm() ? 'ဖောင်ပိတ်မည်' : 'မှတ်တမ်းဟောင်းထည့်ရန်' }}
           </button>
           <button (click)="showImport.set(!showImport())" class="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors text-sm font-medium">
             {{ showImport() ? 'Import ပိတ်မည်' : 'ဒေတာ အများလိုက်ထည့်ရန်' }}
           </button>
           <button (click)="clearAll()" class="flex items-center gap-2 px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 rounded-lg transition-colors text-sm font-medium">
             အားလုံးဖျက်မည်
           </button>
        </div>
      </div>
      
      <!-- Info Box for Automation -->
      <div class="bg-blue-900/30 border border-blue-700 text-blue-200 text-sm rounded-lg p-4 flex items-start gap-3">
         <svg class="w-5 h-5 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
         <span>
         <strong>မှတ်ချက်:</strong> နေ့စဉ်ထွက်ဂဏန်းများကို စနစ်မှ အလိုအလျောက် မှတ်တမ်းတင်ပေးပါသည်။ ဤဖောင်ကို မှတ်တမ်းဟောင်းများ ပြန်ထည့်ရန် သို့မဟုတ် ပြင်ဆင်ရန်အတွက်သာ အသုံးပြုပါ။
         </span>
      </div>

      <!-- Add New Record Form -->
      @if (showAddForm()) {
        <div class="bg-slate-800 rounded-xl p-6 border border-green-500/50 shadow-xl animate-in slide-in-from-top-4 duration-300">
           <h3 class="text-xl font-bold text-white mb-2">မှတ်တမ်းဟောင်း အသစ်သွင်းရန်</h3>
           <p class="text-xs text-slate-400 mb-4">ရလဒ်သွင်းပြီးတိုင်း AI သည် အလိုအလျောက် ပိုမိုឆ្លပ်မြက်လာပါမည်။</p>
           
           <form [formGroup]="entryForm" (ngSubmit)="onSubmit()" class="space-y-4 max-w-md mx-auto">
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">နေ့စွဲ</label>
                  <input type="date" formControlName="date" class="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-bold">
               </div>
                <div>
                   <label class="block text-xs font-medium text-slate-400 mb-1">SET/Value (Optional)</label>
                   <div class="flex gap-2">
                     <input formControlName="set" placeholder="SET" class="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-center font-bold">
                     <input formControlName="value" placeholder="Value" class="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-center font-bold">
                   </div>
                </div>
             </div>
             <div class="grid grid-cols-2 gap-4">
                <div>
                   <label class="block text-xs font-medium text-slate-400 mb-1">မနက်</label>
                   <input formControlName="am" maxlength="2" class="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-center font-bold text-xl">
                </div>
                <div>
                   <label class="block text-xs font-medium text-slate-400 mb-1">ညနေ</label>
                   <input formControlName="pm" maxlength="2" class="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-center font-bold text-xl">
                </div>
             </div>
             <button type="submit" [disabled]="entryForm.invalid" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded transition-colors disabled:opacity-50 shadow-lg shadow-green-600/30">
               မှတ်တမ်းတင်မည်
             </button>
           </form>
        </div>
      }

      <!-- Import Section -->
      @if (showImport()) {
        <div class="bg-slate-800 rounded-xl p-6 border border-cyan-500/50 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <h3 class="text-lg font-bold text-white mb-2">အများလိုက် ထည့်သွင်းခြင်း (အလိုအလျောက် သန့်စင်စနစ်)</h3>
          <p class="text-sm text-slate-400 mb-4">
             ဒေတာများကို ဤနေရာတွင် Paste ချပါ။ (နေ့စွဲပုံစံအမှားများကို စနစ်က အလိုအလျောက် ပြင်ပေးပါလိမ့်မည်)
          </p>
          
          <textarea 
            [(ngModel)]="importText" 
            rows="8" 
            class="w-full bg-slate-900 border border-slate-600 rounded-lg p-4 text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            placeholder="23.1.2026&#10;11:00 AM&#10;43&#10;04:30 PM&#10;91"></textarea>
          
          <div class="flex justify-end gap-3 mt-4">
            <button (click)="showImport.set(false)" class="px-4 py-2 text-slate-400 hover:text-white transition-colors">မလုပ်တော့ပါ</button>
            <button (click)="processImport()" class="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg shadow-green-600/20">
               ထည့်သွင်းမည်
            </button>
          </div>
        </div>
      }

      <!-- Table -->
      <div class="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider">
                <th class="px-6 py-4 font-medium">နေ့စွဲ</th>
                <th class="px-6 py-4 font-medium">မနက်</th>
                <th class="px-6 py-4 font-medium">ညနေ</th>
                <th class="px-6 py-4 font-medium">SET Index</th>
                <th class="px-6 py-4 font-medium">Value</th>
                <th class="px-6 py-4 font-medium text-right">ဆောင်ရွက်ရန်</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-700">
              @for (row of paginatedRecords(); track row.id) {
                <tr class="hover:bg-slate-700/30 transition-colors group">
                  <td class="px-6 py-4 text-slate-300 font-mono">
                    {{ row.date }} <span class="text-xs text-slate-500 ml-2">({{ row.dayOfWeek }})</span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-block w-8 h-8 leading-8 text-center rounded bg-slate-900 text-cyan-400 font-bold border border-slate-600">
                      {{ row.am }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-block w-8 h-8 leading-8 text-center rounded bg-slate-900 text-purple-400 font-bold border border-slate-600">
                      {{ row.pm }}
                    </span>
                  </td>
                   <td class="px-6 py-4 text-sm text-slate-400 font-mono">{{ row.set || '-' }}</td>
                   <td class="px-6 py-4 text-sm text-slate-400 font-mono">{{ row.value || '-' }}</td>
                  <td class="px-6 py-4 text-right">
                    <button (click)="deleteItem(row.id)" class="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      ဖျက်မည်
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (store.totalRecords() > 0) {
          <div class="p-4 border-t border-slate-700 flex justify-center gap-4">
            <button 
              [disabled]="currentPage() === 0"
              (click)="currentPage.set(currentPage() - 1)"
              class="px-4 py-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 hover:bg-slate-600">
              ရှေ့
            </button>
            <span class="flex items-center text-slate-400 text-sm">
              စာမျက်နှာ {{ currentPage() + 1 }} / {{ totalPages() }}
            </span>
            <button 
              [disabled]="currentPage() >= totalPages() - 1"
              (click)="currentPage.set(currentPage() + 1)"
              class="px-4 py-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 hover:bg-slate-600">
              နောက်
            </button>
          </div>
        }
      </div>
    </div>
  `
})
export class HistoryComponent {
  store = inject(StoreService);
  engine = inject(EngineService);
  private fb = inject(FormBuilder);

  currentPage = signal(0);
  pageSize = 15;
  todayStr = new Date().toISOString().split('T')[0];

  showImport = signal(false);
  showAddForm = signal(false);
  importText = '';

  entryForm = this.fb.group({
    date: [this.todayStr, Validators.required],
    am: ['', [Validators.required, Validators.pattern(/^[0-9]{2}$/)]],
    pm: ['', [Validators.required, Validators.pattern(/^[0-9]{2}$/)]],
    set: [''],
    value: ['']
  });

  totalPages = computed(() => Math.ceil(this.store.records().length / this.pageSize));
  
  paginatedRecords = computed(() => {
    const start = this.currentPage() * this.pageSize;
    return this.store.records().slice(start, start + this.pageSize);
  });

  onSubmit() {
    if (this.entryForm.valid) {
      const { date, am, pm, set, value } = this.entryForm.value;
      if (date && am && pm) {
        this.engine.autoTuneWeights(am); 
        this.store.addRecord(date, am, pm, set || undefined, value || undefined);
        this.engine.autoTuneWeights(pm);
        this.entryForm.reset({ date: this.todayStr, am: '', pm: '', set: '', value: '' });
        this.showAddForm.set(false);
      }
    }
  }

  processImport() {
    const { count, errors } = this.store.importBulk(this.importText);
    alert(`မှတ်တမ်း ${count} ခု ထည့်သွင်းပြီးပါပြီ။ (ကျော်သွားသည်/ပြင်ဆင်သည်: ${errors})`);
    if (count > 0) {
      this.importText = '';
      this.showImport.set(false);
      this.currentPage.set(0);
    }
  }

  deleteItem(id: string) {
    if (confirm('ဤမှတ်တမ်းကို ဖျက်မည်မှာ သေချာပါသလား?')) {
      this.store.deleteRecord(id);
    }
  }

  clearAll() {
    if (confirm('မှတ်တမ်းအားလုံးကို ဖျက်မည်မှာ သေချာပါသလား? ဤလုပ်ဆောင်ချက်ကို ပြန်ပြင်၍မရနိုင်ပါ။')) {
      this.store.clearAll();
      this.currentPage.set(0);
    }
  }

  downloadCSV() {
    const data = this.store.records();
    const headers = ['Date', 'Day', 'AM', 'PM', 'Set', 'Value'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => `${row.date},${row.dayOfWeek},${row.am},${row.pm},"${row.set||''}",${row.value||''}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `futureworld_2d_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

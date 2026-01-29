
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../services/store.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-white mb-2">AI Settings</h2>
        <p class="text-slate-400">သင်၏ Google AI API Key ကို ဤနေရာတွင် စီမံခန့်ခွဲပါ။</p>
      </div>

      <div class="bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-2xl">
        <div class="space-y-4">
          <div>
            <label for="apiKey" class="block text-sm font-bold text-slate-300 mb-2">Google AI API Key</label>
            <input 
              type="password"
              id="apiKey"
              name="apiKey"
              [(ngModel)]="apiKeyInput"
              placeholder="သင်၏ API Key ကို ဤနေရာတွင် ထည့်ပါ"
              class="w-full bg-slate-900 border-2 border-slate-600 rounded-lg p-3 text-white font-mono focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-colors"
            >
          </div>
          
          <div class="text-xs text-slate-500 space-y-1">
             <p>သင်၏ API Key ကို သင့်ကွန်ပျူတာ (Browser) ထဲတွင်သာ လုံခြုံစွာ သိမ်းဆည်းထားမည်ဖြစ်သည်။</p>
             <p>
                API Key မရှိသေးပါက 
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:underline">ဤနေရာတွင်</a>
                အခမဲ့ ရယူနိုင်ပါသည်။
             </p>
          </div>

          <div class="pt-4 flex justify-end">
            <button 
              (click)="saveApiKey()"
              class="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-cyan-600/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="apiKeyInput === store.apiKey()"
            >
              သိမ်းဆည်းမည်
            </button>
          </div>
          
          @if(saveMessage()) {
             <p class="text-center text-green-400 text-sm animate-pulse">{{ saveMessage() }}</p>
          }

        </div>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  store = inject(StoreService);
  apiKeyInput = '';
  saveMessage = signal('');

  ngOnInit() {
    this.apiKeyInput = this.store.apiKey();
  }

  saveApiKey() {
    this.store.updateApiKey(this.apiKeyInput);
    this.saveMessage.set('API Key ကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။');
    setTimeout(() => this.saveMessage.set(''), 3000);
  }
}


import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../services/gemini.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-white mb-2">ဆက်တင်</h2>
        <p class="text-slate-400">Gemini AI နှင့် ချိတ်ဆက်ရန် API Key ကို စီမံခန့်ခွဲပါ။</p>
      </div>

      <div class="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl">
        <h3 class="text-lg font-bold text-white mb-2">Google Gemini API Key</h3>
        <p class="text-sm text-slate-400 mb-4">
          သင်၏ API Key ကို <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-cyan-400 underline hover:text-cyan-300">Google AI Studio</a> မှ ရယူနိုင်ပါသည်။ ဤ Key ကို သင်၏ ကွန်ပျူတာတွင်သာ လုံခြုံစွာ သိမ်းဆည်းထားမည်ဖြစ်သည်။
        </p>
        
        <div class="flex flex-col md:flex-row gap-2 mb-4">
          <input 
            type="password"
            [(ngModel)]="apiKeyInput"
            placeholder="သင်၏ Gemini API Key ကို ထည့်ပါ"
            class="flex-grow w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors">
          <button 
            (click)="saveKey()"
            class="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-600/20 transition-all transform hover:scale-105 active:scale-95">
            သိမ်းဆည်းမည်
          </button>
        </div>

        @if (gemini.hasApiKey()) {
          <div class="flex justify-between items-center bg-green-900/50 border border-green-700 text-green-200 text-sm rounded-lg p-3">
            <span>
              <svg class="w-5 h-5 inline-block -mt-1 mr-2" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              Gemini AI Key ကို အောင်မြင်စွာ ချိတ်ဆက်ပြီးပါပြီ။
            </span>
            <button (click)="clearKey()" class="text-red-400 hover:text-red-300 underline text-xs">
              Key ကို ဖယ်ရှားမည်
            </button>
          </div>
        } @else {
           <div class="bg-yellow-900/50 border border-yellow-700 text-yellow-200 text-sm rounded-lg p-3 flex items-center gap-2">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
             Gemini AI Key ချိတ်ဆက်ထားခြင်း မရှိပါ။ Phoenix Engine ဖြင့်သာ အလုပ်လုပ်နေပါသည်။
           </div>
        }

        @if (statusMessage()) {
          <p class="text-center text-sm mt-4" [class.text-green-400]="isSuccess" [class.text-red-400]="!isSuccess">
             {{ statusMessage() }}
          </p>
        }
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  gemini = inject(GeminiService);
  apiKeyInput = '';
  statusMessage = signal('');
  isSuccess = false;
  
  ngOnInit() {
    this.apiKeyInput = this.gemini.getApiKey() || '';
  }

  saveKey() {
    if (!this.apiKeyInput.trim()) {
      this.isSuccess = false;
      this.statusMessage.set('API Key ကို ထည့်သွင်းရန် လိုအပ်ပါသည်။');
      return;
    }
    this.gemini.setApiKey(this.apiKeyInput);
    this.isSuccess = true;
    this.statusMessage.set('API Key ကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။');
    
    setTimeout(() => this.statusMessage.set(''), 3000);
  }

  clearKey() {
    this.gemini.clearApiKey();
    this.apiKeyInput = '';
    this.isSuccess = true;
    this.statusMessage.set('API Key ကို ဖယ်ရှားပြီးပါပြီ။');
    setTimeout(() => this.statusMessage.set(''), 3000);
  }
}

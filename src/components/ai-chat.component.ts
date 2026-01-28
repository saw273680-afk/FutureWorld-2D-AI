
import { Component, inject, signal, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../services/chat.service';
import { GeminiService } from '../services/gemini.service';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl">
      
      <!-- Header -->
      <div class="flex-shrink-0 p-4 border-b border-slate-700 flex justify-between items-center">
        <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <h2 class="text-white font-bold text-lg">AI Chat (2D အတိုင်ပင်ခံ)</h2>
        </div>
        <button (click)="chatService.clearChat()" class="text-slate-400 hover:text-white text-xs">
          စကားဝိုင်း အသစ်စမည်
        </button>
      </div>

      <!-- Main Chat Area -->
      @if (geminiService.hasApiKey()) {
        <div class="flex-grow p-4 overflow-y-auto" #scrollContainer>
          <div class="space-y-6">
            @for (message of chatService.messages(); track $index) {
              <div class="flex items-end gap-3" [class.flex-row-reverse]="message.role === 'user'">
                
                <!-- Avatar -->
                <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold"
                     [class.bg-gradient-to-br]="message.role === 'model'"
                     [class.from-cyan-500]="message.role === 'model'"
                     [class.to-blue-600]="message.role === 'model'"
                     [class.bg-slate-600]="message.role === 'user'">
                  {{ message.role === 'model' ? 'AI' : 'သင်' }}
                </div>

                <!-- Bubble -->
                <div class="max-w-md md:max-w-lg p-3 rounded-2xl"
                     [class.bg-slate-700]="message.role === 'model'"
                     [class.rounded-bl-none]="message.role === 'model'"
                     [class.bg-cyan-600]="message.role === 'user'"
                     [class.rounded-br-none]="message.role === 'user'"
                     [class.animate-pulse]="message.content === '...'">
                  <p class="text-sm text-white whitespace-pre-wrap">{{ message.content }}</p>
                </div>

              </div>
            }
          </div>
        </div>

        <!-- Input Area -->
        <div class="flex-shrink-0 p-4 border-t border-slate-700 bg-slate-800/50">
          <div class="flex items-center gap-2">
            <textarea
              #inputBox
              [(ngModel)]="userInput"
              (keydown.enter)="handleEnter($event)"
              placeholder="2D နှင့် ပတ်သက်၍ မေးမြန်းလိုသည်များကို ရိုက်ထည့်ပါ..."
              rows="1"
              class="flex-grow w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors resize-none"></textarea>
            <button
              (click)="sendMessage()"
              [disabled]="chatService.isLoading() || !userInput.trim()"
              class="w-12 h-12 flex-shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg flex items-center justify-center transition-all disabled:bg-slate-600 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      } @else {
        <div class="flex-grow flex flex-col items-center justify-center text-center p-8">
            <svg class="w-16 h-16 text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
            <h3 class="text-xl font-bold text-white mb-2">AI Chat ကို အသုံးပြု၍မရပါ</h3>
            <p class="text-slate-400 mb-6">ဤ Feature ကို အသုံးပြုရန်အတွက် Gemini API Key လိုအပ်ပါသည်။</p>
            <button (click)="goToSettings()" class="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-cyan-600/20">
              ဆက်တင်သို့သွားပြီး Key ထည့်သွင်းမည်
            </button>
        </div>
      }
    </div>
  `
})
export class AiChatComponent {
  chatService = inject(ChatService);
  geminiService = inject(GeminiService);
  app = inject(AppComponent);

  userInput = signal('');
  
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('inputBox') private inputBox!: ElementRef<HTMLTextAreaElement>;

  constructor() {
    // Effect to scroll down when new messages are added
    effect(() => {
      // Access the signal to create a dependency
      this.chatService.messages(); 
      this.scrollToBottom();
    });

    // Effect to adjust textarea height as user types
    effect(() => {
      this.userInput(); // Access the signal
      this.adjustTextareaHeight();
    });
  }

  sendMessage() {
    this.chatService.sendMessage(this.userInput());
    this.userInput.set('');
  }

  handleEnter(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  goToSettings() {
    this.app.currentView.set('settings');
  }

  private scrollToBottom(): void {
    // Use a timeout to ensure the DOM has been updated before scrolling.
    setTimeout(() => {
        try {
            if (this.scrollContainer) {
                this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
            }
        } catch(err) { console.error(err); }
    }, 0);
  }
  
  private adjustTextareaHeight(): void {
    // Use a timeout to allow the DOM to update with the new value first.
    setTimeout(() => {
      if (this.inputBox) {
        const textarea = this.inputBox.nativeElement;
        textarea.style.height = 'auto'; // Reset height
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, 0);
  }
}

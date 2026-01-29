
import { Component, inject, signal, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../services/gemini.service';
import { StoreService } from '../services/store.service';
import { Chat } from '@google/genai';

// Allow using the 'marked' library for markdown rendering
declare var marked: any;

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  isStreaming?: boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto h-[calc(100vh-15rem)] flex flex-col">
      
      <!-- Header -->
      <div class="text-center mb-6">
        <h2 class="text-3xl font-bold text-white mb-2">AI Chat</h2>
        <p class="text-slate-400">သင်၏ 2D ဒေတာများနှင့် ပတ်သက်၍ AI ကို တိုက်ရိုက်မေးမြန်းပါ။</p>
      </div>
      
      @if(!store.apiKey()) {
        <div class="m-auto text-center bg-slate-800 p-8 rounded-2xl border border-slate-700">
           <p class="text-yellow-400">AI Chat အသုံးပြုရန် API Key လိုအပ်ပါသည်။</p>
           <p class="text-slate-400 text-sm mt-2">ကျေးဇူးပြု၍ Settings စာမျက်နှာတွင် သင်၏ Google AI API Key ကိုထည့်သွင်းပါ။</p>
        </div>
      } @else {
        <!-- Chat Area -->
        <div class="flex-1 overflow-y-auto p-4 bg-slate-800/50 rounded-t-xl border border-b-0 border-slate-700" #chatContainer>
          <div class="space-y-6">
              @for(message of messages(); track $index) {
                <div class="flex" [class.justify-end]="message.role === 'user'">
                   <div class="max-w-lg p-3 rounded-xl" 
                        [class]="message.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-200'">
                      <div class="prose prose-sm prose-invert max-w-none" [innerHTML]="parseMarkdown(message.content)"></div>
                      @if (message.isStreaming) {
                         <div class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mt-2 ml-1"></div>
                      }
                   </div>
                </div>
              }
          </div>
        </div>

        <!-- Input Area -->
        <div class="border-t border-slate-600 p-4 bg-slate-800 rounded-b-xl">
           <div class="flex items-center gap-3">
             <input 
               type="text"
               [(ngModel)]="userInput"
               (keyup.enter)="sendMessage()"
               [disabled]="isLoading()"
               placeholder="မေးခွန်းတစ်ခု မေးပါ..."
               class="flex-1 w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition disabled:opacity-50"
             >
             <button (click)="sendMessage()" [disabled]="isLoading() || !userInput" class="bg-cyan-600 hover:bg-cyan-500 text-white font-bold p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
             </button>
           </div>
        </div>
      }
    </div>
  `
})
export class ChatComponent implements OnInit, AfterViewChecked {
  gemini = inject(GeminiService);
  store = inject(StoreService);

  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  
  messages = signal<ChatMessage[]>([]);
  userInput = '';
  isLoading = signal(false);
  private chat: Chat | null = null;
  private needsScroll = false;

  ngOnInit() {
    this.chat = this.gemini.startChat();
    if (this.chat) {
      this.messages.set([{ role: 'model', content: "မင်္ဂလာပါ၊ ကျွန်တော် FutureWorld AI ပါ။ သင့်ရဲ့ 2D ဒေတာတွေနဲ့ ပတ်သက်ပြီး ဘာများသိချင်ပါသလဲခင်ဗျာ။" }]);
    }
  }

  ngAfterViewChecked() {
    if (this.needsScroll) {
      this.scrollToBottom();
      this.needsScroll = false;
    }
  }

  async sendMessage() {
    if (!this.userInput.trim() || !this.chat || this.isLoading()) return;

    const userMessage: ChatMessage = { role: 'user', content: this.userInput };
    this.messages.update(m => [...m, userMessage]);
    const prompt = this.userInput;
    this.userInput = '';
    this.isLoading.set(true);
    this.needsScroll = true;

    // Add a placeholder for the streaming response
    this.messages.update(m => [...m, { role: 'model', content: '', isStreaming: true }]);

    try {
      const stream = await this.gemini.sendMessageStream(this.chat, prompt);
      
      for await (const chunk of stream) {
        this.messages.update(currentMessages => {
          const lastMessage = currentMessages[currentMessages.length - 1];
          lastMessage.content += chunk.text;
          return [...currentMessages];
        });
        this.needsScroll = true;
      }

    } catch(e: any) {
      console.error(e);
      let errorMessage = "တောင်းပန်ပါသည်။ AI နှင့်ချိတ်ဆက်ရာတွင် အမှားအယွင်းဖြစ်သွားပါသည်။";
      if (e.message === 'Stream start timed out') {
        errorMessage = "AI Chat server နှင့် ချိတ်ဆက်ရန် အချိန်ကြာနေပါသည်။ ကျေးဇူးပြု၍ Network ကိုစစ်ဆေးပြီး ထပ်မံကြိုးစားပါ။";
      }
      this.messages.update(m => {
          // Remove the empty, streaming placeholder message
          const updatedMessages = m.filter(msg => !(msg.isStreaming && msg.content === ''));
          // Add a new message with the error
          return [...updatedMessages, { role: 'model', content: errorMessage, isStreaming: false }];
      });
    } finally {
       this.messages.update(currentMessages => {
          const lastMessage = currentMessages[currentMessages.length - 1];
          if(lastMessage?.isStreaming) {
            lastMessage.isStreaming = false;
          }
          return [...currentMessages];
        });
      this.isLoading.set(false);
      this.needsScroll = true;
    }
  }

  parseMarkdown(content: string): string {
    if (!content) return '';
    return marked.parse(content);
  }

  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
}

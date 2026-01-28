
import { Injectable, signal, inject } from '@angular/core';
import { GeminiService } from './gemini.service';
import { StoreService } from './store.service';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private geminiService = inject(GeminiService);
  private storeService = inject(StoreService);

  messages = signal<ChatMessage[]>([]);
  isLoading = signal(false);

  constructor() {
    this.initializeChat();
  }

  initializeChat() {
    if (this.geminiService.hasApiKey()) {
      this.messages.set([{
        role: 'model',
        content: "မင်္ဂလာပါ၊ ကျွန်တော်က FutureWorld 2D AI ပညာရှင်ပါ။ မြန်မာ့ 2D နှစ်လုံးထီနဲ့ ပတ်သက်ပြီး သင်သိလိုသမျှကို မေးမြန်းနိုင်ပါတယ်ခင်ဗျာ။"
      }]);
    } else {
       this.messages.set([]);
    }
  }

  async sendMessage(userInput: string) {
    if (!userInput.trim() || this.isLoading()) return;

    this.isLoading.set(true);
    this.messages.update(m => [...m, { role: 'user', content: userInput }]);

    // Add a temporary "typing" message from the model
    this.messages.update(m => [...m, { role: 'model', content: "..." }]);
    
    const history = this.storeService.records();
    const aiResponse = await this.geminiService.sendMessageToChat(userInput, history);

    // Replace the "typing" message with the actual response
    this.messages.update(m => {
        const lastMessage = m[m.length - 1];
        if (lastMessage && lastMessage.role === 'model' && lastMessage.content === '...') {
            m[m.length - 1] = { role: 'model', content: aiResponse };
            return [...m];
        }
        // Fallback in case something went wrong
        return [...m, { role: 'model', content: aiResponse }];
    });

    this.isLoading.set(false);
  }

  clearChat() {
    this.initializeChat();
  }
}

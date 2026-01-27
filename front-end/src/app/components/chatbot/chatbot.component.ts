import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  time: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css'
})
export class ChatbotComponent {
  private http = inject(HttpClient);
  
  isOpen = signal(false);
  messages = signal<Message[]>([
    { text: 'Hello! I am your Housing Assistant. Ask me about house prices, income trends, or affordability in London.', sender: 'bot', time: new Date() }
  ]);
  inputMessage = signal('');
  isLoading = signal(false);

  toggleChat() {
    this.isOpen.set(!this.isOpen());
  }

  async sendMessage() {
    if (!this.inputMessage().trim() || this.isLoading()) return;

    const userText = this.inputMessage();
    
    // Add user message
    this.messages.update(msgs => [...msgs, {
      text: userText,
      sender: 'user',
      time: new Date()
    }]);

    this.inputMessage.set('');
    this.isLoading.set(true);

    try {
      const response = await firstValueFrom(
        this.http.post<{response: string}>('http://localhost:8000/api/chat', { message: userText })
      );

      this.messages.update(msgs => [...msgs, {
        text: response.response,
        sender: 'bot',
        time: new Date()
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      this.messages.update(msgs => [...msgs, {
        text: "I'm sorry, I'm having trouble connecting to the server. Please try again later.",
        sender: 'bot',
        time: new Date()
      }]);
    } finally {
      this.isLoading.set(false);
    }
  }
}

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  isOpen = signal(false);
  messages = signal<Message[]>([
    { text: 'Hello! How can I help you with housing affordability in London today?', sender: 'bot', time: new Date() }
  ]);
  inputMessage = signal('');

  toggleChat() {
    this.isOpen.set(!this.isOpen());
  }

  sendMessage() {
    if (!this.inputMessage().trim()) return;

    // Add user message
    this.messages.update(msgs => [...msgs, {
      text: this.inputMessage(),
      sender: 'user',
      time: new Date()
    }]);

    const userText = this.inputMessage();
    this.inputMessage.set('');

    // Simulate bot response (placeholder for now)
    setTimeout(() => {
      this.messages.update(msgs => [...msgs, {
        text: `I'm just a frontend demo for now. You said: "${userText}". The backend will be connected soon!`,
        sender: 'bot',
        time: new Date()
      }]);
    }, 1000);
  }
}

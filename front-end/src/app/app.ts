import { Component, signal } from '@angular/core';
import { HeroComponent } from './components/hero/hero.component';
import { BoroughMapComponent } from './components/borough-map/borough-map.component';
import { IncomeChartComponent } from './components/income-chart/income-chart.component';
import { CalculatorComponent } from './components/calculator/calculator.component';
import { InsightsComponent } from './components/insights/insights.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';

@Component({
  selector: 'app-root',
  imports: [
    HeroComponent,
    BoroughMapComponent,
    IncomeChartComponent,
    CalculatorComponent,
    InsightsComponent,
    ChatbotComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('2A London Housing Market Insights');
}

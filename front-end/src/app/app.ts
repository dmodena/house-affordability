import { Component, signal } from '@angular/core';
import { HeroComponent } from './components/hero/hero.component';
import { BoroughMapComponent } from './components/borough-map/borough-map.component';
import { IncomeChartComponent } from './components/income-chart/income-chart.component';
import { ReasonsSolutionsComponent } from './components/reasons-solutions/reasons-solutions.component';
import { CalculatorComponent } from './components/calculator/calculator.component';
import { SolutionsComponent } from './components/solutions/solutions.component';

@Component({
  selector: 'app-root',
  imports: [
    HeroComponent,
    BoroughMapComponent,
    IncomeChartComponent,
    ReasonsSolutionsComponent,
    CalculatorComponent,
    SolutionsComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('London Housing Affordability');
}

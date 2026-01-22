import { Component, computed } from '@angular/core';
import { HousingDataService } from '../../services/housing-data.service';

@Component({
  selector: 'app-income-chart',
  imports: [],
  templateUrl: './income-chart.component.html',
  styleUrl: './income-chart.component.css',
  host: {
    class: 'block'
  }
})
export class IncomeChartComponent {
  constructor(private housingDataService: HousingDataService) {}

  readonly incomeData = computed(() => this.housingDataService.incomeData());
  readonly priceData = computed(() => this.housingDataService.priceData());

  readonly chartData = computed(() => {
    const income = this.incomeData();
    const prices = this.priceData();
    
    return income.map(incomeItem => {
      const priceItem = prices.find(p => p.year === incomeItem.year);
      return {
        year: incomeItem.year,
        income: incomeItem.income,
        price: priceItem?.price || 0,
        isProjection: incomeItem.isProjection
      };
    });
  });

  readonly maxIncome = computed(() => {
    const incomes = this.incomeData().map(d => d.income);
    return Math.max(...incomes);
  });

  readonly maxPrice = computed(() => {
    const prices = this.priceData().map(d => d.price);
    return Math.max(...prices);
  });

  readonly affordabilityRatio = computed(() => {
    const maxPrice = this.maxPrice();
    const maxIncome = this.maxIncome();
    return Math.round(maxPrice / maxIncome);
  });

  readonly historicalIncomePath = computed(() => {
    return this.getPath(this.chartData().slice(0, 25).map(d => d.income), this.maxIncome());
  });

  readonly historicalPricePath = computed(() => {
    return this.getPath(this.chartData().slice(0, 25).map(d => d.price ?? 0), this.maxPrice());
  });

  readonly projectionIncomePath = computed(() => {
    return this.getProjectionPath(this.chartData().map(d => d.income), this.maxIncome());
  });

  readonly projectionPricePath = computed(() => {
    return this.getProjectionPath(this.chartData().map(d => d.price ?? 0), this.maxPrice());
  });

  readonly chartWidth = 800;
  readonly chartHeight = 400;
  readonly padding = 60;

  getScaledY(value: number, maxValue: number): number {
    return this.chartHeight - this.padding - ((value / maxValue) * (this.chartHeight - 2 * this.padding));
  }

  getScaledX(year: number): number {
    const yearRange = 2030 - 2000;
    const yearOffset = year - 2000;
    return this.padding + ((yearOffset / yearRange) * (this.chartWidth - 2 * this.padding));
  }

  formatCurrency(value: number): string {
    if (value >= 1000000) {
      return `£${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `£${(value / 1000).toFixed(0)}K`;
    }
    return `£${value}`;
  }

  getPath(data: number[], maxValue: number, isProjection: boolean = false): string {
    return data.map((value, index) => {
      const year = 2000 + index;
      const x = this.getScaledX(year);
      const y = this.getScaledY(value, maxValue);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }

  getProjectionPath(data: number[], maxValue: number): string {
    const projectionStart = 25; // 2025 is index 25
    const projectionData = data.slice(projectionStart);
    
    if (projectionData.length === 0) return '';
    
    return projectionData.map((value, index) => {
      const year = 2025 + index;
      const x = this.getScaledX(year);
      const y = this.getScaledY(value, maxValue);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }
}

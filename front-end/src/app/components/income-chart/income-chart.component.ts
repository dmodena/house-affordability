import { Component, signal, ChangeDetectionStrategy, computed, inject, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ChartDataService, ChartData, ForecastData } from '../../services/chart-data.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-income-chart',
  imports: [FormsModule, HttpClientModule],
  templateUrl: './income-chart.component.html',
  styleUrl: './income-chart.component.css',
  host: {
    class: 'block'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IncomeChartComponent implements AfterViewInit {
  private readonly chartDataService = inject(ChartDataService);
  private readonly cdr = inject(ChangeDetectorRef);
  
  @ViewChild('chart') private chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  private chart: Chart | null = null;
  
  // Signals for state management
  readonly selectedBorough = signal<string>('');
  readonly status = signal<string>('Loading overview...');
  readonly availableBoroughs = signal<string[]>([]);
  readonly selectedYears = signal<number[]>([]);
  readonly insightText = signal<string>('Click two years on the chart to compare.');
  
  // Current series data for insights
  private currentSeries = {
    title: '',
    years: [] as number[],
    house_price: [] as number[],
    annual_income: [] as number[],
  };

  readonly yearRangeDisplay = computed(() => {
    const years = this.selectedYears();
    if (years.length === 0) return 'None';
    if (years.length === 1) return `${years[0]} (pick one more year)`;
    return `${years[0]} → ${years[1]}`;
  });

  ngAfterViewInit(): void {
    this.loadBoroughs();
    this.loadOverview();
  }

  loadBoroughs(): void {
    this.chartDataService.getBoroughs().subscribe({
      next: (data) => {
        this.availableBoroughs.set(data.boroughs);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading boroughs:', error);
        this.status.set('Failed to load boroughs.');
      }
    });
  }

  loadOverview(): void {
    this.status.set('Loading London overview forecast...');
    
    this.chartDataService.getOverviewForecast(6).subscribe({
      next: (data) => {
        this.status.set(`Showing: ${data.title}`);
        
        // Use forecast data for insights (full axis with central predictions)
        this.currentSeries = {
          title: data.title,
          years: data.forecast.years,
          house_price: data.forecast.house_price.yhat,
          annual_income: data.forecast.annual_income.yhat,
        };
        
        this.renderChartWithForecast(data.title, data.history, data.forecast);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading overview forecast:', error);
        this.status.set('Failed to load overview forecast.');
      }
    });
  }

  loadBoroughData(): void {
    const borough = this.selectedBorough().trim();
    
    if (!borough) {
      this.loadOverview();
      return;
    }

    this.status.set('Loading forecast...');

    this.chartDataService.getForecast(borough, 6).subscribe({
      next: (data) => {
        this.status.set(`Showing: ${data.title}`);
        
        // For insights, use the full-axis central forecast values
        this.currentSeries = {
          title: data.title,
          years: data.forecast.years,
          house_price: data.forecast.house_price.yhat,
          annual_income: data.forecast.annual_income.yhat,
        };
        
        this.renderChartWithForecast(data.title, data.history, data.forecast);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading borough data:', error);
        this.status.set('Not found. (Try selecting from the list)');
      }
    });
  }

  resetSelection(): void {
    this.selectedYears.set([]);
    this.insightText.set('Click two years on the chart to compare.');
  }

  private moneyGBP(value: number | null): string {
    if (value === null || value === undefined) return 'N/A';
    return `£${Number(value).toLocaleString('en-GB')}`;
  }

  private pctChange(from: number, to: number): number | null {
    if (from === 0 || from === null || from === undefined) return null;
    return ((to - from) / from) * 100;
  }

  private computeInsight(): void {
    const years = this.selectedYears();
    if (years.length < 2) return;

    const [y1, y2] = years;
    const i1 = this.currentSeries.years.indexOf(y1);
    const i2 = this.currentSeries.years.indexOf(y2);

    if (i1 === -1 || i2 === -1) {
      this.insightText.set('Could not find data for the selected years.');
      return;
    }

    const hp1 = this.currentSeries.house_price[i1];
    const hp2 = this.currentSeries.house_price[i2];
    const inc1 = this.currentSeries.annual_income[i1];
    const inc2 = this.currentSeries.annual_income[i2];

    const hpPct = this.pctChange(hp1, hp2);
    const incPct = this.pctChange(inc1, inc2);

    const contextLabel = this.currentSeries.title;
    const hpMsg = hpPct === null ? 'N/A' : `${hpPct.toFixed(1)}%`;
    const incMsg = incPct === null ? 'N/A' : `${incPct.toFixed(1)}%`;

    const msg =
      `${contextLabel}: From ${y1} to ${y2}, house price went from ${this.moneyGBP(hp1)} to ${this.moneyGBP(hp2)} (${hpMsg}). ` +
      `Income went from ${this.moneyGBP(inc1)} to ${this.moneyGBP(inc2)} (${incMsg}).`;

    this.insightText.set(msg);
  }

  private renderChart(title: string, labels: number[], house: number[], income: number[]): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;
    
    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels, // years
        datasets: [
          {
            label: 'House price',
            data: house,
            borderColor: '#3b82f6',
            backgroundColor: '#3b82f6',
            tension: 0.2,
            pointRadius: 3,
            pointHitRadius: 12, // easier to click
          },
          {
            label: 'Annual income',
            data: income,
            borderColor: '#22c55e',
            backgroundColor: '#22c55e',
            tension: 0.2,
            pointRadius: 3,
            pointHitRadius: 12,
          },
        ],
      },
      options: {
        responsive: true,
        interaction: { mode: 'nearest', intersect: true },
        plugins: {
          title: { display: true, text: title },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${this.moneyGBP(ctx.parsed.y)}`,
            },
          },
        },
        scales: {
          y: {
            ticks: { callback: (v) => this.moneyGBP(v as number) },
          },
        },
        onClick: (_event, elements) => {
          if (!elements || elements.length === 0) return;

          const idx = elements[0].index;
          const year = Number(labels[idx]);

          // If already selected same year, ignore
          const currentYears = this.selectedYears();
          if (currentYears.includes(year)) return;

          if (currentYears.length === 0) {
            this.selectedYears.set([year]);
          } else if (currentYears.length === 1) {
            this.selectedYears.set([currentYears[0], year].sort((a, b) => a - b));
          } else {
            // If already had 2, start a new selection with this year
            this.selectedYears.set([year]);
          }

          if (this.selectedYears().length === 2) {
            this.computeInsight();
          } else {
            this.insightText.set('Now click one more year to compare.');
          }
        },
      },
    });

    // Reset selection whenever we render a new chart
    this.resetSelection();
  }

  private renderChartWithForecast(title: string, history: any, forecast: any): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;
    
    if (this.chart) {
      this.chart.destroy();
    }

    const labels = forecast.years; // full axis (e.g., 2002..2030)
    const lastHistYear = Math.max(...history.years);

    // Split: historical solid lines
    const houseHist = labels.map((y: number) => {
      const idx = history.years.indexOf(y);
      return idx !== -1 ? history.house_price[idx] : null;
    });

    const incomeHist = labels.map((y: number) => {
      const idx = history.years.indexOf(y);
      return idx !== -1 ? history.annual_income[idx] : null;
    });

    // Split: forecast dotted lines. Start at lastHistYear to connect visually.
    const houseFc = labels.map((y: number, i: number) =>
      y >= lastHistYear ? forecast.house_price.yhat[i] : null,
    );
    const incomeFc = labels.map((y: number, i: number) =>
      y >= lastHistYear ? forecast.annual_income.yhat[i] : null,
    );

    // Optional bands (upper/lower) for forecast only
    const houseUpper = labels.map((y: number, i: number) =>
      y > lastHistYear ? forecast.house_price.upper[i] : null,
    );
    const houseLower = labels.map((y: number, i: number) =>
      y > lastHistYear ? forecast.house_price.lower[i] : null,
    );
    const incUpper = labels.map((y: number, i: number) =>
      y > lastHistYear ? forecast.annual_income.upper[i] : null,
    );
    const incLower = labels.map((y: number, i: number) =>
      y > lastHistYear ? forecast.annual_income.lower[i] : null,
    );

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          // --- Historical (solid)
          {
            label: 'House price (history)',
            data: houseHist,
            borderColor: '#3b82f6',
            backgroundColor: '#3b82f6',
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            pointRadius: 3,
            pointHitRadius: 12,
            spanGaps: true,
          },
          {
            label: 'Annual income (history)',
            data: incomeHist,
            borderColor: '#22c55e',
            backgroundColor: '#22c55e',
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            pointRadius: 3,
            pointHitRadius: 12,
            spanGaps: true,
          },

          // --- Forecast (dotted)
          {
            label: 'House price (forecast)',
            data: houseFc,
            borderColor: '#3b82f6',
            backgroundColor: '#3b82f6',
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            pointRadius: 3,
            pointHitRadius: 12,
            borderDash: [6, 6],
            spanGaps: true,
          },
          {
            label: 'Annual income (forecast)',
            data: incomeFc,
            borderColor: '#22c55e',
            backgroundColor: '#22c55e',
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            pointRadius: 3,
            pointHitRadius: 12,
            borderDash: [6, 6],
            spanGaps: true,
          },

          // --- Optional uncertainty bands
          {
            label: 'House forecast (upper)',
            data: houseUpper,
            borderColor: 'rgba(59, 130, 246, 0.2)', // transparent blue
            tension: 0.2,
            pointRadius: 0,
            borderWidth: 0,
          },
          {
            label: 'House forecast (lower)',
            data: houseLower,
            borderColor: 'rgba(59, 130, 246, 0.2)',
            backgroundColor: 'rgba(59, 130, 246, 0.2)', // fill color
            tension: 0.2,
            pointRadius: 0,
            borderWidth: 0,
            fill: '-1',
          },
          {
            label: 'Income forecast (upper)',
            data: incUpper,
            borderColor: 'rgba(34, 197, 94, 0.2)', // transparent green
            tension: 0.2,
            pointRadius: 0,
            borderWidth: 0,
          },
          {
            label: 'Income forecast (lower)',
            data: incLower,
            borderColor: 'rgba(34, 197, 94, 0.2)',
            backgroundColor: 'rgba(34, 197, 94, 0.2)', // fill color
            tension: 0.2,
            pointRadius: 0,
            borderWidth: 0,
            fill: '-1',
          },
        ],
      },
      options: {
        responsive: true,
        interaction: { mode: 'nearest', intersect: true },
        plugins: {
          title: { display: true, text: title },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${this.moneyGBP(ctx.parsed.y)}`,
            },
          },
          legend: {
            labels: {
              filter: (legendItem) => {
                const t = legendItem.text || '';
                return !t.includes('(upper)') && !t.includes('(lower)');
              },
            },
          },
        },
        scales: {
          y: {
            ticks: { callback: (v) => this.moneyGBP(v as number) },
          },
        },
        onClick: (_event, elements) => {
          if (!elements || elements.length === 0) return;

          const idx = elements[0].index;
          const year = Number(labels[idx]);

          const currentYears = this.selectedYears();
          if (currentYears.includes(year)) return;

          if (currentYears.length === 0) {
            this.selectedYears.set([year]);
          } else if (currentYears.length === 1) {
            this.selectedYears.set([currentYears[0], year].sort((a, b) => a - b));
          } else {
            this.selectedYears.set([year]);
          }

          if (this.selectedYears().length === 2) {
            this.computeInsight();
          } else {
            this.insightText.set('Now click one more year to compare.');
          }
        },
      },
    });

    this.resetSelection();
  }
}

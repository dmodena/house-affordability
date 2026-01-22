import { Component, signal, computed } from '@angular/core';
import { HousingDataService } from '../../services/housing-data.service';

@Component({
  selector: 'app-borough-map',
  imports: [],
  templateUrl: './borough-map.component.html',
  styleUrl: './borough-map.component.css',
  host: {
    class: 'block'
  }
})
export class BoroughMapComponent {
  readonly selectedYear = signal<number>(2000);
  readonly minYear = 2000;
  readonly maxYear = 2030;

  constructor(private housingDataService: HousingDataService) {}

  readonly boroughs = computed(() => {
    return this.housingDataService.boroughs().map(borough => ({
      ...borough,
      currentPrice: borough.prices[this.selectedYear()],
      color: this.getPriceColor(borough.prices[this.selectedYear()])
    }));
  });

  readonly yearDisplay = computed(() => {
    const year = this.selectedYear();
    return year >= 2025 ? `${year} (Projection)` : year.toString();
  });

  onYearChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.selectedYear.set(parseInt(target.value));
  }

  private getPriceColor(price: number): string {
    if (price < 300000) return '#10b981'; // green
    if (price < 600000) return '#eab308'; // yellow
    if (price < 900000) return '#f97316'; // orange
    if (price < 1200000) return '#ef4444'; // red
    return '#991b1b'; // dark red
  }

  getBoroughPath(boroughName: string): string {
    const paths: { [key: string]: string } = {
      'Camden': 'M 150 100 L 200 100 L 200 150 L 150 150 Z',
      'Westminster': 'M 200 100 L 250 100 L 250 150 L 200 150 Z',
      'Kensington & Chelsea': 'M 250 100 L 300 100 L 300 150 L 250 150 Z',
      'Tower Hamlets': 'M 300 150 L 350 150 L 350 200 L 300 200 Z',
      'Hackney': 'M 150 150 L 200 150 L 200 200 L 150 200 Z',
      'Islington': 'M 200 150 L 250 150 L 250 200 L 200 200 Z',
      'Southwark': 'M 250 200 L 300 200 L 300 250 L 250 250 Z',
      'Lambeth': 'M 200 200 L 250 200 L 250 250 L 200 250 Z',
      'Wandsworth': 'M 150 200 L 200 200 L 200 250 L 150 250 Z',
      'Hammersmith & Fulham': 'M 100 150 L 150 150 L 150 200 L 100 200 Z'
    };
    return paths[boroughName] || '';
  }

  getBoroughPosition(boroughName: string): { x: number; y: number } {
    const positions: { [key: string]: { x: number; y: number } } = {
      'Camden': { x: 175, y: 125 },
      'Westminster': { x: 225, y: 125 },
      'Kensington & Chelsea': { x: 275, y: 125 },
      'Tower Hamlets': { x: 325, y: 175 },
      'Hackney': { x: 175, y: 175 },
      'Islington': { x: 225, y: 175 },
      'Southwark': { x: 275, y: 225 },
      'Lambeth': { x: 225, y: 225 },
      'Wandsworth': { x: 175, y: 225 },
      'Hammersmith & Fulham': { x: 125, y: 175 }
    };
    return positions[boroughName] || { x: 0, y: 0 };
  }
}

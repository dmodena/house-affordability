import { Component, computed } from '@angular/core';
import { HousingDataService } from '../../services/housing-data.service';

@Component({
  selector: 'app-affordability-timeline',
  imports: [],
  templateUrl: './affordability-timeline.component.html',
  styleUrl: './affordability-timeline.component.css',
  host: {
    class: 'block'
  }
})
export class AffordabilityTimelineComponent {
  constructor(private housingDataService: HousingDataService) {}

  readonly timelineEvents = computed(() => this.housingDataService.timelineEvents());

  getImpactColor(impact: string): string {
    switch (impact) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f97316';
      case 'low':
        return '#eab308';
      default:
        return '#64748b';
    }
  }

  getImpactSize(impact: string): number {
    switch (impact) {
      case 'high':
        return 16;
      case 'medium':
        return 12;
      case 'low':
        return 8;
      default:
        return 8;
    }
  }

  getEventPosition(year: number): number {
    const startYear = 2000;
    const endYear = 2030;
    const range = endYear - startYear;
    const offset = year - startYear;
    return (offset / range) * 100;
  }
}

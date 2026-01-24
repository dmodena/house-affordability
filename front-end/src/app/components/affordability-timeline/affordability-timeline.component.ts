import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-affordability-timeline',
  imports: [],
  templateUrl: './affordability-timeline.component.html',
  styleUrl: './affordability-timeline.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block'
  }
})
export class AffordabilityTimelineComponent {
  // Component now displays the reasons GIFs
  // No complex logic needed for this static content display
}

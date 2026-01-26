import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-reasons-solutions',
  imports: [],
  templateUrl: './reasons-solutions.component.html',
  styleUrl: './reasons-solutions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block'
  }
})
export class ReasonsSolutionsComponent {
  // Component now displays the reasons GIFs
  // No complex logic needed for this static content display
}

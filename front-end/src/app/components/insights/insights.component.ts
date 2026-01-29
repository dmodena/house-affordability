import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-insights',
  imports: [CommonModule],
  templateUrl: './insights.component.html',
  styleUrl: './insights.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InsightsComponent {
  
  downloadReport(): void {
    // Open the PDF report in a new tab
    window.open('/real_estate_report.pdf', '_blank');
  }

  contactExperts(): void {
    // Open email client or redirect to contact form
    const email = 'contact@2amarketintelligence.com';
    const subject = encodeURIComponent('London Housing Market Consultation Request');
    const body = encodeURIComponent(
      `Dear 2A Market Intelligence Team,

I would like to schedule a consultation regarding London's housing market insights and strategic solutions.

Please let me know your availability for a discussion.

Best regards`
    );
    
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }
}

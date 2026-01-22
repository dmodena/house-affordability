import { Component } from '@angular/core';

interface Solution {
  title: string;
  description: string;
  icon: string;
  impact: string;
  timeline: string;
}

@Component({
  selector: 'app-solutions',
  imports: [],
  templateUrl: './solutions.component.html',
  styleUrl: './solutions.component.css',
  host: {
    class: 'block'
  }
})
export class SolutionsComponent {
  readonly solutions: Solution[] = [
    {
      title: 'Smart Planning',
      description: 'Implement strategic zoning and density policies to increase housing supply while maintaining neighborhood character. Focus on transit-oriented development and underutilized land conversion.',
      icon: 'building',
      impact: 'High',
      timeline: '5-10 years'
    },
    {
      title: 'Social Housing',
      description: 'Massive investment in affordable housing programs, community land trusts, and cooperative ownership models. Prioritize families and essential workers in allocation schemes.',
      icon: 'home',
      impact: 'Very High',
      timeline: '3-7 years'
    },
    {
      title: 'Rent Stability',
      description: 'Introduce rent control measures, longer tenancy agreements, and tenant protection policies. Balance landlord rights with affordable housing access for long-term residents.',
      icon: 'shield',
      impact: 'Medium',
      timeline: '2-5 years'
    }
  ];

  getIconPath(iconName: string): string {
    const icons: { [key: string]: string } = {
      building: 'M3 21h18M3 10h18M3 7l9-4 9 4M8 21v-11M16 21v-11',
      home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
      shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'
    };
    return icons[iconName] || '';
  }
}

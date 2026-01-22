import { Injectable, signal } from '@angular/core';

export interface BoroughData {
  name: string;
  prices: { [year: number]: number };
}

export interface IncomeData {
  year: number;
  income: number;
  isProjection: boolean;
}

export interface PriceData {
  year: number;
  price: number;
  isProjection: boolean;
}

export interface TimelineEvent {
  year: number;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

@Injectable({
  providedIn: 'root'
})
export class HousingDataService {
  readonly boroughs = signal<BoroughData[]>([
    {
      name: 'Camden',
      prices: this.generatePriceData(250000, 1200000)
    },
    {
      name: 'Westminster',
      prices: this.generatePriceData(300000, 1500000)
    },
    {
      name: 'Kensington & Chelsea',
      prices: this.generatePriceData(400000, 2000000)
    },
    {
      name: 'Tower Hamlets',
      prices: this.generatePriceData(180000, 800000)
    },
    {
      name: 'Hackney',
      prices: this.generatePriceData(200000, 900000)
    },
    {
      name: 'Islington',
      prices: this.generatePriceData(220000, 950000)
    },
    {
      name: 'Southwark',
      prices: this.generatePriceData(190000, 750000)
    },
    {
      name: 'Lambeth',
      prices: this.generatePriceData(185000, 700000)
    },
    {
      name: 'Wandsworth',
      prices: this.generatePriceData(210000, 780000)
    },
    {
      name: 'Hammersmith & Fulham',
      prices: this.generatePriceData(240000, 850000)
    }
  ]);

  readonly incomeData = signal<IncomeData[]>(this.generateIncomeData());

  readonly priceData = signal<PriceData[]>(this.generateAveragePriceData());

  readonly timelineEvents = signal<TimelineEvent[]>([
    {
      year: 2000,
      title: 'Housing Market Boom Begins',
      description: 'London property prices start accelerating beyond inflation',
      impact: 'medium'
    },
    {
      year: 2008,
      title: 'Financial Crisis',
      description: 'Temporary market correction before rapid recovery',
      impact: 'high'
    },
    {
      year: 2012,
      title: 'Olympics Impact',
      description: 'East London regeneration drives price increases',
      impact: 'medium'
    },
    {
      year: 2016,
      title: 'Brexit Vote',
      description: 'Market uncertainty briefly slows price growth',
      impact: 'medium'
    },
    {
      year: 2020,
      title: 'COVID-19 Pandemic',
      description: 'Remote work trends reshape housing preferences',
      impact: 'high'
    },
    {
      year: 2022,
      title: 'Interest Rate Hikes',
      description: 'Mortgage costs surge, reducing affordability',
      impact: 'high'
    },
    {
      year: 2025,
      title: 'Affordability Crisis Peak',
      description: 'Average London home costs 15x average income',
      impact: 'high'
    }
  ]);

  private generatePriceData(startPrice: number, endPrice: number): { [year: number]: number } {
    const prices: { [year: number]: number } = {};
    const years = 30;
    const growthFactor = Math.pow(endPrice / startPrice, 1 / years);
    
    for (let year = 2000; year <= 2030; year++) {
      const yearIndex = year - 2000;
      let price = startPrice * Math.pow(growthFactor, yearIndex);
      
      // Add some volatility
      if (year === 2008) {
        price *= 0.85; // Financial crisis dip
      } else if (year === 2009) {
        price *= 0.9;
      } else if (year === 2016) {
        price *= 0.95; // Brexit uncertainty
      }
      
      prices[year] = Math.round(price);
    }
    
    return prices;
  }

  private generateIncomeData(): IncomeData[] {
    const data: IncomeData[] = [];
    const startIncome = 35000;
    const endIncome = 55000;
    const years = 30;
    const growthFactor = Math.pow(endIncome / startIncome, 1 / years);
    
    for (let year = 2000; year <= 2030; year++) {
      const yearIndex = year - 2000;
      let income = startIncome * Math.pow(growthFactor, yearIndex);
      
      // Add some real-world variations
      if (year >= 2008 && year <= 2010) {
        income *= 0.98; // Stagnation during crisis
      } else if (year >= 2020 && year <= 2022) {
        income *= 1.02; // Slight increase during pandemic
      }
      
      data.push({
        year,
        income: Math.round(income),
        isProjection: year >= 2025
      });
    }
    
    return data;
  }

  private generateAveragePriceData(): PriceData[] {
    const data: PriceData[] = [];
    const startPrice = 200000;
    const endPrice = 1200000;
    const years = 30;
    const growthFactor = Math.pow(endPrice / startPrice, 1 / years);
    
    for (let year = 2000; year <= 2030; year++) {
      const yearIndex = year - 2000;
      let price = startPrice * Math.pow(growthFactor, yearIndex);
      
      // Add market events
      if (year === 2008) {
        price *= 0.85;
      } else if (year === 2009) {
        price *= 0.9;
      } else if (year === 2016) {
        price *= 0.95;
      }
      
      data.push({
        year,
        price: Math.round(price),
        isProjection: year >= 2025
      });
    }
    
    return data;
  }

  getBoroughPrice(boroughName: string, year: number): number {
    const borough = this.boroughs().find(b => b.name === boroughName);
    return borough?.prices[year] || 0;
  }

  getAffordabilityRatio(year: number): number {
    const avgPrice = this.priceData().find(p => p.year === year)?.price || 0;
    const avgIncome = this.incomeData().find(i => i.year === year)?.income || 1;
    return Math.round(avgPrice / avgIncome);
  }
}

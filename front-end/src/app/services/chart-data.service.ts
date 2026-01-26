import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ChartData {
  title: string;
  years: number[];
  house_price: number[];
  annual_income: number[];
}

export interface ForecastData {
  title: string;
  history: {
    years: number[];
    house_price: number[];
    annual_income: number[];
  };
  forecast: {
    years: number[];
    house_price: {
      yhat: number[];
      lower: number[];
      upper: number[];
    };
    annual_income: {
      yhat: number[];
      lower: number[];
      upper: number[];
    };
  };
  meta: {
    years_ahead: number;
    note: string;
  };
}

export interface Borough {
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChartDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8000'; // Adjust if your Flask server runs on different port

  getOverview(): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.baseUrl}/api/overview`).pipe(
      catchError(this.handleError)
    );
  }

  getOverviewForecast(yearsAhead: number = 6): Observable<ForecastData> {
    return this.http.get<ForecastData>(`${this.baseUrl}/api/overview-forecast`, {
      params: { years_ahead: yearsAhead.toString() }
    }).pipe(
      catchError(this.handleError)
    );
  }

  getBoroughs(): Observable<{ boroughs: string[] }> {
    return this.http.get<{ boroughs: string[] }>(`${this.baseUrl}/api/boroughs`).pipe(
      catchError(this.handleError)
    );
  }

  getBoroughSeries(borough: string): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.baseUrl}/api/series`, {
      params: { borough }
    }).pipe(
      catchError(this.handleError)
    );
  }

  getForecast(borough: string, yearsAhead: number = 6): Observable<ForecastData> {
    return this.http.get<ForecastData>(`${this.baseUrl}/api/forecast`, {
      params: { 
        borough,
        years_ahead: yearsAhead.toString()
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error('ChartDataService error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

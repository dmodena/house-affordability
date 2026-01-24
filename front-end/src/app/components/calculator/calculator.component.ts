import { Component, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface CalculationResult {
  years: number;
  months: number;
  totalAge: number;
  message: string;
  status: 'error' | 'warning' | 'success';
}

@Component({
  selector: 'app-calculator',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalculatorComponent {
  private formBuilder = inject(FormBuilder);
  
  calculatorForm = this.formBuilder.group({
    salary: ['', [Validators.required, Validators.min(0)]],
    age: ['', [Validators.required, Validators.min(18), Validators.max(100)]],
    price: ['', [Validators.required, Validators.min(0)]]
  });

  isCalculating = signal(false);
  result = signal<CalculationResult | null>(null);
  advice = signal('');

  calculate(): void {
    if (this.calculatorForm.invalid) {
      this.markFormGroupTouched(this.calculatorForm);
      return;
    }

    this.isCalculating.set(true);
    this.advice.set('Calculating...');

    const formValues = this.calculatorForm.value;
    const salary = Number(formValues.salary);
    const age = Number(formValues.age);
    const price = Number(formValues.price);

    setTimeout(() => {
      const fee = salary * 0.3;
      const months = Math.abs(Math.log(Math.abs(1 - (price * 0.00375 / fee))) / Math.log(1.00375));
      const years = Math.floor(months / 12);
      const remainingMonths = Math.floor(months) - years * 12;
      const totalAge = years + age;

      let status: 'error' | 'warning' | 'success';
      let message: string;

      if (totalAge > 80) {
        status = 'error';
        message = `According to your conditions, I don't think that purchase it shall be possible, mate. Maybe in ${years} years and ${remainingMonths} months.`;
      } else if (totalAge > 50) {
        status = 'warning';
        message = `According to your conditions, I think you could hardly buy that property. Maybe in ${years} years and ${remainingMonths} months.`;
      } else if (totalAge > 30) {
        status = 'success';
        message = `According to your conditions, I think you could purchase that property. Maybe in ${years} years and ${remainingMonths} months.`;
      } else {
        status = 'success';
        message = `According to your conditions, I think you could really purchase that property. Maybe in ${years} years and ${remainingMonths} months.`;
      }

      this.result.set({
        years,
        months: remainingMonths,
        totalAge,
        message,
        status
      });

      this.isCalculating.set(false);
      this.advice.set('');
    }, 500);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  getResultClass(): string {
    const currentResult = this.result();
    if (!currentResult) return '';
    return currentResult.status;
  }
}

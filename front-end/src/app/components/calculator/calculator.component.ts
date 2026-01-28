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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalculatorComponent {
  private formBuilder = inject(FormBuilder);
  
  calculatorForm = this.formBuilder.group({
    salary: ['', [Validators.required, Validators.min(0)]],
    price: ['', [Validators.required, Validators.min(0)]]
  });

  isCalculating = signal(false);
  result = signal<CalculationResult | null>(null);
  advice = signal('');

  // Format number with space separators for hundreds
  formatNumberWithSpaces(value: string): string {
    if (!value) return '';
    
    // Remove all non-digit characters
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue === '') return '';
    
    // Add space separators every 3 digits from the right
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  // Parse formatted number back to clean number
  parseFormattedNumber(formattedValue: string): string {
    return formattedValue.replace(/\s/g, '');
  }

  // Handle input formatting for salary
  onSalaryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formattedValue = this.formatNumberWithSpaces(input.value);
    const cleanValue = this.parseFormattedNumber(formattedValue);
    
    // Update the visual display
    input.value = formattedValue;
    
    // Update the form control with clean value
    this.calculatorForm.patchValue({ salary: cleanValue });
  }

  // Handle input formatting for price
  onPriceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formattedValue = this.formatNumberWithSpaces(input.value);
    const cleanValue = this.parseFormattedNumber(formattedValue);
    
    // Update the visual display
    input.value = formattedValue;
    
    // Update the form control with clean value
    this.calculatorForm.patchValue({ price: cleanValue });
  }

  // Get formatted display value for salary
  getFormattedSalary(): string {
    const salary = this.calculatorForm.get('salary')?.value;
    return salary ? this.formatNumberWithSpaces(salary.toString()) : '';
  }

  // Get formatted display value for price
  getFormattedPrice(): string {
    const price = this.calculatorForm.get('price')?.value;
    return price ? this.formatNumberWithSpaces(price.toString()) : '';
  }

  calculate(): void {
    if (this.calculatorForm.invalid) {
      this.markFormGroupTouched(this.calculatorForm);
      return;
    }

    this.isCalculating.set(true);
    this.advice.set('Calculating...');

    const formValues = this.calculatorForm.value;
    const salary = Number(formValues.salary);
    const price = Number(formValues.price);

    setTimeout(() => {
      const totalAge=40;
      const fee = salary * 0.3;
      const months=price*1.045 /fee;
      const years=Math.floor(months/12);
      const remainingMonths = Math.floor(months) - years * 12;

      let status: 'error' | 'warning' | 'success';
      let message: string;

      if (years > 80) {
        status = 'error';
        message = `According to your conditions, I don't think that purchase it shall be possible, mate. Maybe in ${years} years and ${remainingMonths} months.`;
      } else if (years > 50) {
        status = 'warning';
        message = `According to your conditions, I think you could hardly buy that property. Maybe in ${years} years and ${remainingMonths} months.`;
      } else if (years > 30) {
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
    
    switch (currentResult.status) {
      case 'error':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'success':
        return 'bg-green-100 text-green-800 border border-green-200';
      default:
        return '';
    }
  }
}

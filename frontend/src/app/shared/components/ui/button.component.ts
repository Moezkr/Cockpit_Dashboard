import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      (click)="onClick.emit($event)"
      [ngClass]="getClasses()"
    >
      <ng-content></ng-content>
    </button>
  `
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'secondary';
  @Input() size: 'xs' | 'sm' | 'md' = 'sm';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled: boolean = false;
  @Input() customClass: string = '';
  @Output() onClick = new EventEmitter<MouseEvent>();
  getClasses(): string {
    const base =
      'inline-flex items-center justify-center font-medium transition-colors rounded-md border focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none gap-1.5';
    const variants = {
      primary: 'bg-brand text-white border-transparent hover:bg-brand-strong shadow-sm',
      secondary:
        'bg-white text-ink-soft border-line-strong hover:bg-surface-sunken hover:text-ink shadow-sm',
      ghost: 'bg-transparent text-ink-soft border-transparent hover:bg-surface-sunken hover:text-ink',
      danger: 'bg-negative text-white border-transparent hover:opacity-90 shadow-sm'
    };
    const sizes = {
      xs: 'h-6 px-2 text-2xs',
      sm: 'h-7 px-2.5 text-xs',
      md: 'h-8 px-3 text-xs'
    };
    return `${base} ${variants[this.variant]} ${sizes[this.size]} ${this.customClass}`;
  }
}

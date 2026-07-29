import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [ngClass]="getClasses()">
      <ng-content></ng-content>
    </span>
  `
})
export class BadgeComponent {
  @Input() tone: 'neutral' | 'brand' | 'positive' | 'caution' | 'negative' = 'neutral';

  getClasses(): string {
    const base =
      'inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold';
    const tones = {
      neutral: 'bg-surface-sunken text-ink-soft',
      brand: 'bg-brand-soft text-brand-strong',
      positive: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      caution: 'bg-amber-50 text-amber-700 border border-amber-200',
      negative: 'bg-rose-50 text-rose-700 border border-rose-200'
    };
    return `${base} ${tones[this.tone]}`;
  }
}

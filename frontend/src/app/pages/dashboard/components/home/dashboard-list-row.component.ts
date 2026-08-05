import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dashboard } from '@core/models/types';
import { relativeDate } from '@core/services/utils';
import { BadgeComponent } from '@shared/components/ui/badge.component';
@Component({
  selector: 'app-dashboard-list-row',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  template: `
    <div
      (click)="onOpen.emit()"
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 border-b border-line px-3 sm:px-4 py-2.5 hover:bg-surface-sunken/60 transition-colors"
    >
      <div class="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
        <span class="h-3 w-1 rounded mt-0.5 sm:mt-0 flex-shrink-0" [style.backgroundColor]="dashboard.color"></span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="font-semibold text-xs text-ink truncate">{{ dashboard.name }}</span>
            <app-badge *ngIf="dashboard.status === 'draft'" tone="caution">Brouillon</app-badge>
          </div>
          <p class="text-2xs text-ink-faint truncate mt-0.5">{{ dashboard.description || 'Aucune description' }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3 text-2xs text-ink-faint flex-shrink-0 pl-3.5 sm:pl-0">
        <span>{{ dashboard.widgets.length }} widgets</span>
        <span>{{ getRelDate(dashboard.updatedAt) }}</span>
      </div>
    </div>
  `
})
export class DashboardListRowComponent {
  @Input() dashboard!: Dashboard;
  @Output() onOpen = new EventEmitter<void>();
  getRelDate(iso: string): string {
    return relativeDate(iso);
  }
}

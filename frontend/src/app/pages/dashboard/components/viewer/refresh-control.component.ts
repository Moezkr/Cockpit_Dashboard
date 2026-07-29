import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RefreshInterval } from '@core/models/types';
import { refreshLabel } from '@core/services/utils';

@Component({
  selector: 'app-refresh-control',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-1.5">

      <!-- Auto-refresh countdown badge: only shown when interval is active -->
      <div
        *ngIf="interval !== 'off'"
        class="flex items-center gap-1.5 rounded-md border border-line bg-white px-2 py-1 text-2xs text-ink-soft shadow-xs"
      >
        <span
          class="h-1.5 w-1.5 rounded-full animate-pulse"
          [class.bg-emerald-500]="!paused"
          [class.bg-ink-faint]="paused"
        ></span>
        <span class="font-medium tabular-nums">
          {{ paused ? 'En pause' : countdown + 's' }}
        </span>
        <span class="text-ink-faint">({{ getLabel(interval) }})</span>

        <button
          (click)="onTogglePause.emit()"
          [title]="paused ? 'Reprendre' : 'Mettre en pause'"
          class="ml-1 rounded p-0.5 text-ink-faint hover:text-ink transition-colors"
        >
          {{ paused ? '▶' : '❚❚' }}
        </button>
      </div>

      <!-- Manual refresh button: ALWAYS visible, spins while refreshing -->
      <button
        (click)="triggerRefresh()"
        [disabled]="refreshing"
        title="Rafraîchir maintenant"
        class="flex h-7 items-center gap-1.5 rounded-md border border-line-strong bg-white px-2 text-xs transition-all"
        [class.opacity-50]="refreshing"
        [class.cursor-not-allowed]="refreshing"
        [class.cursor-pointer]="!refreshing"
        [class.text-ink-soft]="!refreshing"
        [class.hover:bg-surface-muted]="!refreshing"
        [class.hover:text-ink]="!refreshing"
        [class.text-brand]="refreshing"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14" height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          [class.animate-spin]="refreshing"
        >
          <path d="M21 2v6h-6"/>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
          <path d="M3 22v-6h6"/>
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
        </svg>
        <span *ngIf="refreshing" class="text-2xs font-medium">Sync...</span>
      </button>

    </div>
  `
})
export class RefreshControlComponent {
  @Input() interval: RefreshInterval = 'off';
  @Input() countdown: number = 0;
  @Input() paused: boolean = false;

  @Output() onTogglePause = new EventEmitter<void>();
  @Output() onRefresh = new EventEmitter<void>();

  refreshing = false;

  triggerRefresh() {
    if (this.refreshing) return;
    this.refreshing = true;
    this.onRefresh.emit();

    setTimeout(() => {
      this.refreshing = false;
    }, 1500);
  }

  getLabel(val: RefreshInterval): string {
    return refreshLabel(val);
  }
}

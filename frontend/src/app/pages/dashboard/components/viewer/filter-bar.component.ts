import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalFilter } from '@core/models/types';
import { isUniversalSelection } from '@pages/dashboard/services/dashboard-filters.service';
@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  host: { class: 'block w-full' },
  template: `
    <div
      *ngIf="filters.length > 0"
      class="flex flex-wrap items-center gap-3 border-b border-line bg-white px-4 py-2 text-xs"
    >
      <span class="font-semibold text-ink">Filtres:</span>
      <div *ngFor="let filter of visibleFilters" class="flex items-center gap-1.5">
        <span class="text-2xs text-ink-faint">{{ filter.label }}</span>
        <!-- Select -->
        <select
          *ngIf="filter.input === 'select'"
          [ngModel]="values[filter.id] || filter.defaultValue"
          (ngModelChange)="onChange.emit({ id: filter.id, value: $event })"
          class="h-7 rounded border border-line-strong bg-white px-2 outline-none focus:border-brand"
        >
          <option value="TOUS">TOUS</option>
          <option *ngFor="let opt of filter.options" [value]="opt">
            {{ opt }}
          </option>
        </select>
        <!-- MultiSelect -->
        <div *ngIf="filter.input === 'multiselect'" class="relative" (click)="$event.stopPropagation()">
          <button (click)="toggleDropdown(filter.id)" class="h-7 rounded border border-line-strong bg-white px-2 text-left flex items-center justify-between min-w-[120px] max-w-[200px] focus:border-brand outline-none">
            <span class="truncate">{{ getMultiSelectLabel(filter) }}</span>
            <svg class="h-3 w-3 text-ink-faint ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div *ngIf="openDropdown === filter.id" class="absolute top-full left-0 mt-1 w-48 rounded-md border border-line bg-white shadow-pop z-50 max-h-64 overflow-y-auto py-1">
             <label *ngFor="let opt of filter.options" class="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-muted cursor-pointer text-xs">
               <input type="checkbox"
                      [checked]="isMultiSelected(filter, opt)"
                      (change)="toggleMultiSelect(filter, opt, $event)"
                      class="rounded border-line-strong text-brand focus:ring-brand focus:ring-offset-0" />
               <span class="truncate">{{ opt }}</span>
             </label>
          </div>
        </div>
        <!-- Date Range -->
        <div *ngIf="filter.input === 'daterange'" class="flex items-center gap-1">
          <input
            type="date"
            [ngModel]="getDateRangeStart(filter)"
            (ngModelChange)="updateDateRange(filter, $event, 'start')"
            class="h-7 rounded border border-line-strong bg-white px-2 outline-none focus:border-brand w-[115px]"
          />
          <span class="text-ink-faint text-[10px]">au</span>
          <input
            type="date"
            [ngModel]="getDateRangeEnd(filter)"
            (ngModelChange)="updateDateRange(filter, $event, 'end')"
            class="h-7 rounded border border-line-strong bg-white px-2 outline-none focus:border-brand w-[115px]"
          />
        </div>
        <!-- Date -->
        <input
          *ngIf="filter.input === 'date'"
          type="date"
          [ngModel]="values[filter.id] || filter.defaultValue"
          (ngModelChange)="onChange.emit({ id: filter.id, value: $event })"
          class="h-7 rounded border border-line-strong bg-white px-2 outline-none focus:border-brand"
        />
        <!-- Text -->
        <input
          *ngIf="filter.input === 'text'"
          type="text"
          [ngModel]="values[filter.id] || filter.defaultValue"
          (ngModelChange)="onChange.emit({ id: filter.id, value: $event })"
          class="h-7 rounded border border-line-strong bg-white px-2 outline-none focus:border-brand"
        />
      </div>
      <button
        (click)="onReset.emit()"
        class="ml-auto text-2xs font-medium text-brand hover:underline"
      >
        Réinitialiser
      </button>
    </div>
  `
})
export class FilterBarComponent {
  @Input() filters: GlobalFilter[] = [];
  @Input() values: Record<string, string> = {};
  @Output() onChange = new EventEmitter<{ id: string; value: string }>();
  @Output() onReset = new EventEmitter<void>();
  get visibleFilters(): GlobalFilter[] {
    return this.filters.filter((f) => f.readerVisible);
  }
  get hasActiveFilters(): boolean {
    return this.filters.some((f) => {
      const val = (this.values[f.id] ?? f.defaultValue).trim();
      return val && !isUniversalSelection(val);
    });
  }
  openDropdown: string | null = null;
  toggleDropdown(id: string) {
    this.openDropdown = this.openDropdown === id ? null : id;
  }
  isMultiSelected(filter: GlobalFilter, opt: string): boolean {
    const val = this.values[filter.id] ?? filter.defaultValue;
    if (isUniversalSelection(val) || !val) return false;
    return val.split(',').map(s => s.trim()).includes(opt);
  }
  toggleMultiSelect(filter: GlobalFilter, opt: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const val = this.values[filter.id] ?? filter.defaultValue;
    let selected = isUniversalSelection(val) || !val ? [] : val.split(',').map(s => s.trim());
    if (checked) {
      if (!selected.includes(opt)) selected.push(opt);
    } else {
      selected = selected.filter(s => s !== opt);
    }
    this.onChange.emit({ id: filter.id, value: selected.length ? selected.join(',') : 'TOUS' });
  }
  getMultiSelectLabel(filter: GlobalFilter): string {
    const val = this.values[filter.id] ?? filter.defaultValue;
    if (isUniversalSelection(val) || !val) return 'TOUS';
    const selected = val.split(',').map(s => s.trim());
    if (selected.length === 1) return selected[0];
    return selected.length + ' selectionnes';
  }
  getDateRangeStart(filter: GlobalFilter): string {
    const val = this.values[filter.id] ?? filter.defaultValue ?? '';
    if (isUniversalSelection(val) || !val) return '';
    return val.split(',')[0]?.trim() || '';
  }
  getDateRangeEnd(filter: GlobalFilter): string {
    const val = this.values[filter.id] ?? filter.defaultValue ?? '';
    if (isUniversalSelection(val) || !val) return '';
    return val.split(',')[1]?.trim() || '';
  }
  updateDateRange(filter: GlobalFilter, date: string, type: 'start' | 'end') {
    const currentStart = this.getDateRangeStart(filter);
    const currentEnd = this.getDateRangeEnd(filter);
    let newStart = currentStart;
    let newEnd = currentEnd;
    if (type === 'start') newStart = date;
    if (type === 'end') newEnd = date;
    if (!newStart && !newEnd) {
      this.onChange.emit({ id: filter.id, value: 'TOUS' });
    } else {
      this.onChange.emit({ id: filter.id, value: newStart + ',' + newEnd });
    }
  }
}

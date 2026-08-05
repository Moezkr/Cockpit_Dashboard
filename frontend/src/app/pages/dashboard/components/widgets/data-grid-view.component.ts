import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataGridConfig } from '@core/models/types';
import {
  resolveDataGridConfig,
  dataGridVisibleColumns,
  formatDataGridValue,
  compareDataGridValues,
  isNumericDataGridColumn
} from '@pages/dashboard/services/datagrid.service';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
@Component({
  selector: 'app-data-grid-view',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgIconComponent],
  template: `
    <div class="flex h-full w-full flex-col overflow-hidden text-xs">
      <div
        *ngIf="cfg.showToolbar"
        class="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-muted px-2 py-1.5"
      >
        <div *ngIf="cfg.showSearch" class="relative flex items-center w-52 max-w-full">
          <div class="pointer-events-none absolute left-2.5 flex items-center justify-center text-ink-faint">
            <app-svg-icon name="Search" class="h-3.5 w-3.5"></app-svg-icon>
          </div>
          <input
            [(ngModel)]="search"
            (ngModelChange)="onSearchChange()"
            placeholder="Rechercher..."
            class="h-7 w-full rounded border border-line-strong bg-white pr-6 text-xs outline-none focus:border-brand"
            style="padding-left: 2.25rem !important;"
          />
          <button
            *ngIf="search"
            (click)="search = ''; onSearchChange()"
            class="absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink text-xs"
          >
            ✕
          </button>
        </div>
        <div class="ml-auto flex items-center gap-1">
          <span class="text-2xs text-ink-faint">{{ filteredRows.length }} enregistrements</span>
          <button
            *ngIf="search || sortColumn"
            (click)="resetFilters()"
            class="ml-1 rounded px-1.5 py-0.5 text-2xs font-medium text-brand hover:bg-brand-soft"
          >
            Réinitialiser
          </button>
        </div>
      </div>
      <div class="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
        <table class="min-w-full border-collapse text-left">
          <thead class="sticky top-0 z-10 border-b border-line bg-surface-muted text-2xs font-semibold text-ink-soft">
            <tr>
              <th
                *ngFor="let col of visibleCols; let i = index"
                (click)="sort(col)"
                class="px-3 py-2 select-none whitespace-nowrap min-w-[110px]"
                [ngClass]="[
                  cfg.sortable ? 'cursor-pointer hover:bg-surface-sunken' : '',
                  getColumnAlign(col, i)
                ]"
              >
                <div class="inline-flex items-center gap-1 w-full" [ngClass]="getColumnAlign(col, i) === 'text-right' ? 'justify-end' : 'justify-start'">
                  <span class="truncate">{{ col }}</span>
                  <span *ngIf="sortColumn === col" class="text-brand flex-shrink-0">
                    {{ sortDirection === 'asc' ? '↑' : '↓' }}
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line bg-white">
            <tr
              *ngFor="let row of pageRows"
              class="hover:bg-surface-sunken/60 transition-colors"
            >
              <td
                *ngFor="let col of visibleCols; let i = index"
                class="px-3 whitespace-nowrap min-w-[110px]"
                [ngClass]="[
                  densityPaddingClass,
                  getColumnAlign(col, i),
                  isNumeric(col) ? 'tabular-nums' : ''
                ]"
              >
                {{ formatValue(row[col], col) }}
              </td>
            </tr>
            <tr *ngIf="pageRows.length === 0">
              <td [attr.colspan]="visibleCols.length" class="px-3 py-6 text-center text-ink-faint">
                Aucune donnée disponible.
              </td>
            </tr>
          </tbody>
          <tfoot *ngIf="cfg.showTotals && filteredRows.length > 0" class="border-t-2 border-line bg-surface-muted font-semibold text-ink">
            <tr>
              <td
                *ngFor="let col of visibleCols; let first = first"
                class="px-3 py-2"
                [ngClass]="isNumeric(col) ? 'text-right tabular-nums' : 'text-left'"
              >
                <ng-container *ngIf="first">Total</ng-container>
                <ng-container *ngIf="!first && isNumeric(col)">
                  {{ formatValue(getColumnTotal(col), col) }}
                </ng-container>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div
        *ngIf="cfg.showPagination && totalPages > 1"
        class="flex flex-shrink-0 items-center justify-between border-t border-line bg-white px-2 py-1 text-2xs text-ink-faint"
      >
        <span>
          Page {{ currentPage }} / {{ totalPages }}
        </span>
        <div class="flex items-center gap-1">
          <button
            [disabled]="currentPage <= 1"
            (click)="currentPage = currentPage - 1; updatePageRows()"
            class="rounded px-1.5 py-0.5 border border-line bg-white hover:bg-surface-muted disabled:opacity-40"
          >
            ‹
          </button>
          <button
            [disabled]="currentPage >= totalPages"
            (click)="currentPage = currentPage + 1; updatePageRows()"
            class="rounded px-1.5 py-0.5 border border-line bg-white hover:bg-surface-muted disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  `
})
export class DataGridViewComponent implements OnChanges {
  @Input() rows: Array<Record<string, unknown>> = [];
  @Input() config?: DataGridConfig;
  cfg: Required<DataGridConfig> = resolveDataGridConfig();
  visibleCols: string[] = [];
  search: string = '';
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage: number = 1;
  filteredRows: Array<Record<string, unknown>> = [];
  pageRows: Array<Record<string, unknown>> = [];
  ngOnChanges(changes: SimpleChanges): void {
    this.cfg = resolveDataGridConfig(this.config);
    this.visibleCols = dataGridVisibleColumns(this.rows, this.config);
    this.applyFiltersAndSort();
  }
  get densityPaddingClass(): string {
    if (this.cfg.density === 'compact') return 'py-1';
    if (this.cfg.density === 'comfortable') return 'py-2.5';
    return 'py-1.5';
  }
  isNumeric(col: string): boolean {
    return isNumericDataGridColumn(this.rows, col);
  }
  getColumnAlign(col: string, index: number): 'text-left' | 'text-right' {
    if (index === 0) return 'text-left';
    if (index === this.visibleCols.length - 1) return 'text-right';
    return this.isNumeric(col) ? 'text-right' : 'text-left';
  }
  formatValue(val: unknown, col: string): string {
    return formatDataGridValue(val, col);
  }
  sort(col: string) {
    if (!this.cfg.sortable) return;
    if (this.sortColumn === col) {
      if (this.sortDirection === 'asc') this.sortDirection = 'desc';
      else {
        this.sortColumn = null;
        this.sortDirection = 'asc';
      }
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSort();
  }
  onSearchChange() {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }
  resetFilters() {
    this.search = '';
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }
  applyFiltersAndSort() {
    let list = [...this.rows];
    if (this.search.trim()) {
      const q = this.search.toLowerCase();
      list = list.filter((row) =>
        Object.values(row).some((val) =>
          String(val ?? '').toLowerCase().includes(q)
        )
      );
    }
    if (this.sortColumn) {
      const col = this.sortColumn;
      const dir = this.sortDirection === 'asc' ? 1 : -1;
      list.sort((a, b) => compareDataGridValues(a[col], b[col]) * dir);
    }
    this.filteredRows = list;
    this.updatePageRows();
  }
  get totalPages(): number {
    const pageSize = this.cfg.rowsPerPage || 10;
    return Math.max(1, Math.ceil(this.filteredRows.length / pageSize));
  }
  updatePageRows() {
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    const pageSize = this.cfg.rowsPerPage || 10;
    const start = (this.currentPage - 1) * pageSize;
    this.pageRows = this.filteredRows.slice(start, start + pageSize);
  }
  getColumnTotal(col: string): number {
    return this.filteredRows.reduce((sum, row) => {
      const val = Number(row[col]);
      return sum + (Number.isNaN(val) ? 0 : val);
    }, 0);
  }
}

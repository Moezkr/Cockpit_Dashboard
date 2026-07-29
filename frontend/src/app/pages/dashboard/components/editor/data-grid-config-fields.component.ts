import { DashboardService } from '@pages/dashboard/services/dashboard.service';
import { QueryService } from '@pages/query/services/query.service';
import { AuditService, AuditLogEntry } from '@pages/settings/services/audit.service';
import { UserService, UserProfile } from '@core/services/user.service';
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataGridConfig, Widget, DataQuery } from '@core/models/types';
import { executeDisplayRows } from '@pages/query/services/query-execution.service';
import { DATA_SOURCES } from '@core/models/types';
import { queryFieldCatalog } from '@pages/query/services/query-model.service';
import { dataGridAvailableColumns, resolveDataGridConfig } from '@pages/dashboard/services/datagrid.service';

@Component({
  selector: 'app-data-grid-config-fields',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="space-y-3 rounded-md border border-line p-2.5 bg-white">
      <div class="flex items-start gap-2">
        <span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-brand-soft text-brand-strong font-bold">
          ⊞
        </span>
        <div>
          <p class="text-xs font-semibold text-ink">Tableau de données</p>
          <p class="text-2xs text-ink-faint">Colonnes et interaction lecteur.</p>
        </div>
      </div>

      <div class="space-y-1 block">
        <label class="text-2xs font-medium uppercase tracking-wide text-ink-faint block">
          COLONNES AFFICHÉES ET ORDRE
        </label>
        <div class="space-y-1">
          <div
            *ngFor="let col of selectedColumns; let idx = index"
            class="flex items-center gap-1 rounded border border-line bg-white px-1.5 py-1"
          >
            <input
              type="checkbox"
              checked
              [disabled]="selectedColumns.length === 1"
              (change)="toggleColumn(col)"
              class="rounded border-line-strong text-brand focus:ring-brand"
            />
            <span class="min-w-0 flex-1 truncate text-2xs text-ink">
              {{ getColumnLabel(col) }}
            </span>
            <button
              type="button"
              (click)="move(idx, -1)"
              [disabled]="idx === 0"
              class="rounded p-0.5 text-ink-faint hover:bg-surface-muted hover:text-ink disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              (click)="move(idx, 1)"
              [disabled]="idx === selectedColumns.length - 1"
              class="rounded p-0.5 text-ink-faint hover:bg-surface-muted hover:text-ink disabled:opacity-30"
            >
              ↓
            </button>
          </div>

          <label
            *ngFor="let col of unselectedColumns"
            class="flex cursor-pointer items-center gap-2 rounded border border-dashed border-line px-1.5 py-1 text-2xs text-ink-faint hover:bg-surface-muted"
          >
            <input
              type="checkbox"
              [checked]="false"
              (change)="toggleColumn(col)"
              class="rounded border-line-strong text-brand"
            />
            <span class="truncate">{{ getColumnLabel(col) }}</span>
          </label>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="text-2xs font-medium uppercase tracking-wide text-ink-faint block mb-1">
            LIGNES/PAGE
          </label>
          <select
            [ngModel]="cfg.rowsPerPage"
            (ngModelChange)="update({ rowsPerPage: +$event })"
            class="h-7 w-full rounded border border-line-strong bg-white px-2 text-xs outline-none focus:border-brand"
          >
            <option [value]="5">5</option>
            <option [value]="10">10</option>
            <option [value]="20">20</option>
            <option [value]="50">50</option>
          </select>
        </div>

        <div>
          <label class="text-2xs font-medium uppercase tracking-wide text-ink-faint block mb-1">
            DENSITÉ
          </label>
          <select
            [ngModel]="cfg.density"
            (ngModelChange)="update({ density: $event })"
            class="h-7 w-full rounded border border-line-strong bg-white px-2 text-xs outline-none focus:border-brand"
          >
            <option value="compact">Compacte</option>
            <option value="normal">Normale</option>
            <option value="comfortable">Aérée</option>
          </select>
        </div>
      </div>

      <fieldset class="space-y-1.5 border-t border-line pt-2">
        <legend class="text-2xs font-semibold uppercase tracking-wide text-ink-faint">
          FONCTIONNALITÉS
        </legend>
        <label class="flex items-center justify-between text-2xs text-ink-soft cursor-pointer">
          <span>Barre d'outils</span>
          <input
            type="checkbox"
            [ngModel]="cfg.showToolbar"
            (ngModelChange)="update({ showToolbar: $event })"
            class="rounded border-line-strong text-brand"
          />
        </label>
        <label
          class="flex items-center justify-between text-2xs text-ink-soft cursor-pointer"
          [ngClass]="{ 'opacity-45': !cfg.showToolbar }"
        >
          <span>Recherche globale</span>
          <input
            type="checkbox"
            [disabled]="!cfg.showToolbar"
            [ngModel]="cfg.showSearch"
            (ngModelChange)="update({ showSearch: $event })"
            class="rounded border-line-strong text-brand"
          />
        </label>
        <label class="flex items-center justify-between text-2xs text-ink-soft cursor-pointer">
          <span>Pagination</span>
          <input
            type="checkbox"
            [ngModel]="cfg.showPagination"
            (ngModelChange)="update({ showPagination: $event })"
            class="rounded border-line-strong text-brand"
          />
        </label>
        <label class="flex items-center justify-between text-2xs text-ink-soft cursor-pointer">
          <span>Totaux en pied de tableau</span>
          <input
            type="checkbox"
            [ngModel]="cfg.showTotals"
            (ngModelChange)="update({ showTotals: $event })"
            class="rounded border-line-strong text-brand"
          />
        </label>
        <label class="flex items-center justify-between text-2xs text-ink-soft cursor-pointer">
          <span>Tri des colonnes</span>
          <input
            type="checkbox"
            [ngModel]="cfg.sortable"
            (ngModelChange)="update({ sortable: $event })"
            class="rounded border-line-strong text-brand"
          />
        </label>
        <label class="flex items-center justify-between text-2xs text-ink-soft cursor-pointer">
          <span>Filtres par colonne</span>
          <input
            type="checkbox"
            [ngModel]="cfg.filterable"
            (ngModelChange)="update({ filterable: $event })"
            class="rounded border-line-strong text-brand"
          />
        </label>
      </fieldset>
    </section>
  `
})
export class DataGridConfigFieldsComponent implements OnChanges {
  @Input() widget!: Widget;
  @Output() onChange = new EventEmitter<DataGridConfig>();

  cfg: Required<DataGridConfig> = resolveDataGridConfig();
  availableCols: string[] = [];

  constructor(private dashboardService: DashboardService, private queryService: QueryService, private auditService: AuditService, private userService: UserService) {}

  ngOnChanges(): void {
    if (!this.widget) return;
    this.cfg = resolveDataGridConfig(this.widget.datagrid);

    if (this.widget.queryId) {
      const query = this.queryService.queries.find((q) => q.id === this.widget.queryId);
      if (query) {
        const rows = executeDisplayRows(query);
        this.availableCols = dataGridAvailableColumns(rows);
      }
    }
  }

  getColumnLabel(col: string): string {
    if (!this.widget?.queryId) return col;
    const query = this.queryService.queries.find((q) => q.id === this.widget.queryId);
    if (!query) return col;
    const catalog = queryFieldCatalog(query, DATA_SOURCES);
    const field = catalog.find((f) => f.id === col);
    if (field) return `${field.sourceLabel} · ${field.label}`;
    return col;
  }

  get selectedColumns(): string[] {
    const rawVisible = this.cfg.visibleColumns;
    if (!rawVisible || !rawVisible.length) return this.availableCols;
    const normalized = rawVisible.map((c) => this.getColumnLabel(c));
    const valid = normalized.filter((c) => this.availableCols.includes(c));
    return valid;
  }

  get unselectedColumns(): string[] {
    return this.availableCols.filter((c) => !this.selectedColumns.includes(c));
  }

  toggleColumn(col: string) {
    const isVisible = this.selectedColumns.includes(col);
    if (isVisible && this.selectedColumns.length === 1) return;

    const next = isVisible
      ? this.selectedColumns.filter((item) => item !== col)
      : [...this.selectedColumns, col];

    this.update({ visibleColumns: next });
  }

  move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= this.selectedColumns.length) return;
    const next = [...this.selectedColumns];
    [next[index], next[target]] = [next[target], next[index]];
    this.update({ visibleColumns: next });
  }

  update(partial: Partial<DataGridConfig>) {
    this.cfg = { ...this.cfg, ...partial };
    this.onChange.emit(this.cfg);
  }
}

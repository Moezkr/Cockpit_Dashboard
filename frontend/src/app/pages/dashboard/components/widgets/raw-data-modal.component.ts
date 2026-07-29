import { DashboardService } from '@pages/dashboard/services/dashboard.service';
import { QueryService } from '@pages/query/services/query.service';
import { AuditService, AuditLogEntry } from '@pages/settings/services/audit.service';
import { UserService, UserProfile } from '@core/services/user.service';
﻿import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Widget, Dashboard } from '@core/models/types';
import { executeDisplayRows } from '@pages/query/services/query-execution.service';
import { RuntimeQueryFilter, ActiveDashboardFilter, mergeRuntimeFilters, resolveWidgetRuntimeFilters } from '@pages/dashboard/services/dashboard-filters.service';
import { ModalComponent } from '@shared/components/ui/modal.component';
import { ButtonComponent } from '@shared/components/ui/button.component';
import { DataGridViewComponent } from '@pages/dashboard/components/widgets/data-grid-view.component';

@Component({
  selector: 'app-raw-data-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent, DataGridViewComponent],
  template: `
    <app-modal
      [open]="open"
      (onClose)="onClose.emit()"
      [title]="'Données brutes — ' + (widget?.title || '')"
      width="max-w-4xl"
    >
      <div class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-muted p-2 text-2xs text-ink-soft">
          <div>
            <span class="font-semibold">Requête source:</span> {{ queryName }}
          </div>
          <div>
            <span class="font-semibold">{{ rows.length }}</span> enregistrements exécutés
          </div>
        </div>

        <div *ngIf="activeFilters.length > 0" class="flex flex-wrap items-center gap-1.5 text-2xs">
          <span class="font-medium text-ink-faint">Filtres actifs:</span>
          <span
            *ngFor="let filter of activeFilters"
            class="inline-flex items-center gap-1 rounded bg-brand-soft px-1.5 py-0.5 font-medium text-brand-strong"
          >
            {{ filter.label }}: {{ filter.value }}
          </span>
        </div>

        <div class="h-[50vh] rounded-md border border-line bg-white">
          <app-data-grid-view [rows]="rows"></app-data-grid-view>
        </div>

        <div class="flex justify-end gap-2 border-t border-line pt-2">
          <app-button variant="secondary" size="sm" (onClick)="exportCsv()">
            Exporter CSV
          </app-button>
          <app-button variant="primary" size="sm" (onClick)="onClose.emit()">
            Fermer
          </app-button>
        </div>
      </div>
    </app-modal>
  `
})
export class RawDataModalComponent implements OnChanges {
  @Input() widget: Widget | null = null;
  @Input() dashboard: Dashboard | null = null;
  @Input() open: boolean = false;
  @Input() runtimeFilters: RuntimeQueryFilter[] = [];
  @Input() activeFilters: ActiveDashboardFilter[] = [];

  @Output() onClose = new EventEmitter<void>();

  rows: Array<Record<string, unknown>> = [];
  queryName: string = 'Requête inconnue';

  constructor(private dashboardService: DashboardService, private queryService: QueryService, private auditService: AuditService, private userService: UserService) {}

  ngOnChanges(): void {
    if (!this.widget || !this.widget.queryId) {
      this.rows = [];
      this.queryName = 'Aucune requête liée';
      return;
    }

    const query = this.queryService.queries.find((q) => q.id === this.widget?.queryId);
    if (!query) {
      this.rows = [];
      this.queryName = 'Requête non trouvée';
      return;
    }

    this.queryName = query.name;
    const widgetRuntimeFilters = this.widget.filters
      ? resolveWidgetRuntimeFilters(this.widget.filters)
      : [];
    const effectiveFilters = mergeRuntimeFilters(
      this.runtimeFilters ?? [],
      widgetRuntimeFilters
    );
    this.rows = executeDisplayRows(query, effectiveFilters);
  }

  exportCsv() {
    if (!this.rows.length) return;
    const keys = Object.keys(this.rows[0]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        keys.join(','),
        ...this.rows.map((r) => keys.map((k) => `"${r[k] ?? ''}"`).join(','))
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${this.widget?.title || 'export'}-donnees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

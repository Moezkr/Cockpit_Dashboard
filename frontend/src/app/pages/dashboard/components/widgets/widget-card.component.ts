import { DashboardService } from '@pages/dashboard/services/dashboard.service';
import { QueryService } from '@pages/query/services/query.service';
import { AuditService, AuditLogEntry } from '@pages/settings/services/audit.service';
import { UserService, UserProfile } from '@core/services/user.service';
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Widget, Dashboard } from '@core/models/types';
import {
  RuntimeQueryFilter,
  mergeRuntimeFilters,
  resolveWidgetRuntimeFilters
} from '@pages/dashboard/services/dashboard-filters.service';
import { executeDisplayRows } from '@pages/query/services/query-execution.service';
import { refreshToMs } from '@core/services/utils';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
import { WidgetContentComponent } from '@pages/dashboard/components/widgets/widget-content.component';

@Component({
  selector: 'app-widget-card',
  standalone: true,
  imports: [CommonModule, SvgIconComponent, WidgetContentComponent],
  template: `
    <div class="group relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-line bg-white shadow-card transition-all hover:shadow-pop">
      <div
        *ngIf="widget.showTitle"
        class="flex flex-shrink-0 items-center justify-between gap-1 border-b border-line px-2.5 py-1.5"
      >
        <div class="flex min-w-0 items-center gap-1.5">
          <h4 class="truncate text-xs font-bold text-ink">
            {{ widget.title }}
          </h4>
        </div>

        <div
          *ngIf="widget.type !== 'text'"
          class="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
          (click)="$event.stopPropagation()"
        >
          <button
            type="button"
            (click)="onViewData.emit(widget)"
            title="Voir les données brutes"
            class="rounded p-1 text-ink-faint hover:bg-surface-muted hover:text-ink"
          >
            <app-svg-icon name="Table" class="h-3.5 w-3.5"></app-svg-icon>
          </button>

          <button
            type="button"
            (click)="exportCsv(widget); $event.stopPropagation()"
            title="Exporter CSV"
            class="rounded p-1 text-ink-faint hover:bg-surface-muted hover:text-ink"
          >
            <app-svg-icon name="Download" class="h-3.5 w-3.5"></app-svg-icon>
          </button>

          <button
            type="button"
            (click)="onMaximize.emit(widget)"
            title="Agrandir"
            class="rounded p-1 text-ink-faint hover:bg-surface-muted hover:text-ink"
          >
            <app-svg-icon name="Maximize" class="h-3.5 w-3.5"></app-svg-icon>
          </button>
        </div>
      </div>

      <div
        class="min-h-0 flex-1 relative"
        [ngClass]="widget.type === 'kpi' ? 'p-1' : 'p-2'"
      >
        <div *ngIf="hasError" class="flex h-full flex-col items-center justify-center p-2 text-center">
          <span class="text-xs font-medium text-negative">Erreur de chargement</span>
          <span class="text-2xs text-ink-faint">Impossible de récupérer les données du widget.</span>
        </div>

        <app-widget-content
          *ngIf="!hasError"
          [widget]="widget"
          [dashboard]="dashboard"
          [refreshTick]="effectiveRefreshTick"
          [runtimeFilters]="effectiveRuntimeFilters"
        ></app-widget-content>
      </div>

      <div
        *ngIf="widget.queryId && widget.showTitle"
        class="flex flex-shrink-0 items-center justify-between border-t border-line px-2.5 py-1 text-2xs text-ink-faint"
      >
        <span class="truncate">{{ widget.title }}</span>
        <span class="ml-2 flex-shrink-0">1 source</span>
      </div>
    </div>
  `
})
export class WidgetCardComponent implements OnInit, OnChanges, OnDestroy {
  @Input() widget!: Widget;
  @Input() dashboard?: Dashboard;
  @Input() compact: boolean = false;
  @Input() refreshTick: number = 0;
  @Input() hasError: boolean = false;
  @Input() runtimeFilters: RuntimeQueryFilter[] = [];

  @Output() onViewData = new EventEmitter<Widget>();
  @Output() onMaximize = new EventEmitter<Widget>();

  widgetLocalTick: number = 0;
  private widgetTimer: any = null;

  constructor(private dashboardService: DashboardService, private queryService: QueryService, private auditService: AuditService, private userService: UserService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.setupWidgetTimer();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['widget']) {
      this.setupWidgetTimer();
    }
  }

  ngOnDestroy(): void {
    if (this.widgetTimer) clearInterval(this.widgetTimer);
  }

  setupWidgetTimer(): void {
    if (this.widgetTimer) {
      clearInterval(this.widgetTimer);
      this.widgetTimer = null;
    }

    const interval = this.widget?.refreshInterval;
    if (!interval || interval === 'inherit' || interval === 'off') {
      return;
    }

    const ms = refreshToMs(interval);
    if (ms > 0) {
      this.widgetTimer = setInterval(() => {
        this.widgetLocalTick++;
        try {
          this.cdr.detectChanges();
        } catch {}
      }, ms);
    }
  }

  get effectiveRefreshTick(): number {
    return this.refreshTick + this.widgetLocalTick;
  }

  private cachedEffectiveFilters: RuntimeQueryFilter[] = [];
  private lastFiltersKeyStr: string = '';

  get effectiveRuntimeFilters(): RuntimeQueryFilter[] {
    const key = JSON.stringify({
      rf: this.runtimeFilters ?? [],
      wf: this.widget?.filters ?? []
    });
    if (key !== this.lastFiltersKeyStr) {
      this.lastFiltersKeyStr = key;
      const widgetRuntimeFilters = this.widget?.filters
        ? resolveWidgetRuntimeFilters(this.widget.filters)
        : [];
      this.cachedEffectiveFilters = mergeRuntimeFilters(this.runtimeFilters ?? [], widgetRuntimeFilters);
    }
    return this.cachedEffectiveFilters;
  }

  exportCsv(widget: Widget) {
    if (!widget || !widget.queryId) return;
    const query = this.queryService.queries.find((q) => q.id === widget.queryId);
    if (!query) return;

    const rows = executeDisplayRows(query, this.effectiveRuntimeFilters);
    if (!rows.length) return;

    const keys = Object.keys(rows[0]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        keys.join(','),
        ...rows.map((r: any) => keys.map((k) => `"${r[k] ?? ''}"`).join(','))
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${widget.title || 'export'}-donnees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

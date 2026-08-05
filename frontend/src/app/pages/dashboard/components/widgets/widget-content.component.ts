import { DashboardService } from '@pages/dashboard/services/dashboard.service';
import { QueryService } from '@pages/query/services/query.service';
import { AuditService, AuditLogEntry } from '@pages/settings/services/audit.service';
import { UserService, UserProfile } from '@core/services/user.service';
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dashboard, Datum, Widget } from '@core/models/types';
import {
  executeDisplayRowsLocal,
  executeWidgetRowsLocal
} from '@pages/query/services/query-execution.service';
import { queryFieldCatalog } from '@pages/query/services/query-model.service';
import { RuntimeQueryFilter } from '@pages/dashboard/services/dashboard-filters.service';
import { DataGridViewComponent } from '@pages/dashboard/components/widgets/data-grid-view.component';
@Component({
  selector: 'app-widget-content',
  standalone: true,
  imports: [CommonModule, DataGridViewComponent],
  templateUrl: './widget-content.component.html'
})
export class WidgetContentComponent implements OnChanges {
  @Input() widget!: Widget;
  @Input() dashboard?: Dashboard;
  @Input() refreshTick: number = 0;
  @Input() hasError: boolean = false;
  @Input() runtimeFilters: RuntimeQueryFilter[] = [];
  dataRows: Datum[] = [];
  gridDisplayRows: Datum[] = [];
  colors = [
    '#2563eb',
    '#059669',
    '#d97706',
    '#7c3aed',
    '#db2777',
    '#0891b2',
    '#4f46e5',
    '#ea580c'
  ];
  hoveredIndex: number | null = null;
  hoveredItem: Datum | null = null;
  hoverType: 'bar' | 'line' | 'donut' | 'heatmap' | null = null;
  constructor(
    private dashboardService: DashboardService,
    private queryService: QueryService,
    private auditService: AuditService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}
  private lastLoadKey: string = '';
  ngOnChanges(changes: SimpleChanges): void {
    const queryId = this.widget?.queryId || '';
    const filtersStr = JSON.stringify(this.runtimeFilters || []);
    const widgetFiltersStr = JSON.stringify(this.widget?.filters || []);
    const refreshKey = `${queryId}_${this.refreshTick}_${this.hasError}_${filtersStr}_${widgetFiltersStr}`;
    if (this.lastLoadKey !== refreshKey) {
      this.lastLoadKey = refreshKey;
      this.loadData();
    }
  }
  isLoading = false;
  loadData(): void {
    if (!this.widget?.queryId) {
      this.dataRows = [];
      this.gridDisplayRows = [];
      return;
    }
    const query = this.queryService.queries.find(
      (q) => q.id === this.widget.queryId
    );
    if (!query) {
      this.dataRows = [];
      this.gridDisplayRows = [];
      return;
    }
    const widgetFilters = this.widget.filters
      ? this.widget.filters
          .filter((f) => f.fieldId && f.operator && f.value)
          .map((f) => ({
            fieldId: f.fieldId!,
            operator: f.operator,
            value: f.value!
          }))
      : [];
    const activeFilters = [...this.runtimeFilters, ...widgetFilters];
    const sources = this.queryService.catalogSources || [];
    const queryCatalog = queryFieldCatalog(query, sources);
    const validFieldKeys = new Set(queryCatalog.map(f => f.key || f.id));
    const validFieldIds = new Set(queryCatalog.map(f => f.id));
    const finalFilters = activeFilters
      .map(f => {
        let resolvedKey = f.fieldId;
        for (const src of sources) {
          for (const field of (src.fields || [])) {
            if ((field.id === f.fieldId || field.key === f.fieldId) && field.key) {
              resolvedKey = field.key;
            }
          }
        }
        return { ...f, fieldId: resolvedKey, field: resolvedKey, originalId: f.fieldId };
      })
      .filter(f => {
        if (!f.fieldId || f.fieldId === 'GLOBAL_DATE_RANGE') return true;
        if (queryCatalog.length === 0) return true;
        return validFieldKeys.has(f.fieldId as string) || validFieldIds.has(f.originalId as string);
      });
    this.queryService.executeQueryData(query.id, finalFilters).subscribe({
      next: (rows) => {
        setTimeout(() => {
          this.dataRows = executeWidgetRowsLocal(query, rows);
          this.gridDisplayRows = executeDisplayRowsLocal(query, rows);
          this.isLoading = false;
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.dataRows = [];
          this.gridDisplayRows = [];
          this.isLoading = false;
          this.cdr.markForCheck();
        });
      }
    });
  }
  get queryName(): string {
    if (!this.widget?.queryId) return 'Requête non liée';
    const query = this.queryService.queries.find(
      (q) => q.id === this.widget.queryId
    );
    return query ? query.name : 'Requête personnalisée';
  }
  get formattedKpiValue(): string {
    if (!this.dataRows.length) return '—';
    const first = this.dataRows[0]['value'];
    const num = Number(first);
    if (Number.isNaN(num)) return String(first ?? '—');
    if (this.widget.kpiFormat === 'amount') {
      return (
        num.toLocaleString('fr-TN', { maximumFractionDigits: 0 }) + ' TND'
      );
    }
    if (this.widget.kpiFormat === 'percent') {
      return num + ' %';
    }
    return num.toLocaleString('fr-TN');
  }
  formatFormattedValue(val: any): string {
    const num = Number(val);
    if (Number.isNaN(num)) return String(val ?? '');
    return num.toLocaleString('fr-TN');
  }
  get yTicks(): string[] {
    if (!this.dataRows.length) return ['100', '66', '33'];
    const max = Math.max(...this.dataRows.map((d) => Number(d['value']) || 0));
    const top = max > 0 ? max : 100;
    return [
      Math.round((top / 3) * 1).toLocaleString('fr-TN'),
      Math.round((top / 3) * 2).toLocaleString('fr-TN'),
      Math.round(top).toLocaleString('fr-TN')
    ];
  }
  getBarHeightPercent(val: any): number {
    const max = Math.max(...this.dataRows.map((d) => Number(d['value']) || 0));
    if (max <= 0) return 0;
    return Math.max(8, Math.min(100, ((Number(val) || 0) / max) * 100));
  }
  getTooltipLeftPercent(index: number): number {
    if (!this.dataRows.length) return 0;
    return ((index + 0.5) / this.dataRows.length) * 100;
  }
  getTooltipTransform(index: number | null): string {
    if (index === null) return 'translateX(-50%)';
    const percent = this.getDotPercentX(index);
    if (percent > 75) return 'translateX(-95%)';
    if (percent < 25) return 'translateX(-5%)';
    return 'translateX(-50%)';
  }
  getDotPercentX(index: number | null): number {
    if (index === null || this.dataRows.length <= 1) return 50;
    return 3 + (index / (this.dataRows.length - 1)) * 94;
  }
  getDotPercentY(val: any): number {
    const max = Math.max(...this.dataRows.map((d) => Number(d['value']) || 0));
    if (max <= 0) return 50;
    const pct = ((Number(val) || 0) / max) * 70;
    return 85 - pct;
  }
  getHeatmapTooltipLeft(index: number): number {
    const cols = this.heatmapGridColumns;
    if (!cols) return 50;
    const col = index % cols;
    return ((col + 0.5) / cols) * 100;
  }
  getHeatmapTooltipTop(index: number): number {
    const cols = this.heatmapGridColumns;
    if (!cols) return 50;
    const row = Math.floor(index / cols);
    const totalRows = Math.ceil(this.heatmapCells.length / cols);
    return ((row + 0.5) / (totalRows || 1)) * 100;
  }
  get svgLinePath(): string {
    if (this.dataRows.length <= 1) return 'M 10,50 L 290,50';
    return this.dataRows
      .map((d, index) => {
        const x = 10 + (index / (this.dataRows.length - 1)) * 280;
        const max = Math.max(
          ...this.dataRows.map((item) => Number(item['value']) || 0)
        );
        const val = Number(d['value']) || 0;
        const y = max > 0 ? 85 - (val / max) * 70 : 50;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }
  get svgAreaPath(): string {
    if (this.dataRows.length <= 1) return 'M 10,100 L 10,50 L 290,50 L 290,100 Z';
    const linePath = this.svgLinePath;
    return `${linePath} L 290,100 L 10,100 Z`;
  }
  get gaugeNeedleX(): number {
    const pct = 68;
    const angle = (pct / 100) * 180 - 180;
    const rad = (angle * Math.PI) / 180;
    return 100 + 55 * Math.cos(rad);
  }
  get gaugeNeedleY(): number {
    const pct = 68;
    const angle = (pct / 100) * 180 - 180;
    const rad = (angle * Math.PI) / 180;
    return 95 + 55 * Math.sin(rad);
  }
  getSlicePercent(val: any): number {
    const total =
      this.dataRows.reduce((sum, d) => sum + (Number(d['value']) || 0), 0) || 1;
    return Math.round(((Number(val) || 0) / total) * 100);
  }
  get donutSlices(): Array<{ path: string; color: string }> {
    let total = this.dataRows.reduce(
      (sum, d) => sum + (Number(d['value']) || 0),
      0
    );
    if (total <= 0) total = 100;
    let accumulated = 0;
    return this.dataRows.map((d, index) => {
      const val = Number(d['value']) || 0;
      const startAngle = (accumulated / total) * 360;
      accumulated += val;
      let endAngle = (accumulated / total) * 360;
      if (endAngle - startAngle >= 359.9) {
        endAngle = startAngle + 359.99;
      }
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;
      const x1 = 18 + 16 * Math.cos(startRad);
      const y1 = 18 + 16 * Math.sin(startRad);
      const x2 = 18 + 16 * Math.cos(endRad);
      const y2 = 18 + 16 * Math.sin(endRad);
      const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
      const path = `M18,18 L${x1},${y1} A16,16 0 ${largeArcFlag},1 ${x2},${y2} Z`;
      return { path, color: this.colors[index % this.colors.length] };
    });
  }
  get heatmapCells(): Array<{ item: Datum; intensity: number }> {
    if (!this.dataRows.length) return [];
    const max = Math.max(...this.dataRows.map((d) => Number(d['value']) || 0));
    return this.dataRows.map((item) => {
      const val = Number(item['value']) || 0;
      return { item, intensity: max > 0 ? val / max : 0 };
    });
  }
  get heatmapGridColumns(): number {
    const count = this.heatmapCells.length;
    if (count <= 2) return count || 1;
    if (count === 4) return 2;
    if (count === 6) return 3;
    if (count === 8) return 4;
    if (count === 9) return 3;
    if (count % 2 === 0 && count <= 8) return 2;
    return 3;
  }
}

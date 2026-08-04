import { DashboardService } from '@pages/dashboard/services/dashboard.service';
import { QueryService } from '@pages/query/services/query.service';
import { AuditService, AuditLogEntry } from '@pages/settings/services/audit.service';
import { UserService, UserProfile } from '@core/services/user.service';
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Widget, WidgetLayout, WidgetFilter, DataQuery } from '@core/models/types';
import { widgetMeta } from '@pages/dashboard/services/widget-catalog.service';
import { querySourceSummary, queryFieldCatalog, CatalogField } from '@pages/query/services/query-model.service';
import { REFRESH_OPTIONS, uid } from '@core/services/utils';
import { LIVE_QUERY_DATA } from '@pages/query/services/query-execution.service';
import { DataGridConfigFieldsComponent } from '@pages/dashboard/components/editor/data-grid-config-fields.component';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
import { ButtonComponent } from '@shared/components/ui/button.component';

type InspectorTab = 'data' | 'display' | 'filters' | 'interactions';

@Component({
  selector: 'app-widget-config-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataGridConfigFieldsComponent,
    SvgIconComponent,
    ButtonComponent
  ],
  host: {
    class: 'h-full flex flex-col flex-shrink-0 bg-white'
  },
  templateUrl: './widget-config-panel.component.html'
})
export class WidgetConfigPanelComponent implements OnChanges {
  @Input() widget: Widget | null = null;
  @Input() columns: number = 12;

  @Output() onChange = new EventEmitter<Widget>();
  @Output() onLayoutChange = new EventEmitter<{ widgetId: string; layout: WidgetLayout }>();
  @Output() onDelete = new EventEmitter<string>();

  activeTab: InspectorTab = 'data';
  queries: DataQuery[] = [];
  dashboards: any[] = [];
  refreshOptions = REFRESH_OPTIONS;
  querySearchText: string = '';
  showQueryDropdown: boolean = false;

  constructor(public dashboardService: DashboardService, public queryService: QueryService, private auditService: AuditService, private userService: UserService) {}

  ngOnChanges(): void {
    this.queries = this.queryService.queries;
    this.dashboards = this.dashboardService.dashboards;
    if (this.widget?.queryId) {
      const q = this.queries.find((item) => item.id === this.widget!.queryId);
      if (q) {
        this.querySearchText = q.name;
      }
    } else {
      this.querySearchText = '';
    }
  }

  get sortedQueries(): DataQuery[] {
    const list = [...(this.queryService.queries || [])];
    return list.reverse();
  }

  get filteredQueries(): DataQuery[] {
    const qList = this.sortedQueries;
    if (!this.querySearchText || !this.querySearchText.trim()) {
      return qList;
    }
    const search = this.querySearchText.toLowerCase().trim();
    return qList.filter(
      (q) =>
        q.name.toLowerCase().includes(search) ||
        this.getQuerySummary(q).toLowerCase().includes(search)
    );
  }

  toggleQueryDropdown() {
    this.showQueryDropdown = !this.showQueryDropdown;
    if (this.showQueryDropdown) {
      this.querySearchText = '';
      setTimeout(() => {
        const input = document.getElementById('querySearchInput');
        if (input) input.focus();
      }, 50);
    }
  }

  onQuerySearchBlur() {
    setTimeout(() => {
      this.showQueryDropdown = false;
    }, 200);
  }

  selectQuery(id?: string) {
    this.update({ queryId: id || undefined });
    this.showQueryDropdown = false;
    this.querySearchText = '';
  }

  getWidgetTypeLabel(type: string): string {
    return widgetMeta(type as any)?.label ?? 'Widget';
  }

  getQuerySummary(query: DataQuery): string {
    return querySourceSummary(query);
  }

  get assignedQuery(): DataQuery | undefined {
    if (!this.widget?.queryId) return undefined;
    return this.queries.find((q) => q.id === this.widget!.queryId);
  }

  private cachedFields: CatalogField[] = [];
  private lastAssignedKey: string = '';

  get assignedFields(): CatalogField[] {
    const query = this.assignedQuery;
    if (!query) return [];

    const key = query.id + '_' + (query.selectedFieldIds || []).join(',') + '_' + (query.groupByFieldIds || []).join(',') + '_' + (query.aggregationFieldId || '');
    if (key === this.lastAssignedKey) {
      return this.cachedFields;
    }
    this.lastAssignedKey = key;

    const catalog = queryFieldCatalog(query, this.dataSources);
    const result: CatalogField[] = [];
    const addedIds = new Set<string>();

    const addField = (f: CatalogField) => {
      if (!addedIds.has(f.id)) {
        addedIds.add(f.id);
        result.push(f);
      }
    };

    const priorityIds = new Set<string>();
    (query.selectedFieldIds || []).forEach((id) => priorityIds.add(id));
    (query.groupByFieldIds || []).forEach((id) => priorityIds.add(id));
    if (query.aggregationFieldId) priorityIds.add(query.aggregationFieldId);

    catalog.filter((f) => priorityIds.has(f.id)).forEach(addField);

    (query.transformations || []).forEach((t) => {
      if (t.outputLabel && !addedIds.has(t.outputLabel)) {
        addedIds.add(t.outputLabel);
        result.push({
          id: t.outputLabel,
          label: t.outputLabel,
          type: 'text',
          sourceId: 'transformation',
          sourceLabel: 'Transformation'
        });
      }
    });

    this.cachedFields = result;
    return this.cachedFields;
  }

  trackByFilterId(index: number, filter: WidgetFilter): string {
    return filter.id;
  }

  trackByFieldId(index: number, field: CatalogField): string {
    return field.id;
  }

  trackByQueryId(index: number, query: DataQuery): string {
    return query.id;
  }

  trackByOptionValue(index: number, opt: { value: string; label: string }): string {
    return opt.value;
  }

  trackByDashboardId(index: number, d: any): string {
    return d.id;
  }

  private get dataSources() {
    const fromApi = this.queryService.catalogSources;
    if (fromApi?.length) {
      return fromApi.map((source: any) => ({
        id: source.key || source.id,
        label: source.label,
        description: source.description || '',
        app: source.app,
        fields: (source.fields || []).map((field: any) => ({
          id: field.key || field.id,
          label: field.label,
          type: field.type,
          description: field.description
        }))
      }));
    }
    return [];
  }

  getBetweenMin(value: string | undefined): string {
    if (!value) return '';
    const parts = value.split(',');
    return parts[0] || '';
  }

  getBetweenMax(value: string | undefined): string {
    if (!value) return '';
    const parts = value.split(',');
    return parts[1] || '';
  }

  updateBetweenValue(filterId: string, min: string, max: string) {
    this.updateFilter(filterId, { value: `${min},${max}` });
  }

  update(partial: Partial<Widget>) {
    if (!this.widget) return;
    this.onChange.emit({ ...this.widget, ...partial });
  }

  updateFilter(filterId: string, patch: Partial<WidgetFilter>) {
    if (!this.widget) return;
    const filters = (this.widget.filters ?? []).map((item) =>
      item.id === filterId ? { ...item, ...patch } : item
    );
    this.update({ filters });
  }

  addFilter() {
    if (!this.widget) return;
    const next: WidgetFilter = {
      id: uid('wf'),
      label: 'Nouveau filtre',
      operator: 'eq',
      value: '',
      fieldId: this.assignedQuery?.selectedFieldIds?.[0]
    };
    this.update({ filters: [...(this.widget.filters ?? []), next] });
  }

  removeFilter(filterId: string) {
    if (!this.widget) return;
    this.update({
      filters: (this.widget.filters ?? []).filter((item) => item.id !== filterId)
    });
  }

  onPosChange(key: keyof WidgetLayout, val: number) {
    if (!this.widget) return;
    const current = { ...this.widget.layout };
    current[key] = val;
    this.onLayoutChange.emit({ widgetId: this.widget.id, layout: current });
  }
}

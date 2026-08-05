import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DataQuery, QueryJoin, QueryCondition, QueryTransformation, QuerySort, DataSource, QueryJoinType, QueryTransformationType, FilterOperator, Aggregation } from '@core/models/types';
import { uid } from '@core/services/utils';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
import { ButtonComponent } from '@shared/components/ui/button.component';
import { QueryService } from '@pages/query/services/query.service';
import { LIVE_QUERY_DATA } from '@pages/query/services/query-execution.service';
const STEPS = [
  'Nom & description',
  'Connexions',
  'Tables',
  'Relations',
  'Champs',
  'Filtres',
  'Transformations',
  'Regroupement',
  'Tri',
  'Valider'
];
const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'eq', label: 'égal à' },
  { value: 'neq', label: 'différent de' },
  { value: 'gt', label: 'supérieur à' },
  { value: 'lt', label: 'inférieur à' },
  { value: 'contains', label: 'contient' },
  { value: 'in', label: 'dans la liste' },
  { value: 'between', label: 'entre' }
];
const JOIN_TYPES: { value: QueryJoinType; label: string }[] = [
  { value: 'inner', label: 'Interne' },
  { value: 'left', label: 'Gauche' },
  { value: 'right', label: 'Droite' },
  { value: 'full', label: 'Complète' }
];
const TRANSFORM_TYPES: { value: QueryTransformationType; label: string }[] = [
  { value: 'rename', label: 'Renommer un champ' },
  { value: 'calculated', label: 'Champ calculé' },
  { value: 'format', label: 'Format / date' },
  { value: 'replaceEmpty', label: 'Remplacer les valeurs vides' },
  { value: 'filterRows', label: 'Filtrer les lignes' }
];
@Component({
  selector: 'app-query-wizard-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgIconComponent, ButtonComponent],
  styleUrls: ['./query-wizard-modal.component.scss'],
  templateUrl: './query-wizard-modal.component.html'
})
export class QueryWizardModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() open: boolean = false;
  @Input() queryToEdit?: DataQuery;
  @Input() sources: any[] = [];
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<DataQuery>();
  step: number = 0;
  slideDirection: 'left' | 'right' = 'right';
  steps = STEPS;
  operators = OPERATORS;
  joinTypes = JOIN_TYPES;
  transformTypes = TRANSFORM_TYPES;
  relationError: string = '';
  query: DataQuery = this.createEmptyQuery();
  selectedConnections: string[] = [];
  get availableConnections(): string[] {
    const apps = this.sources.map(s => s.app);
    return [...new Set(apps)].filter(Boolean) as string[];
  }
  get filteredSources(): any[] {
    if (this.selectedConnections.length === 0) return this.sources;
    return this.sources.filter(s => this.selectedConnections.includes(s.app));
  }
  getTableCountForConnection(conn: string): number {
    if (!this.sources || !Array.isArray(this.sources)) return 0;
    return this.sources.filter(s => s.app === conn).length;
  }
  toggleConnection(conn: string) {
    const isSelected = this.selectedConnections.includes(conn);
    this.selectedConnections = isSelected 
      ? this.selectedConnections.filter(c => c !== conn)
      : [...this.selectedConnections, conn];
    const tablesToRemove = isSelected ? this.sources.filter(s => s.app === conn) : [];
    tablesToRemove.forEach(t => {
      const targetId = t.id || t.key;
      if (this.query.sourceIds.includes(targetId)) {
        this.toggleSource(targetId);
      }
    });
  }
  private sourcesSub?: Subscription;
  constructor(private queryService: QueryService, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void {
    this.queryService.loadCatalog();
    this.sourcesSub = this.queryService.catalogSources$.subscribe((srcs) => {
      if (srcs && srcs.length > 0) {
        this.sources = srcs;
        if (this.open && this.queryToEdit) {
          this.query = this.normalizeQueryForWizard(this.queryToEdit);
          this.updateSelectedConnectionsFromQuery();
        }
        this.cdr.markForCheck();
      }
    });
  }
  ngOnDestroy(): void {
    if (this.sourcesSub) {
      this.sourcesSub.unsubscribe();
    }
  }
  private updateSelectedConnectionsFromQuery(): void {
    if (!this.query || !this.query.sourceIds || !this.sources || this.sources.length === 0) return;
    const selectedApps = this.sources
      .filter(s => this.query.sourceIds.includes(s.id) || this.query.sourceIds.includes(s.key) || this.query.sourceIds.includes(s.sourceKey))
      .map(s => s.app);
    this.selectedConnections = [...new Set(selectedApps)].filter(Boolean) as string[];
  }
  ngOnChanges(): void {
    if (this.open) {
      if (this.queryService.catalogSources && this.queryService.catalogSources.length > 0) {
        this.sources = this.queryService.catalogSources;
      }
      if (this.queryToEdit) {
        this.query = this.normalizeQueryForWizard(this.queryToEdit);
        this.updateSelectedConnectionsFromQuery();
        this.step = 0;
      } else {
        this.query = this.createEmptyQuery();
        this.selectedConnections = [];
        this.step = 0;
      }
      this.relationError = '';
      this.slideDirection = 'right';
      this.fetchDraftPreview();
    }
  }
  private normalizeQueryForWizard(rawQuery: DataQuery): DataQuery {
    if (!rawQuery) return this.createEmptyQuery();
    const q: DataQuery = JSON.parse(JSON.stringify(rawQuery));
    const allFieldsMap = new Map<string, string>();
    const allSourcesMap = new Map<string, string>();
    const activeSources = (this.sources && this.sources.length > 0)
      ? this.sources
      : (this.queryService.catalogSources || []);
    activeSources.forEach((src: any) => {
      const canonicalSourceId = src.id;
      if (src.id) allSourcesMap.set(src.id, canonicalSourceId);
      if (src.key) allSourcesMap.set(src.key, canonicalSourceId);
      if (src.sourceKey) allSourcesMap.set(src.sourceKey, canonicalSourceId);
      (src.fields || []).forEach((f: any) => {
        const canonicalFieldId = f.id;
        if (f.id) allFieldsMap.set(f.id, canonicalFieldId);
        if (f.key) allFieldsMap.set(f.key, canonicalFieldId);
        if (f.fieldKey) allFieldsMap.set(f.fieldKey, canonicalFieldId);
      });
    });
    const resolveSourceId = (rawId: string | undefined): string => {
      if (!rawId) return '';
      return allSourcesMap.get(rawId) || rawId;
    };
    const resolveFieldId = (rawId: string | undefined, contextSourceId?: string | string[]): string => {
      if (!rawId) return '';
      const contextIds = contextSourceId
        ? (Array.isArray(contextSourceId) ? contextSourceId : [contextSourceId])
        : [];
      for (const srcId of contextIds) {
        if (!srcId) continue;
        const canonicalSrcId = resolveSourceId(srcId);
        const src = activeSources.find((s: any) =>
          s.id === canonicalSrcId || s.key === canonicalSrcId || s.sourceKey === canonicalSrcId
        );
        if (src?.fields) {
          const match = src.fields.find((f: any) =>
            f.id === rawId || f.key === rawId || f.fieldKey === rawId
          );
          if (match?.id) return match.id;
        }
      }
      return allFieldsMap.get(rawId) || rawId;
    };
    if (q.sourceIds) {
      q.sourceIds = q.sourceIds.map((id: string) => resolveSourceId(id));
    }
    if (q.joins) {
      q.joins = q.joins.map((j: any) => {
        const lSrc = resolveSourceId(j.leftSourceId) || (q.sourceIds.length > 0 ? q.sourceIds[0] : '');
        const rSrc = resolveSourceId(j.rightSourceId) || (q.sourceIds.length > 1 ? q.sourceIds[1] : (q.sourceIds.length > 0 ? q.sourceIds[0] : ''));
        let lFld = resolveFieldId(j.leftFieldId, lSrc);
        let rFld = resolveFieldId(j.rightFieldId, rSrc);
        if (!lFld && lSrc) lFld = this.getSourceFirstField(lSrc);
        if (!rFld && rSrc) rFld = this.getSourceFirstField(rSrc);
        return {
          ...j,
          leftSourceId: lSrc,
          leftFieldId: lFld,
          rightSourceId: rSrc,
          rightFieldId: rFld
        };
      });
    }
    if (q.conditions) {
      q.conditions = q.conditions.map((c: any) => {
        let fld = resolveFieldId(c.fieldId, q.sourceIds);
        if (!fld && this.catalogFields.length > 0) {
          fld = this.catalogFields[0].id;
        }
        return {
          ...c,
          fieldId: fld
        };
      });
    }
    if (q.transformations) {
      q.transformations = q.transformations.map((t: any) => {
        let fld = resolveFieldId(t.fieldId, q.sourceIds);
        return {
          ...t,
          fieldId: fld
        };
      });
    }
    if (q.selectedFieldIds) {
      q.selectedFieldIds = q.selectedFieldIds.map((id: string) => resolveFieldId(id, q.sourceIds));
    }
    if (q.groupByFieldIds) {
      q.groupByFieldIds = q.groupByFieldIds.map((id: string) => resolveFieldId(id, q.sourceIds));
    }
    if (q.aggregationFieldId) {
      q.aggregationFieldId = resolveFieldId(q.aggregationFieldId, q.sourceIds);
    }
    if (q.sort && q.sort.fieldId) {
      q.sort.fieldId = resolveFieldId(q.sort.fieldId, q.sourceIds);
    }
    return q;
  }
  setStep(nextStep: number) {
    if (nextStep === this.step) return;
    this.slideDirection = nextStep > this.step ? 'right' : 'left';
    this.step = nextStep;
    if (this.step >= 6) {
      this.fetchDraftPreview();
    }
  }
  fetchDraftPreview() {
    if (!this.query || !this.query.sourceIds || this.query.sourceIds.length === 0) return;
    this.queryService.previewQuery(this.query).subscribe({
      next: (rows) => {
        if (rows && Array.isArray(rows)) {
          LIVE_QUERY_DATA[this.query.id] = rows;
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.warn('Draft query preview failed:', err)
    });
  }
  getSourceFields(sourceId: string): any[] {
    const src = this.getSource(sourceId);
    if (!src || !src.fields) return [];
    return src.fields.map((f: any) => ({
      ...f,
      id: f.id || f.key || f.fieldKey,
      label: f.label || f.fieldLabel || f.key
    }));
  }
  getSourceFirstField(sourceId: string): string {
    const fields = this.getSourceFields(sourceId);
    if (!fields || fields.length === 0) return '';
    return fields[0].id;
  }
  createEmptyQuery(): DataQuery {
    return {
      id: uid('q'),
      name: '',
      description: '',
      visibility: 'personal',
      sourceIds: [],
      joins: [],
      selectedFieldIds: [],
      conditions: [],
      transformations: [],
      groupByFieldIds: [],
      aggregation: 'none',
      rowLimit: 1000,
      usedByWidgets: 0,
      updatedAt: new Date().toISOString()
    };
  }
  get selectedSources(): any[] {
    return this.sources.filter((source) => {
      const sid = source.id || source.key || source.sourceKey;
      const skey = source.key || source.sourceKey || source.id;
      return this.query.sourceIds.includes(sid) || this.query.sourceIds.includes(skey);
    });
  }
  get catalogFields() {
    return this.selectedSources.flatMap((source) =>
      (source.fields || []).map((field: any) => ({
        ...field,
        id: field.id || field.key || field.fieldKey,
        label: field.label || field.fieldLabel || field.key,
        sourceId: source.id || source.key,
        sourceLabel: source.label || source.sourceLabel || source.key
      }))
    );
  }
  isSourceSelected(idOrKey: string): boolean {
    const src = this.getSource(idOrKey);
    const sid = src ? (src.id || src.key) : idOrKey;
    const skey = src ? (src.key || src.id) : idOrKey;
    return this.query.sourceIds.includes(sid) || this.query.sourceIds.includes(skey);
  }
  getSource(idOrKey: string): any | undefined {
    return this.sources.find((s) => s.id === idOrKey || s.key === idOrKey || s.sourceKey === idOrKey);
  }
  getDisplayFieldLabel(fieldId: string): string {
    const field = this.catalogFields.find((f) => f.id === fieldId);
    if (field) return `${field.sourceLabel} · ${field.label}`;
    return fieldId;
  }
  getLivePreviewColumns(): { id: string; label: string; key: string }[] {
    if (this.query.aggregation && this.query.aggregation !== 'none') {
      return [
        { id: 'label', key: 'label', label: 'GROUPE (LABEL)' },
        { id: 'value', key: 'value', label: 'VALEUR AGRÉGÉE' }
      ];
    }
    if (this.query.selectedFieldIds && this.query.selectedFieldIds.length > 0) {
      const columns = this.query.selectedFieldIds.map((id) => {
        const f = this.catalogFields.find((field) => field.id === id);
        let colLabel = f ? `${(f.sourceLabel || '').toUpperCase()} · ${(f.label || '').toUpperCase()}` : id.toUpperCase();
        let colKey = f ? (f.key || f.fieldKey || id) : id;
        if (this.query.transformations && this.query.transformations.length > 0) {
          const rename = this.query.transformations.find(t => t.type === 'rename' && t.fieldId === id);
          if (rename && rename.outputLabel) {
            colLabel = rename.outputLabel.toUpperCase();
            colKey = rename.outputLabel; 
          }
        }
        return {
          id,
          key: colKey,
          label: colLabel
        };
      });
      return columns;
    }
    const realRows = LIVE_QUERY_DATA[this.query.id];
    if (realRows && realRows.length > 0) {
      return Object.keys(realRows[0]).map((k) => ({
        id: k,
        key: k,
        label: k.toUpperCase()
      }));
    }
    return [];
  }
  getCellValue(row: Record<string, any>, colIndex: number, colObj: { id: string; label: string; key: string }): any {
    if (!row) return '—';
    if (row[colObj.key] !== undefined && row[colObj.key] !== null) return row[colObj.key];
    if (row[colObj.id] !== undefined && row[colObj.id] !== null) return row[colObj.id];
    const keyLower = (colObj.key || '').toLowerCase();
    const foundKey = Object.keys(row).find((k) => {
      const rowKeyLower = k.toLowerCase();
      return rowKeyLower === keyLower || 
             keyLower.endsWith('.' + rowKeyLower) || 
             rowKeyLower.includes(keyLower) || 
             keyLower.includes(rowKeyLower);
    });
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
      return row[foundKey];
    }
    return '—';
  }
  private getExactRowKey(row: Record<string, any>, colKey: string, fieldId?: string): string | undefined {
    let exactKey = Object.keys(row).find(k => k.toLowerCase() === colKey.toLowerCase() || k.endsWith('.' + colKey.toLowerCase()) || k.endsWith(colKey));
    if (!exactKey && row['label'] !== undefined && fieldId && this.query.groupByFieldIds?.includes(fieldId)) {
      return 'label';
    }
    return exactKey;
  }
  private applyRenameTransform(rows: Record<string, any>[], colKey: string, outLabel: string, fieldId: string): Record<string, any>[] {
    return rows.map(r => {
      const exactKey = this.getExactRowKey(r, colKey, fieldId);
      if (exactKey && r[exactKey] !== undefined) {
        r[outLabel] = r[exactKey];
      }
      return r;
    });
  }
  private applyFormatTransform(rows: Record<string, any>[], colKey: string, formatStr: string, fieldId: string): Record<string, any>[] {
    return rows.map(r => {
      const exactKey = this.getExactRowKey(r, colKey, fieldId);
      if (exactKey && r[exactKey] !== undefined) {
        const d = new Date(r[exactKey]);
        if (!isNaN(d.getTime())) {
          if (formatStr === 'year') {
            r[exactKey] = d.getFullYear().toString();
          } else if (formatStr === 'month') {
            r[exactKey] = (d.getMonth() + 1).toString().padStart(2, '0');
          }
        }
      }
      return r;
    });
  }
  private applyFilterTransform(rows: Record<string, any>[], colKey: string, op: string, filterVal: string, fieldId: string): Record<string, any>[] {
    return rows.filter(r => {
      const exactKey = this.getExactRowKey(r, colKey, fieldId);
      if (!exactKey || r[exactKey] === undefined) return true;
      const cellVal = r[exactKey];
      switch (op) {
        case 'eq': return String(cellVal) === String(filterVal);
        case 'neq': return String(cellVal) !== String(filterVal);
        case 'gt': return Number(cellVal) > Number(filterVal);
        case 'lt': return Number(cellVal) < Number(filterVal);
        case 'contains': return String(cellVal).toLowerCase().includes(String(filterVal).toLowerCase());
        default: return true;
      }
    });
  }
  getLivePreviewRows(): Record<string, any>[] {
    const realRows = LIVE_QUERY_DATA[this.query.id];
    let rows: Record<string, any>[] = [];
    if (realRows && Array.isArray(realRows) && realRows.length > 0) {
      rows = realRows.map(r => ({ ...r }));
    }
    if (!this.query.transformations?.length || (this.query.aggregation && this.query.aggregation !== 'none')) {
      return rows;
    }
    for (const tr of this.query.transformations) {
      if (!tr.fieldId) continue;
      const f = this.catalogFields.find(cf => cf.id === tr.fieldId);
      if (!f) continue;
      const colKey = f.key || f.fieldKey || f.id;
      switch (tr.type) {
        case 'rename':
          if (tr.outputLabel) rows = this.applyRenameTransform(rows, colKey, tr.outputLabel, tr.fieldId);
          break;
        case 'format':
          if (tr.format) rows = this.applyFormatTransform(rows, colKey, tr.format, tr.fieldId);
          break;
        case 'filterRows':
          if (tr.operator && tr.value !== undefined) rows = this.applyFilterTransform(rows, colKey, tr.operator, tr.value, tr.fieldId);
          break;
      }
    }
    return rows;
  }
  toggleSource(idOrKey: any) {
    const targetKey = typeof idOrKey === 'string' ? idOrKey : (idOrKey?.id || idOrKey?.key);
    const src = this.getSource(targetKey);
    const sid = src?.id || targetKey;
    const skey = src?.key || targetKey;
    const isSelected = this.query.sourceIds.includes(sid) || this.query.sourceIds.includes(skey);
    this.query.sourceIds = isSelected 
      ? this.query.sourceIds.filter(s => s !== sid && s !== skey)
      : [...this.query.sourceIds, sid];
    const removedFieldIds = isSelected ? (src?.fields?.map((f: any) => f.id || f.key || f.fieldKey) || []) : [];
    this.query.selectedFieldIds = (this.query.selectedFieldIds || []).filter(id => !removedFieldIds.includes(id));
    this.query.groupByFieldIds = (this.query.groupByFieldIds || []).filter(id => !removedFieldIds.includes(id));
    this.query.aggregationFieldId = removedFieldIds.includes(this.query.aggregationFieldId!) ? '' : this.query.aggregationFieldId;
    this.query.joins = (this.query.joins || []).filter(j => !isSelected || (j.leftSourceId !== sid && j.rightSourceId !== sid && j.leftSourceId !== skey && j.rightSourceId !== skey));
  }
  toggleField(fieldId: string) {
    if (this.query.selectedFieldIds.includes(fieldId)) {
      this.query.selectedFieldIds = this.query.selectedFieldIds.filter((id) => id !== fieldId);
    } else {
      this.query.selectedFieldIds = [...this.query.selectedFieldIds, fieldId];
    }
  }
  draggedIndex: number | null = null;
  onDragStart(event: DragEvent, index: number) {
    this.draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
    }
  }
  onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }
  onDrop(event: DragEvent, targetIndex: number) {
    event.preventDefault();
    if (this.draggedIndex === null || this.draggedIndex === targetIndex) return;
    const copy = [...this.query.selectedFieldIds];
    const [removed] = copy.splice(this.draggedIndex, 1);
    copy.splice(targetIndex, 0, removed);
    this.query.selectedFieldIds = copy;
    this.draggedIndex = null;
  }
  onDragEnd() {
    this.draggedIndex = null;
  }
  moveField(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= this.query.selectedFieldIds.length) return;
    const copy = [...this.query.selectedFieldIds];
    const [removed] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, removed);
    this.query.selectedFieldIds = copy;
  }
  addJoin() {
    if (this.query.sourceIds.length < 2) return;
    const s1 = this.query.sourceIds[0];
    const s2 = this.query.sourceIds[1];
    this.query.joins.push({
      id: uid('join'),
      leftSourceId: s1,
      leftFieldId: this.getSourceFirstField(s1),
      type: 'left',
      rightSourceId: s2,
      rightFieldId: this.getSourceFirstField(s2)
    });
  }
  suggestRelation() {
    if (this.query.sourceIds.length < 2) return;
    const s1 = this.getSource(this.query.sourceIds[0]);
    const s2 = this.getSource(this.query.sourceIds[1]);
    if (!s1 || !s2) return;
    const f1 = (s1.fields || []).find((f: any) => (f.key || f.fieldKey) === 'id_client' || (f.key || f.fieldKey) === 'id_facture') || (s1.fields ? s1.fields[0] : null);
    const f2 = (s2.fields || []).find((f: any) => (f.key || f.fieldKey) === 'id_client' || (f.key || f.fieldKey) === 'id_facture') || (s2.fields ? s2.fields[0] : null);
    this.query.joins = [
      {
        id: uid('join'),
        leftSourceId: s1.id || s1.key,
        leftFieldId: f1 ? (f1.id || f1.key) : '',
        type: 'left',
        rightSourceId: s2.id || s2.key,
        rightFieldId: f2 ? (f2.id || f2.key) : ''
      }
    ];
  }
  updateJoin(id: string, change: Partial<QueryJoin>) {
    this.query.joins = this.query.joins.map((j) => (j.id === id ? { ...j, ...change } : j));
  }
  deleteJoin(id: string) {
    this.query.joins = this.query.joins.filter((j) => j.id !== id);
  }
  addCondition() {
    if (!this.catalogFields.length) return;
    this.query.conditions.push({
      id: uid('filter'),
      fieldId: this.catalogFields[0].id,
      operator: 'eq',
      value: '',
      logical: 'AND',
      parametrable: false
    });
  }
  deleteCondition(id: string) {
    this.query.conditions = this.query.conditions.filter((c) => c.id !== id);
  }
  addTransformation() {
    this.query.transformations.push({
      id: uid('transform'),
      type: 'rename',
      fieldId: this.catalogFields.length ? this.catalogFields[0].id : '',
      outputLabel: ''
    });
    this.fetchDraftPreview();
  }
  deleteTransformation(id: string) {
    this.query.transformations = this.query.transformations.filter((t) => t.id !== id);
    this.fetchDraftPreview();
  }
  toggleGroupBy(fieldId: string) {
    if (this.query.groupByFieldIds.includes(fieldId)) {
      this.query.groupByFieldIds = this.query.groupByFieldIds.filter((id) => id !== fieldId);
    } else {
      this.query.groupByFieldIds = [...this.query.groupByFieldIds, fieldId];
    }
    this.fetchDraftPreview();
  }
  setSortField(fieldId: string) {
    if (!fieldId) {
      this.query.sort = undefined;
    } else {
      this.query.sort = {
        fieldId,
        direction: this.query.sort?.direction || 'asc'
      };
    }
  }
  setSortDirection(direction: 'asc' | 'desc') {
    if (this.query.sort) {
      this.query.sort.direction = direction;
    }
  }
  get canProceed(): boolean {
    if (this.step === 0) return this.query.name.trim().length > 0;
    if (this.step === 1) return this.selectedConnections.length > 0;
    if (this.step === 2) return this.query.sourceIds.length > 0;
    if (this.step === 4) return this.query.selectedFieldIds.length > 0;
    return true;
  }
  isSubmitting: boolean = false;
  handleClose() {
    if (this.isSubmitting) return;
    this.onClose.emit();
  }
  submit() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.onSave.emit(this.query);
    this.onClose.emit();
  }
}

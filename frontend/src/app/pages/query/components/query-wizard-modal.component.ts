import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DataQuery, QueryJoin, QueryCondition, QueryTransformation, QuerySort, DataSource, QueryJoinType, QueryTransformationType, FilterOperator, Aggregation } from '@core/models/types';
import { uid } from '@core/services/utils';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
import { ButtonComponent } from '@shared/components/ui/button.component';
import { QueryService } from '@pages/query/services/query.service';

const STEPS = [
  'Nom & description',
  'Sources',
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

  private sourcesSub?: Subscription;

  constructor(private queryService: QueryService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.queryService.loadCatalog();
    this.sourcesSub = this.queryService.catalogSources$.subscribe((srcs) => {
      if (srcs && srcs.length > 0) {
        this.sources = srcs;
        if (this.open && this.queryToEdit) {
          this.query = this.normalizeQueryForWizard(this.queryToEdit);
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

  ngOnChanges(): void {
    if (this.open) {
      if (this.queryService.catalogSources && this.queryService.catalogSources.length > 0) {
        this.sources = this.queryService.catalogSources;
      }
      if (this.queryToEdit) {
        this.query = this.normalizeQueryForWizard(this.queryToEdit);
        this.step = 0;
      } else {
        this.query = this.createEmptyQuery();
        this.step = 0;
      }
      this.relationError = '';
      this.slideDirection = 'right';
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

    const resolveFieldId = (rawId: string | undefined, contextSourceId?: string): string => {
      if (!rawId) return '';
      if (contextSourceId) {
        const canonicalSrcId = resolveSourceId(contextSourceId);
        const src = activeSources.find((s: any) => s.id === canonicalSrcId || s.key === canonicalSrcId || s.sourceKey === canonicalSrcId);
        if (src && src.fields) {
          const match = src.fields.find((f: any) => f.id === rawId || f.key === rawId || f.fieldKey === rawId);
          if (match && match.id) return match.id;
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
        let derivedSourceId;
        const globalMatch = activeSources.find((s: any) => 
          (s.fields || []).some((f: any) => f.id === c.fieldId || f.key === c.fieldId || f.fieldKey === c.fieldId)
        );
        if (globalMatch) derivedSourceId = globalMatch.id;

        let fld = resolveFieldId(c.fieldId, derivedSourceId);
        if (!fld && this.catalogFields.length > 0) {
          fld = this.catalogFields[0].id;
        }
        return {
          ...c,
          fieldId: fld
        };
      });
    }

    if (q.selectedFieldIds) {
      q.selectedFieldIds = q.selectedFieldIds.map((id: string) => resolveFieldId(id));
    }

    if (q.groupByFieldIds) {
      q.groupByFieldIds = q.groupByFieldIds.map((id: string) => resolveFieldId(id));
    }

    if (q.aggregationFieldId) {
      q.aggregationFieldId = resolveFieldId(q.aggregationFieldId);
    }

    if (q.sort && q.sort.fieldId) {
      q.sort.fieldId = resolveFieldId(q.sort.fieldId);
    }

    return q;
  }

  setStep(nextStep: number) {
    if (nextStep === this.step) return;
    this.slideDirection = nextStep > this.step ? 'right' : 'left';
    this.step = nextStep;
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

  toggleSource(idOrKey: any) {
    const targetKey = typeof idOrKey === 'string' ? idOrKey : (idOrKey.id || idOrKey.key);
    const src = this.getSource(targetKey);
    const sid = src ? (src.id || src.key) : targetKey;
    const skey = src ? (src.key || src.id) : targetKey;

    if (this.query.sourceIds.includes(sid) || this.query.sourceIds.includes(skey)) {
      this.query.sourceIds = this.query.sourceIds.filter((s) => s !== sid && s !== skey);
    } else {
      this.query.sourceIds = [...this.query.sourceIds, sid];
    }
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
  }

  deleteTransformation(id: string) {
    this.query.transformations = this.query.transformations.filter((t) => t.id !== id);
  }

  toggleGroupBy(fieldId: string) {
    if (this.query.groupByFieldIds.includes(fieldId)) {
      this.query.groupByFieldIds = this.query.groupByFieldIds.filter((id) => id !== fieldId);
    } else {
      this.query.groupByFieldIds = [...this.query.groupByFieldIds, fieldId];
    }
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
    if (this.step === 1) return this.query.sourceIds.length > 0;
    if (this.step === 3) return this.query.selectedFieldIds.length > 0;
    return true;
  }

  handleClose() {
    this.onClose.emit();
  }

  submit() {
    this.onSave.emit(this.query);
    this.onClose.emit();
  }
}

import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataQuery, QueryJoin, QueryCondition, QueryTransformation, QuerySort, DataSource, QueryJoinType, QueryTransformationType, FilterOperator, Aggregation } from '@core/models/types';
import { DATA_SOURCES } from '@core/models/types';
import { uid } from '@core/services/utils';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
import { ButtonComponent } from '@shared/components/ui/button.component';

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
export class QueryWizardModalComponent implements OnChanges {
  @Input() open: boolean = false;
  @Input() queryToEdit?: DataQuery;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<DataQuery>();

  step: number = 0;
  slideDirection: 'left' | 'right' = 'right';

  steps = STEPS;
  operators = OPERATORS;
  joinTypes = JOIN_TYPES;
  transformTypes = TRANSFORM_TYPES;

  sources: DataSource[] = DATA_SOURCES;
  relationError: string = '';

  query: DataQuery = this.createEmptyQuery();

  ngOnChanges(): void {
    if (this.open) {
      if (this.queryToEdit) {
        this.query = JSON.parse(JSON.stringify(this.queryToEdit));
        this.step = 0;
      } else {
        this.query = this.createEmptyQuery();
        this.step = 0;
      }
      this.relationError = '';
      this.slideDirection = 'right';
    }
  }

  setStep(nextStep: number) {
    if (nextStep === this.step) return;
    this.slideDirection = nextStep > this.step ? 'right' : 'left';
    this.step = nextStep;
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

  get selectedSources(): DataSource[] {
    return this.sources.filter((source) => this.query.sourceIds.includes(source.id));
  }

  get catalogFields() {
    return this.selectedSources.flatMap((source) =>
      source.fields.map((field) => ({
        ...field,
        sourceId: source.id,
        sourceLabel: source.label
      }))
    );
  }

  isSourceSelected(id: string): boolean {
    return this.query.sourceIds.includes(id);
  }

  getSource(id: string): DataSource | undefined {
    return this.sources.find((s) => s.id === id);
  }

  getSourceFirstField(sourceId: string): string {
    const src = this.getSource(sourceId);
    return src && src.fields.length > 0 ? src.fields[0].id : '';
  }

  getDisplayFieldLabel(fieldId: string): string {
    const field = this.catalogFields.find((f) => f.id === fieldId);
    if (field) return `${field.sourceLabel} · ${field.label}`;
    return fieldId;
  }

  toggleSource(id: string) {
    if (this.query.sourceIds.includes(id)) {
      this.query.sourceIds = this.query.sourceIds.filter((s) => s !== id);
    } else {
      this.query.sourceIds = [...this.query.sourceIds, id];
    }
  }

  toggleField(fieldId: string) {
    if (this.query.selectedFieldIds.includes(fieldId)) {
      this.query.selectedFieldIds = this.query.selectedFieldIds.filter((id) => id !== fieldId);
    } else {
      this.query.selectedFieldIds = [...this.query.selectedFieldIds, fieldId];
    }
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
    this.query.joins = [
      {
        id: uid('join'),
        leftSourceId: 'src-factures',
        leftFieldId: 'f-fact-client',
        type: 'left',
        rightSourceId: 'src-clients',
        rightFieldId: 'f-cli-id'
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

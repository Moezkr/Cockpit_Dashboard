import { DashboardService } from '@pages/dashboard/services/dashboard.service';
import { QueryService } from '@pages/query/services/query.service';
import { AuditService, AuditLogEntry } from '@pages/settings/services/audit.service';
import { UserService, UserProfile } from '@core/services/user.service';
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dashboard, GlobalFilter, RefreshInterval, DataSource, DataField } from '@core/models/types';
import { REFRESH_OPTIONS, uid } from '@core/services/utils';
import { LIVE_QUERY_DATA } from '@pages/query/services/query-execution.service';
import { queryFieldCatalog, CatalogField } from '@pages/query/services/query-model.service';
import { ModalComponent } from '@shared/components/ui/modal.component';
import { ButtonComponent } from '@shared/components/ui/button.component';
type Tab = 'general' | 'filters' | 'refresh';
@Component({
  selector: 'app-dashboard-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent],
  template: `
    <app-modal [open]="open" [title]="'Paramètres du tableau de bord'" width="max-w-xl" (onClose)="onClose.emit()">
      <div *ngIf="draft">
        <div class="flex border-b border-line mb-4 gap-4">
          <button
            class="pb-2 text-sm font-medium border-b-2 transition-colors"
            [class.border-brand]="activeTab === 'general'"
            [class.text-brand-strong]="activeTab === 'general'"
            [class.border-transparent]="activeTab !== 'general'"
            [class.text-ink-faint]="activeTab !== 'general'"
            [class.hover:text-ink]="activeTab !== 'general'"
            (click)="activeTab = 'general'"
          >
            Général
          </button>
          <button
            class="pb-2 text-sm font-medium border-b-2 transition-colors"
            [class.border-brand]="activeTab === 'filters'"
            [class.text-brand-strong]="activeTab === 'filters'"
            [class.border-transparent]="activeTab !== 'filters'"
            [class.text-ink-faint]="activeTab !== 'filters'"
            [class.hover:text-ink]="activeTab !== 'filters'"
            (click)="activeTab = 'filters'"
          >
            Filtres globaux
          </button>
          <button
            class="pb-2 text-sm font-medium border-b-2 transition-colors"
            [class.border-brand]="activeTab === 'refresh'"
            [class.text-brand-strong]="activeTab === 'refresh'"
            [class.border-transparent]="activeTab !== 'refresh'"
            [class.text-ink-faint]="activeTab !== 'refresh'"
            [class.hover:text-ink]="activeTab !== 'refresh'"
            (click)="activeTab = 'refresh'"
          >
            Rafraîchissement
          </button>
        </div>
        <div *ngIf="activeTab === 'general'" class="space-y-4">
          <div>
            <label class="block text-2xs font-semibold uppercase tracking-wide text-ink-faint mb-1">
              Titre du tableau de bord
            </label>
            <input
              [(ngModel)]="draft.name"
              class="h-8 w-full rounded-md border border-line-strong bg-white px-2 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              placeholder="Ex: Suivi des ventes"
            />
          </div>
          <div>
            <label class="block text-2xs font-semibold uppercase tracking-wide text-ink-faint mb-1">
              Description (optionnelle)
            </label>
            <textarea
              [(ngModel)]="draft.description"
              class="w-full rounded-md border border-line-strong bg-white px-2 py-1.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors resize-none h-20"
              placeholder="Brève description..."
            ></textarea>
          </div>
          <div>
            <label class="block text-2xs font-semibold uppercase tracking-wide text-ink-faint mb-1">
              Tags (séparés par des virgules)
            </label>
            <input
              [ngModel]="draft.tags.join(', ')"
              (ngModelChange)="updateTags($event)"
              class="h-8 w-full rounded-md border border-line-strong bg-white px-2 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              placeholder="Ventes, KPI, Direction..."
            />
          </div>
        </div>
        <div *ngIf="activeTab === 'filters'" class="space-y-2">
          <div *ngIf="!draft.globalFilters.length" class="text-xs text-ink-faint mb-2">
            Aucun filtre global. Ajoutez-en pour recontextualiser tous les widgets.
          </div>
          <div
            *ngFor="let f of draft.globalFilters; let i = index"
            class="rounded-md border border-line p-2 mb-2"
          >
            <div class="flex items-center gap-2">
              <input
                [(ngModel)]="f.label"
                class="flex-1 h-7 rounded-md border border-line-strong bg-white px-2 text-xs text-ink placeholder:text-ink-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                placeholder="Nom du filtre (ex: Région)"
              />
              <select
                [(ngModel)]="f.input"
                class="w-28 h-7 rounded-md border border-line-strong bg-white px-2 text-xs text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              >
                <option value="select">Liste</option>
                <option value="multiselect">Multi-choix</option>
                <option value="daterange">Plage dates</option>
              </select>
              <button
                (click)="removeFilter(f.id)"
                aria-label="Supprimer"
                class="rounded p-1 text-ink-faint hover:text-negative"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </div>
            <div class="mt-2" *ngIf="f.input !== 'daterange'">
              <label class="block text-2xs font-semibold uppercase tracking-wide text-ink-faint mb-1">
                CHAMP DE DONNÉES CIBLÉ
              </label>
              <select
                [(ngModel)]="f.fieldId"
                class="h-7 w-full rounded-md border border-line-strong bg-white px-2 text-xs text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              >
                <option [value]="undefined">— Non lié (affichage uniquement) —</option>
                <optgroup *ngFor="let source of sources" [label]="source.label">
                  <option *ngFor="let field of source.fields" [value]="field.id">
                    {{ field.label }}
                  </option>
                </optgroup>
              </select>
              <p class="mt-1 text-2xs text-ink-faint">
                Le filtre s'applique aux widgets dont la requête contient ce champ.
              </p>
              <div *ngIf="f.input === 'select' || f.input === 'multiselect'" class="mt-3">
                <label class="block text-2xs font-semibold uppercase tracking-wide text-ink-faint mb-1">
                  OPTIONS DE FILTRE (séparées par une virgule)
                </label>
                <input
                  [ngModel]="f.options?.join(', ')"
                  (ngModelChange)="updateFilterOptions(f, $event)"
                  class="h-7 w-full rounded-md border border-line-strong bg-white px-2 text-xs text-ink placeholder:text-ink-faint outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                  placeholder="Ex: Paris, Lyon, Marseille"
                />
              </div>
            </div>
            <div class="mt-2" *ngIf="f.input === 'daterange'">
              <p class="mt-2 text-2xs text-ink-faint">
                Le filtre s'applique automatiquement à tous les widgets selon la date de création.
              </p>
            </div>
            <label class="mt-1.5 flex items-center gap-1.5 text-2xs text-ink-soft cursor-pointer">
              <input
                type="checkbox"
                [(ngModel)]="f.readerVisible"
                class="rounded border-line-strong text-brand focus:ring-brand focus:ring-offset-0"
              />
              Visible par les lecteurs
            </label>
          </div>
          <app-button
            variant="secondary"
            size="sm"
            (onClick)="addFilter()"
            customClass="w-full justify-center mt-2"
          >
            + Ajouter un filtre global
          </app-button>
        </div>
        <div *ngIf="activeTab === 'refresh'" class="space-y-3">
          <div>
            <label class="block text-2xs font-semibold uppercase tracking-wide text-ink-faint mb-1">Intervalle de rafraîchissement du tableau de bord</label>
            <select
              [(ngModel)]="draft.refreshInterval"
              class="h-7 w-full rounded-md border border-line-strong bg-white px-2 text-xs text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
            >
              <option *ngFor="let o of refreshOptions" [value]="o.value">
                {{ o.label }}
              </option>
            </select>
          </div>
          <div class="rounded-md bg-surface-muted p-2 text-2xs text-ink-faint">
            S'applique à tous les widgets sauf ceux ayant un intervalle spécifique. Le rafraîchissement se met automatiquement en pause lorsque l'onglet est inactif.
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6 pt-4 border-t border-line">
          <app-button variant="secondary" (onClick)="onClose.emit()">
            Annuler
          </app-button>
          <app-button variant="primary" (onClick)="save()">
            Enregistrer
          </app-button>
        </div>
      </div>
    </app-modal>
  `
})
export class DashboardSettingsModalComponent implements OnChanges {
  @Input() dashboard: Dashboard | null = null;
  @Input() open: boolean = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<Dashboard>();
  draft: Dashboard | null = null;
  activeTab: Tab = 'general';
  refreshOptions = REFRESH_OPTIONS;
  constructor(private dashboardService: DashboardService, private queryService: QueryService, private auditService: AuditService, private userService: UserService) {}
  get sources() {
    if (!this.dashboard) return [];
    const usedFieldIds = new Set<string>();
    this.dashboard.widgets.forEach(w => {
      if (w.queryId) {
        const query = this.queryService.queries.find(q => q.id === w.queryId);
        if (query) {
          if (query.groupByFieldIds?.length) {
            query.groupByFieldIds.forEach(id => usedFieldIds.add(id));
          }
          if (query.aggregationFieldId) {
            usedFieldIds.add(query.aggregationFieldId);
          }
          if (query.selectedFieldIds?.length) {
            query.selectedFieldIds.forEach(id => usedFieldIds.add(id));
          }
        }
      }
    });
    const activeFields: CatalogField[] = [];
    const catalogSources = this.queryService.catalogSources;
    catalogSources.forEach((source: DataSource) => {
      source.fields.forEach((f: DataField) => {
        const matchKey = f.key || f.id;
        if (usedFieldIds.has(matchKey)) {
          activeFields.push({ ...f, sourceId: source.id, sourceLabel: source.label });
        }
      });
    });
    if (activeFields.length > 0) {
      return [{
        id: 'dashboard_fields',
        label: 'Champs utilisés dans ce tableau',
        fields: activeFields
      }];
    }
    return catalogSources;
  }
  ngOnChanges(): void {
    if (this.dashboard) {
      this.draft = JSON.parse(JSON.stringify(this.dashboard));
    }
  }
  updateTags(val: string) {
    if (this.draft) {
      this.draft.tags = val.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
    }
  }
  addFilter() {
    if (!this.draft) return;
    const f: GlobalFilter = {
      id: uid('gf'),
      name: 'nouveau',
      label: 'Nouveau filtre',
      input: 'select',
      options: ['Option A', 'Option B'],
      defaultValue: 'Option A',
      readerVisible: true
    };
    this.draft.globalFilters = [...(this.draft.globalFilters || []), f];
  }
  removeFilter(id: string) {
    if (!this.draft) return;
    this.draft.globalFilters = this.draft.globalFilters.filter((f) => f.id !== id);
  }
  save() {
    if (this.draft) {
      this.onSave.emit(this.draft);
      this.onClose.emit();
    }
  }
  updateFilterOptions(filter: GlobalFilter, val: string) {
    filter.options = val.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (!filter.options.includes(filter.defaultValue || '')) {
      filter.defaultValue = filter.options.length > 0 ? filter.options[0] : '';
    }
  }
}

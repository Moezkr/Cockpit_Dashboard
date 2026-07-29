import { DashboardService } from '@pages/dashboard/services/dashboard.service';
import { QueryService } from '@pages/query/services/query.service';
import { AuditService, AuditLogEntry } from '@pages/settings/services/audit.service';
import { UserService, UserProfile } from '@core/services/user.service';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Dashboard, Widget, WidgetLayout, WidgetType } from '@core/models/types';
import {
  findNextAvailablePosition,
  normalizeWidgetLayouts,
  resolveWidgetLayouts,
  applyWidgetLayouts,
  WidgetLayouts
} from '@pages/dashboard/services/dashboard-layout.service';
import { widgetMeta } from '@pages/dashboard/services/widget-catalog.service';
import { uid } from '@core/services/utils';
import { ButtonComponent } from '@shared/components/ui/button.component';
import { BadgeComponent } from '@shared/components/ui/badge.component';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
import { DashboardGridComponent } from '@pages/dashboard/components/grid/dashboard-grid.component';
import { WidgetCardComponent } from '@pages/dashboard/components/widgets/widget-card.component';
import { WidgetCatalogPanelComponent } from '@pages/dashboard/components/editor/widget-catalog-panel.component';
import { WidgetConfigPanelComponent } from '@pages/dashboard/components/editor/widget-config-panel.component';
import { DashboardSettingsModalComponent } from '@pages/dashboard/components/editor/dashboard-settings-modal.component';
import { FilterBarComponent } from '@pages/dashboard/components/viewer/filter-bar.component';
import { ConfirmModalComponent } from '@shared/components/ui/confirm-modal.component';
import { resolveDashboardRuntimeFilters, RuntimeQueryFilter } from '@pages/dashboard/services/dashboard-filters.service';

@Component({
  selector: 'app-dashboard-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    BadgeComponent,
    SvgIconComponent,
    DashboardGridComponent,
    WidgetCardComponent,
    WidgetCatalogPanelComponent,
    WidgetConfigPanelComponent,
    DashboardSettingsModalComponent,
    FilterBarComponent,
    ConfirmModalComponent
  ],
  template: `
    <div *ngIf="loading" class="flex h-full items-center justify-center text-xs text-ink-faint gap-2">
      <div class="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent"></div>
      Chargement de l'éditeur...
    </div>

    <div *ngIf="!loading && draft; else notFound" class="flex h-full w-full flex-col bg-surface-muted">
      <header class="flex h-12 flex-shrink-0 items-center justify-between gap-2 border-b border-line bg-white px-3">
        <div class="flex items-center gap-2 min-w-0">
          <app-button variant="ghost" size="sm" (onClick)="navigateBack()">
            <app-svg-icon name="ArrowLeft" class="h-4 w-4 sm:mr-1"></app-svg-icon>
            <span class="hidden sm:inline">Retour</span>
          </app-button>

          <span class="h-4 w-1 flex-shrink-0 rounded" [style.backgroundColor]="draft.color"></span>

          <input
            [(ngModel)]="draft.name"
            class="max-w-[140px] sm:max-w-[240px] truncate rounded px-1 text-xs sm:text-sm font-semibold text-ink outline-none hover:bg-surface-muted focus:bg-surface-muted focus:ring-1 focus:ring-brand"
          />

          <app-badge [tone]="draft.status === 'published' ? 'positive' : 'caution'" class="hidden md:inline-flex">
            {{ draft.status === 'published' ? 'Publié' : 'Brouillon' }}
          </app-badge>
        </div>

        <div class="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          <app-button variant="ghost" size="sm" (onClick)="showSettings = true">
            <app-svg-icon name="Settings" class="h-3.5 w-3.5 sm:mr-1"></app-svg-icon>
            <span class="hidden sm:inline">Paramètres</span>
          </app-button>

          <app-button variant="secondary" size="sm" (onClick)="preview()">
            <app-svg-icon name="Eye" class="h-3.5 w-3.5 sm:mr-1"></app-svg-icon>
            <span class="hidden sm:inline">Aperçu</span>
          </app-button>

          <app-button variant="secondary" size="sm" (onClick)="save()">
            <app-svg-icon [name]="saved ? 'Check' : 'Save'" class="h-3.5 w-3.5 sm:mr-1"></app-svg-icon>
            <span class="hidden sm:inline">{{ saved ? 'Enregistré' : 'Enregistrer' }}</span>
          </app-button>

          <app-button variant="primary" size="sm" (onClick)="save(true)">
            <app-svg-icon name="UploadCloud" class="h-3.5 w-3.5 sm:mr-1"></app-svg-icon>
            <span class="hidden sm:inline">Publier</span>
          </app-button>
        </div>
      </header>

      <div class="flex border-b border-line bg-white lg:hidden">
        <button
          (click)="mobileTab = 'catalog'"
          class="flex-1 py-2 text-center text-xs font-semibold border-b-2"
          [ngClass]="mobileTab === 'catalog' ? 'border-brand text-brand' : 'border-transparent text-ink-faint'"
        >
          Catalogue
        </button>
        <button
          (click)="mobileTab = 'canvas'"
          class="flex-1 py-2 text-center text-xs font-semibold border-b-2"
          [ngClass]="mobileTab === 'canvas' ? 'border-brand text-brand' : 'border-transparent text-ink-faint'"
        >
          Canvas ({{ draft.widgets.length }})
        </button>
        <button
          (click)="mobileTab = 'inspector'"
          class="flex-1 py-2 text-center text-xs font-semibold border-b-2"
          [ngClass]="mobileTab === 'inspector' ? 'border-brand text-brand' : 'border-transparent text-ink-faint'"
        >
          Inspecteur
        </button>
      </div>

      <div class="flex min-h-0 flex-1 bg-white relative overflow-hidden">
        <div [ngClass]="['h-full bg-white flex-shrink-0', isMobile ? (mobileTab === 'catalog' ? 'w-full block' : 'hidden') : 'block']">
          <app-widget-catalog-panel (onAdd)="addWidget($event)"></app-widget-catalog-panel>
        </div>

        <main
          [ngClass]="['flex flex-col min-w-0 flex-1 overflow-hidden bg-surface-muted h-full', isMobile ? (mobileTab === 'canvas' ? 'block' : 'hidden') : 'block']"
        >
          <app-filter-bar
            *ngIf="draft.globalFilters && draft.globalFilters.length > 0"
            [filters]="draft.globalFilters"
            [values]="filterValues"
            (onChange)="updateFilter($event.id, $event.value)"
            (onReset)="resetFilters()"
          ></app-filter-bar>

          <div class="flex-1 overflow-auto p-2 sm:p-4">
            <section class="mx-auto max-w-[1500px]">
              <div class="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2 shadow-card">
              <div class="flex items-center gap-2">
                <div class="flex h-7 w-7 items-center justify-center rounded bg-brand-soft text-brand-strong flex-shrink-0">
                  <app-svg-icon name="LayoutGrid" class="h-4 w-4"></app-svg-icon>
                </div>
                <div>
                  <p class="text-xs font-semibold text-ink">Canvas de composition</p>
                  <p class="text-2xs text-ink-faint hidden sm:block">
                    Glissez la poignée d’un widget, puis utilisez ses bords ou son coin pour le redimensionner.
                  </p>
                </div>
              </div>
              <div class="rounded-md bg-surface-muted px-2 py-1 text-2xs font-medium tabular-nums text-ink-soft">
                {{ draft.columns }} colonnes · {{ draft.widgets.length }} widget{{ draft.widgets.length > 1 ? 's' : '' }}
              </div>
            </div>

            <div *ngIf="draft.widgets.length === 0" class="flex flex-col items-center justify-center py-16 text-center text-ink-faint">
              <app-svg-icon name="LayoutGrid" class="h-8 w-8 mb-2"></app-svg-icon>
              <span class="text-xs font-semibold">Grille vide</span>
              <span class="text-2xs">Ajoutez un widget depuis le catalogue à gauche.</span>
            </div>

            <app-dashboard-grid
              *ngIf="draft.widgets.length > 0"
              [columns]="draft.columns"
              [widgets]="draft.widgets"
              [editable]="true"
              [selectedId]="selectedId"
              (onSelect)="onSelectWidget($event)"
              (onLayoutsChange)="updateLayouts($event)"
              [widgetTemplate]="widgetTmpl"
            ></app-dashboard-grid>

            <ng-template #widgetTmpl let-widget>
              <app-widget-card [widget]="widget" [dashboard]="draft" [compact]="true" [runtimeFilters]="runtimeFilters"></app-widget-card>
            </ng-template>
            </section>
          </div>
        </main>

        <div [ngClass]="['h-full bg-white flex-shrink-0', isMobile ? (mobileTab === 'inspector' ? 'w-full block' : 'hidden') : 'block']">
          <app-widget-config-panel
            [widget]="selectedWidget"
            [columns]="draft.columns"
            (onChange)="updateWidget($event)"
            (onLayoutChange)="updateLayout($event.widgetId, $event.layout)"
            (onDelete)="deleteWidget($event)"
          ></app-widget-config-panel>
        </div>
      </div>

      <app-dashboard-settings-modal
        [dashboard]="draft"
        [open]="showSettings"
        (onClose)="showSettings = false"
        (onSave)="applySettings($event)"
      ></app-dashboard-settings-modal>

      <app-confirm-modal
        [open]="showResetConfirm"
        title="Réinitialiser les filtres"
        message="Êtes-vous sûr de vouloir supprimer tous les filtres globaux de ce tableau de bord ?"
        (onClose)="showResetConfirm = false"
        (onConfirm)="confirmResetFilters()"
      ></app-confirm-modal>

      <app-confirm-modal
        [open]="!!widgetToDeleteId"
        title="Supprimer le widget"
        message="Êtes-vous sûr de vouloir supprimer ce widget de votre tableau de bord ? Cette action est irréversible."
        (onClose)="widgetToDeleteId = null"
        (onConfirm)="confirmDeleteWidget()"
      ></app-confirm-modal>
    </div>

    <ng-template #notFound>
      <div class="flex h-full items-center justify-center text-sm text-ink-faint">
        Tableau de bord introuvable.
        <app-button class="ml-2" (onClick)="navigateBack()">Retour</app-button>
      </div>
    </ng-template>
  `
})
export class DashboardEditorComponent implements OnInit, OnDestroy {
  draft: Dashboard | null = null;
  loading: boolean = true;
  selectedId: string | undefined;
  showSettings: boolean = false;
  saved: boolean = false;
  sub!: Subscription;
  private dashboardsSub!: Subscription;
  mobileTab: 'catalog' | 'canvas' | 'inspector' = 'canvas';
  isMobile: boolean = false;
  filterValues: Record<string, string> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dashboardService: DashboardService, private queryService: QueryService, private auditService: AuditService, private userService: UserService
  ) {
    this.checkMobile();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  checkMobile() {
    this.isMobile = window.innerWidth < 1024;
  }

  ngOnInit(): void {
    this.loading = true;
    this.dashboardService.loadFromBackend();
    this.queryService.loadFromBackend();

    this.sub = this.route.params.subscribe((params) => {
      const id = params['id'];
      this.dashboardsSub?.unsubscribe();
      this.dashboardsSub = this.dashboardService.dashboards$.subscribe((list) => {
        const stored = list.find((d) => d.id === id);
        if (stored && !this.draft) {
          this.draft = JSON.parse(JSON.stringify(stored));
          if (this.draft) {
            this.filterValues = Object.fromEntries(
              this.draft.globalFilters.map((f) => [f.id, f.defaultValue || 'TOUS'])
            );
          }
          this.selectedId = undefined;
        }
        this.loading = false;
      });
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
    if (this.dashboardsSub) this.dashboardsSub.unsubscribe();
  }

  get runtimeFilters(): RuntimeQueryFilter[] {
    return this.draft
      ? resolveDashboardRuntimeFilters(this.draft.globalFilters, this.filterValues)
      : [];
  }

  updateFilter(id: string, val: string) {
    this.filterValues = { ...this.filterValues, [id]: val };
  }

  resetFilters() {
    if (!this.draft) return;
    this.showResetConfirm = true;
  }

  confirmResetFilters() {
    if (!this.draft) return;
    this.draft.globalFilters = [];
    this.filterValues = {};
    this.showResetConfirm = false;
    this.save(false);
  }

  showResetConfirm: boolean = false;
  widgetToDeleteId: string | null = null;

  get selectedWidget(): Widget | null {
    if (!this.draft || !this.selectedId) return null;
    return this.draft.widgets.find((w) => w.id === this.selectedId) ?? null;
  }

  onSelectWidget(id?: string) {
    this.selectedId = id;
    if (this.isMobile && id) {
      this.mobileTab = 'inspector';
    }
  }

  navigateBack() {
    if (this.draft) {
      this.save();
      this.router.navigate(['/tableau', this.draft.id]);
    } else {
      this.router.navigate(['/']);
    }
  }

  preview() {
    this.save();
    if (this.draft) {
      this.router.navigate(['/tableau', this.draft.id]);
    }
  }

  save(publish?: boolean) {
    if (!this.draft) return;
    const next: Dashboard = publish
      ? { ...this.draft, status: 'published' }
      : this.draft;
    this.dashboardService.upsertDashboard(next);
    this.draft = next;
    this.saved = true;
    setTimeout(() => (this.saved = false), 1500);
  }

  addWidget(type: WidgetType) {
    if (!this.draft) return;
    const meta = widgetMeta(type);
    const defaultW = meta?.defaultW ?? 4;
    const defaultH = meta?.defaultH ?? 3;
    const label = meta?.label ?? 'Nouveau widget';
    const desired = {
      x: 0,
      y: 0,
      w: Math.min(defaultW, this.draft.columns),
      h: Math.max(1, defaultH)
    };
    const layout = findNextAvailablePosition(
      this.draft.widgets.map((w) => w.layout),
      this.draft.columns,
      desired
    );
    const widget: Widget = {
      id: uid('w'),
      type,
      title: label,
      showTitle: true,
      refreshInterval: 'inherit',
      layout,
      ...(type === 'kpi' ? { kpiFormat: 'amount' } : {}),
      ...(type === 'text' ? { text: '' } : {})
    };
    this.draft.widgets = [...this.draft.widgets, widget];
    this.selectedId = widget.id;
    if (this.isMobile) {
      this.mobileTab = 'canvas';
    }
  }

  updateWidget(widget: Widget) {
    if (!this.draft) return;
    this.draft.widgets = this.draft.widgets.map((item) =>
      item.id === widget.id ? widget : item
    );
  }

  updateLayouts(layouts: WidgetLayouts) {
    if (!this.draft) return;
    this.draft.widgets = applyWidgetLayouts(this.draft.widgets, layouts);
  }

  updateLayout(widgetId: string, layout: WidgetLayout) {
    if (!this.draft) return;
    const resolved = resolveWidgetLayouts(
      this.draft.widgets,
      widgetId,
      layout,
      this.draft.columns
    );
    this.updateLayouts(resolved);
  }

  deleteWidget(widgetId: string) {
    if (!this.draft) return;
    this.widgetToDeleteId = widgetId;
  }

  confirmDeleteWidget() {
    if (!this.draft || !this.widgetToDeleteId) return;
    this.draft.widgets = this.draft.widgets.filter((w) => w.id !== this.widgetToDeleteId);
    if (this.selectedId === this.widgetToDeleteId) this.selectedId = undefined;
    this.widgetToDeleteId = null;
  }

  applySettings(dashboard: Dashboard) {
    this.draft = {
      ...dashboard,
      widgets: normalizeWidgetLayouts(dashboard.widgets, dashboard.columns)
    };

    this.dashboardService.upsertDashboard(this.draft);
  }
}

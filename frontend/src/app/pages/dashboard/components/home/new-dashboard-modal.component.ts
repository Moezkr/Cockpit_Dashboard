import { DashboardService } from '@pages/dashboard/services/dashboard.service';
import { QueryService } from '@pages/query/services/query.service';
import { AuditService, AuditLogEntry } from '@pages/settings/services/audit.service';
import { UserService, UserProfile } from '@core/services/user.service';
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalComponent } from '@shared/components/ui/modal.component';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
import { ButtonComponent } from '@shared/components/ui/button.component';

const COLOR_PALETTE = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#dc2626', '#0891b2'];

@Component({
  selector: 'app-new-dashboard-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, SvgIconComponent, ButtonComponent],
  template: `
    <app-modal
      [open]="open"
      (onClose)="handleClose()"
      title="Nouveau tableau de bord"
    >
      <div class="space-y-4 text-xs">
        <div>
          <label class="block text-2xs font-semibold uppercase tracking-wide text-ink-faint mb-1">
            NOM
          </label>
          <input
            [(ngModel)]="name"
            placeholder="ex : Suivi de trésorerie Q3"
            class="h-9 w-full rounded-md border border-line-strong bg-white px-3 text-xs outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
          />
        </div>

        <div>
          <label class="block text-2xs font-semibold uppercase tracking-wide text-ink-faint mb-1">
            DESCRIPTION <span class="font-normal text-ink-faint">— optionnel</span>
          </label>
          <textarea
            rows="2"
            [(ngModel)]="description"
            placeholder="À quoi sert ce tableau de bord ?"
            class="w-full rounded-md border border-line-strong bg-white p-2.5 text-xs outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all resize-none"
          ></textarea>
        </div>

        <div>
          <label class="block text-2xs font-semibold uppercase tracking-wide text-ink-faint mb-1.5">
            COULEUR D'IDENTIFICATION
          </label>
          <div class="flex items-center gap-2">
            <button
              *ngFor="let c of colors"
              type="button"
              (click)="selectedColor = c"
              class="h-7 w-7 rounded-full transition-transform hover:scale-110 relative flex items-center justify-center cursor-pointer"
              [style.backgroundColor]="c"
            >
              <div
                *ngIf="selectedColor === c"
                class="h-2.5 w-2.5 rounded-full bg-white shadow-sm"
              ></div>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-2xs font-semibold uppercase tracking-wide text-ink-faint mb-1.5">
            MODÈLE DE DÉPART
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              *ngFor="let t of templateOptions"
              type="button"
              (click)="selectedTemplate = t.id"
              class="flex items-start gap-2.5 rounded-lg border p-3 text-left transition-all cursor-pointer"
              [ngClass]="selectedTemplate === t.id ? 'border-brand bg-brand-soft/30 ring-1 ring-brand' : 'border-line hover:border-line-strong bg-white'"
            >
              <div
                class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-surface-muted text-ink-soft mt-0.5"
                [ngClass]="selectedTemplate === t.id ? 'bg-brand-soft text-brand-strong' : ''"
              >
                <app-svg-icon [name]="t.icon" class="h-4 w-4"></app-svg-icon>
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-xs font-semibold text-ink" [class.text-brand-strong]="selectedTemplate === t.id">
                  {{ t.name }}
                </div>
                <div class="text-2xs text-ink-faint line-clamp-2">
                  {{ t.description }}
                </div>
              </div>
            </button>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 border-t border-line pt-3 mt-4">
          <app-button variant="secondary" size="md" (onClick)="handleClose()">
            Annuler
          </app-button>
          <app-button variant="primary" size="md" (onClick)="submit()">
            Créer et éditer
          </app-button>
        </div>
      </div>
    </app-modal>
  `
})
export class NewDashboardModalComponent implements OnChanges {
  @Input() open: boolean = false;
  @Output() onClose = new EventEmitter<void>();

  name: string = '';
  description: string = '';
  selectedColor: string = COLOR_PALETTE[0];
  selectedTemplate: string = 'blank';
  isSubmitting: boolean = false;

  colors = COLOR_PALETTE;

  templateOptions = [
    {
      id: 'blank',
      name: 'Tableau de bord vide',
      description: 'Partez d’une grille vierge.',
      icon: 'LayoutGrid'
    },
    {
      id: 'd-tresorerie',
      name: 'Suivi de trésorerie',
      description: 'CA, encours et recouvrement.',
      icon: 'Table'
    },
    {
      id: 'd-ventes',
      name: 'Suivi des ventes',
      description: 'Performance commerciale.',
      icon: 'LineChart'
    },
    {
      id: 'd-rh',
      name: 'Tableau de bord RH',
      description: 'Effectifs et masse salariale.',
      icon: 'List'
    }
  ];

  constructor(
    private dashboardService: DashboardService, private queryService: QueryService, private auditService: AuditService, private userService: UserService,
    private router: Router
  ) {}

  ngOnChanges(): void {
    if (this.open) {
      this.name = '';
      this.description = '';
      this.selectedColor = COLOR_PALETTE[0];
      this.selectedTemplate = 'blank';
      this.isSubmitting = false;
    }
  }

  handleClose() {
    if (this.isSubmitting) return;
    this.onClose.emit();
  }

  submit() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    let widgets: any[] = [];
    if (this.selectedTemplate !== 'blank') {
      const tmpl = this.dashboardService.dashboards.find((d) => d.id === this.selectedTemplate);
      if (tmpl) {
        widgets = JSON.parse(JSON.stringify(tmpl.widgets));
      }
    }

    this.dashboardService.createDashboard({
      name: this.name.trim() || 'Nouveau tableau de bord',
      description: this.description.trim(),
      color: this.selectedColor,
      widgets
    }).subscribe({
      next: (created) => {
        this.isSubmitting = false;
        this.onClose.emit();
        this.router.navigate(['/editeur', created.id]);
      },
      error: () => {
        this.isSubmitting = false;
        this.onClose.emit();
      }
    });
  }
}

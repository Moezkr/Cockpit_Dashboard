import { DashboardService } from '@pages/dashboard/services/dashboard.service';
import { QueryService } from '@pages/query/services/query.service';
import { AuditService, AuditLogEntry } from '@pages/settings/services/audit.service';
import { UserService, UserProfile } from '@core/services/user.service';
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dashboard } from '@core/models/types';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
interface AccessPerson {
  id: string;
  initials: string;
  name: string;
  role: 'READ' | 'EDIT' | 'OWNER';
}
@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgIconComponent],
  template: `
    <div *ngIf="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-[500px] rounded-xl bg-white shadow-pop overflow-hidden transition-all">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 class="text-sm font-bold text-ink">
            Partager — {{ dashboard?.name || 'Tableau de bord' }}
          </h2>
          <button
            type="button"
            (click)="onClose.emit()"
            class="rounded-md p-1 text-ink-faint hover:bg-surface-sunken hover:text-ink transition-colors"
          >
            <app-svg-icon name="X" class="h-4 w-4"></app-svg-icon>
          </button>
        </div>
        <!-- Content Body -->
        <div class="p-5 space-y-5 text-xs">
          <!-- NIVEAU DE PARTAGE -->
          <div>
            <div class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              NIVEAU DE PARTAGE
            </div>
            <div class="space-y-2">
              <!-- Privé -->
              <div
                (click)="setShareLevel('private')"
                class="flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all"
                [ngClass]="selectedLevel === 'private' ? 'border-brand bg-blue-50/60 ring-1 ring-brand' : 'border-line hover:border-line-strong bg-white'"
              >
                <div class="flex items-center gap-3">
                  <div class="text-ink-soft">
                    <app-svg-icon name="Lock" class="h-4 w-4"></app-svg-icon>
                  </div>
                  <div>
                    <div class="font-bold text-ink text-xs">Privé</div>
                    <div class="text-[11px] text-ink-faint">Vous uniquement.</div>
                  </div>
                </div>
                <div class="flex items-center justify-center">
                  <div
                    class="h-4 w-4 rounded-full border flex items-center justify-center"
                    [ngClass]="selectedLevel === 'private' ? 'border-brand bg-brand' : 'border-line-strong bg-white'"
                  >
                    <div *ngIf="selectedLevel === 'private'" class="h-1.5 w-1.5 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
              <!-- Utilisateurs désignés -->
              <div
                (click)="setShareLevel('users')"
                class="flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all"
                [ngClass]="selectedLevel === 'users' ? 'border-brand bg-blue-50/60 ring-1 ring-brand' : 'border-line hover:border-line-strong bg-white'"
              >
                <div class="flex items-center gap-3">
                  <div class="text-ink-soft">
                    <app-svg-icon name="User" class="h-4 w-4"></app-svg-icon>
                  </div>
                  <div>
                    <div class="font-bold text-ink text-xs">Utilisateurs désignés</div>
                    <div class="text-[11px] text-ink-faint">Personnes spécifiques.</div>
                  </div>
                </div>
                <div class="flex items-center justify-center">
                  <div
                    class="h-4 w-4 rounded-full border flex items-center justify-center"
                    [ngClass]="selectedLevel === 'users' ? 'border-brand bg-brand' : 'border-line-strong bg-white'"
                  >
                    <div *ngIf="selectedLevel === 'users'" class="h-1.5 w-1.5 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
              <!-- Groupe / équipe -->
              <div
                (click)="setShareLevel('group')"
                class="flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all"
                [ngClass]="selectedLevel === 'group' ? 'border-brand bg-blue-50/60 ring-1 ring-brand' : 'border-line hover:border-line-strong bg-white'"
              >
                <div class="flex items-center gap-3">
                  <div class="text-ink-soft">
                    <app-svg-icon name="Users" class="h-4 w-4"></app-svg-icon>
                  </div>
                  <div>
                    <div class="font-bold text-ink text-xs">Groupe / équipe</div>
                    <div class="text-[11px] text-ink-faint">Tous les membres d'un groupe.</div>
                  </div>
                </div>
                <div class="flex items-center justify-center">
                  <div
                    class="h-4 w-4 rounded-full border flex items-center justify-center"
                    [ngClass]="selectedLevel === 'group' ? 'border-brand bg-brand' : 'border-line-strong bg-white'"
                  >
                    <div *ngIf="selectedLevel === 'group'" class="h-1.5 w-1.5 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
              <!-- Organisation -->
              <div
                (click)="setShareLevel('organization')"
                class="flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all"
                [ngClass]="selectedLevel === 'organization' ? 'border-brand bg-blue-50/60 ring-1 ring-brand' : 'border-line hover:border-line-strong bg-white'"
              >
                <div class="flex items-center gap-3">
                  <div class="text-ink-soft">
                    <app-svg-icon name="Globe" class="h-4 w-4"></app-svg-icon>
                  </div>
                  <div>
                    <div class="font-bold text-ink text-xs">Organisation</div>
                    <div class="text-[11px] text-ink-faint">Tous les utilisateurs authentifiés.</div>
                  </div>
                </div>
                <div class="flex items-center justify-center">
                  <div
                    class="h-4 w-4 rounded-full border flex items-center justify-center"
                    [ngClass]="selectedLevel === 'organization' ? 'border-brand bg-brand' : 'border-line-strong bg-white'"
                  >
                    <div *ngIf="selectedLevel === 'organization'" class="h-1.5 w-1.5 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- PERSONNES AYANT ACCÈS -->
          <div *ngIf="selectedLevel !== 'private'">
            <div class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              PERSONNES AYANT ACCÈS
            </div>
            <div class="overflow-hidden rounded-xl border border-line bg-white divide-y divide-line">
              <div
                *ngFor="let p of accessList"
                class="flex items-center justify-between px-3 py-2.5"
              >
                <div class="flex items-center gap-2.5">
                  <div class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
                    {{ p.initials }}
                  </div>
                  <span class="font-semibold text-ink text-xs">{{ p.name }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <select
                    [(ngModel)]="p.role"
                    class="h-7 rounded-lg border border-line-strong bg-white px-2 text-xs font-medium text-ink outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="READ">Lecture</option>
                    <option value="EDIT">Édition</option>
                    <option value="OWNER">Propriétaire</option>
                  </select>
                  <button
                    type="button"
                    (click)="removePerson(p.id)"
                    class="p-1 text-ink-faint hover:text-negative rounded transition-colors"
                  >
                    <app-svg-icon name="X" class="h-3.5 w-3.5"></app-svg-icon>
                  </button>
                </div>
              </div>
            </div>
            <p class="mt-2 text-[11px] text-ink-faint">
              Les bénéficiaires reçoivent une notification avec un lien direct vers le tableau de bord.
            </p>
          </div>
        </div>
        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-2 border-t border-line bg-surface-muted/30 px-5 py-3.5">
          <button
            type="button"
            (click)="onClose.emit()"
            class="rounded-lg border border-line-strong bg-white px-4 py-2 text-xs font-semibold text-ink hover:bg-surface-sunken transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            (click)="save()"
            class="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-strong shadow-2xs transition-colors"
          >
            Enregistrer le partage
          </button>
        </div>
      </div>
    </div>
  `
})
export class ShareModalComponent implements OnChanges {
  @Input() dashboard: Dashboard | null = null;
  @Input() open: boolean = false;
  @Output() onClose = new EventEmitter<void>();
  selectedLevel: 'private' | 'users' | 'group' | 'organization' = 'organization';
  accessList: AccessPerson[] = [
    { id: '1', initials: 'SB', name: 'Sonia Ben Youssef', role: 'EDIT' },
    { id: '2', initials: 'KJ', name: 'Karim Jelassi', role: 'READ' },
    { id: '3', initials: 'ÉF', name: 'Équipe Finance', role: 'READ' }
  ];
  constructor(private dashboardService: DashboardService, private queryService: QueryService, private auditService: AuditService, private userService: UserService) {}
  ngOnChanges(): void {
    if (this.dashboard && this.dashboard.shareLevel) {
      this.selectedLevel = this.dashboard.shareLevel as any;
    }
  }
  setShareLevel(level: 'private' | 'users' | 'group' | 'organization'): void {
    this.selectedLevel = level;
  }
  removePerson(id: string): void {
    this.accessList = this.accessList.filter((p) => p.id !== id);
  }
  save(): void {
    if (this.dashboard) {
      this.dashboard.shareLevel = this.selectedLevel as any;
      this.dashboardService.upsertDashboard(this.dashboard);
      const levelLabel =
        this.selectedLevel === 'organization'
          ? 'Organisation'
          : this.selectedLevel === 'group'
          ? 'Groupe / équipe'
          : this.selectedLevel === 'users'
          ? 'Utilisateurs désignés'
          : 'Privé';
      this.auditService.logAuditEvent(
        'Partage du tableau de bord',
        `${this.dashboard.name} · ${levelLabel}`,
        'DASHBOARD',
        this.dashboard.id
      );
    }
    this.onClose.emit();
  }
}

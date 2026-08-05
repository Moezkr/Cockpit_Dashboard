import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@shared/components/ui/button.component';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent, SvgIconComponent],
  template: `
    <div *ngIf="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-ink/40 dark:bg-black/60 backdrop-blur-xs" (click)="onClose.emit()"></div>
      <div class="relative w-full max-w-sm overflow-hidden rounded-xl border border-line dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-pop transition-all text-center">
        <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40 text-negative">
          <app-svg-icon name="Trash2" class="h-6 w-6"></app-svg-icon>
        </div>
        <h3 class="text-base font-bold text-ink dark:text-white mb-1">
          {{ title || 'Confirmation de suppression' }}
        </h3>
        <p class="text-xs text-ink-faint dark:text-zinc-400 mb-6 leading-relaxed">
          {{ message || 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.' }}
        </p>
        <div class="flex items-center justify-center gap-3">
          <app-button variant="secondary" size="md" (onClick)="onClose.emit()">
            Annuler
          </app-button>
          <app-button variant="danger" size="md" (onClick)="onConfirm.emit()">
            Supprimer
          </app-button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmModalComponent {
  @Input() open: boolean = false;
  @Input() title: string = '';
  @Input() message: string = '';
  @Output() onClose = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<void>();
}

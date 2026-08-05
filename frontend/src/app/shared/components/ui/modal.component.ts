import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@shared/components/ui/button.component';
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div *ngIf="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-ink/40 backdrop-blur-xs" (click)="onClose.emit()"></div>
      <div
        class="relative w-full overflow-hidden rounded-xl border border-line bg-white shadow-pop transition-all max-w-lg"
        [ngClass]="width"
      >
        <div class="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 class="text-sm font-semibold text-ink">{{ title }}</h3>
          <app-button variant="ghost" size="xs" (onClick)="onClose.emit()">✕</app-button>
        </div>
        <div class="p-4 max-h-[80vh] overflow-y-auto overflow-x-hidden">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `
})
export class ModalComponent {
  @Input() open: boolean = false;
  @Input() title: string = '';
  @Input() width: string = 'max-w-lg';
  @Output() onClose = new EventEmitter<void>();
}

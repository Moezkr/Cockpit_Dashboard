import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetType } from '@core/models/types';
import { WIDGET_CATALOG, WidgetTypeMeta } from '@pages/dashboard/services/widget-catalog.service';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
@Component({
  selector: 'app-widget-catalog-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgIconComponent],
  host: {
    class: 'h-full flex flex-col flex-shrink-0 bg-white'
  },
  template: `
    <aside class="flex h-full w-64 flex-shrink-0 flex-col border-r border-line bg-white">
      <div class="border-b border-line p-3">
        <h3 class="text-xs font-semibold text-ink">CATALOGUE DE WIDGETS</h3>
        <div class="relative mt-2 flex items-center">
          <div class="pointer-events-none absolute left-2.5 flex items-center justify-center text-ink-faint">
            <app-svg-icon name="Search" class="h-3.5 w-3.5"></app-svg-icon>
          </div>
          <input
            [(ngModel)]="search"
            placeholder="Rechercher..."
            class="h-8 w-full rounded-md border border-line-strong bg-surface-muted pr-3 text-xs outline-none focus:border-brand"
            style="padding-left: 2.25rem !important;"
          />
        </div>
      </div>
      <div class="flex-1 overflow-auto p-2 space-y-1">
        <button
          *ngFor="let item of filteredCatalog"
          (click)="onAdd.emit(item.type)"
          class="flex w-full items-start gap-2.5 rounded-lg border border-line p-2 text-left transition-all hover:border-brand hover:bg-brand-soft/30 hover:shadow-card group"
        >
          <div class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-surface-muted text-ink-soft group-hover:bg-brand-soft group-hover:text-brand-strong">
            <app-svg-icon [name]="item.icon" class="h-4 w-4"></app-svg-icon>
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-xs font-semibold text-ink group-hover:text-brand-strong">
              {{ item.label }}
            </div>
            <div class="text-2xs text-ink-faint line-clamp-1">
              {{ item.description }}
            </div>
          </div>
        </button>
      </div>
    </aside>
  `
})
export class WidgetCatalogPanelComponent {
  @Output() onAdd = new EventEmitter<WidgetType>();
  search: string = '';
  catalog = WIDGET_CATALOG;
  private cachedFilteredCatalog: WidgetTypeMeta[] = [];
  private lastSearchStr: string | null = null;
  get filteredCatalog(): WidgetTypeMeta[] {
    const searchTrimmed = (this.search || '').trim().toLowerCase();
    if (searchTrimmed === this.lastSearchStr) {
      return this.cachedFilteredCatalog;
    }
    this.lastSearchStr = searchTrimmed;
    if (!searchTrimmed) {
      this.cachedFilteredCatalog = this.catalog;
    } else {
      this.cachedFilteredCatalog = this.catalog.filter(
        (w) => w.label.toLowerCase().includes(searchTrimmed) || w.description.toLowerCase().includes(searchTrimmed)
      );
    }
    return this.cachedFilteredCatalog;
  }
}

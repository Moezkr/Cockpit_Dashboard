import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Widget, WidgetLayout } from '@core/models/types';
import {
  clampWidgetLayout,
  resolveWidgetLayouts,
  WidgetLayouts
} from '@pages/dashboard/services/dashboard-layout.service';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
const ROW_H = 44;
const GAP = 8;
type InteractionMode = 'move' | 'resize-east' | 'resize-south' | 'resize-corner';
interface ActiveInteraction {
  id: string;
  mode: InteractionMode;
  pointerId: number;
  startX: number;
  startY: number;
  origin: WidgetLayout;
  captureElement: HTMLElement;
}
@Component({
  selector: 'app-dashboard-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      #container
      class="relative w-full"
      [ngClass]="editable ? 'cockpit-grid-bg rounded-lg' : ''"
      [style.height.px]="gridHeight"
      [style.backgroundSize]="backgroundSizeStyle"
      (click)="onCanvasClick($event)"
    >
      <p *ngIf="editable" id="grid-instructions" class="sr-only">
        Sélectionnez un widget. Utilisez sa poignée pour le déplacer et ses poignées de bord pour le redimensionner.
      </p>
      <div
        *ngIf="previewedLayout"
        class="pointer-events-none absolute z-30 rounded-lg border-2 border-dashed border-brand bg-brand-soft/20"
        [ngStyle]="styleForLayout(previewedLayout)"
      ></div>
      <div
        *ngFor="let widget of widgets; trackBy: trackById"
        class="group absolute"
        [ngClass]="getWidgetWrapperClass(widget)"
        [ngStyle]="styleForLayout(getLayout(widget), widget)"
        (click)="onWidgetClick($event, widget)"
        (focus)="onWidgetFocus(widget)"
        (keydown)="handleWidgetKeyDown(widget, $event)"
        [attr.tabindex]="editable ? 0 : null"
      >
        <div
          class="h-full"
          [ngClass]="[
            editable && selectedId === widget.id ? 'rounded-lg ring-2 ring-brand ring-offset-2' : '',
            editable && activeId === widget.id ? 'cursor-grabbing opacity-90' : ''
          ]"
        >
          <ng-container
            *ngTemplateOutlet="widgetTemplate; context: { $implicit: widget }"
          ></ng-container>
        </div>
        <ng-container *ngIf="editable">
          <button
            type="button"
            [attr.aria-label]="'Déplacer ' + widget.title"
            (pointerdown)="beginInteraction('move', widget, $event)"
            class="absolute left-1 top-1 z-30 inline-flex h-6 w-6 cursor-grab touch-none items-center justify-center rounded-md border border-line bg-white text-ink-soft shadow-card transition-opacity hover:bg-surface-muted active:cursor-grabbing focus-visible:opacity-100"
            [ngClass]="selectedId === widget.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'"
          >
            ⋮⋮
          </button>
          <button
            type="button"
            [attr.aria-label]="'Agrandir ou réduire la largeur de ' + widget.title"
            (pointerdown)="beginInteraction('resize-east', widget, $event)"
            class="absolute -right-1 top-1/2 z-30 flex h-8 w-3 cursor-col-resize -translate-y-1/2 touch-none items-center justify-center rounded-r-md border border-line bg-white text-brand shadow-card transition-opacity hover:bg-brand-soft focus-visible:opacity-100"
            [ngClass]="selectedId === widget.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'"
          >
            ↔
          </button>
          <button
            type="button"
            [attr.aria-label]="'Agrandir ou réduire la hauteur de ' + widget.title"
            (pointerdown)="beginInteraction('resize-south', widget, $event)"
            class="absolute -bottom-1 left-1/2 z-30 flex h-3 w-8 cursor-row-resize -translate-x-1/2 touch-none items-center justify-center rounded-b-md border border-line bg-white text-brand shadow-card transition-opacity hover:bg-brand-soft focus-visible:opacity-100"
            [ngClass]="selectedId === widget.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'"
          >
            ↕
          </button>
          <button
            type="button"
            [attr.aria-label]="'Redimensionner ' + widget.title"
            (pointerdown)="beginInteraction('resize-corner', widget, $event)"
            class="absolute -bottom-1 -right-1 z-40 flex h-6 w-6 cursor-se-resize touch-none items-center justify-center rounded-md border border-brand bg-white text-brand shadow-pop transition-opacity hover:bg-brand-soft focus-visible:opacity-100"
            [ngClass]="selectedId === widget.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'"
          >
            ⤢
          </button>
        </ng-container>
      </div>
      <div
        *ngIf="previewedLayout && activeId"
        class="pointer-events-none absolute bottom-2 left-2 z-40 rounded-md bg-ink px-2 py-1 text-2xs font-medium tabular-nums text-white shadow-pop"
      >
        Col. {{ previewedLayout.x + 1 }} · Lig. {{ previewedLayout.y + 1 }} ·
        {{ previewedLayout.w }} × {{ previewedLayout.h }}
      </div>
    </div>
  `
})
export class DashboardGridComponent {
  @Input() columns: number = 12;
  @Input() widgets: Widget[] = [];
  @Input() editable: boolean = false;
  @Input() selectedId?: string;
  @Input() widgetTemplate: any;
  @Output() onLayoutsChange = new EventEmitter<WidgetLayouts>();
  @Output() onSelect = new EventEmitter<string | undefined>();
  @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;
  activeInteraction: ActiveInteraction | null = null;
  activeId: string | null = null;
  previewLayouts: WidgetLayouts | null = null;
  trackById(index: number, widget: Widget): string {
    return widget.id;
  }
  isMobile: boolean = false;
  @HostListener('window:resize')
  checkMobile() {
    if (typeof window !== 'undefined') {
      this.isMobile = window.innerWidth < 768;
    }
  }
  ngOnInit() {
    this.checkMobile();
  }
  get backgroundSizeStyle(): string {
    if (this.isMobile && !this.editable) return 'none';
    const percent = 100 / this.columns;
    return `calc(${percent}% + ${GAP / this.columns}px) ${ROW_H + GAP}px`;
  }
  private getMobileLayoutMap(): Record<string, { top: number; left: string; width: string; height: number }> {
    const map: Record<string, { top: number; left: string; width: string; height: number }> = {};
    const sorted = [...this.widgets].sort((a, b) => {
      const la = this.getLayout(a);
      const lb = this.getLayout(b);
      return la.y !== lb.y ? la.y - lb.y : la.x - lb.x;
    });
    let currentY = 0;
    let inKpiRow = false;
    let kpiRowY = 0;
    const isSmallPhone = typeof window !== 'undefined' ? window.innerWidth < 480 : false;
    for (let i = 0; i < sorted.length; i++) {
      const w = sorted[i];
      const l = this.getLayout(w);
      const isKpi = w.type === 'kpi' || (l.w <= 4 && l.h <= 3);
      if (isKpi) {
        if (inKpiRow) {
          currentY = kpiRowY + 130 + GAP;
          inKpiRow = false;
        }
        let kpiHeight = 130;
        map[w.id] = { top: currentY, left: '0px', width: '100%', height: kpiHeight };
        currentY += kpiHeight + GAP;
      } else {
        if (inKpiRow) {
          currentY = kpiRowY + 130 + GAP;
          inKpiRow = false;
        }
        let h = 250;
        if (w.type === 'datagrid') h = 360;
        else if (w.type === 'kpi') h = 130;
        else if (l.h > 6) h = 320;
        map[w.id] = { top: currentY, left: '0px', width: '100%', height: h };
        currentY += h + GAP;
      }
    }
    return map;
  }
  get gridHeight(): number {
    if (this.isMobile && !this.editable) {
      const mobileMap = this.getMobileLayoutMap();
      let maxBottom = 0;
      Object.values(mobileMap).forEach(m => {
        maxBottom = Math.max(maxBottom, m.top + m.height);
      });
      return maxBottom || 400;
    }
    const layouts =
      this.previewLayouts ??
      Object.fromEntries(this.widgets.map((w) => [w.id, w.layout]));
    const maxRow = this.widgets.reduce((max, w) => {
      const l = layouts[w.id] ?? w.layout;
      return Math.max(max, l.y + l.h);
    }, 0);
    const gridRows = Math.max(2, maxRow + (this.editable ? 3 : 0));
    return gridRows * (ROW_H + GAP) - GAP;
  }
  get previewedLayout(): WidgetLayout | undefined {
    return this.activeId && this.previewLayouts
      ? this.previewLayouts[this.activeId]
      : undefined;
  }
  getLayout(widget: Widget): WidgetLayout {
    return (
      (this.previewLayouts && this.previewLayouts[widget.id]) || widget.layout
    );
  }
  styleForLayout(layout: WidgetLayout, widget?: Widget): Record<string, string> {
    if (this.isMobile && !this.editable && widget) {
      const mobileMap = this.getMobileLayoutMap();
      const m = mobileMap[widget.id];
      if (m) {
        return {
          left: m.left,
          top: `${m.top}px`,
          width: m.width,
          height: `${m.height}px`
        };
      }
    }
    const percent = 100 / this.columns;
    return {
      left: `calc(${layout.x * percent}% + ${(layout.x * GAP) / this.columns}px)`,
      top: `${layout.y * (ROW_H + GAP)}px`,
      width: `calc(${layout.w * percent}% - ${((this.columns - layout.w) * GAP) / this.columns}px)`,
      height: `${layout.h * ROW_H + (layout.h - 1) * GAP}px`
    };
  }
  getWidgetWrapperClass(widget: Widget): string {
    const isActive = this.activeId === widget.id;
    return `${!isActive ? 'transition-[left,top,width,height] duration-150' : ''} ${isActive ? 'z-20' : ''}`;
  }
  onCanvasClick(event: MouseEvent) {
    if (this.editable && event.target === event.currentTarget) {
      this.onSelect.emit(undefined);
    }
  }
  constructor(private router: Router) {}
  onWidgetClick(event: MouseEvent, widget: Widget) {
    if (this.editable) {
      event.stopPropagation();
      this.onSelect.emit(widget.id);
    } else if (widget.navigateToDashboardId) {
      event.stopPropagation();
      this.router.navigate(['/tableau', widget.navigateToDashboardId]);
    }
  }
  onWidgetFocus(widget: Widget) {
    if (this.editable) this.onSelect.emit(widget.id);
  }
  beginInteraction(
    mode: InteractionMode,
    widget: Widget,
    event: PointerEvent
  ) {
    if (!this.editable || (event.pointerType === 'mouse' && event.button !== 0))
      return;
    event.preventDefault();
    event.stopPropagation();
    const targetEl = event.currentTarget as HTMLElement;
    targetEl.setPointerCapture?.(event.pointerId);
    this.onSelect.emit(widget.id);
    this.activeInteraction = {
      id: widget.id,
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: widget.layout,
      captureElement: targetEl
    };
    this.activeId = widget.id;
    this.previewLayouts = resolveWidgetLayouts(
      this.widgets,
      widget.id,
      widget.layout,
      this.columns
    );
  }
  @HostListener('window:pointermove', ['$event'])
  onPointerMove(event: PointerEvent) {
    const interaction = this.activeInteraction;
    if (!interaction || event.pointerId !== interaction.pointerId) return;
    const canvasWidth = this.containerRef?.nativeElement?.clientWidth ?? 1;
    const currentColumns = Math.max(1, this.columns);
    const columnWidth =
      (canvasWidth - GAP * (currentColumns - 1)) / currentColumns;
    const deltaX = Math.round(
      (event.clientX - interaction.startX) / (columnWidth + GAP)
    );
    const deltaY = Math.round(
      (event.clientY - interaction.startY) / (ROW_H + GAP)
    );
    let requested = interaction.origin;
    if (interaction.mode === 'move') {
      requested = {
        ...interaction.origin,
        x: interaction.origin.x + deltaX,
        y: interaction.origin.y + deltaY
      };
    } else if (interaction.mode === 'resize-east') {
      requested = {
        ...interaction.origin,
        w: interaction.origin.w + deltaX
      };
    } else if (interaction.mode === 'resize-south') {
      requested = {
        ...interaction.origin,
        h: interaction.origin.h + deltaY
      };
    } else if (interaction.mode === 'resize-corner') {
      requested = {
        ...interaction.origin,
        w: interaction.origin.w + deltaX,
        h: interaction.origin.h + deltaY
      };
    }
    const next = clampWidgetLayout(requested, currentColumns);
    this.previewLayouts = resolveWidgetLayouts(
      this.widgets,
      interaction.id,
      next,
      currentColumns
    );
  }
  @HostListener('window:pointerup', ['$event'])
  onPointerUp(event: PointerEvent) {
    if (this.activeInteraction?.pointerId === event.pointerId) {
      this.commitInteraction();
    }
  }
  @HostListener('window:pointercancel', ['$event'])
  onPointerCancel(event: PointerEvent) {
    if (this.activeInteraction?.pointerId === event.pointerId) {
      this.clearInteraction();
    }
  }
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.activeInteraction) {
      event.preventDefault();
      this.clearInteraction();
    }
  }
  private clearInteraction() {
    if (this.activeInteraction?.captureElement.hasPointerCapture?.(this.activeInteraction.pointerId)) {
      this.activeInteraction.captureElement.releasePointerCapture(this.activeInteraction.pointerId);
    }
    this.activeInteraction = null;
    this.activeId = null;
    this.previewLayouts = null;
  }
  private commitInteraction() {
    if (this.previewLayouts) {
      this.onLayoutsChange.emit(this.previewLayouts);
    }
    this.clearInteraction();
  }
  handleWidgetKeyDown(widget: Widget, event: KeyboardEvent) {
    if (!this.editable) return;
    if (event.key === 'Escape') {
      this.clearInteraction();
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const current = widget.layout;
    const amount = event.altKey ? 2 : 1;
    let requested = current;
    if (event.shiftKey) {
      if (event.key === 'ArrowLeft') requested = { ...current, w: current.w - amount };
      if (event.key === 'ArrowRight') requested = { ...current, w: current.w + amount };
      if (event.key === 'ArrowUp') requested = { ...current, h: current.h - amount };
      if (event.key === 'ArrowDown') requested = { ...current, h: current.h + amount };
    } else {
      if (event.key === 'ArrowLeft') requested = { ...current, x: current.x - amount };
      if (event.key === 'ArrowRight') requested = { ...current, x: current.x + amount };
      if (event.key === 'ArrowUp') requested = { ...current, y: current.y - amount };
      if (event.key === 'ArrowDown') requested = { ...current, y: current.y + amount };
    }
    const resolved = resolveWidgetLayouts(
      this.widgets,
      widget.id,
      clampWidgetLayout(requested, this.columns),
      this.columns
    );
    this.onLayoutsChange.emit(resolved);
  }
}

import { Widget, WidgetLayout } from '@core/models/types';
export type WidgetLayouts = Record<string, WidgetLayout>;
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(value), min), max);
}
export function clampWidgetLayout(
  layout: WidgetLayout,
  columns: number
): WidgetLayout {
  const safeColumns = Math.max(1, columns);
  const w = clamp(layout.w, 1, safeColumns);
  const h = Math.max(1, Math.round(layout.h));
  return {
    x: clamp(layout.x, 0, safeColumns - w),
    y: Math.max(0, Math.round(layout.y)),
    w,
    h
  };
}
export function layoutsOverlap(a: WidgetLayout, b: WidgetLayout): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}
export function findNextAvailablePosition(
  occupied: WidgetLayout[],
  columns: number,
  desired: WidgetLayout
): WidgetLayout {
  const candidate = clampWidgetLayout(desired, columns);
  const maxX = Math.max(0, columns - candidate.w);
  const xOrder = [
    candidate.x,
    ...Array.from({ length: maxX + 1 }, (_, x) => x).filter(
      (x) => x !== candidate.x
    )
  ];
  for (let y = candidate.y; y < candidate.y + 1000; y += 1) {
    for (const x of xOrder) {
      const positioned = { ...candidate, x, y };
      if (!occupied.some((layout) => layoutsOverlap(positioned, layout))) {
        return positioned;
      }
    }
  }
  return { ...candidate, y: candidate.y + 1000 };
}
export function normalizeWidgetLayouts(
  widgets: Widget[],
  columns: number
): Widget[] {
  const occupied: WidgetLayout[] = [];
  const ordered = widgets
    .map((widget, index) => ({ widget, index }))
    .sort(
      (a, b) =>
        a.widget.layout.y - b.widget.layout.y ||
        a.widget.layout.x - b.widget.layout.x ||
        a.index - b.index
    );
  const layouts: WidgetLayouts = {};
  ordered.forEach(({ widget }) => {
    const layout = findNextAvailablePosition(occupied, columns, widget.layout);
    occupied.push(layout);
    layouts[widget.id] = layout;
  });
  return widgets.map((widget) => ({
    ...widget,
    layout: layouts[widget.id]
  }));
}
export function resolveWidgetLayouts(
  widgets: Widget[],
  widgetId: string,
  requestedLayout: WidgetLayout,
  columns: number
): WidgetLayouts {
  const edited = widgets.find((widget) => widget.id === widgetId);
  if (!edited)
    return Object.fromEntries(
      widgets.map((widget) => [widget.id, widget.layout])
    );
  const layouts: WidgetLayouts = {
    [widgetId]: clampWidgetLayout(requestedLayout, columns)
  };
  const occupied = [layouts[widgetId]];
  const orderedOthers = widgets
    .filter((widget) => widget.id !== widgetId)
    .map((widget, index) => ({ widget, index }))
    .sort(
      (a, b) =>
        a.widget.layout.y - b.widget.layout.y ||
        a.widget.layout.x - b.widget.layout.x ||
        a.index - b.index
    );
  orderedOthers.forEach(({ widget }) => {
    const layout = findNextAvailablePosition(occupied, columns, widget.layout);
    occupied.push(layout);
    layouts[widget.id] = layout;
  });
  return layouts;
}
export function applyWidgetLayouts(
  widgets: Widget[],
  layouts: WidgetLayouts
): Widget[] {
  return widgets.map((widget) =>
    layouts[widget.id] ? { ...widget, layout: layouts[widget.id] } : widget
  );
}

import { Injectable } from '@angular/core';
import { WidgetType } from '@core/models/types';
export interface WidgetCatalogItem {
  type: WidgetType;
  label: string;
  description: string;
  icon: string;
  defaultW: number;
  defaultH: number;
}
export type WidgetTypeMeta = WidgetCatalogItem;
export const WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'kpi',
    label: 'Indicateur (KPI)',
    description: 'Valeur unique avec tendance.',
    icon: 'Gauge',
    defaultW: 3,
    defaultH: 2
  },
  {
    type: 'bar',
    label: 'Graphique en barres',
    description: 'Comparaison entre catégories en bleu unifié.',
    icon: 'BarChart3',
    defaultW: 5,
    defaultH: 4
  },
  {
    type: 'stacked',
    label: 'Barres empilées',
    description: 'Composition d’un total avec barres multi-couleurs.',
    icon: 'BarChart4',
    defaultW: 5,
    defaultH: 4
  },
  {
    type: 'line',
    label: 'Graphique en courbes',
    description: 'Évolution dans le temps avec points ajustés.',
    icon: 'LineChart',
    defaultW: 6,
    defaultH: 4
  },
  {
    type: 'pie',
    label: 'Graphique circulaire',
    description: 'Répartition proportionnelle.',
    icon: 'PieChart',
    defaultW: 4,
    defaultH: 4
  },
  {
    type: 'donut',
    label: 'Graphique en anneau',
    description: 'Répartition + valeur centrale.',
    icon: 'CircleDot',
    defaultW: 4,
    defaultH: 4
  },
  {
    type: 'heatmap',
    label: 'Matrice / Heatmap',
    description: 'Cartographie thermique par cartes colorées.',
    icon: 'Grid3x3',
    defaultW: 5,
    defaultH: 4
  },
  {
    type: 'gauge',
    label: 'Jauge d’objectif',
    description: 'Niveau de réalisation.',
    icon: 'Gauge',
    defaultW: 4,
    defaultH: 3
  },
  {
    type: 'datagrid',
    label: 'Tableau de données',
    description: 'Vue tabulaire détaillée.',
    icon: 'Table',
    defaultW: 12,
    defaultH: 5
  },
  {
    type: 'text',
    label: 'Bloc de texte',
    description: 'Zone de texte libre / commentaire.',
    icon: 'Type',
    defaultW: 4,
    defaultH: 2
  }
];
export function widgetMeta(type: WidgetType): WidgetCatalogItem | undefined {
  return WIDGET_CATALOG.find((item) => item.type === type);
}
@Injectable({
  providedIn: 'root'
})
export class WidgetCatalogService {
  getCatalog(): WidgetCatalogItem[] {
    return WIDGET_CATALOG;
  }
}

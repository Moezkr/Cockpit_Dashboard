import { Routes } from '@angular/router';
import { DashboardHomeComponent } from './dashboard.component';
import { DashboardEditorComponent } from './editor.component';
import { DashboardViewerComponent } from './viewer.component';
export const routes: Routes = [
  { path: '', component: DashboardHomeComponent },
  { path: 'editeur/:id', component: DashboardEditorComponent },
  { path: 'tableau/:id', component: DashboardViewerComponent }
];

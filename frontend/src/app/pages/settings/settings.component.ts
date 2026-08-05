import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
import { AuditTableComponent } from './components/audit-table.component';
import { DashboardService } from '@pages/dashboard/services/dashboard.service';
import { QueryService } from '@pages/query/services/query.service';
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgIconComponent, AuditTableComponent],
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
  refreshIntervals = [
    'Désactivé',
    '5 secondes',
    '10 secondes',
    '30 secondes',
    '1 minute',
    '5 minutes',
    '15 minutes',
    '30 minutes',
    '1 heure'
  ];
  constructor(
    private dashboardService: DashboardService,
    private queryService: QueryService
  ) {}
  ngOnInit(): void {
    this.dashboardService.loadFromBackend();
    this.queryService.loadFromBackend();
  }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
import { AuditService, AuditLogEntry } from '@pages/settings/services/audit.service';
@Component({
  selector: 'app-audit-table',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgIconComponent],
  templateUrl: './audit-table.component.html'
})
export class AuditTableComponent implements OnInit {
  auditLogs: AuditLogEntry[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  sortField: 'event' | 'detail' | 'author' | 'date' | '' = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';
  constructor(private auditService: AuditService, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void {
    this.auditService.auditLogs$.subscribe((logs) => {
      this.auditLogs = logs;
      this.currentPage = 1;
      this.cdr.markForCheck();
    });
  }
  toggleSort(field: 'event' | 'detail' | 'author' | 'date'): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
  }
  get sortedAuditLogs(): AuditLogEntry[] {
    if (!this.sortField) return this.auditLogs;
    const field = this.sortField;
    const dir = this.sortDirection === 'asc' ? 1 : -1;
    return [...this.auditLogs].sort((a, b) => {
      const valA = (a[field] || '').toString().toLowerCase();
      const valB = (b[field] || '').toString().toLowerCase();
      return valA.localeCompare(valB) * dir;
    });
  }
  get totalPages(): number {
    return Math.ceil(this.sortedAuditLogs.length / this.pageSize) || 1;
  }
  get paginatedAuditLogs(): AuditLogEntry[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sortedAuditLogs.slice(start, start + this.pageSize);
  }
  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }
  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.sortedAuditLogs.length);
  }
  get pageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, current - Math.floor(maxButtons / 2));
    let end = Math.min(total, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }
  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }
}

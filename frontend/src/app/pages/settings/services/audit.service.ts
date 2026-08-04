import { AuditEventDto, CreateAuditEventRequestDto } from '@core/api/dtos/audit.dto';
import { AuditMapper } from '@core/api/mappers/audit.mapper';
import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

const API_URL = '/api';

export interface AuditLogEntry {
  id?: string;
  event: string;
  detail: string;
  author: string;
  date: string;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private auditLogsSubject = new BehaviorSubject<AuditLogEntry[]>([]);
  auditLogs$: Observable<AuditLogEntry[]> = this.auditLogsSubject.asObservable();

  constructor(private http: HttpClient, private ngZone: NgZone) {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.http.get<any[]>(`${API_URL}/audit-events`).subscribe({
      next: (events: any) => {
        if (Array.isArray(events)) {
          const mapped: AuditLogEntry[] = events.map((e: AuditEventDto) => AuditMapper.toDomain(e));


          this.ngZone.run(() => this.auditLogsSubject.next(mapped));
        }
      },
      error: () => {}
    });
  }

  logAuditEvent(eventType: string, detailsJson: string, targetType: string = 'DASHBOARD', targetId?: string): void {
    const payload = AuditMapper.toCreateDto(eventType, detailsJson, targetType, targetId);


    this.http.post<any>(`${API_URL}/audit-events`, payload).subscribe({
      next: () => {
        this.loadAuditLogs();
      },
      error: () => {}
    });
  }
}

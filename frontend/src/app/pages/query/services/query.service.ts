import { QueryResponseDto, QueryRequestDto } from '@core/api/dtos/query.dto';
import { QueryMapper } from '@core/api/mappers/query.mapper';
import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { DataQuery } from '@core/models/types';
import { uid } from '@core/utils/utils';
import { AuditService } from '@pages/settings/services/audit.service';
import { normalizeQueries, normalizeQuery } from '@pages/query/services/query-model.service';
import { LIVE_QUERY_DATA, setCatalogSources } from '@pages/query/services/query-execution.service';

const nowIso = () => new Date().toISOString();
const API_URL = (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '4200')
  ? 'http://localhost:8080/api'
  : '/api';

function getStoredQueries(): DataQuery[] {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('cockpit_queries');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
  }
  return [];
}

function saveStoredQueries(list: DataQuery[]): void {
  if (typeof localStorage !== 'undefined' && Array.isArray(list)) {
    localStorage.setItem('cockpit_queries', JSON.stringify(list));
  }
}

@Injectable({ providedIn: 'root' })
export class QueryService {
  private queriesSubject = new BehaviorSubject<DataQuery[]>(normalizeQueries(getStoredQueries()));
  private catalogSourcesSubject = new BehaviorSubject<any[]>([]);

  queries$: Observable<DataQuery[]> = this.queriesSubject.asObservable();
  catalogSources$: Observable<any[]> = this.catalogSourcesSubject.asObservable();

  constructor(private http: HttpClient, private ngZone: NgZone, private auditService: AuditService) {
    this.loadFromBackend();
    this.loadCatalog();
  }

  private setQueries(list: DataQuery[]) {
    saveStoredQueries(list);
    this.ngZone.run(() => this.queriesSubject.next(list));
  }

  public loadFromBackend(): void {
    this.http.get<QueryResponseDto[]>(`${API_URL}/queries`).subscribe({
      next: (data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          const cleanModels = data.map((dto: QueryResponseDto) => QueryMapper.toDomain(dto));
          const queries = normalizeQueries(cleanModels);
          this.setQueries(queries);
          queries.forEach(q => {
            this.http.get<any[]>(`${API_URL}/queries/${q.id}/execute`).subscribe({
              next: (rows) => {
                if (Array.isArray(rows) && rows.length > 0) {
                  LIVE_QUERY_DATA[q.id] = rows;
                  this.ngZone.run(() => this.queriesSubject.next([...this.queriesSubject.value]));
                }
              },
              error: () => {}
            });
          });
        }
      },
      error: () => {
        this.setQueries(this.queries);
      }
    });
  }

  get queries(): DataQuery[] {
    return this.queriesSubject.value;
  }

  get catalogSources(): any[] {
    return this.catalogSourcesSubject.value;
  }

  loadCatalog(): void {
    this.http.get<any[]>(`${API_URL}/catalog/data-sources`).subscribe({
      next: (sources: any) => {
        if (Array.isArray(sources)) {
          setCatalogSources(sources);
          this.ngZone.run(() => this.catalogSourcesSubject.next(sources));
        }
      },
      error: () => {}
    });
  }

  upsertQuery(query: DataQuery): void {
    const prev = this.queries;
    const exists = prev.some((q) => q.id === query.id);
    const next: DataQuery = {
      ...normalizeQuery(query),
      sourceId: undefined,
      updatedAt: nowIso()
    };
    const updated = exists
      ? prev.map((q) => (q.id === query.id ? next : q))
      : [next, ...prev];
    this.setQueries(updated);

    if (exists) {
      const dto = QueryMapper.toDto(query);
      this.http.put<QueryRequestDto>(`${API_URL}/queries/${query.id}`, dto).subscribe({
        next: () => {
          this.loadFromBackend();
          this.auditService.loadAuditLogs();
        },
        error: (err) => console.error('Error updating query:', err)
      });
    } else {
      const dto = QueryMapper.toDto(query);
      this.http.post<QueryResponseDto>(`${API_URL}/queries`, dto).subscribe({
        next: (createdDto: QueryResponseDto) => {
          const created = QueryMapper.toDomain(createdDto);
          if (created && created.id) {
            const current = this.queries.filter(q => q.id !== query.id && q.id !== created.id);
            this.setQueries([created, ...current]);
          }
          this.loadFromBackend();
          this.auditService.loadAuditLogs();
        },
        error: (err) => console.error('Error creating query:', err)
      });
    }
  }

  deleteQuery(id: string): void {
    this.queriesSubject.next(this.queries.filter((q) => q.id !== id));
    this.http.delete(`${API_URL}/queries/${id}`).subscribe({
      next: () => this.auditService.loadAuditLogs()
    });
  }

  duplicateQuery(id: string): void {
    const source = this.queries.find((q) => q.id === id);
    if (!source) return;
    const copyId = uid('q');
    const existingNames = this.queries.map((q) => q.name);
    const cleanBase = source.name.replace(/(\s*\(copie\s*\d*\))+$/gi, '').trim();
    let counter = 1;
    let newName = `${cleanBase} (copie ${counter})`;
    while (existingNames.some((n) => n.toLowerCase() === newName.toLowerCase())) {
      counter++;
      newName = `${cleanBase} (copie ${counter})`;
    }

    const copy: DataQuery = {
      ...normalizeQuery(source),
      id: copyId,
      name: newName,
      joins: source.joins.map((join) => ({
        ...join,
        id: uid('join')
      })),
      transformations: source.transformations.map((transformation) => ({
        ...transformation,
        id: uid('transform')
      })),
      conditions: source.conditions.map((condition) => ({
        ...condition,
        id: uid('filter')
      })),
      selectedFieldIds: [...source.selectedFieldIds],
      groupByFieldIds: [...source.groupByFieldIds],
      sourceIds: [...source.sourceIds],
      usedByWidgets: 0,
      updatedAt: nowIso()
    };
    this.queriesSubject.next([copy, ...this.queries]);

    this.http.post<QueryResponseDto>(`${API_URL}/queries/${id}/duplicate`, {}).subscribe({
      next: (createdDto: QueryResponseDto) => {
          const created = QueryMapper.toDomain(createdDto);
        if (created && created.id) {
          created.name = newName;
          const current = this.queries;
          const idx = current.findIndex(q => q.id === copyId);
          if (idx !== -1) {
            current[idx] = created;
            this.queriesSubject.next([...current]);
          }
          const createdDtoForPut = QueryMapper.toDto(created);
          this.http.put(`${API_URL}/queries/${created.id}`, createdDtoForPut).subscribe({
            next: () => this.auditService.loadAuditLogs()
          });
        }
        this.auditService.loadAuditLogs();
      }
    });
  }

  executeQueryData(queryId: string, filters: import('@pages/dashboard/services/dashboard-filters.service').RuntimeQueryFilter[] = []): Observable<any[]> {
    return this.http.post<any[]>(`${API_URL}/queries/${queryId}/execute`, filters);
  }
}

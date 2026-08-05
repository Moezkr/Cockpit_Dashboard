import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
const API_URL = '/api';
export interface DbConnectionRequest {
  connectionName: string;
  dbType: string;
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUsername: string;
  dbPassword?: string;
  useSsl: boolean;
}
export interface DbConnectionResponse {
  id: string;
  connectionName: string;
  dbType: string;
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUsername: string;
  useSsl: boolean;
  tableCount?: number;
}
export interface SchemaFieldPreview {
  tableName: string;
  fieldName: string;
  fieldType: string;
}
@Injectable({
  providedIn: 'root'
})
export class DbConnectionService {
  private apiUrl = `${API_URL}/db-connections`;
  constructor(private http: HttpClient) {}
  getAllConnections(): Observable<DbConnectionResponse[]> {
    return this.http.get<DbConnectionResponse[]>(this.apiUrl);
  }
  testConnection(request: DbConnectionRequest): Observable<{ success: boolean; message: string; detectedSchema?: SchemaFieldPreview[] }> {
    return this.http.post<{ success: boolean; message: string; detectedSchema?: SchemaFieldPreview[] }>(`${this.apiUrl}/test`, request);
  }
  createConnection(request: DbConnectionRequest): Observable<string> {
    return this.http.post(this.apiUrl, request, { responseType: 'text' });
  }
  updateConnection(id: string, request: DbConnectionRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, request);
  }
  deleteConnection(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

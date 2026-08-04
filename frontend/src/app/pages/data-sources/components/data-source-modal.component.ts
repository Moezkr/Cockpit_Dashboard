import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '@shared/components/ui/modal.component';
import { ButtonComponent } from '@shared/components/ui/button.component';
import { SvgIconComponent } from '@shared/components/svg-icon/svg-icon.component';
import { DbConnectionService, DbConnectionRequest, SchemaFieldPreview } from '../services/db-connection.service';

@Component({
  selector: 'app-data-source-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent, SvgIconComponent],
  templateUrl: './data-source-modal.component.html'
})
export class DataSourceModalComponent implements OnChanges {
  @Input() open: boolean = false;
  @Input() source: any = null;
  @Output() onClose = new EventEmitter<void>();

  databaseTypes = [
    { kind: 'postgresql', label: 'PostgreSQL', detail: 'Base relationnelle open source', port: 5432 },
    { kind: 'mysql', label: 'MySQL', detail: 'Base relationnelle MySQL / MariaDB', port: 3306 },
    { kind: 'sqlserver', label: 'SQL Server', detail: 'Microsoft SQL Server', port: 1433 }
  ];

  draft: any = this.createDraft('postgresql');
  testing: boolean = false;
  saving: boolean = false;
  testResult: 'success' | 'error' | null = null;
  errorMessage: string = '';
  detectedSchema: SchemaFieldPreview[] = [];

  constructor(
    private dbConnectionService: DbConnectionService,
    private cdr: ChangeDetectorRef
  ) {}

  get connector() {
    return this.databaseTypes.find((item) => item.kind === this.draft.kind);
  }

  get isValid() {
    return Boolean(this.draft.label?.trim() && this.draft.host?.trim() && this.draft.database?.trim() && this.draft.username?.trim());
  }

  get groupedSchema(): { tableName: string; fields: SchemaFieldPreview[] }[] {
    if (!this.detectedSchema || this.detectedSchema.length === 0) return [];
    
    const groupsMap = new Map<string, SchemaFieldPreview[]>();
    for (const item of this.detectedSchema) {
      const tName = item.tableName || 'Table';
      if (!groupsMap.has(tName)) {
        groupsMap.set(tName, []);
      }
      groupsMap.get(tName)!.push(item);
    }

    return Array.from(groupsMap.entries()).map(([tableName, fields]) => ({
      tableName,
      fields
    }));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open'] && changes['open'].currentValue) {
      if (this.source) {
        const kindMap: Record<string, string> = {
          'POSTGRESQL': 'postgresql',
          'MYSQL': 'mysql',
          'SQL_SERVER': 'sqlserver'
        };
        this.draft = {
          id: this.source.id,
          label: this.source.connectionName || '',
          kind: kindMap[this.source.dbType] || 'postgresql',
          host: this.source.dbHost || '',
          port: this.source.dbPort || 5432,
          database: this.source.dbName || '',
          username: this.source.dbUsername || '',
          password: '',
          description: this.source.description || '',
          ssl: Boolean(this.source.useSsl)
        };
      } else {
        this.draft = this.createDraft('postgresql');
      }
      this.testing = false;
      this.saving = false;
      this.testResult = null;
      this.errorMessage = '';
      this.detectedSchema = [];
    }
  }

  createDraft(kind: string) {
    const type = this.databaseTypes.find((item) => item.kind === kind)!;
    return {
      id: 'draft_' + Math.random().toString(36).substr(2, 9),
      label: '',
      description: '',
      app: 'ProgesCode',
      kind,
      status: 'untested',
      host: '',
      port: type.port,
      database: '',
      username: '',
      password: '',
      ssl: false
    };
  }

  chooseKind(kind: string) {
    const next = this.createDraft(kind);
    this.draft.kind = kind;
    this.draft.port = next.port;
    this.testResult = null;
    this.errorMessage = '';
    this.detectedSchema = [];
  }

  runTest() {
    if (!this.isValid) return;

    this.testing = true;
    this.testResult = null;
    this.errorMessage = '';
    this.detectedSchema = [];

    const dbTypeMap: Record<string, string> = {
      'postgresql': 'POSTGRESQL',
      'mysql': 'MYSQL',
      'sqlserver': 'SQL_SERVER'
    };

    const request: DbConnectionRequest = {
      connectionName: this.draft.label || 'Test Connection',
      dbType: dbTypeMap[this.draft.kind] || 'POSTGRESQL',
      dbHost: this.draft.host,
      dbPort: Number(this.draft.port),
      dbName: this.draft.database,
      dbUsername: this.draft.username,
      dbPassword: this.draft.password,
      useSsl: Boolean(this.draft.ssl)
    };

    this.dbConnectionService.testConnection(request).subscribe({
      next: (res) => {
        this.testing = false;
        if (res.success) {
          this.testResult = 'success';
          this.detectedSchema = res.detectedSchema || [];
        } else {
          this.testResult = 'error';
          this.errorMessage = res.message;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.testing = false;
        this.testResult = 'error';
        this.errorMessage = err.error?.message || 'Impossible de contacter le serveur backend.';
        this.cdr.detectChanges();
      }
    });
  }

  save() {
    if (!this.isValid) return;
    
    this.saving = true;
    this.testResult = null;
    this.errorMessage = '';

    const dbTypeMap: Record<string, string> = {
      'postgresql': 'POSTGRESQL',
      'mysql': 'MYSQL',
      'sqlserver': 'SQL_SERVER'
    };

    const request: DbConnectionRequest = {
      connectionName: this.draft.label,
      dbType: dbTypeMap[this.draft.kind] || 'POSTGRESQL',
      dbHost: this.draft.host,
      dbPort: Number(this.draft.port),
      dbName: this.draft.database,
      dbUsername: this.draft.username,
      dbPassword: this.draft.password,
      useSsl: Boolean(this.draft.ssl)
    };

    if (this.draft.id && !this.draft.id.startsWith('draft_')) {
      this.dbConnectionService.updateConnection(this.draft.id, request).subscribe({
        next: () => {
          this.saving = false;
          this.testResult = 'success';
          this.cdr.detectChanges();
          this.onClose.emit();
        },
        error: (err) => {
          this.saving = false;
          this.testResult = 'error';
          this.errorMessage = err.error?.message || 'Erreur lors de la mise à jour.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.dbConnectionService.createConnection(request).subscribe({
        next: (res) => {
          this.saving = false;
          this.testResult = 'success';
          this.cdr.detectChanges();
          this.onClose.emit();
        },
        error: (err) => {
          this.saving = false;
          this.testResult = 'error';
          try {
            const parsed = JSON.parse(err.error);
            this.errorMessage = parsed.message || 'La connexion a échoué.';
          } catch {
            this.errorMessage = err.error?.message || 'La connexion a échoué. Vérifiez vos identifiants et l\'hôte.';
          }
          this.cdr.detectChanges();
        }
      });
    }
  }
}

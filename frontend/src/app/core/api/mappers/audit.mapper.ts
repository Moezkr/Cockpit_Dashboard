import { AuditEventDto, CreateAuditEventRequestDto } from '../dtos/audit.dto';
import { AuditLogEntry } from '@pages/settings/services/audit.service';

export class AuditMapper {
  static toDomain(dto: AuditEventDto): AuditLogEntry {
    return {
      id: dto.id,
      event: dto.eventType || 'Événement système',
      detail: dto.detailsJson || dto.targetType || 'Détail',
      author: (!dto.actorName || dto.actorName === 'Système' || dto.actorName === 'System') ? 'Amine Haddad' : dto.actorName,
      date: dto.occurredAt ? new Date(dto.occurredAt).toLocaleString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Récemment'
    };
  }

  static toCreateDto(eventType: string, detailsJson: string, targetType: string = 'DASHBOARD', targetId?: string): CreateAuditEventRequestDto {
    return {
      eventType,
      targetType,
      targetId,
      detailsJson,
      sourceIp: '127.0.0.1'
    };
  }
}

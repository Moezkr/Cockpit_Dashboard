export interface AuditEventDto {
  id?: string;
  eventType?: string;
  targetType?: string;
  detailsJson?: string;
  actorName?: string;
  occurredAt?: string;
}

export interface CreateAuditEventRequestDto {
  eventType: string;
  targetType?: string;
  targetId?: string;
  detailsJson: string;
  sourceIp?: string;
}

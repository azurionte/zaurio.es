export const AUDIT_ENGINE_VERSION = 'dz3-audit-1';

export function createAuditEntry({
  planId = null,
  actorType,
  actorUserId = null,
  actionType,
  entityType,
  entityId = null,
  correlationId,
  reason = null,
  beforeState = null,
  afterState = null,
  metadata = {},
  createdAt = new Date().toISOString()
}) {
  const actors = new Set(['user', 'system', 'ai', 'bank_sync', 'migration']);
  if (!actors.has(actorType)) throw new RangeError(`Unsupported audit actor: ${actorType}`);
  if (!actionType || !entityType || !correlationId) throw new TypeError('actionType, entityType and correlationId are required');
  return {
    planId,
    actorType,
    actorUserId,
    actionType,
    entityType,
    entityId,
    correlationId,
    reason,
    beforeState,
    afterState,
    metadata: { ...metadata, auditEngineVersion: AUDIT_ENGINE_VERSION },
    createdAt
  };
}

export function explainChange(entry) {
  if (!entry) return null;
  return {
    actor: entry.actorType,
    action: entry.actionType,
    entity: entry.entityType,
    entityId: entry.entityId,
    reason: entry.reason,
    before: entry.beforeState,
    after: entry.afterState,
    correlationId: entry.correlationId,
    createdAt: entry.createdAt
  };
}

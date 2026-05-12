import { prisma } from "../../db/prisma.js";

type AuditInput = {
  actorType: "ADMIN" | "SYSTEM";
  actorId?: string;
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
};

export async function createAuditLog(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      actorType: input.actorType,
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null
    }
  });
}

export async function listAuditLogs(input: {
  page: number;
  limit: number;
  search?: string;
  action?: string;
  targetType?: string;
}) {
  const where = {
    ...(input.action ? { action: input.action } : {}),
    ...(input.targetType ? { targetType: input.targetType } : {}),
    ...(input.search
      ? {
          OR: [
            { actorEmail: { contains: input.search } },
            { targetId: { contains: input.search } },
            { action: { contains: input.search } },
            { targetType: { contains: input.search } }
          ]
        }
      : {})
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit
    }),
    prisma.auditLog.count({ where })
  ]);

  return { logs, total };
}

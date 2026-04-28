import { JobRunStatus, Prisma } from "@prisma/client";
import type { JobRun } from "@/domain/entities/job-run";
import type { JobRunRepositoryPort } from "@/domain/ports/job-run-repository";
import { prisma } from "@/lib/prisma";

function mapJobRun(record: {
  id: string;
  jobName: string;
  status: JobRunStatus;
  startedAt: Date;
  completedAt: Date | null;
  error: string | null;
  metadata: unknown;
}): JobRun {
  return {
    id: record.id,
    jobName: record.jobName,
    status: record.status,
    startedAt: record.startedAt.toISOString(),
    completedAt: record.completedAt?.toISOString() ?? null,
    error: record.error,
    metadata:
      typeof record.metadata === "object" && record.metadata !== null
        ? (record.metadata as Record<string, unknown>)
        : null
  };
}

export class PostgresJobRunRepository implements JobRunRepositoryPort {
  async createRunning(jobName: string, metadata?: Record<string, unknown>) {
    const record = await prisma.jobRun.create({
      data: {
        jobName,
        status: JobRunStatus.RUNNING,
        startedAt: new Date(),
        metadata: metadata as Prisma.InputJsonValue | undefined
      }
    });

    return mapJobRun(record);
  }

  async markSuccess(id: string, metadata?: Record<string, unknown>) {
    const record = await prisma.jobRun.update({
      where: { id },
      data: {
        status: JobRunStatus.SUCCESS,
        completedAt: new Date(),
        metadata: metadata as Prisma.InputJsonValue | undefined
      }
    });

    return mapJobRun(record);
  }

  async markFailed(id: string, error: string, metadata?: Record<string, unknown>) {
    const record = await prisma.jobRun.update({
      where: { id },
      data: {
        status: JobRunStatus.FAILED,
        completedAt: new Date(),
        error,
        metadata: metadata as Prisma.InputJsonValue | undefined
      }
    });

    return mapJobRun(record);
  }
}

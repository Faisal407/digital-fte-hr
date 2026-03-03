/**
 * Audit logging for agent actions
 * Mandatory before and after critical operations
 */

import type { AuditEntry } from "../types/index";
import { sanitizeForLogging } from "./pii";

export interface AuditLogInput {
  correlationId: string;
  userId: string;
  action: string;
  agent: string;
  status: "started" | "completed" | "failed";
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  resultCode?: string;
  resultMessage?: string;
  errorStack?: string;
  context?: Record<string, unknown>;
}

export class AuditLogger {
  private static logs: AuditEntry[] = [];

  /**
   * Log an audit entry (in production, write to DynamoDB)
   */
  static async log(input: AuditLogInput): Promise<AuditEntry> {
    const entry: AuditEntry = {
      correlationId: input.correlationId,
      userId: input.userId,
      action: input.action,
      agent: input.agent,
      status: input.status,
      inputData: this.sanitizeData(input.inputData),
      outputData: this.sanitizeData(input.outputData),
      resultCode: input.resultCode,
      resultMessage: input.resultMessage,
      errorStack: input.errorStack,
      context: this.sanitizeData(input.context),
      timestamp: new Date(),
    };

    // In development, store in memory
    if (process.env.NODE_ENV !== "production") {
      this.logs.push(entry);
    }

    // In production, write to DynamoDB
    if (process.env.NODE_ENV === "production") {
      await this.writeToDynamoDB(entry);
    }

    return entry;
  }

  /**
   * Log action start
   */
  static async logStart(
    correlationId: string,
    userId: string,
    action: string,
    agent: string,
    inputData?: Record<string, unknown>
  ): Promise<AuditEntry> {
    return this.log({
      correlationId,
      userId,
      action,
      agent,
      status: "started",
      inputData,
    });
  }

  /**
   * Log action completion
   */
  static async logCompleted(
    correlationId: string,
    userId: string,
    action: string,
    agent: string,
    outputData?: Record<string, unknown>,
    resultCode?: string,
    resultMessage?: string
  ): Promise<AuditEntry> {
    return this.log({
      correlationId,
      userId,
      action,
      agent,
      status: "completed",
      outputData,
      resultCode,
      resultMessage,
    });
  }

  /**
   * Log action failure
   */
  static async logFailed(
    correlationId: string,
    userId: string,
    action: string,
    agent: string,
    error: Error | string,
    context?: Record<string, unknown>
  ): Promise<AuditEntry> {
    const errorMessage = typeof error === "string" ? error : error.message;
    const errorStack = typeof error === "string" ? undefined : error.stack;

    return this.log({
      correlationId,
      userId,
      action,
      agent,
      status: "failed",
      resultCode: "AUDIT_ERROR",
      resultMessage: errorMessage,
      errorStack,
      context,
    });
  }

  /**
   * Sanitize sensitive data before logging
   */
  private static sanitizeData(data: unknown): unknown {
    if (!data) return data;
    return sanitizeForLogging(data, {
      maskEmail: true,
      maskPhone: true,
      maskName: true,
      maskAddress: true,
      preserveLength: true,
    });
  }

  /**
   * Write to DynamoDB (production only)
   */
  private static async writeToDynamoDB(entry: AuditEntry): Promise<void> {
    try {
      const { DynamoDBClient, PutItemCommand } = await import(
        "@aws-sdk/client-dynamodb"
      );
      const { marshall } = await import("@aws-sdk/util-dynamodb");

      const client = new DynamoDBClient({
        region: process.env.AWS_REGION || "us-east-1",
      });

      const params = {
        TableName: process.env.AUDIT_LOG_TABLE || "audit_logs",
        Item: marshall(entry),
      };

      await client.send(new PutItemCommand(params));
    } catch (error) {
      // Log error but don't throw (audit logging failures shouldn't break the app)
      console.error("Failed to write audit log:", error);
    }
  }

  /**
   * Get logs (development only)
   */
  static getLogs(): AuditEntry[] {
    return this.logs;
  }

  /**
   * Clear logs (testing only)
   */
  static clearLogs(): void {
    this.logs = [];
  }
}

/**
 * Decorator for automatic audit logging
 */
export function Auditable(action: string, agent: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      ...args: any[]
    ) {
      const userId = args[0]?.userId || "unknown";
      const correlationId = args[0]?.correlationId || generateCorrelationId();

      try {
        await AuditLogger.logStart(
          correlationId,
          userId,
          action,
          agent,
          args[0]
        );

        const result = await originalMethod.apply(this, args);

        await AuditLogger.logCompleted(
          correlationId,
          userId,
          action,
          agent,
          result
        );

        return result;
      } catch (error) {
        await AuditLogger.logFailed(
          correlationId,
          userId,
          action,
          agent,
          error instanceof Error ? error : new Error(String(error))
        );

        throw error;
      }
    };

    return descriptor;
  };
}

export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

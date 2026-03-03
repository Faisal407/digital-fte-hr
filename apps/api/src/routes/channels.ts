/**
 * Channel management endpoints
 * POST /channels/subscribe
 * GET /channels/subscriptions
 * POST /channels/preferences
 * POST /channels/webhooks/whatsapp
 * POST /channels/webhooks/telegram
 */

import type { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@packages/db";
import {
  sendError,
  sendSuccess,
  sendPaginated,
  logError,
} from "../lib/errors";
import {
  asyncHandler,
  assertAuthenticated,
  assertOwnership,
  getPaginationParams,
  getContext,
  logActionStart,
  logActionComplete,
  logActionFailed,
} from "../lib/handler";
import { ERROR_CODES, HTTP_STATUS, Channel } from "@packages/shared";

const SubscribeSchema = z.object({
  channel: z.enum(["whatsapp", "telegram", "email", "push"]),
  identifier: z.string().min(1), // phone, email, telegram_id, fcm_token
});

const PreferencesSchema = z.object({
  channel: z.enum(["whatsapp", "telegram", "email", "push"]),
  jobAlerts: z.boolean().optional(),
  applicationUpdates: z.boolean().optional(),
  weeklyReport: z.boolean().optional(),
  promotional: z.boolean().optional(),
  quietHoursRespected: z.boolean().optional(),
});

export function registerChannelRoutes(router: Router): void {
  /**
   * POST /channels/subscribe
   * Subscribe to a notification channel
   */
  router.post(
    "/channels/subscribe",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      const validation = SubscribeSchema.safeParse(req.body);
      if (!validation.success) {
        return sendError(
          res,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid channel subscription data",
          422,
          { errors: validation.error.flatten() }
        );
      }

      const context = getContext(req);
      const { channel, identifier } = validation.data;

      try {
        await logActionStart(context, "channel_subscribe", "channel_orchestration", {
          channel,
          identifier: "***", // Mask for logging
        });

        // Check if already subscribed
        const existing = await prisma.channelSubscription.findUnique({
          where: {
            userId_channel_identifier: {
              userId: authReq.userId,
              channel: channel as any,
              identifier,
            },
          },
        });

        if (existing && existing.isVerified) {
          await logActionFailed(
            context,
            "channel_subscribe",
            "channel_orchestration",
            "Already subscribed"
          );
          return sendError(
            res,
            ERROR_CODES.VALIDATION_ERROR,
            `Already subscribed to ${channel}`,
            409
          );
        }

        // Create or update subscription
        const subscription = await prisma.channelSubscription.upsert({
          where: {
            userId_channel_identifier: {
              userId: authReq.userId,
              channel: channel as any,
              identifier,
            },
          },
          create: {
            userId: authReq.userId,
            channel: channel as any,
            identifier,
            isVerified: false, // Requires verification
          },
          update: {
            isVerified: false, // Reset verification
            supressedAt: null,
            isSupressed: false,
          },
        });

        await logActionComplete(context, "channel_subscribe", "channel_orchestration", {
          subscriptionId: subscription.id,
          requiresVerification: !subscription.isVerified,
        });

        return sendSuccess(
          res,
          {
            id: subscription.id,
            channel: subscription.channel,
            identifier: identifier.slice(0, 3) + "***", // Show only first 3 chars
            isVerified: subscription.isVerified,
            message: `Verification code sent to ${channel}`,
          },
          HTTP_STATUS.CREATED
        );
      } catch (error) {
        logError(error, {
          action: "subscribe_channel",
          userId: authReq.userId,
          channel,
        });
        await logActionFailed(
          context,
          "channel_subscribe",
          "channel_orchestration",
          error instanceof Error ? error : new Error(String(error))
        );

        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Failed to subscribe to channel",
          500
        );
      }
    })
  );

  /**
   * GET /channels/subscriptions
   * List user's channel subscriptions
   */
  router.get(
    "/channels/subscriptions",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      const { page, pageSize } = getPaginationParams(req.query as any);

      try {
        const subscriptions = await prisma.channelSubscription.findMany({
          where: { userId: authReq.userId },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            channel: true,
            identifier: true,
            isVerified: true,
            isSupressed: true,
            jobAlerts: true,
            applicationUpdates: true,
            weeklyReport: true,
            promotional: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });

        // Mask sensitive identifiers
        const masked = subscriptions.map((sub) => ({
          ...sub,
          identifier: sub.identifier.slice(0, 3) + "***",
        }));

        const total = await prisma.channelSubscription.count({
          where: { userId: authReq.userId },
        });

        return sendPaginated(res, masked, page, pageSize, total);
      } catch (error) {
        logError(error, { action: "list_subscriptions", userId: authReq.userId });
        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Failed to list subscriptions",
          500
        );
      }
    })
  );

  /**
   * POST /channels/:id/preferences
   * Update channel notification preferences
   */
  router.post(
    "/channels/:id/preferences",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      const idValidation = z.object({ id: z.string().cuid() }).safeParse(req.params);
      if (!idValidation.success) {
        return sendError(
          res,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid subscription ID",
          422
        );
      }

      const prefValidation = PreferencesSchema.safeParse(req.body);
      if (!prefValidation.success) {
        return sendError(
          res,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid preferences",
          422,
          { errors: prefValidation.error.flatten() }
        );
      }

      const { id } = idValidation.data;
      const preferences = prefValidation.data;

      try {
        const subscription = await prisma.channelSubscription.findUnique({
          where: { id },
          select: { userId: true },
        });

        if (!subscription) {
          return sendError(
            res,
            ERROR_CODES.CHANNEL_NOT_FOUND,
            "Subscription not found",
            404
          );
        }

        if (!assertOwnership(authReq.userId, subscription.userId, res)) return;

        const updated = await prisma.channelSubscription.update({
          where: { id },
          data: preferences,
          select: {
            id: true,
            channel: true,
            jobAlerts: true,
            applicationUpdates: true,
            weeklyReport: true,
            promotional: true,
          },
        });

        return sendSuccess(res, updated);
      } catch (error) {
        logError(error, {
          action: "update_preferences",
          subscriptionId: id,
          userId: authReq.userId,
        });
        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Failed to update preferences",
          500
        );
      }
    })
  );

  /**
   * POST /channels/:id/unsubscribe
   * Unsubscribe from a channel
   */
  router.post(
    "/channels/:id/unsubscribe",
    asyncHandler(async (req: Request, res: Response) => {
      const authReq = assertAuthenticated(req, res);
      if (!authReq) return;

      const idValidation = z.object({ id: z.string().cuid() }).safeParse(req.params);
      if (!idValidation.success) {
        return sendError(
          res,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid subscription ID",
          422
        );
      }

      const { id } = idValidation.data;

      try {
        const subscription = await prisma.channelSubscription.findUnique({
          where: { id },
          select: { userId: true },
        });

        if (!subscription) {
          return sendError(
            res,
            ERROR_CODES.CHANNEL_NOT_FOUND,
            "Subscription not found",
            404
          );
        }

        if (!assertOwnership(authReq.userId, subscription.userId, res)) return;

        // Mark as suppressed instead of deleting (for compliance tracking)
        await prisma.channelSubscription.update({
          where: { id },
          data: {
            isSupressed: true,
            supressedAt: new Date(),
            supressedReason: "user_requested",
          },
        });

        return sendSuccess(res, {
          message: "Unsubscribed successfully",
        });
      } catch (error) {
        logError(error, {
          action: "unsubscribe",
          subscriptionId: id,
          userId: authReq.userId,
        });
        return sendError(
          res,
          ERROR_CODES.INTERNAL_ERROR,
          "Failed to unsubscribe",
          500
        );
      }
    })
  );

  /**
   * POST /channels/webhooks/whatsapp
   * WhatsApp incoming message webhook (public - no auth)
   */
  router.post(
    "/channels/webhooks/whatsapp",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        // Verify webhook signature (TODO: Implement Twilio signature verification)
        const { messages, statuses } = req.body;

        // Handle incoming messages
        if (messages && messages.length > 0) {
          for (const message of messages) {
            const phoneNumber = message.from;
            const text = message.text?.body || "";

            // Handle STOP command
            if (text.toUpperCase() === "STOP") {
              const subscription = await prisma.channelSubscription.findFirst({
                where: {
                  channel: "whatsapp",
                  identifier: phoneNumber,
                },
              });

              if (subscription) {
                await prisma.channelSubscription.update({
                  where: { id: subscription.id },
                  data: {
                    isSupressed: true,
                    supressedAt: new Date(),
                    supressedReason: "user_requested",
                  },
                });
              }
            }

            // Log incoming message
            await prisma.notificationLog.create({
              data: {
                userId: "unknown", // Would need to lookup from phoneNumber
                channel: "whatsapp",
                messageId: message.id,
                body: text,
                status: "sent", // Incoming
                deliveredAt: new Date(),
              },
            });
          }
        }

        // Handle delivery status updates
        if (statuses && statuses.length > 0) {
          for (const status of statuses) {
            // Update notification log with delivery status
            await prisma.notificationLog.updateMany({
              where: { messageId: status.id },
              data: {
                status: status.status === "delivered" ? "sent" : "failed",
                deliveredAt: status.timestamp ? new Date(status.timestamp * 1000) : undefined,
              },
            });
          }
        }

        return res.status(200).json({ success: true });
      } catch (error) {
        logError(error, { action: "whatsapp_webhook" });
        // Always return 200 to prevent retry loop
        return res.status(200).json({ success: false, error: "Processing error" });
      }
    })
  );

  /**
   * POST /channels/webhooks/telegram
   * Telegram incoming message webhook (public - no auth)
   */
  router.post(
    "/channels/webhooks/telegram",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const { message, my_chat_member } = req.body;

        if (message) {
          const chatId = message.chat.id;
          const text = message.text || "";

          // Handle /stop command
          if (text === "/stop") {
            const subscription = await prisma.channelSubscription.findFirst({
              where: {
                channel: "telegram",
                identifier: String(chatId),
              },
            });

            if (subscription) {
              await prisma.channelSubscription.update({
                where: { id: subscription.id },
                data: {
                  isSupressed: true,
                  supressedAt: new Date(),
                  supressedReason: "user_requested",
                },
              });
            }
          }

          // Log incoming message
          await prisma.notificationLog.create({
            data: {
              userId: "unknown",
              channel: "telegram",
              messageId: String(message.message_id),
              body: text,
              status: "sent",
              deliveredAt: new Date(),
            },
          });
        }

        // Handle bot removal (my_chat_member event)
        if (my_chat_member && my_chat_member.new_chat_member.status === "left") {
          const chatId = my_chat_member.chat.id;
          const subscription = await prisma.channelSubscription.findFirst({
            where: {
              channel: "telegram",
              identifier: String(chatId),
            },
          });

          if (subscription) {
            await prisma.channelSubscription.update({
              where: { id: subscription.id },
              data: {
                isSupressed: true,
                supressedAt: new Date(),
                supressedReason: "user_removed_bot",
              },
            });
          }
        }

        return res.status(200).json({ ok: true });
      } catch (error) {
        logError(error, { action: "telegram_webhook" });
        // Always return 200 to prevent retry
        return res.status(200).json({ ok: true });
      }
    })
  );
}

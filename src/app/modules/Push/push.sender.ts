// src/modules/Push/push.sender.ts
import { fcm } from "../../../utils/fcm";
import prisma from "../../../shared/prisma";

export async function sendUserNotification(
  userId: string,
  payload: {
    title?: string;
    body?: string;
    data?: Record<string, string>;
    collapseKey?: string;
    ttlSeconds?: number;
    // devOnly: don't delete tokens automatically
    devDontPruneInvalid?: boolean;
  }
) {
  const tokens = await prisma.pushToken.findMany({
    where: { userId, disabled: false },
    select: { token: true },
  });

  if (!tokens.length) {
    return { targeted: 0, sent: 0, failed: 0, details: [] as any[] };
  }

  const message = {
    tokens: tokens.map((t) => t.token),
    notification:
      payload.title || payload.body
        ? { title: payload.title, body: payload.body }
        : undefined,
    data: payload.data,
    android: {
  collapseKey: payload.collapseKey,
  priority: "high",
  ttl: (typeof payload.ttlSeconds === "number")
    ? Math.max(0, payload.ttlSeconds * 1000) // milliseconds ✅
    : undefined,
},
    apns: {
      headers: payload.collapseKey
        ? { "apns-collapse-id": payload.collapseKey }
        : undefined,
      payload: { aps: { sound: "default" } },
    },
  };

  const resp = await fcm.sendEachForMulticast(message as any);

  // Build a detailed report
  const details = resp.responses.map((r, i) => ({
    token: tokens[i].token,
    success: r.success,
    errorCode:
      (r.error as any)?.errorInfo?.code || r.error?.code || null,
    errorMessage: r.success ? null : r.error?.message || null,
  }));

  // Optionally prune invalid tokens (disabled if devDontPruneInvalid = true)
  if (!payload.devDontPruneInvalid) {
    await Promise.all(
      resp.responses.map(async (r, i) => {
        if (!r.success) {
          const code =
            (r.error as any)?.errorInfo?.code || r.error?.code;
          if (
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token"
          ) {
            await prisma.pushToken
              .delete({ where: { token: tokens[i].token } })
              .catch(() => {});
          }
        }
      })
    );
  }

  return {
    targeted: tokens.length,
    sent: resp.successCount,
    failed: resp.failureCount,
    details,
  };
}

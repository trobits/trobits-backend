import prisma from "../../../shared/prisma";

export const PushService = {
  async upsertToken(userId: string, payload: {
    token: string;
    platform: string;
    deviceId?: string;
    appVersion?: string;
    locale?: string;
    osVersion?: string;
    model?: string;
  }) {
    // If token already exists, reassign to this user (handles re-login on another account)
    const existing = await prisma.pushToken.findUnique({ where: { token: payload.token } });

    if (existing) {
      return prisma.pushToken.update({
        where: { token: payload.token },
        data: {
          userId,
          platform: payload.platform,
          deviceId: payload.deviceId,
          appVersion: payload.appVersion,
          locale: payload.locale,
          osVersion: payload.osVersion,
          model: payload.model,
          disabled: false, // re-enable if previously disabled
        },
      });
    }

    return prisma.pushToken.create({
      data: {
        userId,
        token: payload.token,
        platform: payload.platform,
        deviceId: payload.deviceId,
        appVersion: payload.appVersion,
        locale: payload.locale,
        osVersion: payload.osVersion,
        model: payload.model,
      },
    });
  },

  async disableToken(userId: string, token: string) {
    // Only disable if the token belongs to this user (avoid disabling someone else’s)
    const existing = await prisma.pushToken.findUnique({ where: { token } });
    if (!existing || existing.userId !== userId) return null;

    return prisma.pushToken.update({
      where: { token },
      data: { disabled: true },
    });
  },

  async listActiveTokensForUser(userId: string) {
    return prisma.pushToken.findMany({
      where: { userId, disabled: false },
      select: { token: true, platform: true },
    });
  },

  // Optional utility for cleanup if FCM says "NotRegistered"/"Invalid"
  async deleteToken(token: string) {
    try {
      await prisma.pushToken.delete({ where: { token } });
    } catch (_) {}
  },
};

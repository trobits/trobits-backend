import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import {
  MAX_STREAK_DAY,
  pointsForDay,
  DAILY_REWARDS_DEBUG_LOGS,
} from "./dailyRewards.constants";
import {
  getCycleKey,
  getNextResetAtUtc,
  getPrevCycleKey,
} from "./dailyRewards.utils";

const log = (...args: any[]) => {
  if (DAILY_REWARDS_DEBUG_LOGS) {
    // eslint-disable-next-line no-console
    console.log("[DailyRewards]", ...args);
  }
};

const logError = (...args: any[]) => {
  if (DAILY_REWARDS_DEBUG_LOGS) {
    // eslint-disable-next-line no-console
    console.error("[DailyRewards]", ...args);
  }
};

const ensureState = async (userId: string) => {
  const state = await prisma.dailyPointState.findUnique({
    where: { userId },
  });

  if (state) return state;

  return prisma.dailyPointState.create({
    data: {
      user: { connect: { id: userId } },
      streakDay: 1,
      lastClaimAt: null,
      lastCycleKey: null,
    },
  });
};

/**
 * We store state.streakDay as "NEXT DAY TO CLAIM"
 * - If user never claimed => 1
 * - If user claimed previous cycle => keep state.streakDay
 * - If user missed a cycle => reset to 1
 */
const computeDayToClaim = (state: any, currentCycleKey: string) => {
  if (!state.lastCycleKey) return 1;

  const prevCycleKey = getPrevCycleKey(currentCycleKey);

  // claimed yesterday cycle => continue streak
  if (state.lastCycleKey === prevCycleKey) {
    return state.streakDay ?? 1;
  }

  // if already claimed same cycle, claim API will block anyway.
  // if missed => reset
  if (state.lastCycleKey !== currentCycleKey) {
    return 1;
  }

  return state.streakDay ?? 1;
};

const isMongoDuplicateKeyError = (err: any) => {
  // Prisma + Mongo commonly surfaces duplicate key as P2002 OR raw Mongo E11000.
  // We handle both.
  const msg = String(err?.message || "");
  return err?.code === "P2002" || msg.includes("E11000") || msg.includes("duplicate key");
};

const clearMyDailyClaims = async (userId: string) => {
  // ensure user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  const result = await prisma.$transaction(async (tx) => {
    // 1) delete ledger
    const deletedClaims = await tx.dailyPointClaim.deleteMany({
      where: { userId },
    });

    // 2) reset state (if exists)
    const state = await tx.dailyPointState.findUnique({
      where: { userId },
    });

    let stateReset = null;
    if (state) {
      stateReset = await tx.dailyPointState.update({
        where: { userId },
        data: {
          streakDay: 1,
          lastClaimAt: null,
          lastCycleKey: null,
        },
      });
    }

    // 3) reset points balance
    await tx.user.update({
      where: { id: userId },
      data: { pointsBalance: 0 },
      select: { pointsBalance: true },
    });

    return {
      deletedClaimsCount: deletedClaims.count,
      stateReset: Boolean(stateReset),
      pointsBalance: 0,
    };
  });

  return result;
};

const getStatus = async (userId: string) => {
  const now = new Date();
  const cycleKey = getCycleKey(now);

  const state = await ensureState(userId);

  const alreadyClaimed = await prisma.dailyPointClaim.findUnique({
    where: {
      userId_cycleKey: { userId, cycleKey },
    },
  });

  const dayToClaim = computeDayToClaim(state, cycleKey);
  const nextResetAt = getNextResetAtUtc(now);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pointsBalance: true },
  });

  // 🔎 DEBUG: prove what we're reading from users collection
  log("STATUS", {
    userId,
    cycleKey,
    pointsBalanceRaw: user?.pointsBalance,
    alreadyClaimed: Boolean(alreadyClaimed),
    stateLastCycleKey: state?.lastCycleKey ?? null,
    stateStreakDay: state?.streakDay ?? null,
    stateLastClaimAt: state?.lastClaimAt ? state.lastClaimAt.toISOString() : null,
  });

  // Optional: If pointsBalance is explicitly null, we can auto-heal it here too.
  // This is safe and prevents "status shows 0 due to null" even when claims exist.
  if (user && user.pointsBalance === null) {
    log("STATUS_FIX_NULL_BALANCE", { userId, from: null, to: 0 });
    await prisma.user.update({
      where: { id: userId },
      data: { pointsBalance: 0 },
    });
  }

  return {
    pointsBalance: user?.pointsBalance ?? 0,
    cycleKey,
    canClaim: !alreadyClaimed,
    alreadyClaimed: Boolean(alreadyClaimed),
    streakDayToClaim: dayToClaim,
    pointsIfClaimNow: pointsForDay(dayToClaim),
    lastClaimAt: state.lastClaimAt ? state.lastClaimAt.toISOString() : null,
    lastCycleKey: state.lastCycleKey ?? null,
    nextResetAtUtc: nextResetAt.toISOString(),
  };
};

const claim = async (userId: string) => {
  const now = new Date();
  const cycleKey = getCycleKey(now);

  const state = await ensureState(userId);

  // block double claim same cycle
  const existing = await prisma.dailyPointClaim.findUnique({
    where: {
      userId_cycleKey: { userId, cycleKey },
    },
  });

  if (existing) {
    throw new ApiError(400, "Already claimed for this cycle.");
  }

  const dayToClaim = computeDayToClaim(state, cycleKey);
  const points = pointsForDay(dayToClaim);

  const nextStreakDay = dayToClaim >= MAX_STREAK_DAY ? 1 : dayToClaim + 1;

  log("CLAIM_ATTEMPT", { userId, cycleKey, dayToClaim, points });

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 🔎 Check user balance before increment (debug + null handling)
      const userBefore = await tx.user.findUnique({
        where: { id: userId },
        select: { pointsBalance: true },
      });

      if (!userBefore) {
        throw new ApiError(404, "User not found");
      }

      log("CLAIM_USER_BEFORE", { userId, pointsBalanceRaw: userBefore.pointsBalance });

      // ✅ Normalize null -> 0 before increment (critical fix)
      if (userBefore.pointsBalance === null) {
        log("CLAIM_FIX_NULL_BALANCE", { userId, from: null, to: 0 });
        await tx.user.update({
          where: { id: userId },
          data: { pointsBalance: 0 },
          select: { pointsBalance: true },
        });
      }

      const claimRow = await tx.dailyPointClaim.create({
        data: {
          user: { connect: { id: userId } },
          cycleKey,
          dayNumber: dayToClaim,
          points,
          claimedAt: now,
        },
      });

      const stateRow = await tx.dailyPointState.update({
        where: { userId },
        data: {
          lastClaimAt: now,
          lastCycleKey: cycleKey,
          streakDay: nextStreakDay, // store next day
        },
      });

      const userRow = await tx.user.update({
        where: { id: userId },
        data: {
          pointsBalance: { increment: points },
        },
        select: { pointsBalance: true },
      });

      log("CLAIM_SUCCESS", {
        userId,
        cycleKey,
        awardedPoints: points,
        pointsBalanceAfter: userRow.pointsBalance,
      });

      return { claimRow, stateRow, userRow };
    });

    return {
      awarded: {
        cycleKey,
        dayNumber: result.claimRow.dayNumber,
        points: result.claimRow.points,
        claimedAt: result.claimRow.claimedAt.toISOString(),
      },
      pointsBalance: result.userRow.pointsBalance,
      nextDayToClaim: result.stateRow.streakDay,
    };
  } catch (err: any) {
    // 🔥 DO NOT mask all errors as "Already claimed".
    // Only map duplicate/unique constraint errors to that message.
    logError("CLAIM_ERROR", {
      userId,
      cycleKey,
      errCode: err?.code,
      errMessage: String(err?.message || err),
    });

    if (isMongoDuplicateKeyError(err)) {
      throw new ApiError(400, "Already claimed for this cycle.");
    }

    // if it's an ApiError already, keep it
    if (err instanceof ApiError) throw err;

    throw new ApiError(500, "Failed to claim daily reward.");
  }
};

const history = async (userId: string, limit: number) => {
  const rows = await prisma.dailyPointClaim.findMany({
    where: { userId },
    orderBy: { claimedAt: "desc" },
    take: limit,
    select: {
      id: true,
      cycleKey: true,
      dayNumber: true,
      points: true,
      claimedAt: true,
    },
  });

  return rows.map((r) => ({
    ...r,
    claimedAt: r.claimedAt.toISOString(),
  }));
};

export const DailyRewardsService = {
  getStatus,
  claim,
  history,
  clearMyDailyClaims,
};

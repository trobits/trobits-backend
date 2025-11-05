import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { PushService } from "./push.service";
import { registerSchema, unregisterSchema } from "./push.validation";
import { sendUserNotification } from "./push.sender";

// ===============
// Auth endpoints
// ===============
const register = catchAsync(async (req, res) => {
  const user = req.user as { id: string } | undefined;
  if (!user?.id) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: "Unauthorized",
      data: null,
    });
  }

  const body = registerSchema.parse(req.body);
  const saved = await PushService.upsertToken(user.id, body);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Push token registered",
    data: {
      token: saved.token,
      platform: saved.platform,
      disabled: saved.disabled,
      userId: saved.userId,
    },
  });
});

const unregister = catchAsync(async (req, res) => {
  const user = req.user as { id: string } | undefined;
  if (!user?.id) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: "Unauthorized",
      data: null,
    });
  }

  const body = unregisterSchema.parse(req.body);
  const result = await PushService.disableToken(user.id, body.token);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Push token disabled",
    data: { ok: Boolean(result) },
  });
});

const listMine = catchAsync(async (req, res) => {
  const user = req.user as { id: string } | undefined;
  if (!user?.id) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: "Unauthorized",
      data: null,
    });
  }

  const tokens = await PushService.listActiveTokensForUser(user.id);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Active tokens",
    data: tokens,
  });
});

// ==============================
// Dev-only public test endpoint
// ==============================


// src/modules/Push/push.controller.ts (devTestSend)
const devTestSend = catchAsync(async (_req, res) => {
  const TEST_USER_ID = "68bbf9680e92f176535efcbf";

  const report = await sendUserNotification(TEST_USER_ID, {
    title: "🔔 Trobits Dev Push",
    body: "Hello from /api/v1/push/dev/test 🎉",
    data: { route: "/", deeplink: "trobits://home", env: "dev" },
    collapseKey: "dev-test",
    ttlSeconds: 60,
    devDontPruneInvalid: true, // <—
  });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dev push dispatched",
    data: { userId: TEST_USER_ID, ...report },
  });
});


export const PushController = {
  register,
  unregister,
  listMine,
  devTestSend,
};

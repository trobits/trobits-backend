import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { DailyRewardsService } from "./dailyRewards.service";

const getStatus = catchAsync(async (req, res) => {
  const user = req.user; // set by verifyUser middleware
  const result = await DailyRewardsService.getStatus(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Daily rewards status fetched successfully!",
    data: result,
  });
});

const claim = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await DailyRewardsService.claim(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Daily points claimed successfully!",
    data: result,
  });
});

const history = catchAsync(async (req, res) => {
  const user = req.user;
  const limit = req.query.limit ? Number(req.query.limit) : 30;
  const safeLimit = Number.isNaN(limit) ? 30 : Math.min(Math.max(limit, 1), 100);

  const result = await DailyRewardsService.history(user.id, safeLimit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Daily points history fetched successfully!",
    data: result,
  });
});

const clearMyDailyClaims = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await DailyRewardsService.clearMyDailyClaims(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Daily claim history cleared successfully!",
    data: result,
  });
});

export const DailyRewardsController = {
  getStatus,
  claim,
  history,
  clearMyDailyClaims,
};

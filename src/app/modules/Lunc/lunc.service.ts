import { PrismaClient, Lunc } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";

const prisma = new PrismaClient();

const createLunc = async (payload: Partial<Lunc>) => {
  const newLunc = await prisma.lunc.create({
    data: {
      visits: payload.visits || "0",
      revenue: payload.revenue || "0",
      burns: payload.burns || "0",
    },
  });

  if (!newLunc) {
    throw new ApiError(500, "Failed to create Lunc record");
  }

  return newLunc;
};

const updateLunc = async (payload: Partial<Lunc>) => {
  if (!payload.id) {
    throw new ApiError(400, "Lunc ID is required for updating");
  }

  const existingLunc = await prisma.lunc.findUnique({
    where: { id: payload.id },
  });

  if (!existingLunc) {
    throw new ApiError(404, "Lunc record not found");
  }

  const updatedLunc = await prisma.lunc.update({
    where: { id: payload.id },
    data: {
      visits: payload.visits ?? existingLunc.visits,
      revenue: payload.revenue ?? existingLunc.revenue,
      burns: payload.burns ?? existingLunc.burns,
    },
  });

  if (!updatedLunc) {
    throw new ApiError(500, "Failed to update Lunc record");
  }

  return updatedLunc;
};

const getLuncInformation = async () => {
  const lunc = await prisma.lunc.findUnique({
    where: { id: "67387c1944be92e6a601fd35" },
  });
  if (!lunc) {
    throw new ApiError(404, "Shiba record not found");
  }
  return lunc;
};

export const LuncServices = {
  createLunc,
  updateLunc,
  getLuncInformation,
};

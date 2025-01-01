import { CurrencyName, ShibaBurn, ShibaBurnArchive } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { Request } from "express";
import normalizeDate from "../../../utils/normalizeDate";
import { paginationHelpers } from "../../../helpars/paginationHelper";

//create main archive
const createShibaBurnArchiveIntoDB = async () => {
  const result = await prisma.shibaBurnArchive.create({
    data: {
      name: CurrencyName.SHIBA,
    },
  });
  if (!result) {
    throw new ApiError(500, "Failed to create ShibaBurnArchive record");
  }
  return result;
};

//create burn data for each date
const createShibaBurnIntoDB = async (payload: Partial<ShibaBurn>) => {
  const date = normalizeDate(payload.date as string);
  const isExistThisDate = await prisma.shibaBurn.findUnique({
    where: {
      date: date,
    },
  });
  if (isExistThisDate) {
    throw new ApiError(400, "data with This date already exist");
  }
  const result = await prisma.shibaBurn.create({
    data: {
      shibaBurnArchiveId: payload.shibaBurnArchiveId as string,
      date: date as string,
      burnCount: payload.burnCount as number,
      transactionRef: payload.transactionRef as string,
    },
  });
  if (!result) {
    throw new ApiError(500, "Failed to create ShibaBurn record");
  }
  return result;
};

//update shiba burn data
const updateShibaBurnIntoDB = async (
  payload: Partial<ShibaBurn>,
  shibaBurnId: string
) => {
  let date;
  // check if this date already exist
  if (payload.date) {
    date = normalizeDate(payload.date as string);
    const isExistThisDate = await prisma.shibaBurn.findFirst({
      where: {
        date: date,
      },
    });
    if (isExistThisDate) {
      throw new ApiError(400, "data with This date already exist");
    }
  }
  const result = await prisma.shibaBurn.update({
    where: { id: shibaBurnId },
    data: payload,
  });

  if (!result) {
    throw new ApiError(500, "Failed to update ShibaBurn record");
  }
  return result;
};

//delete shiba burn
const deleteShibaBurnFromDB = async (id: string) => {
  const result = await prisma.shibaBurn.delete({
    where: { id },
  });
  if (!result) {
    throw new ApiError(500, "Failed to delete ShibaBurn record");
  }
  return result;
};

//get shiba burn data by month and year
const getShibaBurnByMonthAndYear = async (req: Request) => {
  const { year, month } = req.query;
  const parsedYear = parseInt(year as string, 10);
  const parsedMonth = parseInt(month as string, 10);

  // Create the date range as strings
  // Start of the month
  const startDate = new Date(parsedYear, parsedMonth - 1, 1).toISOString();
  // Start of the next month
  const endDate = new Date(parsedYear, parsedMonth, 1).toISOString();

  const burns = await prisma.shibaBurn.findMany({
    where: {
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
  });

  return burns;
};

//get all shiba burn
const getAllShibaBurn = async (req: Request) => {
  //paginate options
  const options = {
    page: Number(req.query.page),
    limit: Number(req.query.limit) || 31,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as string,
  };

  //get month and year
  const { year, month } = req.query;
  const parsedYear = parseInt(year as string, 10);
  const parsedMonth = parseInt(month as string, 10);

  //initialize start and end date
  let startDate;
  let endDate;
  let whereCondition = {};

  // if (parsedMonth && parsedYear) {
  //   // Start of the month
  //   startDate = new Date(parsedYear, parsedMonth - 1, 1).toISOString();
  //   // Start of the next month
  //   endDate = new Date(parsedYear, parsedMonth, 1).toISOString();
  //   whereCondition = {
  //     date: {
  //       gte: startDate,
  //       lt: endDate,
  //     },
  //   };
  // }

if (parsedMonth && parsedYear) {
  // Set startDate to the start of the month at midnight UTC
  startDate = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1)).toISOString(); // Convert to ISO string
  // Set endDate to the first day of the next month at midnight UTC
  endDate = new Date(Date.UTC(parsedYear, parsedMonth, 1)).toISOString();

  // Ensure the end date is at the end of the day for the given month
  endDate = new Date(Date.UTC(parsedYear, parsedMonth, 1)); // Reset the time to midnight
  endDate.setUTCDate(endDate.getUTCDate() + 1); // Adjust to include the whole last day of the month
  endDate = endDate.toISOString(); // Convert to ISO string

  // Log the start and end dates
  console.log("Start Date: ", startDate);
  console.log("End Date: ", endDate);

  whereCondition = {
    date: {
      gte: startDate, // From the start of the month
      lt: endDate, // Up to the start of the next month
    },
  };
}

  //calculate pagination
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);

  const result = await prisma.shibaBurn.findMany({
    where: whereCondition,
    skip,
    take: limit,
    orderBy: {
      date: "desc",
    },
  });
  console.log({result})
  if (!result) {
    throw new ApiError(500, "Failed to get ShibaBurn record");
  }
  console.log({result})
  return result;
};

// const getAllShibaBurn = async (req: Request) => {
//   // Pagination options
//   const options = {
//     page: Number(req.query.page) || 1,
//     limit: Number(req.query.limit) || 31,
//     sortBy: req.query.sortBy as string,
//     sortOrder: req.query.sortOrder as string,
//   };

//   // Get year and month
//   const { year, month } = req.query;
//   const parsedYear = parseInt(year as string, 10);
//   const parsedMonth = parseInt(month as string, 10);

//   // Validate year and month
//   if (!parsedYear || !parsedMonth || isNaN(parsedYear) || isNaN(parsedMonth)) {
//     throw new ApiError(400, "Invalid or missing 'year' or 'month' query parameters");
//   }

//   // Set start and end of the month for the given year and month, in UTC
//   const startDate = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1)); // Start of the month in UTC
//   const endDate = new Date(Date.UTC(parsedYear, parsedMonth, 1)); // Start of the next month in UTC

//   // Log the dates to ensure they are correct
//   console.log("Start Date for ShibaBurn:", startDate);
//   console.log("End Date for ShibaBurn:", endDate);

//   const whereCondition = {
//     date: {
//       gte: startDate.toISOString(),
//       lt: endDate.toISOString(),
//     },
//   };

//   // Pagination calculation
//   const { page, limit, skip, sortBy, sortOrder } =
//     paginationHelpers.calculatePagination(options);

//   // Validate sorting fields
//   const validSortFields = ["date", "burnAmount", "name"]; // Example fields
//   const sortField = validSortFields.includes(sortBy) ? sortBy : "date";

//   // Query for full date range
//   const result = await prisma.shibaBurn.findMany({
//     where: whereCondition,
//     skip,
//     take: limit,
//     orderBy: {
//       [sortField]: sortOrder === "asc" ? "asc" : "desc",
//     },
//   });

//   if (!result) {
//     throw new ApiError(500, "Failed to get ShibaBurn record");
//   }

//   console.log({ result });
//   return result;
// };





export const ShibaBurnServices = {
  createShibaBurnArchiveIntoDB,
  createShibaBurnIntoDB,
  updateShibaBurnIntoDB,
  deleteShibaBurnFromDB,
  getShibaBurnByMonthAndYear,
  getAllShibaBurn,
};

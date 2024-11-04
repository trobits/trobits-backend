import { ObjectId } from "mongodb";
import prisma from "../../../shared/prisma";
import ITopic from "./topic.interface";

const createTopic = async (
  topicCoverImageLocalpath: string,
  payload: Partial<ITopic>
) => {
  const authorId = payload.topicAuthor as string;
  const author = await prisma.user.findUnique({
    where: { id: authorId },
  });
};

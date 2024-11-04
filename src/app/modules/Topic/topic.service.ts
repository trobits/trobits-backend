import { ObjectId } from "mongodb";
import prisma from "../../../shared/prisma";
import ITopic from "./topic.interface";
import ApiError from "../../../errors/ApiErrors";

const createTopic = async (
  topicCoverImageLocalpath: string,
  payload: Partial<ITopic>
) => {
  const authorId = payload.topicAuthor;
  if (!authorId) {
    throw new ApiError(400, "Author id is required");
  }
  const author = await prisma.user.findUnique({
    where: { id: payload.topicAuthor },
  });
  if (!author) {
    throw new ApiError(404, "Author not found with the given authorId");
  }
  const createTopic = await prisma.topic.create({
    data: {
      title: payload.title || "",
      description: payload.description || "",
      image: topicCoverImageLocalpath || undefined,
      topicAuthor: authorId,
    },
  });
  if (!createTopic) {
    throw new ApiError(500, "Failed to create a new topic");
  }
  return createTopic;
};

const getAllTopics = async () => {
  const topics = await prisma.topic.findMany({});
  if (!topics) {
    throw new ApiError(500, "Failed to retrieve all topics");
  }
  return topics;
};

const getTopicsByAuthor = async (authorId: string) => {
  const topics = await prisma.topic.findMany({
    where: {
      topicAuthor: authorId,
    },
  });
  if (!topics) {
    throw new ApiError(404, "No topics found for the given author");
  }
  return topics;
};

const updateTopic = async (payload: Partial<ITopic>, topicImage: string) => {
  const topic = await prisma.topic.findUnique({
    where: { id: payload.id },
  });
  if (!topic) {
    throw new ApiError(404, "Topic not found with the given id");
  }
  const updateTopic = await prisma.topic.update({
    where: { id: payload.id },
    data: {
      title: payload.title || undefined,
      description: payload.description || undefined,
      image: topicImage || undefined,
    },
  });
  if (!updateTopic) {
    throw new ApiError(500, "Failed to update the topic");
  }
  return updateTopic;
};

const deleteTopic = async (topicId: string) => {
  const isTopicExist = await prisma.topic.findUnique({
    where: { id: topicId },
  });
  if (!isTopicExist) {
    throw new ApiError(404, "Topic not found with the given id");
  }
  // remove existing post from this topic
  await prisma.post.deleteMany({
    where: {
      topicId: topicId,
    },
  });
  //   now delete the topic
  await prisma.topic.delete({
    where: { id: topicId },
  });
  return true;
};

export const TopicServices = {
  createTopic,
  getAllTopics,
  getTopicsByAuthor,
  updateTopic,
  deleteTopic
};

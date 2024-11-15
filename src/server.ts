import { Server } from "http";
import app from "./app";
import config from "./config";
import { socketIo } from "./helpars/socketIo";

// Main function to start the server
function main() {
  const server: Server = app.listen(config.port, () => {
    console.log("Server is running on port", config.port);
  });

  socketIo(server);
  // Graceful shutdown function
  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.log("Server closed");
      });
    }
    process.exit(1);
  };

  // Handle uncaught exceptions and unhandled promise rejections
  process.on("uncaughtException", exitHandler);
  process.on("unhandledRejection", exitHandler);
}

// Start the server
main();


// import { Server } from "http";
// import app from "./app";
// import config from "./config";
// import { UserService } from "./app/modules/User/user.service";
// import { PostServices } from "./app/modules/Post/post.service";
// import { CommentServices } from "./app/modules/Comment/comment.service";
// import { socketIo } from "./helpars/socketIo";

// // Main function to start the server
// function main() {
//   const server: Server = app.listen(config.port, () => {
//     console.log(`Server is running on port ${config.port}`);
//   });

//   // Initialize Socket.IO and receive io instance
//   const io = socketIo(server);

//   // Listen for new client connections and redefine service methods with socket instance
//   io.on("connection", (socket) => {
//     console.log(`New client connected with socket ID: ${socket.id}`);

//     // Redefine methods in UserService and PostServices to accept socket for real-time notifications
//     UserService.toggleFollow = (payload) =>
//       UserService.toggleFollow(payload, socket);
//     PostServices.addOrRemoveLike = (payload) =>
//       PostServices.addOrRemoveLike(payload, socket);
//     CommentServices.createComment = (postId, content, authorId) =>
//       CommentServices.createComment(postId, content, authorId, socket);

//     // Handle socket disconnection
//     socket.on("disconnect", () => {
//       console.log(`Client with socket ID ${socket.id} disconnected`);
//     });
//   });

//   // Graceful shutdown function
//   const exitHandler = () => {
//     if (server) {
//       server.close(() => {
//         console.log("Server closed gracefully");
//       });
//     }
//     process.exit(1);
//   };

//   // Handle uncaught exceptions and unhandled promise rejections
//   process.on("uncaughtException", exitHandler);
//   process.on("unhandledRejection", exitHandler);
// }

// // Start the server
// main();

// import app from "./app";
// import config from "./config";
// import { UserService } from "./app/modules/User/user.service";
// import { PostServices } from "./app/modules/Post/post.service";
// import { CommentServices } from "./app/modules/Comment/comment.service";
// import { NotificationType } from "@prisma/client";
// import { socketIo } from "./helpars/socketIo";
// import { Socket } from "socket.io";

// // Wrapper functions for real-time notifications with Socket.IO

// const handleToggleFollow = async (
//   payload: { followerId: any; followedId: any },
//   socket: Socket
// ) => {
//   const result = await UserService.toggleFollow(payload);
//   const { followerId, followedId } = payload;
//   if (socket.data.sendNotification) {
//     await socket.data.sendNotification(
//       followedId,
//       followerId,
//       "User followed you!",
//       NotificationType.FOLLOW
//     );
//   }
//   return result;
// };

// const handleAddOrRemoveLike = async (
//   payload: Partial<{
//     id: string;
//     content: string;
//     createdAt: Date;
//     updatedAt: Date;
//     authorId: string;
//     image: string | null;
//     likeCount: number;
//     likers: string[];
//     topicId: string | null;
//   }>,
//   socket: Socket
// ) => {
//   const result = await PostServices.addOrRemoveLike(payload);
//   const { authorId, id } = payload;
//   if (socket.data.sendNotification && authorId) {
//     await socket.data.sendNotification(
//       authorId,
//       id,
//       "Your post was liked!",
//       NotificationType.LIKE
//     );
//   }
//   return result;
// };

// const handleCreateComment = async (
//   payload: Partial<{
//     id: string;
//     content: string;
//     createdAt: Date;
//     updatedAt: Date;
//     authorId: string;
//     likeCount: number;
//     likers: string[];
//     postId: string;
//     dislikers: string[];
//     dislikeCount: number;
//   }>,
//   socket: Socket
// ) => {
//   const result = await CommentServices.createComment(payload);
//   const { postId, authorId } = payload;
//   if (socket.data.sendNotification && postId) {
//     await socket.data.sendNotification(
//       authorId,
//       postId,
//       "New comment on your post!",
//       NotificationType.COMMENT
//     );
//   }
//   return result;
// };

// // Main function to start the server
// function main() {
//   const server = app.listen(config.port, () => {
//     console.log(`Server is running on port ${config.port}`);
//   });

//   const io = socketIo(server);

//   io.on("connection", (socket) => {
//     console.log(`New client connected with socket ID: ${socket.id}`);

//     socket.on("toggleFollow", (payload) => handleToggleFollow(payload, socket));
//     socket.on("addOrRemoveLike", (payload) =>
//       handleAddOrRemoveLike(payload, socket)
//     );
//     socket.on("createComment", (payload) =>
//       handleCreateComment(payload, socket)
//     );

//     socket.on("disconnect", () => {
//       console.log(`Client with socket ID ${socket.id} disconnected`);
//     });
//   });

//   const exitHandler = () => {
//     if (server) {
//       server.close(() => {
//         console.log("Server closed gracefully");
//       });
//     }
//     process.exit(1);
//   };

//   process.on("uncaughtException", exitHandler);
//   process.on("unhandledRejection", exitHandler);
// }

// main();

// import app from "./app";
// import config from "./config";
// import { UserService } from "./app/modules/User/user.service";
// import { PostServices } from "./app/modules/Post/post.service";
// import { CommentServices } from "./app/modules/Comment/comment.service";
// import { NotificationType } from "@prisma/client";
// import { socketIo } from "./helpars/socketIo";
// import { Socket } from "socket.io";
// import prisma from "./shared/prisma";
// import ApiError from "./errors/ApiErrors";
// // import prisma from "./shared/prisma";

// // Wrapper functions for real-time notifications with Socket.IO
// const handleToggleFollow = async (
//   payload: { followerId: string; followedId: string },
//   socket: Socket
// ) => {
//   const result = await UserService.toggleFollow(payload);
//   const { followerId, followedId } = payload;
//   console.log({ result });
//   if (socket.data.sendNotification) {

//     console.log("from under");
//     await socket.data.sendNotification(
//       followedId,
//       followerId,
//       "User followed you!",
//       NotificationType.FOLLOW
//     );
//   }
//   return result;
// };

// const handleAddOrRemoveLike = async (
//   payload: { id: string; content: string; authorId: string },
//   socket: Socket
// ) => {
//   const result = await PostServices.addOrRemoveLike(payload);

//   const { authorId, id } = payload;
//   const isPostExist = await prisma.post.findUnique({ where: { id: id } });
//   if (!isPostExist) {
//     throw new ApiError(404, "post not found!");
//   }

//   if (socket.data.sendNotification && authorId) {
//     console.log({ payload });
//     await socket.data.sendNotification(
//       isPostExist.authorId, //to whom the notification is sent
//       authorId,//sender or who click on the like dislike button
//       "Your post was liked!",
//       NotificationType.LIKE
//     );
//   }
//   return result;
// };

// const handleCreateComment = async (
//   payload: { id: string; content: string; authorId: string; postId: string },
//   socket: Socket
// ) => {
//   const result = await CommentServices.createComment(payload);
//   const { postId, authorId } = payload;
//     const isPostExist = await prisma.post.findUnique({ where: { id: postId } });
//     console.log({isPostExist})
//     if (!isPostExist) {
//       throw new ApiError(404, "post not found!");
//     }

//   if (socket.data.sendNotification && postId) {
//     await socket.data.sendNotification(
//       isPostExist.authorId,
//       authorId,
//       "New comment on your post!",
//       NotificationType.COMMENT
//     );
//   }
//   return result;
// };

// // Main function to start the server
// function main() {
//   const server = app.listen(config.port, () => {
//     console.log(`Server is running on port ${config.port}`);
//   });

//   const io = socketIo(server);

//   io.on("connection", (socket) => {
//     console.log(`New client connected with socket ID: ${socket.id}`);

//     socket.on("toggleFollow", (payload) => handleToggleFollow(payload, socket));
//     socket.on("addOrRemoveLike", (payload) =>
//       handleAddOrRemoveLike(payload, socket)
//     );
//     socket.on("createComment", (payload) =>
//       handleCreateComment(payload, socket)
//     );

//     socket.on("disconnect", () => {
//       console.log(`Client with socket ID ${socket.id} disconnected`);
//     });
//   });

//   const exitHandler = () => {
//     if (server) {
//       server.close(() => {
//         console.log("Server closed gracefully");
//       });
//     }
//     process.exit(1);
//   };

//   process.on("uncaughtException", exitHandler);
//   process.on("unhandledRejection", exitHandler);
// }

// main();

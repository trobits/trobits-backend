import { NotificationType } from "@prisma/client";
// import { Server } from "http";
// import { Server as SocketIOServer } from "socket.io";
// import { corsOptions } from "../app";
// import prisma from "../shared/prisma";
// import { NotificationType } from "@prisma/client";

// export function socketIo(server: Server) {
//   const io = new SocketIOServer(server, {
//     cors: corsOptions,
//   });

//   io.on("connection", (socket) => {
//     console.log("User connected for notifications:", socket.id);

//     // Event for user to join their personal notification room
//     socket.on("joinNotificationRoom", (userId: string) => {
//       console.log(`Attempting to join room with userId: ${userId}`);
//       socket.join(userId);
//       console.log(`User with ID ${userId} joined their notification room`);
//     });

//     // Attach sendNotification function to each socket instance for usage in server.ts
//     socket.data.sendNotification = async (
//       userId: string,
//       senderId: string,
//       message: string,
//       type: NotificationType
//     ) => {
//       console.log("sendNotification called with:", {
//         userId,
//         senderId,
//         message,
//         type,
//       });

//       // Fetch additional sender data if needed
//       const sender = await prisma.user.findUnique({
//         where: { id: senderId },
//         select: {
//           firstName: true,
//           lastName: true,
//           profileImage: true,
//         },
//       });

//       if (!sender) {
//         console.log("Sender not found for senderId:", senderId);
//         return;
//       }

//       const notificationData = {
//         senderId,
//         senderName: `${sender.firstName} ${sender.lastName}`,
//         senderAvatar: sender.profileImage || "/placeholder.svg",
//         message,
//         type,
//         timestamp: new Date().toISOString(),
//       };

//       console.log("Notification data prepared:", notificationData);

//       // Store the notification in the database
//       await prisma.notification.create({
//         data: { userId, senderId, message, type },
//       });

//       // Emit the notification to the user's room
//       console.log(`Emitting notification to room: ${userId}`);
//       io.to(userId).emit("notification", notificationData);
//     };

//     socket.on("disconnect", () => {
//       console.log("User disconnected from notifications:", socket.id);
//     });
//   });

//   return io;
// }

// import { Server } from "http";
// import { Server as SocketIOServer } from "socket.io";
// import { corsOptions } from "../app";
// import prisma from "../shared/prisma";
// import { NotificationType } from "@prisma/client";

// export function socketIo(server: Server) {
//   const io = new SocketIOServer(server, {
//     cors: corsOptions,
//   });

//   io.on("connection", (socket) => {
//     console.log("User connected for notifications:", socket.id);

//     // Event for user to join their personal notification room
//     socket.on("joinNotificationRoom", (userId: string) => {
//       socket.join(userId);
//       console.log(
//         `User with ID ${userId} joined joinNotificationRoom notification room`
//       );
//     });

//     // Function to send a notification to a user
//     socket.data.sendNotification = async (
//       userId: string,
//       senderId: string,
//       message: string,
//       type: NotificationType
//     ) => {
//       // Fetch additional sender data if needed
//       const sender = await prisma.user.findUnique({
//         where: { id: senderId },
//         select: {
//           firstName: true,
//           lastName: true,
//           profileImage: true,
//           id: true,
//         },
//       });
//       if (!sender) return;

//       const notificationData = {
//         senderId,
//         senderName: `${sender.firstName} ${sender.lastName}`,
//         senderAvatar: sender.profileImage || "",
//         message,
//         type,
//         timestamp: new Date().toISOString(), // Add a timestamp
//       };
//       console.log({ notificationData });
//       // Store notification in the database
//       await prisma.notification.create({
//         data: { userId, senderId, message, type },
//       });

//       // Emit notification to the user's room
//       io.to(userId).emit("notification", notificationData);
//     };

//     socket.on("disconnect", () => {
//       console.log("User disconnected from notifications:", socket.id);
//     });
//   });

//   return io;
// }

// socketIo.ts

// socketIo.ts

import { Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { corsOptions } from "../app";
import prisma from "../shared/prisma";

// Declare a variable to hold io and sendNotification
let sendNotification: Function | null = null;

export function socketIo(server: Server) {
  const io = new SocketIOServer(server, {
    cors: corsOptions,
  });

  // Define sendNotification function
  sendNotification = async (
    recipientId: string,
    senderId: string,
    message: string,
    type: NotificationType
  ) => {
    try {
      // Save the notification to the database
      const notification = await prisma.notification.create({
        data: {
          userId: recipientId,
          senderId,
          message,
          type,
          isRead: false,
        },
      });

      // Emit the notification to the recipient if they're connected
      io.to(recipientId).emit("receiveNotification", notification);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  // Handle new connections to the Socket.io server
  io.on("connection", (socket: Socket) => {

    // Allow users to join their own private room based on their user ID
    socket.on("joinUserRoom", (userId) => {
      socket.join(userId);
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
    });
  });

  return { io };
}

export { sendNotification };

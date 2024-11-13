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

import { Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { corsOptions } from "../app";
import prisma from "../shared/prisma";
import { NotificationType } from "@prisma/client";

export function socketIo(server: Server) {
  const io = new SocketIOServer(server, {
    cors: corsOptions,
  });

  io.on("connection", (socket) => {
    console.log("User connected for notifications:", socket.id);

    // Event for user to join their personal notification room
    socket.on("joinNotificationRoom", (userId: string) => {
      socket.join(userId);
      console.log(`User with ID ${userId} joined their notification room`);
    });

    // Function to send a notification to a user
    socket.data.sendNotification = async (
      userId: string,
      senderId: string,
      message: string,
      type: NotificationType
    ) => {
      // Fetch additional sender data if needed
      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: {
          firstName: true,
          lastName: true,
          profileImage: true,
          id: true,
        },
      });
      if (!sender) return;

      const notificationData = {
        senderId,
        senderName: `${sender.firstName} ${sender.lastName}`,
        senderAvatar: sender.profileImage || "",
        message,
        type,
        timestamp: new Date().toISOString(), // Add a timestamp
      };
      console.log({ notificationData });
      // Store notification in the database
      await prisma.notification.create({
        data: { userId, senderId, message, type },
      });

      // Emit notification to the user's room
      io.to(userId).emit("notification", notificationData);
    };

    socket.on("disconnect", () => {
      console.log("User disconnected from notifications:", socket.id);
    });
  });

  return io;
}

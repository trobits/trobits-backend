// SocketIo.ts
import { NotificationType, PostCategory } from "@prisma/client";
import { Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { corsOptions } from "../app";
import prisma from "../shared/prisma";
import nodemailer from "nodemailer";

// ⬇️ NEW: bring in your existing FCM sender
import { sendUserNotification } from "../app/modules/Push/push.sender";

// Declare a variable to hold io and sendNotification
let sendNotification: Function | null = null;

// Configure nodemailer transport (kept as-is)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || "trobitscommunity@gmail.com",
    pass: process.env.EMAIL_PASS || "dxow wbph klfv jkcb",
  },
});

export function socketIo(server: Server) {
  const io = new SocketIOServer(server, {
    cors: corsOptions,
  });

  // Small helper to make a nice push title by type
  const titleFor = (type: NotificationType) => {
    switch (type) {
      case "COMMENT":
        return "New comment";
      case "LIKE":
        return "New like";
      case "FOLLOW":
        return "New follower";
      default:
        return "New notification";
    }
  };

  // Define sendNotification function — now also sends FCM (global, single place)
  sendNotification = async (
    recipientId: string,
    senderId: string,
    message: string,
    type: NotificationType,
    postId?: string,
    category?: PostCategory
  ) => {
    try {
      // Save the notification to the database (as before)
      const notification = await prisma.notification.create({
        data: {
          userId: recipientId,
          senderId,
          message,
          type,
          isRead: false,
          postId,
          category,
        },
      });

      // Emit the notification to the recipient if they're connected (as before)
      io.to(recipientId).emit("receiveNotification", notification);

      // Fetch recipient email from DB (as before)
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { email: true, firstName: true },
      });

      if (recipient?.email) {
        // Send email notification (kept as-is)
        await transporter.sendMail({
          from: `"My App" <${process.env.SMTP_USER}>`,
          to: recipient.email,
          subject: "New Notification",
          html: `
            <p>Hi ${recipient.firstName || "User"},</p>
            <p>${message}</p>
            <p>Type: ${type}</p>
            ${postId ? `<p>Related Post: ${postId}</p>` : ""}
            <br/>
            <p>Best regards,<br/>My App Team</p>
          `,
        });
      }

      // ⬇️ NEW: Push via FCM — minimal, centralized
      try {
        await sendUserNotification(recipientId, {
          title: titleFor(type),
          body: message,
          data: {
            notificationId: notification.id,
            type,
            postId: postId ?? "",
            category: category ?? "",
            // If your apps route on these, uncomment:
            // route: postId ? `/post/${postId}` : "/notifications",
            // deeplink: postId ? `trobits://post/${postId}` : "trobits://notifications",
          },
          collapseKey: `notif-${type}`,
          ttlSeconds: 300, // 5 minutes
          // devDontPruneInvalid: false, // use default behavior from push.sender.ts
        });
      } catch (pushErr) {
        // Don't block the flow if FCM fails
        console.error("FCM push error:", pushErr);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  // Handle new connections to the Socket.io server (kept as-is)
  io.on("connection", (socket: Socket) => {
    socket.on("joinUserRoom", (userId) => {
      socket.join(userId);
    });

    socket.on("disconnect", () => {});
  });

  return { io };
}

export { sendNotification };

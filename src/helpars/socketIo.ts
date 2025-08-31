import { NotificationType, PostCategory } from "@prisma/client";
import { Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { corsOptions } from "../app";
import prisma from "../shared/prisma";
import nodemailer from "nodemailer";

// Declare a variable to hold io and sendNotification
let sendNotification: Function | null = null;

// Configure nodemailer transport
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'trobitscommunity@gmail.com',
        pass: process.env.EMAIL_PASS || 'dxow wbph klfv jkcb',
    },
});

export function socketIo(server: Server) {
  const io = new SocketIOServer(server, {
    cors: corsOptions,
  });

  // Define sendNotification function
  sendNotification = async (
    recipientId: string,
    senderId: string,
    message: string,
    type: NotificationType,
    postId?: string,
    category?: PostCategory
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
          postId,
          category,
        },
      });

      // Emit the notification to the recipient if they're connected
      io.to(recipientId).emit("receiveNotification", notification);

      // Fetch recipient email from DB
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { email: true, firstName: true },
      });

      if (recipient?.email) {
        // Send email notification
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
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  // Handle new connections to the Socket.io server
  io.on("connection", (socket: Socket) => {
    socket.on("joinUserRoom", (userId) => {
      socket.join(userId);
    });

    socket.on("disconnect", () => {});
  });

  return { io };
}

export { sendNotification };

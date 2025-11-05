import z from "zod";

export const registerSchema = z.object({
  token: z.string().min(10),
  platform: z.enum(["android", "ios", "web", "other"]).default("other"),
  deviceId: z.string().optional(),
  appVersion: z.string().optional(),
  locale: z.string().optional(),
  osVersion: z.string().optional(),
  model: z.string().optional(),
});

export const unregisterSchema = z.object({
  token: z.string().min(10),
});

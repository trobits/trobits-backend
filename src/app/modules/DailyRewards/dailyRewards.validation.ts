import z from "zod";

const historyQuerySchema = z.object({
  query: z.object({
    limit: z
      .string()
      .optional()
      .transform((v) => {
        const n = v ? Number(v) : 30;
        if (Number.isNaN(n) || n <= 0) return 30;
        return Math.min(n, 100);
      }),
  }),
});

export const dailyRewardsValidation = {
  historyQuerySchema,
};

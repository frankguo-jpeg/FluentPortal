import { z } from "zod";
import { metricsSchema } from "./metrics";

export const createUpdateSchema = z.object({
  metrics: metricsSchema,
  details: z.string().min(1, "Details are required").max(5000),
});

export const createCommentSchema = z.object({
  updateId: z.string().min(1),
  content: z.string().min(1, "Comment cannot be empty").max(2000),
});

export const createReactionSchema = z.object({
  updateId: z.string().min(1),
  type: z.enum(["LIKE", "INSIGHTFUL", "INNOVATIVE"]),
});

export type CreateUpdateInput = z.infer<typeof createUpdateSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateReactionInput = z.infer<typeof createReactionSchema>;

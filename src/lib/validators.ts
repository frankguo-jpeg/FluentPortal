import { z } from "zod";
import { metricsSchema } from "./metrics";

export const createUpdateSchema = z.object({
  metrics: metricsSchema,
  details: z.string().min(1, "Details are required").max(5000),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string(),
    size: z.number(),
    mimeType: z.string(),
  })).optional(),
});

export const createCommentSchema = z.object({
  updateId: z.string().min(1),
  content: z.string().min(1, "Comment cannot be empty").max(2000),
});

export const createReactionSchema = z.object({
  updateId: z.string().min(1),
  type: z.enum(["LIKE", "INSIGHTFUL", "INNOVATIVE"]),
});

export const companyProfileSchema = z.object({
  description: z.string().max(2000).optional().nullable(),
  techStack: z.string().max(1000).optional().nullable(),
  teamSize: z.number().int().min(1).optional().nullable(),
  products: z.string().max(1000).optional().nullable(),
  challenges: z.string().max(2000).optional().nullable(),
  goals: z.string().max(2000).optional().nullable(),
});

export const chatMessageSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(5000),
  })).min(1).max(50),
});

export type CreateUpdateInput = z.infer<typeof createUpdateSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateReactionInput = z.infer<typeof createReactionSchema>;
export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

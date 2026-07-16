import { z } from "zod";

export const aiRecommendedActionSchema = z.enum([
  "REFUND_REVIEW",
  "DELAY_COUPON",
  "ESCALATE",
]);

export const aiConfidenceSchema = z.enum(["high", "medium", "low"]);

export const aiPolicyReferenceSchema = z
  .object({
    policyId: z.string().min(1).max(100),
    section: z.string().min(1).max(300),
    reason: z.string().min(1).max(1_000),
  })
  .strict();

export const aiSuggestionSchema = z
  .object({
    replyDraft: z.string().min(1).max(4_000),
    policyReferences: z.array(aiPolicyReferenceSchema).max(4),
    recommendedAction: aiRecommendedActionSchema,
    confidence: aiConfidenceSchema,
  })
  .strict();

export const aiOrderContextSchema = z
  .object({
    orderId: z.string().trim().min(1).max(100),
    productName: z.string().trim().min(1).max(500),
    orderStatus: z.string().trim().min(1).max(100),
    orderedAt: z.string().trim().min(1).max(100),
    deliveryExpectedAt: z.string().max(100).nullable(),
    deliveredAt: z.string().max(100).nullable(),
    paymentAmount: z.number().finite().nonnegative(),
  })
  .strict();

export const aiPolicyContextSchema = z
  .object({
    policyId: z.string().trim().min(1).max(100),
    section: z.string().trim().min(1).max(300),
    content: z.string().trim().min(1).max(8_000),
  })
  .strict();

export const aiSuggestionRequestSchema = z
  .object({
    inquiry: z.string().trim().min(1).max(4_000),
    order: aiOrderContextSchema.nullable(),
    policies: z.array(aiPolicyContextSchema).max(4),
  })
  .strict();

export type AiRecommendedAction = z.infer<typeof aiRecommendedActionSchema>;
export type AiConfidence = z.infer<typeof aiConfidenceSchema>;
export type AiPolicyReference = z.infer<typeof aiPolicyReferenceSchema>;
export type AiSuggestion = z.infer<typeof aiSuggestionSchema>;
export type AiOrderContext = z.infer<typeof aiOrderContextSchema>;
export type AiPolicyContext = z.infer<typeof aiPolicyContextSchema>;
export type AiSuggestionRequest = z.infer<typeof aiSuggestionRequestSchema>;

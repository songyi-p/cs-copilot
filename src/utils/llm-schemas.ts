import { z } from "zod";

export const recommendedActionSchema = z.enum([
  "REFUND_REVIEW",
  "DELAY_COUPON",
  "ESCALATE",
]);

export const llmConfidenceSchema = z.enum(["high", "medium", "low"]);

export const llmPolicyReferenceSchema = z
  .object({
    policyId: z.string().min(1).max(100),
    section: z.string().min(1).max(300),
    reason: z.string().min(1).max(1_000),
  })
  .strict();

export const llmSuggestionSchema = z
  .object({
    replyDraft: z.string().min(1).max(4_000),
    policyReferences: z.array(llmPolicyReferenceSchema).max(4),
    recommendedAction: recommendedActionSchema,
    confidence: llmConfidenceSchema,
  })
  .strict();

export const llmOrderContextSchema = z
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

export const llmPolicyContextSchema = z
  .object({
    policyId: z.string().trim().min(1).max(100),
    section: z.string().trim().min(1).max(300),
    content: z.string().trim().min(1).max(8_000),
  })
  .strict();

export const llmSuggestionRequestSchema = z
  .object({
    inquiry: z.string().trim().min(1).max(4_000),
    order: llmOrderContextSchema.nullable(),
    policies: z.array(llmPolicyContextSchema).max(4),
  })
  .strict();

export type RecommendedAction = z.infer<typeof recommendedActionSchema>;
export type LlmConfidence = z.infer<typeof llmConfidenceSchema>;
export type LlmPolicyReference = z.infer<typeof llmPolicyReferenceSchema>;
export type LlmSuggestion = z.infer<typeof llmSuggestionSchema>;
export type LlmOrderContext = z.infer<typeof llmOrderContextSchema>;
export type LlmPolicyContext = z.infer<typeof llmPolicyContextSchema>;
export type LlmSuggestionRequest = z.infer<typeof llmSuggestionRequestSchema>;

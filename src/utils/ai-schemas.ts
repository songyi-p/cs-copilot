import { z } from "zod";

export const aiRecommendedActionSchema = z.enum([
  "REFUND_REVIEW",
  "DELAY_COUPON",
  "EXCHANGE_REVIEW",
  "RETURN_REVIEW",
  "DEFECT_EVIDENCE_REQUEST",
  "CANCELLATION_REQUEST",
  "ORDER_CHANGE_CHECK",
  "ADDRESS_CHANGE_CHECK",
  "DELIVERY_TRACE",
  "REFUND_STATUS_NOTICE",
  "RETURN_FEE_NOTICE",
  "MEMBERSHIP_GUIDE",
  "ESCALATE",
]);

export const aiConfidenceScoreSchema = z.number().int().min(1).max(5);

export const aiPolicyReferenceSchema = z
  .object({
    policyId: z.string().min(1).max(100),
    section: z.string().min(1).max(300),
    reason: z.string().min(1).max(1_000),
  })
  .strict();

export const aiSuggestionSchema = z
  .object({
    replyDraft: z.string().min(1).max(800),
    policyReferences: z.array(aiPolicyReferenceSchema).max(4),
    recommendedAction: aiRecommendedActionSchema,
    confidenceScore: aiConfidenceScoreSchema,
    confidenceReason: z.string().trim().min(1).max(1_000),
    missingInformation: z.array(z.string().trim().min(1).max(300)).max(5),
    reviewRequired: z.boolean(),
  })
  .strict();

const aiProviderPolicyReferenceSchema = z
  .object({
    policyId: z.string(),
    section: z.string(),
    reason: z.string(),
  })
  .strict();

export const aiProviderSuggestionSchema = z
  .object({
    replyDraft: z.string(),
    policyReferences: z.array(aiProviderPolicyReferenceSchema),
    recommendedAction: aiRecommendedActionSchema,
    confidenceScore: z.enum(["1", "2", "3", "4", "5"]),
    confidenceReason: z.string(),
    missingInformation: z.array(z.string()),
    reviewRequired: z.boolean(),
  })
  .strict();

export const parseAiProviderSuggestion = (value: unknown): AiSuggestion => {
  const providerSuggestion = aiProviderSuggestionSchema.parse(value);
  return aiSuggestionSchema.parse({
    ...providerSuggestion,
    confidenceScore: Number(providerSuggestion.confidenceScore),
  });
};

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

export const aiOrderFactsSchema = aiOrderContextSchema
  .extend({
    evaluatedAt: z.string().trim().min(1).max(100),
    daysPastDeliveryExpected: z.number().int().nonnegative().nullable(),
    daysSinceDelivered: z.number().int().nonnegative().nullable(),
    isBeforeShipment: z.boolean(),
  })
  .strict();

export const aiSuggestionRequestSchema = z
  .object({
    inquiryTitle: z.string().trim().min(1).max(300),
    inquiryContent: z.string().trim().min(1).max(4_000),
    ticketCategory: z.string().trim().min(1).max(100),
    order: aiOrderContextSchema.nullable(),
    policies: z.array(aiPolicyContextSchema).max(5),
  })
  .strict();

export type AiRecommendedAction = z.infer<typeof aiRecommendedActionSchema>;
export type AiConfidenceScore = z.infer<typeof aiConfidenceScoreSchema>;
export type AiPolicyReference = z.infer<typeof aiPolicyReferenceSchema>;
export type AiSuggestion = z.infer<typeof aiSuggestionSchema>;
export type AiProviderSuggestion = z.infer<typeof aiProviderSuggestionSchema>;
export type AiOrderContext = z.infer<typeof aiOrderContextSchema>;
export type AiOrderFacts = z.infer<typeof aiOrderFactsSchema>;
export type AiPolicyContext = z.infer<typeof aiPolicyContextSchema>;
export type AiSuggestionRequest = z.infer<typeof aiSuggestionRequestSchema>;

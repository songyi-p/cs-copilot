import { z } from "zod";

export const AI_REPLY_DRAFT_MAX_LENGTH = 500;
export const AI_POLICY_REFERENCE_MAX_COUNT = 3;
export const AI_POLICY_REASON_MAX_LENGTH = 120;
export const AI_CONFIDENCE_REASON_MAX_LENGTH = 120;
export const AI_MISSING_INFORMATION_MAX_COUNT = 3;
export const AI_MISSING_INFORMATION_MAX_LENGTH = 160;

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
    reason: z.string().min(1).max(AI_POLICY_REASON_MAX_LENGTH),
  })
  .strict();

export const aiSuggestionSchema = z
  .object({
    replyDraft: z.string().min(1).max(AI_REPLY_DRAFT_MAX_LENGTH),
    policyReferences: z.array(aiPolicyReferenceSchema).max(AI_POLICY_REFERENCE_MAX_COUNT),
    recommendedAction: aiRecommendedActionSchema,
    confidenceScore: aiConfidenceScoreSchema,
    confidenceReason: z.string().trim().min(1).max(AI_CONFIDENCE_REASON_MAX_LENGTH),
    missingInformation: z
      .array(z.string().trim().min(1).max(AI_MISSING_INFORMATION_MAX_LENGTH))
      .max(AI_MISSING_INFORMATION_MAX_COUNT),
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
  })
  .strict();

const normalizeProviderText = (value: string, maxLength: number) =>
  value.trim().slice(0, maxLength);

export const parseAiProviderSuggestion = (value: unknown): AiSuggestion => {
  const providerSuggestion = aiProviderSuggestionSchema.parse(value);
  return aiSuggestionSchema.parse({
    ...providerSuggestion,
    replyDraft: normalizeProviderText(
      providerSuggestion.replyDraft,
      AI_REPLY_DRAFT_MAX_LENGTH
    ),
    policyReferences: providerSuggestion.policyReferences
      .map((reference) => ({
        policyId: normalizeProviderText(reference.policyId, 100),
        section: normalizeProviderText(reference.section, 300),
        reason: normalizeProviderText(reference.reason, AI_POLICY_REASON_MAX_LENGTH),
      }))
      .filter(
        (reference) => reference.policyId && reference.section && reference.reason
      )
      .slice(0, AI_POLICY_REFERENCE_MAX_COUNT),
    confidenceScore: Number(providerSuggestion.confidenceScore),
    confidenceReason: normalizeProviderText(
      providerSuggestion.confidenceReason,
      AI_CONFIDENCE_REASON_MAX_LENGTH
    ),
    missingInformation: providerSuggestion.missingInformation
      .map((information) =>
        normalizeProviderText(information, AI_MISSING_INFORMATION_MAX_LENGTH)
      )
      .filter(Boolean)
      .slice(0, AI_MISSING_INFORMATION_MAX_COUNT),
    reviewRequired: false,
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
    policies: z.array(aiPolicyContextSchema).max(3),
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

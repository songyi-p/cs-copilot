import { z } from "zod";

export const MAX_REPLY_LEN = 500;
export const MAX_POLICY_REFS = 3;
export const MAX_POLICY_REASON_LEN = 120;
export const MAX_SCORE_REASON_LEN = 120;
export const MAX_MISSING_INFO = 3;
export const MAX_MISSING_INFO_LEN = 160;

export const aiActionSchema = z.enum([
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

export const aiScoreSchema = z.number().int().min(1).max(5);

export const policyRefSchema = z
  .object({
    policyId: z.string().min(1).max(100),
    section: z.string().min(1).max(300),
    reason: z.string().min(1).max(MAX_POLICY_REASON_LEN),
  })
  .strict();

export const aiSuggestionSchema = z
  .object({
    replyDraft: z.string().min(1).max(MAX_REPLY_LEN),
    policyReferences: z.array(policyRefSchema).max(MAX_POLICY_REFS),
    recommendedAction: aiActionSchema,
    confidenceScore: aiScoreSchema,
    confidenceReason: z.string().trim().min(1).max(MAX_SCORE_REASON_LEN),
    missingInformation: z
      .array(z.string().trim().min(1).max(MAX_MISSING_INFO_LEN))
      .max(MAX_MISSING_INFO),
    reviewRequired: z.boolean(),
  })
  .strict();

const aiOutputRefSchema = z
  .object({
    policyId: z.string(),
    section: z.string(),
    reason: z.string(),
  })
  .strict();

export const aiOutputSchema = z
  .object({
    replyDraft: z.string(),
    policyReferences: z.array(aiOutputRefSchema),
    recommendedAction: aiActionSchema,
    confidenceScore: z.enum(["1", "2", "3", "4", "5"]),
    confidenceReason: z.string(),
    missingInformation: z.array(z.string()),
  })
  .strict();

const trimOutput = (value: string, maxLen: number) => value.trim().slice(0, maxLen);

export const parseAiOutput = (value: unknown): AiSuggestion => {
  const output = aiOutputSchema.parse(value);
  return aiSuggestionSchema.parse({
    ...output,
    replyDraft: trimOutput(output.replyDraft, MAX_REPLY_LEN),
    policyReferences: output.policyReferences
      .map((reference) => ({
        policyId: trimOutput(reference.policyId, 100),
        section: trimOutput(reference.section, 300),
        reason: trimOutput(reference.reason, MAX_POLICY_REASON_LEN),
      }))
      .filter(
        (reference) => reference.policyId && reference.section && reference.reason
      )
      .slice(0, MAX_POLICY_REFS),
    confidenceScore: Number(output.confidenceScore),
    confidenceReason: trimOutput(output.confidenceReason, MAX_SCORE_REASON_LEN),
    missingInformation: output.missingInformation
      .map((info) => trimOutput(info, MAX_MISSING_INFO_LEN))
      .filter(Boolean)
      .slice(0, MAX_MISSING_INFO),
    reviewRequired: false,
  });
};

export const orderContextSchema = z
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

export const policyContextSchema = z
  .object({
    policyId: z.string().trim().min(1).max(100),
    section: z.string().trim().min(1).max(300),
    content: z.string().trim().min(1).max(8_000),
  })
  .strict();

export const orderFactsSchema = orderContextSchema
  .extend({
    evaluatedAt: z.string().trim().min(1).max(100),
    daysPastDeliveryExpected: z.number().int().nonnegative().nullable(),
    daysSinceDelivered: z.number().int().nonnegative().nullable(),
    isBeforeShipment: z.boolean(),
  })
  .strict();

export const aiReqSchema = z
  .object({
    inquiryTitle: z.string().trim().min(1).max(300),
    inquiryContent: z.string().trim().min(1).max(4_000),
    ticketCategory: z.string().trim().min(1).max(100),
    order: orderContextSchema.nullable(),
    policies: z.array(policyContextSchema).max(3),
  })
  .strict();

export type AiAction = z.infer<typeof aiActionSchema>;
export type AiScore = z.infer<typeof aiScoreSchema>;
export type PolicyRef = z.infer<typeof policyRefSchema>;
export type AiSuggestion = z.infer<typeof aiSuggestionSchema>;
export type AiOutput = z.infer<typeof aiOutputSchema>;
export type OrderContext = z.infer<typeof orderContextSchema>;
export type OrderFacts = z.infer<typeof orderFactsSchema>;
export type PolicyContext = z.infer<typeof policyContextSchema>;
export type AiReq = z.infer<typeof aiReqSchema>;

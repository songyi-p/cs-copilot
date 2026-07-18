import type {
  ActionHistory,
  AiConfidence,
  AiRecommendedAction,
} from "@/utils/types";

export const categoryLabel: Record<string, string> = {
  DELIVERY_DELAY: "배송 지연",
  EXCHANGE: "교환",
  RETURN: "반품",
  DELIVERY_ADDRESS: "배송지 변경",
  ORDER_CHANGE: "주문 변경",
  REFUND_STATUS: "환불 현황",
  RETURN_FEE: "반품비",
  DEFECT: "불량",
  CANCELLATION: "주문 취소",
  MEMBERSHIP: "회원 혜택",
  WRONG_ITEM: "오배송",
  DELIVERY_MISSING: "배송 완료 미수령",
};

export const statusLabel: Record<string, string> = {
  OPEN: "접수",
  IN_REVIEW: "검토 중",
  ESCALATED: "이관됨",
  RESOLVED: "처리 완료",
};

export const orderStatusLabel: Record<string, string> = {
  PAID: "결제 완료",
  PREPARING: "상품 준비 중",
  IN_TRANSIT: "배송 중",
  DELIVERED: "배송 완료",
  CANCELLED: "주문 취소",
  REFUNDED: "환불 완료",
};

export const aiDecisionLabel: Record<NonNullable<ActionHistory["aiDecision"]>, string> = {
  ADOPTED: "초안 그대로 승인",
  EDITED: "수정 후 승인",
  REJECTED: "제안 미채택",
};

export const aiRecommendedActionLabel: Record<AiRecommendedAction, string> = {
  REFUND_REVIEW: "환불 가능 여부 검토",
  DELAY_COUPON: "배송 지연 쿠폰 발급 검토",
  ESCALATE: "담당자 이관 권장",
};

export const aiConfidenceLabel: Record<AiConfidence, string> = {
  high: "신뢰도 높음",
  medium: "신뢰도 보통",
  low: "신뢰도 낮음",
};

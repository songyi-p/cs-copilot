import type { ActionHistory, AiAction, AiScore } from "@/utils/types";

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

export const aiActionLabel: Record<AiAction, string> = {
  REFUND_REVIEW: "환불 가능 여부 검토",
  DELAY_COUPON: "배송 지연 쿠폰 발급 검토",
  EXCHANGE_REVIEW: "교환 가능 여부 검토",
  RETURN_REVIEW: "반품 가능 여부 검토",
  DEFECT_EVIDENCE_REQUEST: "불량·오배송 증빙 확인",
  CANCELLATION_REQUEST: "출고 전 주문 취소 검토",
  ORDER_CHANGE_CHECK: "주문 변경 가능 여부 확인",
  ADDRESS_CHANGE_CHECK: "배송지 변경 가능 여부 확인",
  DELIVERY_TRACE: "배송 위치 및 인계 상태 확인",
  REFUND_STATUS_NOTICE: "환불 반영 기간 안내",
  RETURN_FEE_NOTICE: "반품·교환 배송비 기준 안내",
  MEMBERSHIP_GUIDE: "회원 등급 혜택 안내",
  ESCALATE: "담당자 이관 권장",
};

export const aiScoreLabel: Record<AiScore, string> = {
  1: "근거 부족",
  2: "추가 판단 필요",
  3: "외부 확인 필요",
  4: "근거 충분",
  5: "판단 명확",
};

// 화면 구조를 단계적으로 옮기는 동안 기존 import와 호환합니다.
export const aiRecommendedActionLabel = aiActionLabel;
export const aiConfidenceLabel = aiScoreLabel;

type StatusTone = "open" | "review" | "escalated" | "resolved";

export const statusTone: Record<string, StatusTone> = {
  OPEN: "open",
  IN_REVIEW: "review",
  ESCALATED: "escalated",
  RESOLVED: "resolved",
};

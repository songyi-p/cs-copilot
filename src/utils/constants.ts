import type { ActionHistory } from "@/utils/types";

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
  ACCOUNT: "계정",
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

export const aiDecisionLabel: Record<ActionHistory["aiDecision"], string> = {
  ADOPTED: "초안 그대로 승인",
  EDITED: "수정 후 승인",
  REJECTED: "제안 미채택",
};

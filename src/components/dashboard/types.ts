export type Ticket = {
  ticketId: string;
  customerId: string;
  orderId: string | null;
  inquiry: string;
  category: string;
  status: string;
  createdAt: string;
};

export type Customer = {
  customerId: string;
  name: string;
  grade: string;
  recentOrderCount: number;
  recentCsCount: number;
};

export type Order = {
  orderId: string;
  customerId: string;
  productName: string;
  orderStatus: string;
  orderedAt: string;
  deliveryExpectedAt: string | null;
  deliveredAt: string | null;
  paymentAmount: number;
};

export type PolicyReference = {
  referenceId: string;
  ticketId: string;
  policyId: string;
  section: string;
  reason: string;
};

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

export function formatDate(value: string | null) {
  if (!value) return "-";
  const [, month, day] = value.slice(0, 10).split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

export function formatDateTime(value: string) {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-");
  return `${year}. ${Number(month)}. ${Number(day)}. ${time.slice(0, 5)}`;
}

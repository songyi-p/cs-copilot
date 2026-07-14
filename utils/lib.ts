import { Order, Ticket } from "../components/dashboard/types";

export const createDraft = (ticket: Ticket, name: string, order?: Order) => {
  if (ticket.category === "DELIVERY_DELAY")
    return `안녕하세요, ${name}님. 배송이 지연되어 불편을 드려 죄송합니다. 현재 상품은 배송 중이며, 택배사 확인 후 최신 배송 상황을 다시 안내드리겠습니다. 예정일보다 2일 이상 지연된 경우 3,000원 쿠폰도 함께 발급해 드릴 수 있습니다.`;
  if (ticket.category === "EXCHANGE")
    return `안녕하세요, ${name}님. 사이즈 교환을 도와드리겠습니다. 상품 수령 후 7일 이내라면 동일 상품의 재고 확인 후 교환 신청이 가능합니다. 원하시는 사이즈를 알려주시면 바로 확인하겠습니다.`;
  if (ticket.category === "DEFECT")
    return `안녕하세요, ${name}님. 상품 상태로 불편을 드려 죄송합니다. 불량 부위가 잘 보이는 사진을 보내주시면 확인 후 교환 또는 환불을 빠르게 도와드리겠습니다. 이 경우 반품 배송비는 차감되지 않습니다.`;
  return `안녕하세요, ${name}님. 문의해 주신 내용을 확인했습니다${
    order ? ` (${order.productName})` : ""
  }. 정확한 처리를 위해 확인 후 안내드리겠습니다.`;
};

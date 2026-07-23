import { PrismaPg } from "@prisma/adapter-pg";
import {
  AiDecision,
  CustomerGrade,
  OrderStatus,
  PrismaClient,
  TicketCategory,
  TicketStatus,
} from "../src/generated/prisma/client";
import actionHistoryData from "../src/data/action-history.json";
import customerData from "../src/data/customers.json";
import orderData from "../src/data/orders.json";
import policyReferenceData from "../src/data/policy-references.json";
import ticketData from "../src/data/tickets.json";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL 또는 DIRECT_URL이 필요합니다.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const demoUser = {
  id: "user-demo-yoon",
  name: "윤서연",
  email: "demo-yoon@cs-copilot.local",
};

const agents = [
  {
    agentId: "agent-yoon",
    name: "윤서연",
    role: "AGENT" as const,
    userId: demoUser.id,
  },
  {
    agentId: "agent-lee",
    name: "이수진",
    role: "AGENT" as const,
    userId: null,
  },
  {
    agentId: "agent-kim",
    name: "김도현",
    role: "AGENT" as const,
    userId: null,
  },
  {
    agentId: "agent-park",
    name: "박준호",
    role: "ADMIN" as const,
    userId: null,
  },
];

const toDate = (value: string | null) => (value ? new Date(`${value}T00:00:00.000Z`) : null);

const parseEnum = <T extends Record<string, string>>(
  values: T,
  value: string,
  field: string
): T[keyof T] => {
  if (!(value in values)) {
    throw new Error(`${field} 값이 올바르지 않습니다: ${value}`);
  }
  return values[value as keyof T];
};

async function seed() {
  await prisma.user.upsert({
    where: { id: demoUser.id },
    update: demoUser,
    create: demoUser,
  });

  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { agentId: agent.agentId },
      update: agent,
      create: agent,
    });
  }

  for (const customer of customerData) {
    const values = {
      ...customer,
      grade: parseEnum(CustomerGrade, customer.grade, "Customer.grade"),
    };
    await prisma.customer.upsert({
      where: { customerId: customer.customerId },
      update: values,
      create: values,
    });
  }

  for (const order of orderData) {
    const values = {
      ...order,
      orderStatus: parseEnum(OrderStatus, order.orderStatus, "Order.orderStatus"),
      orderedAt: toDate(order.orderedAt)!,
      deliveryExpectedAt: toDate(order.deliveryExpectedAt),
      deliveredAt: toDate(order.deliveredAt),
    };
    await prisma.order.upsert({
      where: { orderId: order.orderId },
      update: values,
      create: values,
    });
  }

  for (const ticket of ticketData) {
    const values = {
      ...ticket,
      assigneeId: ticket.ticketId === "TKT-1004" ? "agent-lee" : "agent-yoon",
      category: parseEnum(TicketCategory, ticket.category, "Ticket.category"),
      status: parseEnum(TicketStatus, ticket.status, "Ticket.status"),
      createdAt: new Date(ticket.createdAt),
    };
    await prisma.ticket.upsert({
      where: { ticketId: ticket.ticketId },
      update: values,
      create: values,
    });
  }

  for (const history of actionHistoryData) {
    await prisma.actionHistory.upsert({
      where: { historyId: history.historyId },
      update: {
        ...history,
        aiDecision: parseEnum(AiDecision, history.aiDecision, "ActionHistory.aiDecision"),
        createdAt: new Date(history.createdAt),
      },
      create: {
        ...history,
        aiDecision: parseEnum(AiDecision, history.aiDecision, "ActionHistory.aiDecision"),
        createdAt: new Date(history.createdAt),
      },
    });
  }

  for (const reference of policyReferenceData) {
    await prisma.ticketPolicyReference.upsert({
      where: { referenceId: reference.referenceId },
      update: reference,
      create: reference,
    });
  }
}

seed()
  .then(() => {
    console.info(
      `Seeded ${customerData.length} customers, ${orderData.length} orders, ${ticketData.length} tickets, ${actionHistoryData.length} histories.`
    );
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

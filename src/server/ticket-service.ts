import {
  Prisma,
  type ActionHistory as ActionHistoryRecord,
  type Agent as AgentRecord,
  type Customer as CustomerRecord,
  type Order as OrderRecord,
  type Ticket as TicketRow,
} from "@/generated/prisma/client";
import { aiActionLabel } from "@/utils/constants";
import { aiScoreSchema, policyRefSchema } from "@/utils/schemas";
import type {
  ActionHistory,
  Agent,
  ApproveTicketInput,
  Customer,
  MutationResult,
  Order,
  SaveDraftInput,
  Ticket,
  TicketDetailData,
  TicketListData,
  TransferTicketInput,
} from "@/utils/types";
import type { CurrentAgent } from "@/server/current-agent";
import { ServerError } from "@/server/errors";
import { prisma } from "@/server/prisma";

const ticketInclude = {
  customer: true,
  order: true,
  assignee: true,
  draft: true,
  histories: {
    orderBy: {
      createdAt: "desc",
    },
  },
} satisfies Prisma.TicketInclude;

type TicketRecord = Prisma.TicketGetPayload<{
  include: typeof ticketInclude;
}>;

type TicketAccessRecord = {
  assigneeId: string;
  status: "OPEN" | "IN_REVIEW" | "ESCALATED" | "RESOLVED";
  version: number;
};

const toTicket = (ticket: TicketRow): Ticket => ({
  ticketId: ticket.ticketId,
  customerId: ticket.customerId,
  orderId: ticket.orderId,
  title: ticket.title,
  inquiry: ticket.inquiry,
  category: ticket.category,
  status: ticket.status,
  createdAt: ticket.createdAt.toISOString(),
  assigneeId: ticket.assigneeId,
});

const toCustomer = (customer: CustomerRecord): Customer => ({
  customerId: customer.customerId,
  name: customer.name,
  grade: customer.grade,
  recentOrderCount: customer.recentOrderCount,
  recentCsCount: customer.recentCsCount,
});

const toOrder = (order: OrderRecord): Order => ({
  orderId: order.orderId,
  customerId: order.customerId,
  productName: order.productName,
  orderStatus: order.orderStatus,
  orderedAt: order.orderedAt.toISOString().slice(0, 10),
  deliveryExpectedAt: order.deliveryExpectedAt?.toISOString().slice(0, 10) ?? null,
  deliveredAt: order.deliveredAt?.toISOString().slice(0, 10) ?? null,
  paymentAmount: order.paymentAmount,
});

const toAgent = (agent: AgentRecord): Agent => ({
  agentId: agent.agentId,
  name: agent.name,
  role: agent.role,
});

const toHistory = (history: ActionHistoryRecord): ActionHistory => {
  const parsedReferences = policyRefSchema.array().safeParse(history.policyReferences);
  const parsedScore = aiScoreSchema.safeParse(history.aiConfidenceScore);

  return {
    historyId: history.historyId,
    ticketId: history.ticketId,
    suggestedAction: history.suggestedAction,
    finalAction: history.finalAction,
    aiDecision: history.aiDecision ?? undefined,
    agentId: history.agentId,
    createdAt: history.createdAt.toISOString(),
    finalResponse: history.finalResponse ?? undefined,
    actionLabel: history.actionLabel ?? undefined,
    eventType: history.eventType ?? undefined,
    note: history.note ?? undefined,
    fromAgentId: history.fromAgentId ?? undefined,
    toAgentId: history.toAgentId ?? undefined,
    aiConfidenceScore: parsedScore.success ? parsedScore.data : undefined,
    policyReferences: parsedReferences.success ? parsedReferences.data : undefined,
  };
};

const toDetail = (record: TicketRecord): TicketDetailData => ({
  ticket: toTicket(record),
  customer: toCustomer(record.customer),
  order: record.order ? toOrder(record.order) : undefined,
  assignee: toAgent(record.assignee),
  histories: record.histories.map(toHistory),
  draft: record.draft?.content ?? "",
});

export const canManageTicket = (
  agent: Pick<CurrentAgent, "agentId" | "role">,
  assigneeId: string
) => agent.role === "ADMIN" || agent.agentId === assigneeId;

export const getAiDecision = (finalResponse: string, suggestedResponse: string) =>
  finalResponse === suggestedResponse ? "ADOPTED" as const : "EDITED" as const;

const assertTicketAccess: (
  ticket: TicketAccessRecord | null,
  agent: CurrentAgent,
  action: "read" | "edit"
) => asserts ticket is TicketAccessRecord = (ticket, agent, action) => {
  if (!ticket) {
    throw new ServerError("티켓을 찾을 수 없습니다.", 404, "TICKET_NOT_FOUND");
  }

  if (!canManageTicket(agent, ticket.assigneeId)) {
    const status = action === "read" ? 404 : 403;
    throw new ServerError(
      action === "read"
        ? "티켓을 찾을 수 없습니다."
        : "현재 담당자만 티켓을 처리할 수 있습니다.",
      status,
      action === "read" ? "TICKET_NOT_FOUND" : "TICKET_FORBIDDEN"
    );
  }
};

const assertNotResolved = (ticket: TicketAccessRecord) => {
  if (ticket.status === "RESOLVED") {
    throw new ServerError("이미 처리 완료된 티켓입니다.", 409, "TICKET_RESOLVED");
  }
};

const assertApprovable = (ticket: TicketAccessRecord) => {
  assertNotResolved(ticket);
  if (ticket.status === "ESCALATED") {
    throw new ServerError(
      "이관된 티켓은 바로 승인할 수 없습니다.",
      409,
      "TICKET_ESCALATED"
    );
  }
};

const historySuggestion = (
  suggestion: SaveDraftInput["suggestion"] | TransferTicketInput["suggestion"]
) => ({
  suggestedAction: suggestion?.recommendedAction ?? "MANUAL_REVIEW",
  aiConfidenceScore: suggestion?.confidenceScore,
  policyReferences: suggestion?.policyReferences,
});

export async function listTickets(agent: CurrentAgent): Promise<TicketListData> {
  const records = await prisma.ticket.findMany({
    where: agent.role === "ADMIN" ? undefined : { assigneeId: agent.agentId },
    include: {
      customer: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    tickets: records.map(toTicket),
    customers: records.map((record) => toCustomer(record.customer)),
  };
}

export async function getTicketDetail(
  ticketId: string,
  agent: CurrentAgent
): Promise<TicketDetailData> {
  const record = await prisma.ticket.findUnique({
    where: { ticketId },
    include: ticketInclude,
  });

  assertTicketAccess(record, agent, "read");
  return toDetail(record);
}

export async function listAgents(): Promise<Agent[]> {
  const agents = await prisma.agent.findMany({
    where: { isActive: true },
    select: {
      agentId: true,
      name: true,
      role: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return agents;
}

export async function saveTicketDraft(
  ticketId: string,
  agent: CurrentAgent,
  input: SaveDraftInput
): Promise<MutationResult> {
  await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({
      where: { ticketId },
      select: {
        assigneeId: true,
        status: true,
        version: true,
      },
    });

    assertTicketAccess(ticket, agent, "edit");
    assertNotResolved(ticket);

    await tx.ticketDraft.upsert({
      where: { ticketId },
      update: {
        content: input.draft,
        savedById: agent.agentId,
      },
      create: {
        ticketId,
        content: input.draft,
        savedById: agent.agentId,
      },
    });

    await tx.actionHistory.create({
      data: {
        ticketId,
        ...historySuggestion(input.suggestion),
        finalAction: "DRAFT_SAVED",
        actionLabel: "답변 초안 저장",
        eventType: "DRAFT_SAVED",
        agentId: agent.agentId,
        finalResponse: input.draft,
      },
    });
  });

  return { message: "답변 초안이 저장되었습니다." };
}

export async function approveTicket(
  ticketId: string,
  agent: CurrentAgent,
  input: ApproveTicketInput
): Promise<MutationResult> {
  await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({
      where: { ticketId },
      select: {
        assigneeId: true,
        status: true,
        version: true,
      },
    });

    assertTicketAccess(ticket, agent, "edit");
    assertApprovable(ticket);

    const updated = await tx.ticket.updateMany({
      where: {
        ticketId,
        version: ticket.version,
        status: {
          in: ["OPEN", "IN_REVIEW"],
        },
      },
      data: {
        status: "RESOLVED",
        version: {
          increment: 1,
        },
      },
    });

    if (updated.count !== 1) {
      throw new ServerError(
        "다른 작업자가 티켓을 먼저 변경했습니다. 최신 상태를 다시 확인해 주세요.",
        409,
        "TICKET_CONFLICT"
      );
    }

    await tx.ticketDraft.deleteMany({
      where: { ticketId },
    });

    await tx.actionHistory.create({
      data: {
        ticketId,
        suggestedAction: input.suggestion.recommendedAction,
        finalAction: "APPROVED_RESPONSE",
        actionLabel: aiActionLabel[input.suggestion.recommendedAction],
        eventType: "RESPONSE_APPROVED",
        aiDecision: getAiDecision(
          input.finalResponse,
          input.suggestion.replyDraft
        ),
        agentId: agent.agentId,
        finalResponse: input.finalResponse,
        aiConfidenceScore: input.suggestion.confidenceScore,
        policyReferences: input.suggestion.policyReferences,
      },
    });
  }, {
    isolationLevel: "Serializable",
  });

  return { message: "답변이 승인되었습니다." };
}

export async function transferTicket(
  ticketId: string,
  agent: CurrentAgent,
  input: TransferTicketInput
): Promise<MutationResult> {
  await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({
      where: { ticketId },
      select: {
        assigneeId: true,
        status: true,
        version: true,
      },
    });

    assertTicketAccess(ticket, agent, "edit");
    assertNotResolved(ticket);

    if (input.toAgentId === ticket.assigneeId) {
      throw new ServerError("현재 담당자에게 다시 이관할 수 없습니다.", 400, "SAME_AGENT");
    }

    const target = await tx.agent.findUnique({
      where: {
        agentId: input.toAgentId,
        isActive: true,
      },
      select: {
        agentId: true,
        name: true,
      },
    });

    if (!target) {
      throw new ServerError("이관할 상담사를 찾을 수 없습니다.", 400, "AGENT_NOT_FOUND");
    }

    const updated = await tx.ticket.updateMany({
      where: {
        ticketId,
        version: ticket.version,
        assigneeId: ticket.assigneeId,
      },
      data: {
        assigneeId: target.agentId,
        status: "ESCALATED",
        version: {
          increment: 1,
        },
      },
    });

    if (updated.count !== 1) {
      throw new ServerError(
        "다른 작업자가 티켓을 먼저 변경했습니다. 최신 상태를 다시 확인해 주세요.",
        409,
        "TICKET_CONFLICT"
      );
    }

    if (input.draft) {
      await tx.ticketDraft.upsert({
        where: { ticketId },
        update: {
          content: input.draft,
          savedById: agent.agentId,
        },
        create: {
          ticketId,
          content: input.draft,
          savedById: agent.agentId,
        },
      });
    }

    await tx.actionHistory.create({
      data: {
        ticketId,
        ...historySuggestion(input.suggestion),
        finalAction: "ESCALATE",
        actionLabel: `${agent.name} → ${target.name} 담당자 이관`,
        eventType: "ESCALATED",
        agentId: agent.agentId,
        fromAgentId: ticket.assigneeId,
        toAgentId: target.agentId,
        note: input.note || undefined,
      },
    });
  }, {
    isolationLevel: "Serializable",
  });

  return {
    message: input.draft
      ? "답변 초안과 함께 담당자에게 이관했습니다."
      : "답변 초안 없이 담당자에게 이관했습니다.",
  };
}

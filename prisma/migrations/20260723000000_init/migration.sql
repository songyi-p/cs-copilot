-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AgentRole" AS ENUM ('AGENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "CustomerGrade" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'VIP');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PAID', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('DELIVERY_DELAY', 'EXCHANGE', 'RETURN', 'DELIVERY_ADDRESS', 'ORDER_CHANGE', 'REFUND_STATUS', 'RETURN_FEE', 'DEFECT', 'CANCELLATION', 'MEMBERSHIP', 'WRONG_ITEM', 'DELIVERY_MISSING');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'ESCALATED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AiDecision" AS ENUM ('ADOPTED', 'EDITED', 'REJECTED');

-- CreateEnum
CREATE TYPE "HistoryEventType" AS ENUM ('DRAFT_SAVED', 'ESCALATED', 'RESPONSE_APPROVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Agent" (
    "agentId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "role" "AgentRole" NOT NULL DEFAULT 'AGENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("agentId")
);

-- CreateTable
CREATE TABLE "Customer" (
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" "CustomerGrade" NOT NULL,
    "recentOrderCount" INTEGER NOT NULL DEFAULT 0,
    "recentCsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("customerId")
);

-- CreateTable
CREATE TABLE "Order" (
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "orderStatus" "OrderStatus" NOT NULL,
    "orderedAt" DATE NOT NULL,
    "deliveryExpectedAt" DATE,
    "deliveredAt" DATE,
    "paymentAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("orderId")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "ticketId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT,
    "assigneeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "inquiry" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL,
    "status" "TicketStatus" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("ticketId")
);

-- CreateTable
CREATE TABLE "TicketDraft" (
    "ticketId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "savedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketDraft_pkey" PRIMARY KEY ("ticketId")
);

-- CreateTable
CREATE TABLE "ActionHistory" (
    "historyId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "suggestedAction" TEXT NOT NULL,
    "finalAction" TEXT NOT NULL,
    "aiDecision" "AiDecision",
    "agentId" TEXT NOT NULL,
    "finalResponse" TEXT,
    "actionLabel" TEXT,
    "eventType" "HistoryEventType",
    "note" TEXT,
    "fromAgentId" TEXT,
    "toAgentId" TEXT,
    "aiConfidenceScore" INTEGER,
    "policyReferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionHistory_pkey" PRIMARY KEY ("historyId")
);

-- CreateTable
CREATE TABLE "TicketPolicyReference" (
    "referenceId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketPolicyReference_pkey" PRIMARY KEY ("referenceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_userId_key" ON "Agent"("userId");

-- CreateIndex
CREATE INDEX "Agent_role_isActive_idx" ON "Agent"("role", "isActive");

-- CreateIndex
CREATE INDEX "Customer_grade_idx" ON "Customer"("grade");

-- CreateIndex
CREATE INDEX "Order_customerId_orderedAt_idx" ON "Order"("customerId", "orderedAt" DESC);

-- CreateIndex
CREATE INDEX "Order_orderStatus_idx" ON "Order"("orderStatus");

-- CreateIndex
CREATE INDEX "Ticket_assigneeId_status_createdAt_idx" ON "Ticket"("assigneeId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Ticket_customerId_createdAt_idx" ON "Ticket"("customerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Ticket_orderId_idx" ON "Ticket"("orderId");

-- CreateIndex
CREATE INDEX "Ticket_category_status_idx" ON "Ticket"("category", "status");

-- CreateIndex
CREATE INDEX "TicketDraft_savedById_updatedAt_idx" ON "TicketDraft"("savedById", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "ActionHistory_ticketId_createdAt_idx" ON "ActionHistory"("ticketId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ActionHistory_agentId_createdAt_idx" ON "ActionHistory"("agentId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ActionHistory_eventType_createdAt_idx" ON "ActionHistory"("eventType", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ActionHistory_fromAgentId_idx" ON "ActionHistory"("fromAgentId");

-- CreateIndex
CREATE INDEX "ActionHistory_toAgentId_idx" ON "ActionHistory"("toAgentId");

-- CreateIndex
CREATE INDEX "TicketPolicyReference_ticketId_idx" ON "TicketPolicyReference"("ticketId");

-- CreateIndex
CREATE INDEX "TicketPolicyReference_policyId_section_idx" ON "TicketPolicyReference"("policyId", "section");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("customerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("customerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("orderId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Agent"("agentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketDraft" ADD CONSTRAINT "TicketDraft_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("ticketId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketDraft" ADD CONSTRAINT "TicketDraft_savedById_fkey" FOREIGN KEY ("savedById") REFERENCES "Agent"("agentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionHistory" ADD CONSTRAINT "ActionHistory_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("ticketId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionHistory" ADD CONSTRAINT "ActionHistory_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("agentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionHistory" ADD CONSTRAINT "ActionHistory_fromAgentId_fkey" FOREIGN KEY ("fromAgentId") REFERENCES "Agent"("agentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionHistory" ADD CONSTRAINT "ActionHistory_toAgentId_fkey" FOREIGN KEY ("toAgentId") REFERENCES "Agent"("agentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketPolicyReference" ADD CONSTRAINT "TicketPolicyReference_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("ticketId") ON DELETE CASCADE ON UPDATE CASCADE;

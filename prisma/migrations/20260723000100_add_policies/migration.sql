CREATE TABLE "Policy" (
    "policyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Policy_pkey" PRIMARY KEY ("policyId")
);

CREATE TABLE "PolicySection" (
    "sectionId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "keywords" TEXT[] NOT NULL,
    "ticketCategories" TEXT[] NOT NULL,
    "orderStatuses" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PolicySection_pkey" PRIMARY KEY ("sectionId")
);

CREATE UNIQUE INDEX "Policy_sourcePath_key" ON "Policy"("sourcePath");
CREATE INDEX "PolicySection_policyId_idx" ON "PolicySection"("policyId");
ALTER TABLE "PolicySection" ADD CONSTRAINT "PolicySection_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("policyId") ON DELETE CASCADE ON UPDATE CASCADE;

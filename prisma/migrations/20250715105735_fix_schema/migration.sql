-- AlterTable
ALTER TABLE "proposals" ADD COLUMN "duration" INTEGER;

-- CreateTable
CREATE TABLE "document_requirements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "callId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "maxSize" INTEGER,
    "allowedFormats" TEXT,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "document_requirements_callId_fkey" FOREIGN KEY ("callId") REFERENCES "calls_for_proposals" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "budget_configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "budget_configurations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "budget_heads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "budgetConfigurationId" TEXT,
    CONSTRAINT "budget_heads_budgetConfigurationId_fkey" FOREIGN KEY ("budgetConfigurationId") REFERENCES "budget_configurations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "salary_structures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "position" TEXT NOT NULL,
    "baseSalary" REAL NOT NULL,
    "hraPercentage" REAL NOT NULL DEFAULT 0.1,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "budgetHeadId" TEXT NOT NULL,
    CONSTRAINT "salary_structures_budgetHeadId_fkey" FOREIGN KEY ("budgetHeadId") REFERENCES "budget_heads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_budget_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "description" TEXT NOT NULL,
    "justification" TEXT,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "amount" REAL NOT NULL,
    "baseAmount" REAL,
    "hraAmount" REAL,
    "totalAmount" REAL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "budgetHeadId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "proposalId" TEXT NOT NULL,
    CONSTRAINT "budget_items_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "budget_items_budgetHeadId_fkey" FOREIGN KEY ("budgetHeadId") REFERENCES "budget_heads" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_budget_items" ("amount", "category", "createdAt", "currency", "description", "id", "justification", "proposalId", "subcategory", "updatedAt", "year") SELECT "amount", "category", "createdAt", "currency", "description", "id", "justification", "proposalId", "subcategory", "updatedAt", "year" FROM "budget_items";
DROP TABLE "budget_items";
ALTER TABLE "new_budget_items" RENAME TO "budget_items";
CREATE TABLE "new_calls_for_proposals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "openDate" DATETIME,
    "closeDate" DATETIME,
    "intentDeadline" DATETIME,
    "fullProposalDeadline" DATETIME,
    "reviewDeadline" DATETIME,
    "maxDuration" INTEGER,
    "expectedAwards" INTEGER,
    "totalBudget" REAL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "reviewVisibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "allowResubmissions" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "resultsPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fundingProgramId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "calls_for_proposals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "calls_for_proposals_fundingProgramId_fkey" FOREIGN KEY ("fundingProgramId") REFERENCES "funding_programs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_calls_for_proposals" ("allowResubmissions", "closeDate", "createdAt", "createdById", "currency", "description", "expectedAwards", "fullProposalDeadline", "fundingProgramId", "id", "intentDeadline", "isPublic", "openDate", "reviewDeadline", "reviewVisibility", "status", "title", "totalBudget", "updatedAt") SELECT "allowResubmissions", "closeDate", "createdAt", "createdById", "currency", "description", "expectedAwards", "fullProposalDeadline", "fundingProgramId", "id", "intentDeadline", "isPublic", "openDate", "reviewDeadline", "reviewVisibility", "status", "title", "totalBudget", "updatedAt" FROM "calls_for_proposals";
DROP TABLE "calls_for_proposals";
ALTER TABLE "new_calls_for_proposals" RENAME TO "calls_for_proposals";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "budget_heads_code_key" ON "budget_heads"("code");

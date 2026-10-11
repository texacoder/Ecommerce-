-- AlterTable
ALTER TABLE "Suggestion" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'site';

-- CreateTable
CREATE TABLE "MissedSearch" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastSearchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MissedSearch_query_key" ON "MissedSearch"("query");

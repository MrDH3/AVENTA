-- Unique per Sumsub image per user (concurrency-safe dedupe). NULLs stay distinct in Postgres.
CREATE UNIQUE INDEX "Document_userId_sumsubImageId_key" ON "Document"("userId", "sumsubImageId");

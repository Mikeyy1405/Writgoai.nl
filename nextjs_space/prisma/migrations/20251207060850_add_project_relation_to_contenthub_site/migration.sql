-- AlterTable
ALTER TABLE "ContentHubSite" ADD COLUMN "projectId" TEXT;

-- CreateIndex
CREATE INDEX "ContentHubSite_projectId_idx" ON "ContentHubSite"("projectId");

-- AddForeignKey
ALTER TABLE "ContentHubSite" ADD CONSTRAINT "ContentHubSite_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

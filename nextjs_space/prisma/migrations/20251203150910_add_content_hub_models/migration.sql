-- CreateTable
CREATE TABLE "ContentHubSite" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "wordpressUrl" TEXT NOT NULL,
    "wordpressUsername" TEXT,
    "wordpressAppPassword" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    "existingPages" INTEGER NOT NULL DEFAULT 0,
    "authorityScore" DOUBLE PRECISION,
    "niche" TEXT,
    "topicalMap" JSONB,
    "totalArticles" INTEGER NOT NULL DEFAULT 0,
    "completedArticles" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentHubSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentHubArticle" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "cluster" TEXT NOT NULL,
    "keywords" TEXT[],
    "searchVolume" INTEGER,
    "difficulty" INTEGER,
    "searchIntent" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "researchData" JSONB,
    "content" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "featuredImage" TEXT,
    "images" TEXT[],
    "internalLinks" JSONB,
    "faqSection" JSONB,
    "schemaMarkup" JSONB,
    "wordpressPostId" INTEGER,
    "wordpressUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "wordCount" INTEGER,
    "generationTime" INTEGER,
    "creditsUsed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentHubArticle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentHubSite_clientId_idx" ON "ContentHubSite"("clientId");

-- CreateIndex
CREATE INDEX "ContentHubSite_wordpressUrl_idx" ON "ContentHubSite"("wordpressUrl");

-- CreateIndex
CREATE INDEX "ContentHubArticle_siteId_idx" ON "ContentHubArticle"("siteId");

-- CreateIndex
CREATE INDEX "ContentHubArticle_status_idx" ON "ContentHubArticle"("status");

-- CreateIndex
CREATE INDEX "ContentHubArticle_cluster_idx" ON "ContentHubArticle"("cluster");

-- CreateIndex
CREATE INDEX "ContentHubArticle_priority_idx" ON "ContentHubArticle"("priority");

-- AddForeignKey
ALTER TABLE "ContentHubSite" ADD CONSTRAINT "ContentHubSite_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentHubArticle" ADD CONSTRAINT "ContentHubArticle_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "ContentHubSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

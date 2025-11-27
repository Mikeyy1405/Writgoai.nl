// Supabase database types for WritgoAI
// These types are manually generated from the Prisma schema for initial setup.
// For production, regenerate using: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts

export type Language = 'NL' | 'EN' | 'DE' | 'ES' | 'FR' | 'IT' | 'PT' | 'PL' | 'SV' | 'DA'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      User: {
        Row: {
          id: string
          email: string
          password: string
          name: string | null
          role: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          email: string
          password: string
          name?: string | null
          role?: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          email?: string
          password?: string
          name?: string | null
          role?: string
          createdAt?: string
          updatedAt?: string
        }
      }
      Client: {
        Row: {
          id: string
          email: string
          name: string
          companyName: string | null
          website: string | null
          password: string
          automationActive: boolean
          automationStartDate: string | null
          targetAudience: string | null
          brandVoice: string | null
          keywords: string[]
          wordpressUrl: string | null
          wordpressUsername: string | null
          wordpressPassword: string | null
          youtubeChannelId: string | null
          youtubeApiKey: string | null
          tiktokAccessToken: string | null
          facebookPageId: string | null
          instagramAccountId: string | null
          linkedinPageId: string | null
          createdAt: string
          updatedAt: string
          facebookAccessToken: string | null
          facebookConnected: boolean
          facebookPageName: string | null
          instagramAccessToken: string | null
          instagramConnected: boolean
          instagramUsername: string | null
          tiktokConnected: boolean
          youtubeAccessToken: string | null
          youtubeChannelName: string | null
          youtubeConnected: boolean
          youtubeRefreshToken: string | null
          youtubeTokenExpiry: string | null
          tiktokOpenId: string | null
          tiktokRefreshToken: string | null
          tiktokTokenExpiry: string | null
          tiktokUsername: string | null
          lateDevProfileId: string | null
          wordpressSitemap: Json | null
          wordpressSitemapDate: string | null
          contentPlan: Json | null
          lastPlanGenerated: string | null
          isUnlimited: boolean
          totalCreditsPurchased: number
          totalCreditsUsed: number
          monthlyCredits: number | null
          subscriptionEndDate: string | null
          subscriptionId: string | null
          subscriptionPlan: string | null
          subscriptionStartDate: string | null
          subscriptionStatus: string | null
          subscriptionCredits: number
          topUpCredits: number
          hasFullyManagedService: boolean
          managedServiceStartDate: string | null
          managedServiceSubscriptionId: string | null
          affiliateCode: string | null
          affiliateCommissionRate: number
          affiliateEnabled: boolean
          affiliateTotalEarnings: number
          affiliateWithdrawn: number
          linkbuildingEnabled: boolean
          referredBy: string | null
          hasCompletedOnboarding: boolean
        }
        Insert: {
          id?: string
          email: string
          name: string
          companyName?: string | null
          website?: string | null
          password: string
          automationActive?: boolean
          automationStartDate?: string | null
          targetAudience?: string | null
          brandVoice?: string | null
          keywords?: string[]
          wordpressUrl?: string | null
          wordpressUsername?: string | null
          wordpressPassword?: string | null
          youtubeChannelId?: string | null
          youtubeApiKey?: string | null
          tiktokAccessToken?: string | null
          facebookPageId?: string | null
          instagramAccountId?: string | null
          linkedinPageId?: string | null
          createdAt?: string
          updatedAt?: string
          facebookAccessToken?: string | null
          facebookConnected?: boolean
          facebookPageName?: string | null
          instagramAccessToken?: string | null
          instagramConnected?: boolean
          instagramUsername?: string | null
          tiktokConnected?: boolean
          youtubeAccessToken?: string | null
          youtubeChannelName?: string | null
          youtubeConnected?: boolean
          youtubeRefreshToken?: string | null
          youtubeTokenExpiry?: string | null
          tiktokOpenId?: string | null
          tiktokRefreshToken?: string | null
          tiktokTokenExpiry?: string | null
          tiktokUsername?: string | null
          lateDevProfileId?: string | null
          wordpressSitemap?: Json | null
          wordpressSitemapDate?: string | null
          contentPlan?: Json | null
          lastPlanGenerated?: string | null
          isUnlimited?: boolean
          totalCreditsPurchased?: number
          totalCreditsUsed?: number
          monthlyCredits?: number | null
          subscriptionEndDate?: string | null
          subscriptionId?: string | null
          subscriptionPlan?: string | null
          subscriptionStartDate?: string | null
          subscriptionStatus?: string | null
          subscriptionCredits?: number
          topUpCredits?: number
          hasFullyManagedService?: boolean
          managedServiceStartDate?: string | null
          managedServiceSubscriptionId?: string | null
          affiliateCode?: string | null
          affiliateCommissionRate?: number
          affiliateEnabled?: boolean
          affiliateTotalEarnings?: number
          affiliateWithdrawn?: number
          linkbuildingEnabled?: boolean
          referredBy?: string | null
          hasCompletedOnboarding?: boolean
        }
        Update: {
          id?: string
          email?: string
          name?: string
          companyName?: string | null
          website?: string | null
          password?: string
          automationActive?: boolean
          automationStartDate?: string | null
          targetAudience?: string | null
          brandVoice?: string | null
          keywords?: string[]
          wordpressUrl?: string | null
          wordpressUsername?: string | null
          wordpressPassword?: string | null
          youtubeChannelId?: string | null
          youtubeApiKey?: string | null
          tiktokAccessToken?: string | null
          facebookPageId?: string | null
          instagramAccountId?: string | null
          linkedinPageId?: string | null
          createdAt?: string
          updatedAt?: string
          facebookAccessToken?: string | null
          facebookConnected?: boolean
          facebookPageName?: string | null
          instagramAccessToken?: string | null
          instagramConnected?: boolean
          instagramUsername?: string | null
          tiktokConnected?: boolean
          youtubeAccessToken?: string | null
          youtubeChannelName?: string | null
          youtubeConnected?: boolean
          youtubeRefreshToken?: string | null
          youtubeTokenExpiry?: string | null
          tiktokOpenId?: string | null
          tiktokRefreshToken?: string | null
          tiktokTokenExpiry?: string | null
          tiktokUsername?: string | null
          lateDevProfileId?: string | null
          wordpressSitemap?: Json | null
          wordpressSitemapDate?: string | null
          contentPlan?: Json | null
          lastPlanGenerated?: string | null
          isUnlimited?: boolean
          totalCreditsPurchased?: number
          totalCreditsUsed?: number
          monthlyCredits?: number | null
          subscriptionEndDate?: string | null
          subscriptionId?: string | null
          subscriptionPlan?: string | null
          subscriptionStartDate?: string | null
          subscriptionStatus?: string | null
          subscriptionCredits?: number
          topUpCredits?: number
          hasFullyManagedService?: boolean
          managedServiceStartDate?: string | null
          managedServiceSubscriptionId?: string | null
          affiliateCode?: string | null
          affiliateCommissionRate?: number
          affiliateEnabled?: boolean
          affiliateTotalEarnings?: number
          affiliateWithdrawn?: number
          linkbuildingEnabled?: boolean
          referredBy?: string | null
          hasCompletedOnboarding?: boolean
        }
      }
      Project: {
        Row: {
          id: string
          clientId: string
          name: string
          websiteUrl: string
          description: string | null
          sitemap: Json | null
          sitemapScannedAt: string | null
          targetAudience: string | null
          brandVoice: string | null
          niche: string | null
          keywords: string[]
          contentPillars: string[]
          writingStyle: string | null
          customInstructions: string | null
          personalInfo: Json | null
          preferredProducts: string[]
          importantPages: Json | null
          linkingGuidelines: string | null
          wordpressUrl: string | null
          wordpressUsername: string | null
          wordpressPassword: string | null
          wordpressCategory: string | null
          wordpressAutoPublish: boolean
          isActive: boolean
          isPrimary: boolean
          createdAt: string
          updatedAt: string
          additionalInfo: string | null
          budget: string | null
          businessGoals: string | null
          competitors: string | null
          contentTopics: string | null
          currentChallenges: string | null
          desiredOutcome: string | null
          socialMediaChannels: string | null
          timeline: string | null
          uniqueSellingPoints: string | null
          contentAnalysis: Json | null
          contentAnalysisDate: string | null
          contentAnalysisStatus: string | null
          contentStrategy: Json | null
          contentStrategyDate: string | null
          contentStrategyStatus: string | null
          keywordResearch: Json | null
          keywordResearchDate: string | null
          keywordResearchStatus: string | null
          bolcomAffiliateId: string | null
          bolcomClientId: string | null
          bolcomClientSecret: string | null
          bolcomEnabled: boolean
          autopilotArticlesPerRun: number
          autopilotAutoPublish: boolean
          autopilotContentType: string | null
          autopilotEnabled: boolean
          autopilotFrequency: string | null
          autopilotLastRun: string | null
          autopilotNextRun: string | null
          autopilotPriority: string | null
          autopilotMode: string
          autopilotWordCount: number
          tradeTrackerCampaignId: string | null
          tradeTrackerEnabled: boolean
          tradeTrackerPassphrase: string | null
          tradeTrackerSiteId: string | null
          autopilotIncludeDirectAnswer: boolean
          autopilotIncludeFAQ: boolean
          autopilotIncludeYouTube: boolean
          googleSearchConsoleEnabled: boolean
          googleSearchConsoleLastSync: string | null
          googleSearchConsoleSiteUrl: string | null
          autopilotPublishToWritgoaiBlog: boolean
          customTones: string[]
          language: Language
          autopilotImageCount: number
          autopilotPublishingDays: string[]
          autopilotPublishingTime: string
          wooCommerceEnabled: boolean
          imageModel: string
          useFreeStockImages: boolean
          wooCommerceAutoUpdate: boolean | null
          wooCommerceUpdateSchedule: string | null
          aiDetectionProvider: string
        }
        Insert: {
          id?: string
          clientId: string
          name: string
          websiteUrl: string
          description?: string | null
          sitemap?: Json | null
          sitemapScannedAt?: string | null
          targetAudience?: string | null
          brandVoice?: string | null
          niche?: string | null
          keywords?: string[]
          contentPillars?: string[]
          writingStyle?: string | null
          customInstructions?: string | null
          personalInfo?: Json | null
          preferredProducts?: string[]
          importantPages?: Json | null
          linkingGuidelines?: string | null
          wordpressUrl?: string | null
          wordpressUsername?: string | null
          wordpressPassword?: string | null
          wordpressCategory?: string | null
          wordpressAutoPublish?: boolean
          isActive?: boolean
          isPrimary?: boolean
          createdAt?: string
          updatedAt?: string
          additionalInfo?: string | null
          budget?: string | null
          businessGoals?: string | null
          competitors?: string | null
          contentTopics?: string | null
          currentChallenges?: string | null
          desiredOutcome?: string | null
          socialMediaChannels?: string | null
          timeline?: string | null
          uniqueSellingPoints?: string | null
          contentAnalysis?: Json | null
          contentAnalysisDate?: string | null
          contentAnalysisStatus?: string | null
          contentStrategy?: Json | null
          contentStrategyDate?: string | null
          contentStrategyStatus?: string | null
          keywordResearch?: Json | null
          keywordResearchDate?: string | null
          keywordResearchStatus?: string | null
          bolcomAffiliateId?: string | null
          bolcomClientId?: string | null
          bolcomClientSecret?: string | null
          bolcomEnabled?: boolean
          autopilotArticlesPerRun?: number
          autopilotAutoPublish?: boolean
          autopilotContentType?: string | null
          autopilotEnabled?: boolean
          autopilotFrequency?: string | null
          autopilotLastRun?: string | null
          autopilotNextRun?: string | null
          autopilotPriority?: string | null
          autopilotMode?: string
          autopilotWordCount?: number
          tradeTrackerCampaignId?: string | null
          tradeTrackerEnabled?: boolean
          tradeTrackerPassphrase?: string | null
          tradeTrackerSiteId?: string | null
          autopilotIncludeDirectAnswer?: boolean
          autopilotIncludeFAQ?: boolean
          autopilotIncludeYouTube?: boolean
          googleSearchConsoleEnabled?: boolean
          googleSearchConsoleLastSync?: string | null
          googleSearchConsoleSiteUrl?: string | null
          autopilotPublishToWritgoaiBlog?: boolean
          customTones?: string[]
          language?: Language
          autopilotImageCount?: number
          autopilotPublishingDays?: string[]
          autopilotPublishingTime?: string
          wooCommerceEnabled?: boolean
          imageModel?: string
          useFreeStockImages?: boolean
          wooCommerceAutoUpdate?: boolean | null
          wooCommerceUpdateSchedule?: string | null
          aiDetectionProvider?: string
        }
        Update: {
          id?: string
          clientId?: string
          name?: string
          websiteUrl?: string
          description?: string | null
          sitemap?: Json | null
          sitemapScannedAt?: string | null
          targetAudience?: string | null
          brandVoice?: string | null
          niche?: string | null
          keywords?: string[]
          contentPillars?: string[]
          writingStyle?: string | null
          customInstructions?: string | null
          personalInfo?: Json | null
          preferredProducts?: string[]
          importantPages?: Json | null
          linkingGuidelines?: string | null
          wordpressUrl?: string | null
          wordpressUsername?: string | null
          wordpressPassword?: string | null
          wordpressCategory?: string | null
          wordpressAutoPublish?: boolean
          isActive?: boolean
          isPrimary?: boolean
          createdAt?: string
          updatedAt?: string
          additionalInfo?: string | null
          budget?: string | null
          businessGoals?: string | null
          competitors?: string | null
          contentTopics?: string | null
          currentChallenges?: string | null
          desiredOutcome?: string | null
          socialMediaChannels?: string | null
          timeline?: string | null
          uniqueSellingPoints?: string | null
          contentAnalysis?: Json | null
          contentAnalysisDate?: string | null
          contentAnalysisStatus?: string | null
          contentStrategy?: Json | null
          contentStrategyDate?: string | null
          contentStrategyStatus?: string | null
          keywordResearch?: Json | null
          keywordResearchDate?: string | null
          keywordResearchStatus?: string | null
          bolcomAffiliateId?: string | null
          bolcomClientId?: string | null
          bolcomClientSecret?: string | null
          bolcomEnabled?: boolean
          autopilotArticlesPerRun?: number
          autopilotAutoPublish?: boolean
          autopilotContentType?: string | null
          autopilotEnabled?: boolean
          autopilotFrequency?: string | null
          autopilotLastRun?: string | null
          autopilotNextRun?: string | null
          autopilotPriority?: string | null
          autopilotMode?: string
          autopilotWordCount?: number
          tradeTrackerCampaignId?: string | null
          tradeTrackerEnabled?: boolean
          tradeTrackerPassphrase?: string | null
          tradeTrackerSiteId?: string | null
          autopilotIncludeDirectAnswer?: boolean
          autopilotIncludeFAQ?: boolean
          autopilotIncludeYouTube?: boolean
          googleSearchConsoleEnabled?: boolean
          googleSearchConsoleLastSync?: string | null
          googleSearchConsoleSiteUrl?: string | null
          autopilotPublishToWritgoaiBlog?: boolean
          customTones?: string[]
          language?: Language
          autopilotImageCount?: number
          autopilotPublishingDays?: string[]
          autopilotPublishingTime?: string
          wooCommerceEnabled?: boolean
          imageModel?: string
          useFreeStockImages?: boolean
          wooCommerceAutoUpdate?: boolean | null
          wooCommerceUpdateSchedule?: string | null
          aiDetectionProvider?: string
        }
      }
      SavedContent: {
        Row: {
          id: string
          clientId: string
          type: string
          title: string
          content: string
          contentHtml: string | null
          category: string | null
          tags: string[]
          description: string | null
          keywords: string[]
          metaDesc: string | null
          slug: string | null
          thumbnailUrl: string | null
          imageUrls: string[]
          isFavorite: boolean
          isArchived: boolean
          publishedUrl: string | null
          publishedAt: string | null
          wordCount: number | null
          characterCount: number | null
          projectId: string | null
          createdAt: string
          updatedAt: string
          generatorType: string | null
          wordpressCategory: string | null
          language: Language
        }
        Insert: {
          id?: string
          clientId: string
          type: string
          title: string
          content: string
          contentHtml?: string | null
          category?: string | null
          tags?: string[]
          description?: string | null
          keywords?: string[]
          metaDesc?: string | null
          slug?: string | null
          thumbnailUrl?: string | null
          imageUrls?: string[]
          isFavorite?: boolean
          isArchived?: boolean
          publishedUrl?: string | null
          publishedAt?: string | null
          wordCount?: number | null
          characterCount?: number | null
          projectId?: string | null
          createdAt?: string
          updatedAt?: string
          generatorType?: string | null
          wordpressCategory?: string | null
          language?: Language
        }
        Update: {
          id?: string
          clientId?: string
          type?: string
          title?: string
          content?: string
          contentHtml?: string | null
          category?: string | null
          tags?: string[]
          description?: string | null
          keywords?: string[]
          metaDesc?: string | null
          slug?: string | null
          thumbnailUrl?: string | null
          imageUrls?: string[]
          isFavorite?: boolean
          isArchived?: boolean
          publishedUrl?: string | null
          publishedAt?: string | null
          wordCount?: number | null
          characterCount?: number | null
          projectId?: string | null
          createdAt?: string
          updatedAt?: string
          generatorType?: string | null
          wordpressCategory?: string | null
          language?: Language
        }
      }
      ArticleIdea: {
        Row: {
          id: string
          clientId: string
          title: string
          slug: string
          focusKeyword: string
          topic: string
          secondaryKeywords: string[]
          searchIntent: string | null
          searchVolume: number | null
          difficulty: number | null
          contentOutline: Json | null
          targetWordCount: number | null
          contentType: string | null
          contentCategory: string | null
          internalLinks: Json | null
          relatedArticles: string[]
          imageIdeas: string[]
          videoIdeas: string[]
          priority: string
          category: string | null
          cluster: string | null
          scheduledFor: string | null
          status: string
          hasContent: boolean
          contentId: string | null
          generatedAt: string | null
          publishedAt: string | null
          aiScore: number | null
          trending: boolean
          seasonal: boolean
          competitorGap: boolean
          notes: string | null
          createdAt: string
          updatedAt: string
          projectId: string | null
          language: Language
        }
        Insert: {
          id?: string
          clientId: string
          title: string
          slug: string
          focusKeyword: string
          topic: string
          secondaryKeywords?: string[]
          searchIntent?: string | null
          searchVolume?: number | null
          difficulty?: number | null
          contentOutline?: Json | null
          targetWordCount?: number | null
          contentType?: string | null
          contentCategory?: string | null
          internalLinks?: Json | null
          relatedArticles?: string[]
          imageIdeas?: string[]
          videoIdeas?: string[]
          priority?: string
          category?: string | null
          cluster?: string | null
          scheduledFor?: string | null
          status?: string
          hasContent?: boolean
          contentId?: string | null
          generatedAt?: string | null
          publishedAt?: string | null
          aiScore?: number | null
          trending?: boolean
          seasonal?: boolean
          competitorGap?: boolean
          notes?: string | null
          createdAt?: string
          updatedAt?: string
          projectId?: string | null
          language?: Language
        }
        Update: {
          id?: string
          clientId?: string
          title?: string
          slug?: string
          focusKeyword?: string
          topic?: string
          secondaryKeywords?: string[]
          searchIntent?: string | null
          searchVolume?: number | null
          difficulty?: number | null
          contentOutline?: Json | null
          targetWordCount?: number | null
          contentType?: string | null
          contentCategory?: string | null
          internalLinks?: Json | null
          relatedArticles?: string[]
          imageIdeas?: string[]
          videoIdeas?: string[]
          priority?: string
          category?: string | null
          cluster?: string | null
          scheduledFor?: string | null
          status?: string
          hasContent?: boolean
          contentId?: string | null
          generatedAt?: string | null
          publishedAt?: string | null
          aiScore?: number | null
          trending?: boolean
          seasonal?: boolean
          competitorGap?: boolean
          notes?: string | null
          createdAt?: string
          updatedAt?: string
          projectId?: string | null
          language?: Language
        }
      }
      AutopilotJob: {
        Row: {
          id: string
          clientId: string
          articleId: string
          projectId: string | null
          status: string
          progress: number
          currentStep: string | null
          contentId: string | null
          publishedUrl: string | null
          error: string | null
          startedAt: string
          completedAt: string | null
          updatedAt: string
        }
        Insert: {
          id?: string
          clientId: string
          articleId: string
          projectId?: string | null
          status?: string
          progress?: number
          currentStep?: string | null
          contentId?: string | null
          publishedUrl?: string | null
          error?: string | null
          startedAt?: string
          completedAt?: string | null
          updatedAt?: string
        }
        Update: {
          id?: string
          clientId?: string
          articleId?: string
          projectId?: string | null
          status?: string
          progress?: number
          currentStep?: string | null
          contentId?: string | null
          publishedUrl?: string | null
          error?: string | null
          startedAt?: string
          completedAt?: string | null
          updatedAt?: string
        }
      }
      CreditTransaction: {
        Row: {
          id: string
          clientId: string
          amount: number
          type: string
          description: string
          model: string | null
          tokensUsed: number | null
          messageId: string | null
          balanceAfter: number
          createdAt: string
        }
        Insert: {
          id?: string
          clientId: string
          amount: number
          type: string
          description: string
          model?: string | null
          tokensUsed?: number | null
          messageId?: string | null
          balanceAfter: number
          createdAt?: string
        }
        Update: {
          id?: string
          clientId?: string
          amount?: number
          type?: string
          description?: string
          model?: string | null
          tokensUsed?: number | null
          messageId?: string | null
          balanceAfter?: number
          createdAt?: string
        }
      }
      AutopilotSchedule: {
        Row: {
          id: string
          clientId: string
          projectId: string
          name: string
          isActive: boolean
          scheduleType: string
          scheduledDate: string | null
          frequency: string | null
          dayOfWeek: number | null
          dayOfMonth: number | null
          timeOfDay: string
          customInterval: number | null
          articleIds: string[]
          processingStrategy: string
          articlesPerRun: number
          autoPublish: boolean
          notifyOnCompletion: boolean
          lastRunAt: string | null
          nextRunAt: string | null
          totalRuns: number
          successfulRuns: number
          failedRuns: number
          lastError: string | null
          processedArticleIds: string[]
          createdAt: string
          updatedAt: string
          contentType: string
          includeAffiliateLinks: boolean
          includeBolcomProducts: boolean
          includeImages: boolean
          secondTimeOfDay: string | null
          autoSelectMode: boolean
          daysOfWeek: number[]
          platforms: string[]
        }
        Insert: {
          id?: string
          clientId: string
          projectId: string
          name: string
          isActive?: boolean
          scheduleType: string
          scheduledDate?: string | null
          frequency?: string | null
          dayOfWeek?: number | null
          dayOfMonth?: number | null
          timeOfDay?: string
          customInterval?: number | null
          articleIds?: string[]
          processingStrategy?: string
          articlesPerRun?: number
          autoPublish?: boolean
          notifyOnCompletion?: boolean
          lastRunAt?: string | null
          nextRunAt?: string | null
          totalRuns?: number
          successfulRuns?: number
          failedRuns?: number
          lastError?: string | null
          processedArticleIds?: string[]
          createdAt?: string
          updatedAt?: string
          contentType?: string
          includeAffiliateLinks?: boolean
          includeBolcomProducts?: boolean
          includeImages?: boolean
          secondTimeOfDay?: string | null
          autoSelectMode?: boolean
          daysOfWeek?: number[]
          platforms?: string[]
        }
        Update: {
          id?: string
          clientId?: string
          projectId?: string
          name?: string
          isActive?: boolean
          scheduleType?: string
          scheduledDate?: string | null
          frequency?: string | null
          dayOfWeek?: number | null
          dayOfMonth?: number | null
          timeOfDay?: string
          customInterval?: number | null
          articleIds?: string[]
          processingStrategy?: string
          articlesPerRun?: number
          autoPublish?: boolean
          notifyOnCompletion?: boolean
          lastRunAt?: string | null
          nextRunAt?: string | null
          totalRuns?: number
          successfulRuns?: number
          failedRuns?: number
          lastError?: string | null
          processedArticleIds?: string[]
          createdAt?: string
          updatedAt?: string
          contentType?: string
          includeAffiliateLinks?: boolean
          includeBolcomProducts?: boolean
          includeImages?: boolean
          secondTimeOfDay?: string | null
          autoSelectMode?: boolean
          daysOfWeek?: number[]
          platforms?: string[]
        }
      }
      Video: {
        Row: {
          id: string
          vid: string
          topic: string
          script: string
          language: string
          voiceId: string | null
          style: string
          duration: string
          status: string
          videoUrl: string | null
          thumbnailUrl: string | null
          error: string | null
          clientId: string | null
          userId: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          vid: string
          topic: string
          script: string
          language?: string
          voiceId?: string | null
          style?: string
          duration?: string
          status?: string
          videoUrl?: string | null
          thumbnailUrl?: string | null
          error?: string | null
          clientId?: string | null
          userId?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          vid?: string
          topic?: string
          script?: string
          language?: string
          voiceId?: string | null
          style?: string
          duration?: string
          status?: string
          videoUrl?: string | null
          thumbnailUrl?: string | null
          error?: string | null
          clientId?: string | null
          userId?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      Conversation: {
        Row: {
          id: string
          title: string
          clientId: string
          isPinned: boolean
          isArchived: boolean
          lastMessageAt: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          title?: string
          clientId: string
          isPinned?: boolean
          isArchived?: boolean
          lastMessageAt?: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          title?: string
          clientId?: string
          isPinned?: boolean
          isArchived?: boolean
          lastMessageAt?: string
          createdAt?: string
          updatedAt?: string
        }
      }
      ChatMessage: {
        Row: {
          id: string
          conversationId: string
          role: string
          content: string
          model: string | null
          toolCalls: Json | null
          images: string[]
          videos: Json | null
          attachments: Json | null
          codeBlocks: Json | null
          createdAt: string
        }
        Insert: {
          id?: string
          conversationId: string
          role: string
          content: string
          model?: string | null
          toolCalls?: Json | null
          images?: string[]
          videos?: Json | null
          attachments?: Json | null
          codeBlocks?: Json | null
          createdAt?: string
        }
        Update: {
          id?: string
          conversationId?: string
          role?: string
          content?: string
          model?: string | null
          toolCalls?: Json | null
          images?: string[]
          videos?: Json | null
          attachments?: Json | null
          codeBlocks?: Json | null
          createdAt?: string
        }
      }
      BlogPost: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string
          content: string
          featuredImage: string | null
          metaTitle: string | null
          metaDescription: string | null
          focusKeyword: string | null
          category: string
          tags: string[]
          status: string
          publishedAt: string | null
          scheduledFor: string | null
          authorId: string | null
          authorName: string
          views: number
          readingTimeMinutes: number
          createdAt: string
          updatedAt: string
          language: Language
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt: string
          content: string
          featuredImage?: string | null
          metaTitle?: string | null
          metaDescription?: string | null
          focusKeyword?: string | null
          category?: string
          tags?: string[]
          status?: string
          publishedAt?: string | null
          scheduledFor?: string | null
          authorId?: string | null
          authorName?: string
          views?: number
          readingTimeMinutes?: number
          createdAt?: string
          updatedAt?: string
          language?: Language
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string
          content?: string
          featuredImage?: string | null
          metaTitle?: string | null
          metaDescription?: string | null
          focusKeyword?: string | null
          category?: string
          tags?: string[]
          status?: string
          publishedAt?: string | null
          scheduledFor?: string | null
          authorId?: string | null
          authorName?: string
          views?: number
          readingTimeMinutes?: number
          createdAt?: string
          updatedAt?: string
          language?: Language
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      Language: Language
    }
  }
}

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AccountsTab from './components/accounts-tab';
import PlanningTab from './components/planning-tab';
import CreatePostTab from './components/create-post-tab';
import OverviewTab from './components/overview-tab';

export default function SocialMediaSuitePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📱 Social Media Suite</h1>
          <p className="text-muted-foreground">
            Beheer al je social media accounts en posts op één plek
          </p>
        </div>
      </div>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="accounts">🔗 Accounts</TabsTrigger>
          <TabsTrigger value="planning">📅 Planning</TabsTrigger>
          <TabsTrigger value="create">✏️ Post Maken</TabsTrigger>
          <TabsTrigger value="overview">📊 Overzicht</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <AccountsTab />
        </TabsContent>

        <TabsContent value="planning">
          <PlanningTab />
        </TabsContent>

        <TabsContent value="create">
          <CreatePostTab />
        </TabsContent>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

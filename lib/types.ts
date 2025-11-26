
// Simplified types for WritgoAI

export type TaskCategory = 'CONTENT_AUTOMATION' | 'SOCIAL_MEDIA_AUTOMATION' | 'YOUTUBE_FACELESS_AUTOMATION';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';
export type MessageSender = 'CLIENT' | 'TEAM';

export const TASK_CATEGORIES = {
  CONTENT_AUTOMATION: 'Content Automation',
  SOCIAL_MEDIA_AUTOMATION: 'Social Media Automation',
  YOUTUBE_FACELESS_AUTOMATION: 'YouTube Faceless Automation',
} as const;

export const TASK_STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
} as const;

export interface Task {
  id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  status: TaskStatus;
  deadline: Date | null;
  clientId: string;
  createdById: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  Client: {
    id: string;
    name: string;
    email: string;
    companyName: string | null;
  };
  Deliverable?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    notes: string | null;
    createdAt: Date;
  }>;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  website: string | null;
  bufferEmail: string | null;
  bufferConnected: boolean;
  bufferConnectedAt: Date | null;
  isActive: boolean;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  ClientSubscription?: ClientSubscription | null;
}

export interface TaskRequest {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: TaskCategory;
  deadline: Date | null;
  status: TaskRequestStatus;
  rejectionReason: string | null;
  convertedToTaskId: string | null;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt: Date | null;
  Client: {
    id: string;
    name: string;
    email: string;
  };
}

export type ServiceType = 'full' | 'content_only' | 'socials_only';
export type PackageTier = 'Pro' | 'Premium' | 'Ultra';

export const SERVICE_TYPE_LABELS = {
  full: 'Volledige Service',
  content_only: 'Alleen Content',
  socials_only: 'Alleen Socials',
} as const;

export interface SubscriptionPackage {
  id: string;
  tier: PackageTier;
  serviceType: ServiceType;
  displayName: string;
  description: string;
  monthlyPrice: number;
  articlesPerMonth: number | null;
  reelsFrequency: string | null;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  order: number;
}

export interface ClientSubscription {
  id: string;
  clientId: string;
  packageId: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date | null;
  nextBillingDate: Date | null;
  articlesUsed: number;
  reelsUsed: number;
  Package: SubscriptionPackage;
}

export interface Message {
  id: string;
  taskId: string | null;
  clientId: string | null;
  userId: string | null;
  senderType: MessageSender;
  content: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

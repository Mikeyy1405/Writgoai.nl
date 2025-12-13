
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Plus, Loader2, Trash2, Edit2, MoreVertical, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EnhancedChat from '@/components/enhanced-chat';
import ProjectSelector from '@/components/project-selector';

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
}

export default function AIChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>();
  
  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [conversationToRename, setConversationToRename] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete all dialog state
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadConversations();
    }
  }, [status]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/client/conversations');
      if (!response.ok) {
        throw new Error('Kon conversaties niet laden');
      }
      const data = await response.json();
      const conversations = data.conversations || [];
      setConversations(conversations);

      // Always create a new conversation when page loads
      // This ensures users always start with a fresh chat
      await createNewConversation();
    } catch (error: any) {
      console.error('Load conversations error:', error);
      toast.error(error.message || 'Kon conversaties niet laden');
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      setCreating(true);
      const response = await fetch('/api/client/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Nieuwe conversatie',
        }),
      });

      if (!response.ok) {
        throw new Error('Kon conversatie niet aanmaken');
      }

      const data = await response.json();
      setConversations((prev) => [data.conversation, ...prev]);
      setSelectedConversation(data.conversation.id);
      toast.success('Nieuwe conversatie aangemaakt');
    } catch (error: any) {
      console.error('Create conversation error:', error);
      toast.error(error.message || 'Kon conversatie niet aanmaken');
    } finally {
      setCreating(false);
    }
  };

  const openRenameDialog = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      setConversationToRename(conversationId);
      setNewTitle(conversation.title);
      setRenameDialogOpen(true);
    }
  };

  const handleRenameConversation = async () => {
    if (!conversationToRename || !newTitle.trim()) return;

    try {
      setIsRenaming(true);
      const response = await fetch(`/api/client/conversations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversationToRename,
          title: newTitle.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Kon conversatie niet hernoemen');
      }

      const data = await response.json();
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationToRename ? { ...c, title: data.conversation.title } : c))
      );
      setRenameDialogOpen(false);
      setConversationToRename(null);
      setNewTitle('');
      toast.success('Conversatie hernoemd');
    } catch (error: any) {
      console.error('Rename conversation error:', error);
      toast.error(error.message || 'Kon conversatie niet hernoemen');
    } finally {
      setIsRenaming(false);
    }
  };

  const openDeleteDialog = (conversationId: string) => {
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/client/conversations?id=${conversationToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Kon conversatie niet verwijderen');
      }

      // Remove from list
      setConversations((prev) => prev.filter((c) => c.id !== conversationToDelete));
      
      // If deleted conversation was selected, select another one
      if (selectedConversation === conversationToDelete) {
        const remaining = conversations.filter((c) => c.id !== conversationToDelete);
        if (remaining.length > 0) {
          setSelectedConversation(remaining[0].id);
        } else {
          setSelectedConversation(null);
          await createNewConversation();
        }
      }
      
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
      toast.success('Conversatie verwijderd');
    } catch (error: any) {
      console.error('Delete conversation error:', error);
      toast.error(error.message || 'Kon conversatie niet verwijderen');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAllConversations = async () => {
    try {
      setIsDeletingAll(true);
      const response = await fetch('/api/client/conversations?all=true', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Kon alle conversaties niet verwijderen');
      }

      // Clear all conversations
      setConversations([]);
      setSelectedConversation(null);
      
      // Create a new conversation
      await createNewConversation();
      
      setDeleteAllDialogOpen(false);
      toast.success('Alle conversaties verwijderd');
    } catch (error: any) {
      console.error('Delete all conversations error:', error);
      toast.error(error.message || 'Kon alle conversaties niet verwijderen');
    } finally {
      setIsDeletingAll(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          w-64 border-r bg-muted/30 flex flex-col z-50
          fixed lg:relative h-full
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-3 sm:p-4 border-b">
          <div className="mb-3">
            <h2 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-orange-500" />
              WritGo AI Assistent
            </h2>
          </div>
          <Button
            onClick={createNewConversation}
            disabled={creating}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-xs sm:text-sm"
          >
            {creating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Nieuwe Chat
          </Button>
          
          {/* Project Selector for Blog Writing */}
          <div className="mt-3">
            <ProjectSelector
              value={selectedProjectId || null}
              onChange={(projectId) => setSelectedProjectId(projectId || undefined)}
              label="Project (optioneel)"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Voor sitemap links in blog mode
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`relative group rounded-lg transition-colors ${
                  selectedConversation === conv.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <button
                  onClick={() => setSelectedConversation(conv.id)}
                  className="w-full text-left p-3 pr-10"
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      <p className="text-xs opacity-70">
                        {conv._count.messages} berichten
                      </p>
                    </div>
                  </div>
                </button>

                {/* Action menu */}
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity ${
                          selectedConversation === conv.id
                            ? 'text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/20'
                            : ''
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openRenameDialog(conv.id)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Hernoemen
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(conv.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Verwijderen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-3 sm:p-4 border-t space-y-2">
          {conversations.length > 0 && (
            <Button
              variant="destructive"
              className="w-full text-xs sm:text-sm"
              onClick={() => setDeleteAllDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Alles Opruimen
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full text-xs sm:text-sm"
            onClick={() => router.push('/client-portal')}
          >
            Terug naar Dashboard
          </Button>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header with toggle */}
        <div className="lg:hidden border-b p-3 bg-background flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-orange-500" />
            <span className="font-semibold text-sm">WritGo AI Assistent</span>
          </div>
        </div>

        {selectedConversation ? (
          <EnhancedChat
            conversationId={selectedConversation}
            projectId={selectedProjectId}
            onNewMessage={(message) => {
              // Update conversation title based on first message
              if (conversations.find((c) => c.id === selectedConversation)?._count.messages === 0) {
                setConversations((prev) =>
                  prev.map((c) =>
                    c.id === selectedConversation
                      ? { ...c, title: message.content.substring(0, 50) + '...' }
                      : c
                  )
                );
              }
              // Close sidebar on mobile after sending message
              setSidebarOpen(false);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="p-4 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">WritGo AI Assistent</h3>
              <p className="text-muted-foreground mb-6">
                Vraag me alles over content creatie, affiliate marketing, WordPress, social media en meer!
              </p>
              <Button 
                onClick={createNewConversation} 
                disabled={creating}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                {creating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Start Gesprek
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conversatie hernoemen</DialogTitle>
            <DialogDescription>
              Geef je conversatie een nieuwe naam om deze makkelijker terug te vinden.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Bijv: Content strategie 2025"
                maxLength={100}
                disabled={isRenaming}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isRenaming) {
                    handleRenameConversation();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
              disabled={isRenaming}
            >
              Annuleren
            </Button>
            <Button
              onClick={handleRenameConversation}
              disabled={!newTitle.trim() || isRenaming}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              {isRenaming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Hernoemen...
                </>
              ) : (
                'Hernoemen'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conversatie verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze actie kan niet ongedaan gemaakt worden. De conversatie en alle berichten worden permanent verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verwijderen...
                </>
              ) : (
                'Verwijderen'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Dialog */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alle conversaties verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p className="font-semibold text-orange-600">⚠️ Let op: Deze actie kan niet ongedaan gemaakt worden!</p>
                <p>
                  Je staat op het punt om <span className="font-bold">{conversations.length} conversatie{conversations.length !== 1 ? 's' : ''}</span> en alle bijbehorende berichten permanent te verwijderen.
                </p>
                <p className="text-sm">
                  Na het verwijderen wordt automatisch een nieuwe, lege conversatie aangemaakt.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAll}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllConversations}
              disabled={isDeletingAll}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeletingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alles verwijderen...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Alles Verwijderen
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

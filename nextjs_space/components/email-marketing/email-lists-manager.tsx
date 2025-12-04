/**
 * Email Lists Manager Component
 * Manage email lists and subscribers
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Users, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface EmailList {
  id: string;
  name: string;
  description: string | null;
  subscriberCount: number;
  isActive: boolean;
  createdAt: string;
}

export function EmailListsManager() {
  const [lists, setLists] = useState<EmailList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/admin/email-marketing/lists');
      const data = await response.json();
      
      if (response.ok) {
        setLists(data.lists || []);
      } else {
        toast.error(data.error || 'Failed to fetch lists');
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
      toast.error('Failed to fetch lists');
    } finally {
      setLoading(false);
    }
  };

  const createList = async () => {
    if (!newListName.trim()) {
      toast.error('List name is required');
      return;
    }

    try {
      const response = await fetch('/api/admin/email-marketing/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newListName,
          description: newListDescription,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('List created successfully');
        setShowCreateDialog(false);
        setNewListName('');
        setNewListDescription('');
        fetchLists();
      } else {
        toast.error(data.error || 'Failed to create list');
      }
    } catch (error) {
      console.error('Error creating list:', error);
      toast.error('Failed to create list');
    }
  };

  const deleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list? All subscribers will be removed.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/email-marketing/lists/${listId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('List deleted successfully');
        fetchLists();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete list');
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      toast.error('Failed to delete list');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading lists...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Lists</h2>
          <p className="text-muted-foreground">
            Manage your subscriber lists
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New List</DialogTitle>
              <DialogDescription>
                Create a new email list for organizing your subscribers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="listName">List Name</Label>
                <Input
                  id="listName"
                  placeholder="e.g., Newsletter Subscribers"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="listDescription">Description (Optional)</Label>
                <Textarea
                  id="listDescription"
                  placeholder="Describe this list..."
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createList}>Create List</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {lists.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No lists yet</h3>
              <p className="text-muted-foreground">
                Create your first email list to start building your subscriber base
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First List
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Card key={list.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{list.name}</CardTitle>
                    {list.description && (
                      <CardDescription className="mt-1">
                        {list.description}
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteList(list.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{list.subscriberCount} subscribers</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

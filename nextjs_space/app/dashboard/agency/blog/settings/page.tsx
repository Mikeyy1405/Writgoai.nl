'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BlogSettingsPage() {
  const [categories, setCategories] = useState([
    'AI & Content Marketing',
    'SEO & Ranking',
    'WordPress Tips',
    'Automatisering',
    'Nieuws & Updates',
  ]);

  const [newCategory, setNewCategory] = useState('');

  const [defaultSettings, setDefaultSettings] = useState({
    defaultCategory: 'AI & Content Marketing',
    defaultAuthor: 'WritgoAI Team',
    postsPerPage: 10,
    enableComments: false,
    autoPublishTwitter: false,
  });

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
      toast.success('Categorie toegevoegd');
    }
  };

  const handleDeleteCategory = (category: string) => {
    if (confirm(`Categorie "${category}" verwijderen?`)) {
      setCategories(categories.filter((c) => c !== category));
      toast.success('Categorie verwijderd');
    }
  };

  const handleSaveSettings = () => {
    // In a real implementation, this would save to the database
    toast.success('Instellingen opgeslagen');
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Blog Instellingen</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Configureer je blog systeem
        </p>
      </div>

      {/* Categories Management */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Categorieën Beheren
        </h2>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nieuwe categorie..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCategory();
                }
              }}
            />
            <Button onClick={handleAddCategory}>
              <Plus className="w-4 h-4 mr-2" />
              Toevoegen
            </Button>
          </div>

          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category}
                className="flex items-center justify-between p-3 bg-slate-800 dark:bg-zinc-800 rounded-lg"
              >
                <span>{category}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteCategory(category)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Default Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Standaard Instellingen</h2>

        <div className="space-y-4">
          <div>
            <Label>Standaard Categorie</Label>
            <Select
              value={defaultSettings.defaultCategory}
              onValueChange={(value) =>
                setDefaultSettings({ ...defaultSettings, defaultCategory: value })
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Standaard Auteur</Label>
            <Input
              value={defaultSettings.defaultAuthor}
              onChange={(e) =>
                setDefaultSettings({
                  ...defaultSettings,
                  defaultAuthor: e.target.value,
                })
              }
              className="mt-2"
            />
          </div>

          <div>
            <Label>Posts per Pagina</Label>
            <Input
              type="number"
              value={defaultSettings.postsPerPage}
              onChange={(e) =>
                setDefaultSettings({
                  ...defaultSettings,
                  postsPerPage: parseInt(e.target.value) || 10,
                })
              }
              min={1}
              max={100}
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      {/* Author Profiles */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Auteur Profielen</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Beheer auteur profielen voor je blog posts
        </p>
        <Button variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Auteur Toevoegen
        </Button>
      </Card>

      {/* Integration Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Integraties</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-800 dark:bg-zinc-800 rounded-lg">
            <div>
              <h4 className="font-medium">Google Search Console</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Niet verbonden
              </p>
            </div>
            <Button variant="outline">Verbinden</Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-800 dark:bg-zinc-800 rounded-lg">
            <div>
              <h4 className="font-medium">Google Analytics</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Niet verbonden
              </p>
            </div>
            <Button variant="outline">Verbinden</Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-800 dark:bg-zinc-800 rounded-lg">
            <div>
              <h4 className="font-medium">Twitter Auto-Post</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatisch tweets bij publicatie
              </p>
            </div>
            <Button variant="outline">Configureren</Button>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          className="bg-gradient-to-r from-[#FF9933] to-[#FFAD33]"
        >
          <Save className="w-4 h-4 mr-2" />
          Instellingen Opslaan
        </Button>
      </div>
    </div>
  );
}

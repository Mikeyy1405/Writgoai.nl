#!/bin/bash

# Projects page
cat > app/projects/page.tsx << 'EOFPROJECTS'
'use client';

import { useEffect, useState } from 'react';
import SimplifiedLayout from '@/components/SimplifiedLayout';
import { Plus, Globe, Settings, Trash2, CheckCircle } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  wordpressUrl: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newProject, setNewProject] = useState({
    name: '',
    wordpressUrl: '',
    wordpressUsername: '',
    wordpressPassword: '',
    getLateApiKey: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });

      if (response.ok) {
        setShowWizard(false);
        setWizardStep(1);
        setNewProject({
          name: '',
          wordpressUrl: '',
          wordpressUsername: '',
          wordpressPassword: '',
          getLateApiKey: '',
        });
        fetchProjects();
      } else {
        const error = await response.json();
        alert('Error: ' + (error.message || 'Project aanmaken mislukt'));
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Project aanmaken mislukt. Probeer opnieuw.');
    }
  };

  return (
    <SimplifiedLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-800">📁 Mijn Projecten</h1>
            <p className="text-lg text-slate-600 mt-2">Beheer je WordPress websites</p>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Nieuw Project</span>
          </button>
        </div>

        {!loading && projects.length === 0 && !showWizard && (
          <div className="bg-white rounded-xl p-12 text-center shadow-lg border border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Nog geen projecten</h2>
            <p className="text-slate-600 mb-6">Maak je eerste project aan om te beginnen!</p>
            <button
              onClick={() => setShowWizard(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-xl transition-all"
            >
              Start Nu
            </button>
          </div>
        )}

        {projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{project.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{project.wordpressUrl}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    project.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {project.status === 'active' ? '● Actief' : '○ Inactief'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Instellingen</span>
                  </button>
                  <button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SimplifiedLayout>
  );
}
EOFPROJECTS

# Create directory
mkdir -p app/projects

echo "✅ All pages created successfully!"

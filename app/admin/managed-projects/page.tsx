
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Globe,
  Building2,
  User,
  Mail,
  ExternalLink,
  Search,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface ManagedProject {
  id: string;
  name: string;
  websiteUrl: string;
  description: string | null;
  managedSince: string;
  managedServiceActive: boolean;
  client: {
    id: string;
    name: string;
    email: string;
    companyName: string | null;
  };
}

export default function ManagedProjectsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [projects, setProjects] = useState<ManagedProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ManagedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/inloggen');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      // Check if user is admin (info@WritgoAI.nl or other admin)
      const isAdmin = session.user.email === 'info@WritgoAI.nl' || session.user.role === 'admin';
      if (!isAdmin) {
        router.push('/client-portal');
        return;
      }
      fetchManagedProjects();
    }
  }, [session]);

  useEffect(() => {
    // Filter projects based on search query
    if (searchQuery.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.websiteUrl.toLowerCase().includes(query) ||
          p.client.name.toLowerCase().includes(query) ||
          p.client.email.toLowerCase().includes(query) ||
          p.client.companyName?.toLowerCase().includes(query)
      );
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);

  const fetchManagedProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/client/projects/transfer-management');
      if (!res.ok) throw new Error('Failed to fetch managed projects');
      const data = await res.json();
      setProjects(data.projects || []);
      setFilteredProjects(data.projects || []);
    } catch (error: any) {
      console.error('Error fetching managed projects:', error);
      toast.error('Kon beheerde projecten niet laden');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          Fully Managed Projecten
        </h1>
        <p className="text-muted-foreground mt-2">
          Alle projecten die volledig door Writgo worden beheerd
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Totaal Beheerd</CardDescription>
            <CardTitle className="text-3xl">{projects.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Actieve managed projecten
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Maandelijkse Omzet</CardDescription>
            <CardTitle className="text-3xl">€{projects.length * 199}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Van managed services
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Unieke Klanten</CardDescription>
            <CardTitle className="text-3xl">
              {new Set(projects.map((p) => p.client.id)).size}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Met managed service
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op project naam, website, klant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 mb-2">
                    <Globe className="h-5 w-5 text-primary" />
                    {project.name}
                  </CardTitle>
                  <div className="space-y-1">
                    <a
                      href={project.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {project.websiteUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {project.description && (
                      <p className="text-sm text-muted-foreground">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={project.managedServiceActive ? 'default' : 'secondary'}>
                  {project.managedServiceActive ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Actief
                    </span>
                  ) : (
                    'Pending'
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Client Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Klant Informatie
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Naam:</span>
                      <span className="font-medium">{project.client.name}</span>
                    </div>
                    {project.client.companyName && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Bedrijf:</span>
                        <span className="font-medium">{project.client.companyName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <a
                        href={`mailto:${project.client.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {project.client.email}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Management Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Management Details
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Sinds:</span>
                      <span className="font-medium">
                        {new Date(project.managedSince).toLocaleDateString('nl-NL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Maandprijs:</span>
                      <span className="font-medium">€199,00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t flex gap-2">
                <Link href={`/admin/clients/${project.client.id}`}>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Bekijk klant
                  </Button>
                </Link>
                <Link href={`/client-portal/projects/${project.id}/settings`}>
                  <Button variant="outline" size="sm">
                    <Globe className="h-4 w-4 mr-2" />
                    Project instellingen
                  </Button>
                </Link>
                <Link href={`/client-portal/content-library?projectId=${project.id}`}>
                  <Button variant="default" size="sm">
                    Bekijk content
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredProjects.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Geen projecten gevonden met deze zoekopdracht'
                  : 'Nog geen fully managed projecten'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

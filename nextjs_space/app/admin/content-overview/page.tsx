'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Layers,
  Search,
  FileText,
  Share2,
  Video,
  Filter,
  Download,
  Loader2,
  Eye,
  Trash2,
  Calendar,
  User,
  ArrowUpDown,
} from 'lucide-react';
import Link from 'next/link';

interface ContentItem {
  id: string;
  type: 'blog' | 'social' | 'video';
  title: string;
  clientName: string;
  clientId: string;
  status: 'draft' | 'scheduled' | 'published';
  createdAt: string;
  publishedAt?: string;
  wordCount?: number;
  platform?: string;
}

export default function ContentOverviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'client' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    blogs: 0,
    social: 0,
    videos: 0,
    published: 0,
    draft: 0,
    scheduled: 0,
  });
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    } else if (status === 'authenticated') {
      loadContent();
    }
  }, [status, router]);
  
  useEffect(() => {
    applyFilters();
  }, [searchTerm, typeFilter, statusFilter, sortBy, sortOrder, content]);
  
  async function loadContent() {
    try {
      const response = await fetch('/api/admin/content-overview');
      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
        setStats(data.stats);
      } else {
        toast.error('Fout bij laden van content');
      }
    } catch (error) {
      console.error('Failed to load content:', error);
      toast.error('Fout bij laden van content');
    } finally {
      setLoading(false);
    }
  }
  
  function applyFilters() {
    let filtered = [...content];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clientName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'client') {
        comparison = a.clientName.localeCompare(b.clientName);
      } else if (sortBy === 'type') {
        comparison = a.type.localeCompare(b.type);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredContent(filtered);
  }
  
  function getTypeIcon(type: string) {
    switch (type) {
      case 'blog':
        return <FileText className="h-4 w-4" />;
      case 'social':
        return <Share2 className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  }
  
  function getStatusColor(status: string) {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }
  
  function exportToCSV() {
    const csvData = filteredContent.map(item => ({
      Type: item.type,
      Titel: item.title,
      Klant: item.clientName,
      Status: item.status,
      'Aangemaakt op': new Date(item.createdAt).toLocaleDateString('nl-NL'),
      'Gepubliceerd op': item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('nl-NL') : 'N/A',
    }));
    
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('Content geëxporteerd naar CSV');
  }
  
  function toggleSort() {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Layers className="h-8 w-8" />
            Content Overzicht
          </h1>
          <p className="text-muted-foreground mt-1">
            Alle gegenereerde content van alle klanten
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporteer CSV
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard">Terug naar Dashboard</Link>
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totaal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Blogs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.blogs}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Social
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.social}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Video className="h-4 w-4" />
              Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.videos}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700">
              Gepubliceerd
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-800">{stats.published}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">
              Ingepland
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-800">{stats.scheduled}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Concepten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-800">{stats.draft}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Zoek op titel of klant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Types</SelectItem>
                <SelectItem value="blog">Blogs</SelectItem>
                <SelectItem value="social">Social Posts</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Statussen</SelectItem>
                <SelectItem value="published">Gepubliceerd</SelectItem>
                <SelectItem value="scheduled">Ingepland</SelectItem>
                <SelectItem value="draft">Concept</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sorteren op" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Datum</SelectItem>
                <SelectItem value="client">Klant</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Content Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Content Items ({filteredContent.length})</CardTitle>
              <CardDescription>
                Alle gegenereerde content met details
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={toggleSort}>
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {sortOrder === 'asc' ? 'Oplopend' : 'Aflopend'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead>Klant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aangemaakt</TableHead>
                  <TableHead>Gepubliceerd</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContent.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Geen content gevonden
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContent.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          {getTypeIcon(item.type)}
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {item.title}
                      </TableCell>
                      <TableCell>
                        <Link 
                          href={`/admin/clients/${item.clientId}`}
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <User className="h-3 w-3" />
                          {item.clientName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status === 'published' ? 'Gepubliceerd' : 
                           item.status === 'scheduled' ? 'Ingepland' : 'Concept'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleDateString('nl-NL')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.publishedAt ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.publishedAt).toLocaleDateString('nl-NL')}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { isUnauthorizedError } from '@/lib/authUtils';
import { currencies } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Link as LinkIcon, 
  ExternalLink, 
  BarChart3, 
  LogOut,
  Copy,
  Check,
  Grip,
  User,
  Settings,
  Eye,
  Music,
  Mic2,
  Globe,
  Target,
  ChevronDown,
  LayoutGrid,
  List,
  FileText,
  CreditCard,
  Upload
} from 'lucide-react';
import { SiSpotify, SiSoundcloud, SiYoutube, SiApple, SiTidal, SiAmazon, SiFacebook, SiInstagram, SiTiktok } from 'react-icons/si';
import { Music2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CustomDomainSettings from '@/components/CustomDomainSettings';
import type { LinkPage, Link } from '@shared/schema';

interface DashboardStats {
  totalPages: number;
  totalClicks: number;
  isSubscribed: boolean;
  subscription: {
    id: string;
    status: string;
  } | null;
}

const streamingPlatforms = [
  { id: 'spotify', name: 'Spotify', icon: SiSpotify, color: '#1DB954' },
  { id: 'soundcloud', name: 'SoundCloud', icon: SiSoundcloud, color: '#FF5500' },
  { id: 'youtube', name: 'YouTube', icon: SiYoutube, color: '#FF0000' },
  { id: 'deezer', name: 'Deezer', icon: Music2, color: '#FEAA2D' },
  { id: 'apple_music', name: 'Apple Music', icon: SiApple, color: '#FA243C' },
  { id: 'tidal', name: 'Tidal', icon: SiTidal, color: '#000000' },
  { id: 'amazon_music', name: 'Amazon Music', icon: SiAmazon, color: '#FF9900' },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const { language, setLanguage, currency, setCurrency, t } = useLanguage();
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [editingPage, setEditingPage] = useState<LinkPage | null>(null);
  const [selectedPage, setSelectedPage] = useState<LinkPage | null>(null);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  // Handle create standard page
  const handleCreatePage = () => {
    setActiveTab('pages');
    setIsCreatingPage(true);
  };

  // Handle create smart link page
  const handleCreateSmartLink = () => {
    setLocation('/create-smart-link');
  };
  
  // Form states
  const [pageForm, setPageForm] = useState({
    slug: '',
    title: '',
    bio: '',
    backgroundColor: '#FF6600',
    textColor: '#FFFFFF',
    gtmContainerId: '',
    pageType: 'standard' as 'standard' | 'smart-link',
    websiteUrl: '',
    avatarUrl: '',
    socialLinks: {
      facebook: '',
      youtube: '',
      instagram: '',
      tiktok: '',
      custom: '',
    },
  });
  
  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    icon: '',
    linkType: 'custom' as string,
    streamingPlatform: '' as string,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [user, authLoading, toast]);

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    enabled: !!user,
  });

  // Fetch custom domain status for dynamic URL display
  const { data: domainStatus } = useQuery<{
    customDomain: string | null;
    customDomainVerified: boolean;
  }>({
    queryKey: ['/api/account/domains/status'],
    enabled: !!user,
  });

  // Helper to get the base URL for display
  const getDisplayDomain = () => {
    if (domainStatus?.customDomain && domainStatus.customDomainVerified) {
      return domainStatus.customDomain;
    }
    return 'hubisck.com';
  };

  // Fetch all link pages
  const { data: pages = [], isLoading: pagesLoading } = useQuery<LinkPage[]>({
    queryKey: ['/api/link-pages'],
    enabled: !!user,
  });

  // Fetch links for selected page
  const { data: links = [], isLoading: linksLoading } = useQuery<Link[]>({
    queryKey: ['/api/links', selectedPage?.id],
    queryFn: async () => {
      const res = await fetch(`/api/links?pageId=${selectedPage?.id}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch links');
      return res.json();
    },
    enabled: !!selectedPage,
  });

  // Fetch analytics for selected page
  const { data: analytics } = useQuery<{ totalClicks: number; clicksByLink: { linkId: string; clicks: number }[] }>({
    queryKey: ['/api/analytics', selectedPage?.id],
    enabled: !!user && !!selectedPage,
  });

  // Create link page mutation
  const createPageMutation = useMutation({
    mutationFn: async (data: typeof pageForm) => {
      return apiRequest('POST', '/api/link-page', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/link-pages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({ title: t.dashboard.pages.title, description: "Page created successfully!" });
      setIsCreatingPage(false);
      resetPageForm();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({ title: "Unauthorized", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => window.location.href = "/login", 500);
        return;
      }
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    },
  });

  // Update link page mutation
  const updatePageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof pageForm> }) => {
      return apiRequest('PATCH', `/api/link-page/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/link-pages'] });
      toast({ title: "Success", description: "Page updated successfully!" });
      setEditingPage(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    },
  });

  // Delete link page mutation
  const deletePageMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/link-page/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/link-pages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({ title: "Success", description: "Page deleted successfully!" });
      if (selectedPage) setSelectedPage(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    },
  });

  // Create link mutation
  const createLinkMutation = useMutation({
    mutationFn: async (data: typeof linkForm & { linkPageId: string }) => {
      return apiRequest('POST', '/api/links', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links', selectedPage?.id] });
      toast({ title: "Success", description: "Link added!" });
      setIsAddingLink(false);
      setLinkForm({ title: '', url: '', icon: '', linkType: 'custom', streamingPlatform: '' });
    },
    onError: (error) => {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    },
  });

  // Update link mutation
  const updateLinkMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Link> }) => {
      return apiRequest('PATCH', `/api/links/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links', selectedPage?.id] });
      toast({ title: "Success", description: "Link updated!" });
      setEditingLink(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    },
  });

  // Delete link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/links', selectedPage?.id] });
      toast({ title: "Success", description: "Link deleted!" });
    },
    onError: (error) => {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    },
  });

  const resetPageForm = () => {
    setPageForm({
      slug: '',
      title: '',
      bio: '',
      backgroundColor: '#FF6600',
      textColor: '#FFFFFF',
      gtmContainerId: '',
      pageType: 'standard',
      websiteUrl: '',
      avatarUrl: '',
      socialLinks: {
        facebook: '',
        youtube: '',
        instagram: '',
        tiktok: '',
        custom: '',
      },
    });
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: t.dashboard.pages.copyLink, description: "Link copied to clipboard" });
  };

  const getClicksForLink = (linkId: string) => {
    return analytics?.clicksByLink.find(c => c.linkId === linkId)?.clicks || 0;
  };

  const getPageTypeIcon = (pageType: string) => {
    switch (pageType) {
      case 'smart-link': return <Music className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getPageTypeBadge = (pageType: string) => {
    const labels: Record<string, string> = {
      standard: t.dashboard.pageTypes.standard,
      'smart-link': t.dashboard.pageTypes.smartLink,
    };
    return labels[pageType] || pageType;
  };

  if (authLoading || pagesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <a href="/" className="flex items-center gap-2" data-testid="link-dashboard-logo">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-primary">Hubisck</span>
            </a>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Button 
                variant={activeTab === 'dashboard' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setActiveTab('dashboard')}
                data-testid="nav-dashboard"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {t.nav.dashboard}
              </Button>
              <Button 
                variant={activeTab === 'pages' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setActiveTab('pages')}
                data-testid="nav-my-pages"
              >
                <FileText className="w-4 h-4 mr-2" />
                {t.nav.myPages}
              </Button>
              <Button 
                variant={activeTab === 'settings' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setActiveTab('settings')}
                data-testid="nav-settings"
              >
                <Settings className="w-4 h-4 mr-2" />
                {t.nav.settings}
              </Button>
              <Button 
                variant={activeTab === 'googleads' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setActiveTab('googleads')}
                data-testid="nav-google-ads"
              >
                <Target className="w-4 h-4 mr-2" />
                {t.nav.googleAds}
              </Button>
              <Button 
                variant={activeTab === 'domains' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setActiveTab('domains')}
                data-testid="nav-domains"
              >
                <Globe className="w-4 h-4 mr-2" />
                Domains
              </Button>
            </nav>

            <div className="flex items-center gap-3">
              {/* Language selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-language-selector">
                    <Globe className="w-4 h-4 mr-1" />
                    {language.toUpperCase()}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setLanguage('pt')} data-testid="menu-item-lang-pt">
                    PT - Português
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('en')} data-testid="menu-item-lang-en">
                    EN - English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('fr')} data-testid="menu-item-lang-fr">
                    FR - Français
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url || ''} alt={user?.user_metadata?.full_name || 'User'} className="object-cover" />
                  <AvatarFallback>{user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
                  {user?.user_metadata?.full_name || user?.email}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => signOut()}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">{t.nav.logout}</span>
              </Button>
            </div>
          </div>

          {/* Mobile navigation */}
          <div className="flex md:hidden mt-4 gap-1 overflow-x-auto pb-2">
            <Button 
              variant={activeTab === 'dashboard' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveTab('dashboard')}
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button 
              variant={activeTab === 'pages' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveTab('pages')}
            >
              <FileText className="w-4 h-4" />
            </Button>
            <Button 
              variant={activeTab === 'settings' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button 
              variant={activeTab === 'googleads' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveTab('googleads')}
            >
              <Target className="w-4 h-4" />
            </Button>
            <Button 
              variant={activeTab === 'domains' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveTab('domains')}
            >
              <Globe className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-welcome">
                    {t.dashboard.welcome}, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}!
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    {stats?.isSubscribed ? (
                      <Badge variant="default" className="bg-green-500" data-testid="badge-subscription-active">
                        <CreditCard className="w-3 h-3 mr-1" />
                        {t.dashboard.subscription.active}: {t.dashboard.subscription.monthly} - {currencies[currency].symbol}{currencies[currency].price}{t.dashboard.subscription.price}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" data-testid="badge-subscription-inactive">
                        {t.dashboard.subscription.inactive}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button onClick={handleCreatePage} data-testid="button-create-page-welcome">
                  <Plus className="w-4 h-4 mr-2" />
                  {t.dashboard.pages.createNew}
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="text-total-pages">{stats?.totalPages || 0}</p>
                      <p className="text-sm text-gray-500">{t.dashboard.stats.totalPages}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="text-total-clicks">{stats?.totalClicks || 0}</p>
                      <p className="text-sm text-gray-500">{t.dashboard.stats.totalClicks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Pages Preview */}
            {pages.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle>{t.dashboard.pages.title}</CardTitle>
                    <CardDescription>Your most recent link pages</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('pages')}>
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pages.slice(0, 3).map((page) => (
                      <div
                        key={page.id}
                        className="p-4 border rounded-lg hover-elevate cursor-pointer"
                        onClick={() => { setSelectedPage(page); setActiveTab('pages'); }}
                        data-testid={`card-page-preview-${page.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: page.backgroundColor || '#FF6600' }}
                          >
                            {getPageTypeIcon(page.pageType || 'standard')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{page.title}</p>
                            <p className="text-sm text-gray-500 truncate">/{page.slug}</p>
                          </div>
                          <Badge variant="outline">
                            {getPageTypeBadge(page.pageType || 'standard')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {pages.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t.dashboard.pages.empty}</h3>
                  <Button onClick={handleCreatePage}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t.dashboard.pages.createNew}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* My Pages Tab */}
        {activeTab === 'pages' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{t.dashboard.pages.title}</h2>
                <p className="text-gray-500">Manage all your link pages</p>
              </div>
              <div className="flex items-center gap-3">
                {/* View mode toggle */}
                <div className="flex border rounded-lg">
                  <Button 
                    variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={viewMode === 'list' ? 'default' : 'ghost'} 
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>

                {/* Smart Link Button */}
                <Button 
                  variant="outline" 
                  onClick={handleCreateSmartLink}
                  data-testid="button-create-smart-link"
                >
                  <Music className="w-4 h-4 mr-2" />
                  {t.dashboard.createOptions.smartLinkTitle}
                </Button>

                <Dialog open={isCreatingPage} onOpenChange={setIsCreatingPage}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-page">
                      <Plus className="w-4 h-4 mr-2" />
                      {t.dashboard.createOptions.standardTitle}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{t.dashboard.createOptions.standardTitle}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Your URL */}
                      <div className="space-y-2">
                        <Label htmlFor="slug">Your URL</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{getDisplayDomain()}/</span>
                          <Input
                            id="slug"
                            placeholder="yourname"
                            value={pageForm.slug}
                            onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                            data-testid="input-page-slug"
                          />
                        </div>
                      </div>

                      {/* Display Name */}
                      <div className="space-y-2">
                        <Label htmlFor="title">Display Name</Label>
                        <Input
                          id="title"
                          placeholder="Your Name"
                          value={pageForm.title}
                          onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                          data-testid="input-page-title"
                        />
                      </div>

                      {/* Bio */}
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio (optional)</Label>
                        <Textarea
                          id="bio"
                          placeholder="Tell people about yourself..."
                          value={pageForm.bio}
                          onChange={(e) => setPageForm({ ...pageForm, bio: e.target.value })}
                          data-testid="input-page-bio"
                        />
                      </div>

                      {/* Website */}
                      <div className="space-y-2">
                        <Label htmlFor="websiteUrl">Website</Label>
                        <Input
                          id="websiteUrl"
                          placeholder="https://yourwebsite.com"
                          value={pageForm.websiteUrl}
                          onChange={(e) => setPageForm({ ...pageForm, websiteUrl: e.target.value })}
                          data-testid="input-website-url"
                        />
                      </div>

                      {/* Social Media Links */}
                      <div className="space-y-3">
                        <Label>Social Media Links</Label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 flex items-center justify-center text-[#1877F2]">
                              <SiFacebook className="w-5 h-5" />
                            </div>
                            <Input
                              placeholder="Facebook Page URL"
                              value={pageForm.socialLinks.facebook}
                              onChange={(e) => setPageForm({ 
                                ...pageForm, 
                                socialLinks: { ...pageForm.socialLinks, facebook: e.target.value }
                              })}
                              data-testid="input-social-facebook"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 flex items-center justify-center text-[#FF0000]">
                              <SiYoutube className="w-5 h-5" />
                            </div>
                            <Input
                              placeholder="YouTube Channel URL"
                              value={pageForm.socialLinks.youtube}
                              onChange={(e) => setPageForm({ 
                                ...pageForm, 
                                socialLinks: { ...pageForm.socialLinks, youtube: e.target.value }
                              })}
                              data-testid="input-social-youtube"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 flex items-center justify-center text-[#E4405F]">
                              <SiInstagram className="w-5 h-5" />
                            </div>
                            <Input
                              placeholder="Instagram Profile URL"
                              value={pageForm.socialLinks.instagram}
                              onChange={(e) => setPageForm({ 
                                ...pageForm, 
                                socialLinks: { ...pageForm.socialLinks, instagram: e.target.value }
                              })}
                              data-testid="input-social-instagram"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 flex items-center justify-center text-[#000000] dark:text-white">
                              <SiTiktok className="w-5 h-5" />
                            </div>
                            <Input
                              placeholder="TikTok Profile URL"
                              value={pageForm.socialLinks.tiktok}
                              onChange={(e) => setPageForm({ 
                                ...pageForm, 
                                socialLinks: { ...pageForm.socialLinks, tiktok: e.target.value }
                              })}
                              data-testid="input-social-tiktok"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 flex items-center justify-center text-gray-500">
                              <LinkIcon className="w-5 h-5" />
                            </div>
                            <Input
                              placeholder="Custom Link URL"
                              value={pageForm.socialLinks.custom}
                              onChange={(e) => setPageForm({ 
                                ...pageForm, 
                                socialLinks: { ...pageForm.socialLinks, custom: e.target.value }
                              })}
                              data-testid="input-social-custom"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Colors */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bgColor">Background Color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="bgColor"
                              type="color"
                              value={pageForm.backgroundColor}
                              onChange={(e) => setPageForm({ ...pageForm, backgroundColor: e.target.value })}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              value={pageForm.backgroundColor}
                              onChange={(e) => setPageForm({ ...pageForm, backgroundColor: e.target.value })}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="textColor">Text Color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="textColor"
                              type="color"
                              value={pageForm.textColor}
                              onChange={(e) => setPageForm({ ...pageForm, textColor: e.target.value })}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              value={pageForm.textColor}
                              onChange={(e) => setPageForm({ ...pageForm, textColor: e.target.value })}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Picture Upload */}
                      <div className="space-y-2">
                        <Label>Profile Picture</Label>
                        <p className="text-xs text-gray-500">Max 500KB, JPEG/PNG/GIF/WebP</p>
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {pageForm.avatarUrl ? (
                              <img 
                                src={pageForm.avatarUrl} 
                                alt="Preview" 
                                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300">
                                <Upload className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              className="hidden"
                              id="avatar-upload"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                if (file.size > 500 * 1024) {
                                  toast({ title: "Error", description: "File too large. Max 500KB allowed.", variant: "destructive" });
                                  return;
                                }
                                
                                const formData = new FormData();
                                formData.append('image', file);
                                
                                try {
                                  const response = await fetch('/api/upload', {
                                    method: 'POST',
                                    body: formData,
                                    credentials: 'include',
                                  });
                                  
                                  if (!response.ok) throw new Error('Upload failed');
                                  
                                  const { url } = await response.json();
                                  setPageForm({ ...pageForm, avatarUrl: url });
                                  toast({ title: "Success", description: "Image uploaded successfully!" });
                                } catch (error) {
                                  toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
                                }
                              }}
                              data-testid="input-avatar-upload"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('avatar-upload')?.click()}
                              data-testid="button-upload-avatar"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {pageForm.avatarUrl ? 'Change Image' : 'Upload Image'}
                            </Button>
                            {pageForm.avatarUrl && (
                              <Button
                                type="button"
                                variant="ghost"
                                className="ml-2 text-red-500"
                                onClick={() => setPageForm({ ...pageForm, avatarUrl: '' })}
                                data-testid="button-remove-avatar"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button 
                        onClick={() => createPageMutation.mutate(pageForm)}
                        disabled={!pageForm.slug || !pageForm.title || createPageMutation.isPending}
                        data-testid="button-submit-create-page"
                      >
                        {createPageMutation.isPending ? 'Creating...' : 'Create Page'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Pages Grid/List View */}
            {pages.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t.dashboard.pages.empty}</h3>
                  <Button onClick={handleCreatePage}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t.dashboard.pages.createNew}
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pages.map((page) => (
                  <Card 
                    key={page.id} 
                    className={`hover-elevate cursor-pointer transition-all ${selectedPage?.id === page.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedPage(page)}
                    data-testid={`card-page-${page.id}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-2">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                          style={{ backgroundColor: page.backgroundColor || '#FF6600' }}
                        >
                          {getPageTypeIcon(page.pageType || 'standard')}
                        </div>
                        <Badge variant="outline">
                          {getPageTypeBadge(page.pageType || 'standard')}
                        </Badge>
                      </div>
                      <h3 className="font-semibold mt-3 truncate">{page.title}</h3>
                      <p className="text-sm text-gray-500 truncate">/{page.slug}</p>
                      {page.bio && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{page.bio}</p>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0 flex gap-2 flex-wrap">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleCopyLink(page.slug); }}
                      >
                        {copied === page.slug ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                        {t.dashboard.pages.copyLink}
                      </Button>
                      <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-3 h-3 mr-1" />
                          {t.dashboard.pages.preview}
                        </Button>
                      </a>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (page.pageType === 'smart-link' || page.pageType === 'music') {
                            setLocation(`/smart-link/edit/${page.id}`);
                          } else {
                            setLocation(`/page/edit/${page.id}`);
                          }
                        }}
                        data-testid={`button-edit-${page.id}`}
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        {t.dashboard.pages.edit}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Page?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this page and all its links.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deletePageMutation.mutate(page.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {pages.map((page) => (
                  <Card 
                    key={page.id} 
                    className={`hover-elevate cursor-pointer ${selectedPage?.id === page.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedPage(page)}
                    data-testid={`list-page-${page.id}`}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                          style={{ backgroundColor: page.backgroundColor || '#FF6600' }}
                        >
                          {getPageTypeIcon(page.pageType || 'standard')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{page.title}</h3>
                          <p className="text-sm text-gray-500">/{page.slug}</p>
                        </div>
                        <Badge variant="outline">
                          {getPageTypeBadge(page.pageType || 'standard')}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleCopyLink(page.slug); }}>
                            {copied === page.slug ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                          <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (page.pageType === 'smart-link' || page.pageType === 'music') {
                                setLocation(`/smart-link/edit/${page.id}`);
                              } else {
                                setLocation(`/page/edit/${page.id}`);
                              }
                            }}
                            data-testid={`button-edit-list-${page.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Selected Page Details */}
            {selectedPage && (
              <Card className="mt-8">
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                  <div>
                    <CardTitle>Links for: {selectedPage.title}</CardTitle>
                    <CardDescription>Manage links for this page</CardDescription>
                  </div>
                  <Dialog open={isAddingLink} onOpenChange={setIsAddingLink}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-link">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Link
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Link</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {/* Streaming platform quick add for smart-link pages */}
                        {selectedPage.pageType === 'smart-link' && (
                          <div className="space-y-2">
                            <Label>Quick Add Streaming Link</Label>
                            <div className="grid grid-cols-4 gap-2">
                              {streamingPlatforms.map((platform) => (
                                <button
                                  key={platform.id}
                                  type="button"
                                  className={`p-2 border rounded-lg flex flex-col items-center gap-1 transition-colors ${
                                    linkForm.streamingPlatform === platform.id ? 'border-primary bg-primary/10' : 'hover:border-gray-400'
                                  }`}
                                  onClick={() => setLinkForm({
                                    ...linkForm,
                                    title: platform.name,
                                    linkType: 'streaming',
                                    streamingPlatform: platform.id,
                                  })}
                                >
                                  <platform.icon className="w-5 h-5" style={{ color: platform.color }} />
                                  <span className="text-xs">{platform.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="link-title">Title</Label>
                          <Input
                            id="link-title"
                            placeholder="My Website"
                            value={linkForm.title}
                            onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                            data-testid="input-link-title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="link-url">URL</Label>
                          <Input
                            id="link-url"
                            placeholder="https://example.com"
                            value={linkForm.url}
                            onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                            data-testid="input-link-url"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button 
                          onClick={() => createLinkMutation.mutate({ ...linkForm, linkPageId: selectedPage.id })}
                          disabled={!linkForm.title || !linkForm.url || createLinkMutation.isPending}
                          data-testid="button-save-link"
                        >
                          {createLinkMutation.isPending ? 'Adding...' : 'Add Link'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {linksLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading links...</div>
                  ) : links.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <LinkIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>No links yet. Add your first link to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {links.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg group"
                          data-testid={`link-item-${link.id}`}
                        >
                          <div className="flex-shrink-0 text-gray-400">
                            <Grip className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{link.title}</p>
                            <p className="text-sm text-gray-500 truncate">{link.url}</p>
                          </div>
                          <Badge variant="secondary" className="flex-shrink-0">
                            {getClicksForLink(link.id)} clicks
                          </Badge>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Switch
                              checked={link.isActive ?? true}
                              onCheckedChange={(checked) => updateLinkMutation.mutate({ id: link.id, data: { isActive: checked } })}
                              data-testid={`switch-link-active-${link.id}`}
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-delete-link-${link.id}`}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Link?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteLinkMutation.mutate(link.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">{t.nav.settings}</h2>
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.user_metadata?.avatar_url || ''} alt={user?.user_metadata?.full_name || 'User'} className="object-cover" />
                    <AvatarFallback className="text-xl">{user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt">Português</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={(v) => setCurrency(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">BRL - Real</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="USD">USD - Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Subscription</h4>
                  {stats?.isSubscribed ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="default" className="bg-green-500">
                          {t.dashboard.subscription.active}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">
                          {t.dashboard.subscription.monthly} - {currencies[currency].symbol}{currencies[currency].price}{t.dashboard.subscription.price}
                        </p>
                      </div>
                      <Button variant="outline" onClick={async () => {
                        const res = await apiRequest('POST', '/api/customer-portal');
                        const data = await res.json();
                        if (data.url) window.location.href = data.url;
                      }}>
                        Manage Subscription
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-gray-500">{t.dashboard.subscription.inactive}</p>
                      <a href="/#pricing">
                        <Button>Subscribe Now</Button>
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Google Ads Tab */}
        {activeTab === 'googleads' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">{t.dashboard.googleAds.title}</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {t.dashboard.googleAds.title}
                </CardTitle>
                <CardDescription>{t.dashboard.googleAds.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">{t.dashboard.googleAds.connect}</h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    {t.dashboard.googleAds.description}
                  </p>
                </div>

                {pages.length > 0 ? (
                  <div className="space-y-4">
                    <Label>{t.dashboard.googleAds.pixelId}</Label>
                    {pages.map((page) => (
                      <div key={page.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div 
                          className="w-8 h-8 rounded flex items-center justify-center text-white flex-shrink-0"
                          style={{ backgroundColor: page.backgroundColor || '#FF6600' }}
                        >
                          {getPageTypeIcon(page.pageType || 'standard')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{page.title}</p>
                          <p className="text-sm text-gray-500">/{page.slug}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder={t.dashboard.googleAds.pixelPlaceholder}
                            defaultValue={page.gtmContainerId || ''}
                            onBlur={(e) => {
                              if (e.target.value !== page.gtmContainerId) {
                                updatePageMutation.mutate({ id: page.id, data: { gtmContainerId: e.target.value } });
                              }
                            }}
                            className="w-48"
                            data-testid={`input-gtm-${page.id}`}
                          />
                          <Badge variant={page.gtmContainerId ? 'default' : 'secondary'}>
                            {page.gtmContainerId ? t.dashboard.googleAds.active : t.dashboard.googleAds.inactive}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>{t.dashboard.googleAds.connect}</p>
                    <Button className="mt-4" onClick={handleCreatePage}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t.dashboard.pages.createNew}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Domains Tab - Account-Level Custom Domain */}
        {activeTab === 'domains' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Globe className="w-6 h-6 text-[#FF6600]" />
                  Custom Domain
                </h2>
                <p className="text-muted-foreground mt-1">
                  Use your own domain for all your pages
                </p>
              </div>
            </div>

            <CustomDomainSettings />

            {/* URL Preview */}
            {pages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Page URLs</CardTitle>
                  <CardDescription>
                    These are the URLs where your pages can be accessed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pages.map((page) => (
                      <div 
                        key={page.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded flex items-center justify-center text-white"
                            style={{ backgroundColor: page.backgroundColor || '#FF6600' }}
                          >
                            {getPageTypeIcon(page.pageType || 'standard')}
                          </div>
                          <div>
                            <p className="font-medium">{page.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {getDisplayDomain()}/{page.slug}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(`https://${getDisplayDomain()}/${page.slug}`);
                            toast({ title: "Copied!", description: "URL copied to clipboard" });
                          }}
                          data-testid={`copy-url-${page.id}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

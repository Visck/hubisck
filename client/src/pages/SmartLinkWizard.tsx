import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type { LinkPage, Link } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  ChevronLeft,
  Check,
  Plus,
  Music,
  Palette,
  Link as LinkIcon,
  Settings,
  Headphones,
  Target,
  CheckCircle2,
  Upload,
  Play,
  Loader2,
  Sparkles,
  Wand2,
  Trash2,
  ExternalLink,
  Lock
} from 'lucide-react';
import { 
  SiSpotify, 
  SiSoundcloud, 
  SiYoutube, 
  SiApple, 
  SiTidal, 
  SiAmazon,
  SiBandcamp,
  SiTiktok,
  SiPandora
} from 'react-icons/si';
import { Music2, Globe, Mail, Share2 } from 'lucide-react';

interface StreamingPlatform {
  id: string;
  name: string;
  icon: any;
  color: string;
  url: string;
}

const allStreamingPlatforms = [
  { id: 'spotify', name: 'Spotify', icon: SiSpotify, color: '#1DB954' },
  { id: 'soundcloud', name: 'SoundCloud', icon: SiSoundcloud, color: '#FF5500' },
  { id: 'itunes', name: 'iTunes Store', icon: SiApple, color: '#EA4CC0' },
  { id: 'apple_music', name: 'Apple Music', icon: SiApple, color: '#FA243C' },
  { id: 'youtube', name: 'Youtube', icon: SiYoutube, color: '#FF0000' },
  { id: 'youtube_music', name: 'Youtube Music', icon: SiYoutube, color: '#FF0000' },
  { id: 'amazon', name: 'Amazon', icon: SiAmazon, color: '#FF9900' },
  { id: 'amazon_music', name: 'Amazon Music', icon: SiAmazon, color: '#FF9900' },
  { id: 'google', name: 'Google', icon: Globe, color: '#4285F4' },
  { id: 'google_play', name: 'Google Play', icon: Globe, color: '#3DDC84' },
  { id: 'deezer', name: 'Deezer', icon: Music2, color: '#FEAA2D' },
  { id: 'beatport', name: 'Beatport', icon: Music2, color: '#94D500' },
  { id: 'tidal', name: 'Tidal', icon: SiTidal, color: '#000000' },
  { id: 'napster', name: 'Napster', icon: Music2, color: '#000000' },
  { id: 'pandora', name: 'Pandora', icon: SiPandora, color: '#005483' },
  { id: 'yandex', name: 'Yandex', icon: Music2, color: '#FF0000' },
  { id: 'hypeddit', name: 'Hypeddit', icon: Music2, color: '#00D4AA' },
  { id: 'bandcamp', name: 'Bandcamp', icon: SiBandcamp, color: '#629AA9' },
  { id: 'juno', name: 'Juno Download', icon: Music2, color: '#003366' },
  { id: 'traxsource', name: 'Traxsource', icon: Music2, color: '#FF6600' },
  { id: 'email', name: 'Email capture', icon: Mail, color: '#666666', premium: true },
  { id: 'tiktok', name: 'TikTok', icon: SiTiktok, color: '#000000' },
  { id: 'share', name: 'Share', icon: Share2, color: '#666666', premium: true },
  { id: 'custom', name: 'Custom', icon: Music2, color: '#666666', premium: true },
];

const genres = [
  'Pop', 'Hip-Hop', 'R&B', 'Electronic', 'Dance', 'House', 'Techno', 
  'Rock', 'Indie', 'Alternative', 'Jazz', 'Classical', 'Country',
  'Reggae', 'Latin', 'Afrobeat', 'K-Pop', 'Metal', 'Punk', 'Soul', 'Funk'
];

interface SmartLinkWizardProps {
  editPageId?: string;
}

export default function SmartLinkWizard({ editPageId }: SmartLinkWizardProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState('1');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [detectUrl, setDetectUrl] = useState('');
  const [detectionSuccess, setDetectionSuccess] = useState(false);
  const [titleStepErrors, setTitleStepErrors] = useState<{title?: boolean; artistName?: boolean; slug?: boolean}>({});
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());
  const [isEditMode, setIsEditMode] = useState(!!editPageId);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const [formData, setFormData] = useState({
    source: 'new',
    genre: '',
    title: '',
    artistName: '',
    slug: '',
    backgroundColor: '#1a1a2e',
    textColor: '#ffffff',
    coverArtUrl: '',
    selectedPlatforms: [] as StreamingPlatform[],
    releaseDate: '',
    previewUrl: '',
    gtmContainerId: '',
  });

  // Fetch existing page data when in edit mode (uses default queryFn with auth headers)
  const { data: existingPage, isLoading: isLoadingPage } = useQuery<LinkPage>({
    queryKey: ['/api/link-pages', editPageId],
    enabled: !!editPageId,
  });

  // Fetch custom domain status for dynamic URL display
  const { data: domainStatus } = useQuery<{
    customDomain: string | null;
    customDomainVerified: boolean;
  }>({
    queryKey: ['/api/account/domains/status'],
  });

  // Helper to get the base URL for display
  const getDisplayDomain = () => {
    if (domainStatus?.customDomain && domainStatus.customDomainVerified) {
      return domainStatus.customDomain;
    }
    return 'hubisck.com';
  };

  // Fetch existing links for the page when in edit mode
  const { data: existingLinks, isLoading: isLoadingLinks } = useQuery<Link[]>({
    queryKey: ['/api/links'],
    queryFn: async () => {
      const { getAuthHeaders } = await import('@/lib/queryClient');
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`/api/links?pageId=${editPageId}`, {
        headers: authHeaders,
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch links');
      return response.json();
    },
    enabled: !!editPageId,
  });

  // Populate form with existing data when editing
  useEffect(() => {
    if (editPageId && existingPage && !dataLoaded) {
      // Map existing links to platform format
      const platformsFromLinks: StreamingPlatform[] = (existingLinks || []).map(link => {
        const platformDef = allStreamingPlatforms.find(p => p.id === link.streamingPlatform || p.id === link.icon);
        return {
          id: link.streamingPlatform || link.icon || 'custom',
          name: link.title,
          icon: platformDef?.icon || Music2,
          color: platformDef?.color || '#666666',
          url: link.url,
        };
      });

      setFormData({
        source: 'existing',
        genre: '',
        title: existingPage.title,
        artistName: existingPage.artistName || '',
        slug: existingPage.slug,
        backgroundColor: existingPage.backgroundColor || '#1a1a2e',
        textColor: existingPage.textColor || '#ffffff',
        coverArtUrl: existingPage.coverArtUrl || '',
        selectedPlatforms: platformsFromLinks,
        releaseDate: existingPage.releaseDate || '',
        previewUrl: '',
        gtmContainerId: existingPage.gtmContainerId || '',
      });

      // Expand all platforms that have links
      setExpandedPlatforms(new Set(platformsFromLinks.map(p => p.id)));
      
      // Mark all steps as completed since we're editing
      setCompletedSteps(['1', '2', '3', '4', '5', '6', '7', '8']);
      setCurrentStep('9');
      setDataLoaded(true);
      setIsEditMode(true);
    }
  }, [editPageId, existingPage, existingLinks, dataLoaded]);

  // Platform ID mapping for API results to frontend platform IDs
  const platformMapping: Record<string, string> = {
    spotify: 'spotify',
    youtube: 'youtube',
    youtube_music: 'youtube_music',
    appleMusic: 'apple_music',
    apple_music: 'apple_music',
    deezer: 'deezer',
    soundcloud: 'soundcloud',
    tidal: 'tidal',
    amazonMusic: 'amazon_music',
    amazon_music: 'amazon_music',
    bandcamp: 'bandcamp',
  };

  // Validate Spotify URL before submitting
  const isValidSpotifyUrl = (url: string): boolean => {
    return /(?:open\.spotify\.com|spotify\.com)\/(track|album)\/[a-zA-Z0-9]+/.test(url) ||
           /spotify:(track|album):[a-zA-Z0-9]+/.test(url);
  };

  // Detect track mutation
  const detectTrackMutation = useMutation({
    mutationFn: async (url: string) => {
      // Validate URL before making API call
      if (!isValidSpotifyUrl(url)) {
        throw new Error('Please enter a valid Spotify track or album URL');
      }
      const response = await apiRequest('POST', '/api/detect-track', { url });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setDetectionSuccess(true);
      
      // Auto-fill form data with safe defaults
      const track = data.track || {};
      const streamingLinks = data.streamingLinks || {};
      
      // Create slug from title (with safe fallback)
      const title = track.title || '';
      const autoSlug = title
        ? title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50)
        : '';
      
      // Build selected platforms from detected links
      const detectedPlatforms: StreamingPlatform[] = [];
      const detectedPlatformIds: string[] = [];
      
      Object.entries(streamingLinks).forEach(([key, url]) => {
        const platformId = platformMapping[key] || key;
        const platformInfo = allStreamingPlatforms.find(p => p.id === platformId);
        if (platformInfo && url) {
          detectedPlatforms.push({
            ...platformInfo,
            url: url as string,
          });
          detectedPlatformIds.push(platformId);
        }
      });
      
      // Auto-expand all detected platforms
      setExpandedPlatforms(new Set(detectedPlatformIds));
      
      // Use functional update to avoid stale closure
      setFormData(prev => ({
        ...prev,
        title: title,
        artistName: track.artistName || '',
        slug: autoSlug,
        coverArtUrl: track.coverArtUrl || '',
        releaseDate: track.releaseDate || '',
        selectedPlatforms: detectedPlatforms,
      }));
      
      toast({
        title: "Auto-Fill Complete!",
        description: data.message || `Found your song on ${data.platformCount} platforms`,
      });
      
      // Mark step 1 complete and move to next
      markStepComplete('1');
      setCurrentStep('2');
    },
    onError: (error: any) => {
      setDetectionSuccess(false);
      toast({
        title: "Detection Failed",
        description: error.message || "Could not detect track. Please try again or enter details manually.",
        variant: "destructive",
      });
    },
  });

  const markStepComplete = (step: string) => {
    setCompletedSteps(prev => {
      if (!prev.includes(step)) {
        return [...prev, step];
      }
      return prev;
    });
  };

  // Check if form is ready for submission
  const isFormComplete = formData.title && formData.artistName && formData.slug;

  const savePageMutation = useMutation({
    mutationFn: async () => {
      // Validate required fields before submission
      if (!formData.slug || formData.slug.trim() === '') {
        throw new Error('URL slug is required. Please go back and enter a URL slug.');
      }
      if (!formData.title || formData.title.trim() === '') {
        throw new Error('Track title is required. Please go back and enter a title.');
      }
      if (!formData.artistName || formData.artistName.trim() === '') {
        throw new Error('Artist name is required. Please go back and enter an artist name.');
      }
      
      const pageData = {
        slug: formData.slug.trim(),
        title: formData.title.trim(),
        bio: '',
        backgroundColor: formData.backgroundColor,
        textColor: formData.textColor,
        gtmContainerId: formData.gtmContainerId,
        pageType: 'smart-link',
        artistName: formData.artistName.trim(),
        releaseDate: formData.releaseDate,
        coverArtUrl: formData.coverArtUrl,
      };

      if (isEditMode && editPageId) {
        // Update existing page
        return apiRequest('PATCH', `/api/link-page/${editPageId}`, pageData);
      } else {
        // Create new page
        return apiRequest('POST', '/api/link-page', pageData);
      }
    },
    onSuccess: async (page: any) => {
      const pageId = isEditMode && editPageId ? editPageId : page.id;
      
      if (isEditMode && existingLinks) {
        // Delete old links first when editing
        for (const oldLink of existingLinks) {
          try {
            await apiRequest('DELETE', `/api/links/${oldLink.id}`);
          } catch (e) {
            // Ignore errors if link already deleted
          }
        }
      }
      
      // Create new links
      for (const platform of formData.selectedPlatforms) {
        if (platform.url) {
          await apiRequest('POST', '/api/links', {
            linkPageId: pageId,
            title: platform.name,
            url: platform.url,
            icon: platform.id,
            linkType: 'streaming',
            streamingPlatform: platform.id,
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/link-pages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/link-pages', editPageId] });
      queryClient.invalidateQueries({ queryKey: ['/api/links', editPageId] });
      
      toast({ 
        title: "Success!", 
        description: isEditMode ? "Your smart link has been updated" : "Your smart link has been created" 
      });
      setLocation('/dashboard');
    },
    onError: (error) => {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    },
  });

  const handlePlatformToggle = (platform: typeof allStreamingPlatforms[0]) => {
    const existing = formData.selectedPlatforms.find(p => p.id === platform.id);
    if (existing) {
      // If already selected, just toggle expand/collapse
      togglePlatformExpand(platform.id);
    } else {
      // Add platform, pre-fill with source URL if it's spotify and we have a detect URL
      let prefillUrl = '';
      if (platform.id === 'spotify' && detectUrl) {
        prefillUrl = detectUrl;
      }
      setFormData(prev => ({
        ...prev,
        selectedPlatforms: [...prev.selectedPlatforms, { ...platform, url: prefillUrl }]
      }));
      // Auto-expand when adding
      setExpandedPlatforms(prev => {
        const newSet = new Set(prev);
        newSet.add(platform.id);
        return newSet;
      });
    }
  };

  const removePlatform = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.filter(p => p.id !== platformId)
    }));
    setExpandedPlatforms(prev => {
      const newSet = new Set(prev);
      newSet.delete(platformId);
      return newSet;
    });
  };

  const togglePlatformExpand = (platformId: string) => {
    setExpandedPlatforms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(platformId)) {
        newSet.delete(platformId);
      } else {
        newSet.add(platformId);
      }
      return newSet;
    });
  };

  const updatePlatformUrl = (platformId: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.map(p => 
        p.id === platformId ? { ...p, url } : p
      )
    }));
  };

  const isPlatformSelected = (platformId: string) => {
    return formData.selectedPlatforms.some(p => p.id === platformId);
  };

  const getPlatformUrl = (platformId: string) => {
    return formData.selectedPlatforms.find(p => p.id === platformId)?.url || '';
  };

  // Show loading state when fetching existing data in edit mode
  if (editPageId && (isLoadingPage || isLoadingLinks)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading page data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setLocation('/dashboard')}
                data-testid="button-back-to-dashboard"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold">{isEditMode ? 'EDIT SMART LINK' : 'CREATE SMART LINK'}</h1>
            </div>

            <Accordion 
              type="single" 
              collapsible 
              value={currentStep}
              onValueChange={setCurrentStep}
              className="space-y-2"
            >
              <AccordionItem value="1" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${completedSteps.includes('1') ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary'}`}>
                      {completedSteps.includes('1') ? <Check className="w-4 h-4" /> : '1'}
                    </div>
                    <span className="font-medium">Auto-Detect Track</span>
                  </div>
                  {completedSteps.includes('1') && <Check className="w-5 h-5 text-green-500 ml-auto mr-2" />}
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 text-primary">
                      <Wand2 className="w-5 h-5" />
                      <span className="font-medium">Magic Auto-Fill</span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Enter any Spotify track or album URL and we'll automatically find your song on 7+ platforms
                    </p>
                    
                    <div className="space-y-3">
                      <Label htmlFor="detect-url">Spotify Track/Album URL</Label>
                      <Input
                        id="detect-url"
                        placeholder="https://open.spotify.com/track/..."
                        value={detectUrl}
                        onChange={(e) => setDetectUrl(e.target.value)}
                        disabled={detectTrackMutation.isPending}
                        data-testid="input-detect-url"
                        className="text-base"
                      />
                    </div>
                    
                    <Button 
                      onClick={() => detectTrackMutation.mutate(detectUrl)}
                      disabled={!detectUrl || detectTrackMutation.isPending}
                      className="w-full h-12 text-base font-semibold"
                      data-testid="button-detect-track"
                    >
                      {detectTrackMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Detecting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Detect & Auto-Fill
                        </>
                      )}
                    </Button>
                    
                    {detectionSuccess && (
                      <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">Track detected! Form auto-filled with your song info.</span>
                      </div>
                    )}
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        markStepComplete('1');
                        setCurrentStep('2');
                      }}
                      className="w-full"
                      data-testid="button-skip-detection"
                    >
                      Skip - Enter details manually
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="2" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${completedSteps.includes('2') ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary'}`}>
                      {completedSteps.includes('2') ? <Check className="w-4 h-4" /> : '2'}
                    </div>
                    <span className="font-medium">Genre</span>
                  </div>
                  {completedSteps.includes('2') && <Check className="w-5 h-5 text-green-500 ml-auto mr-2" />}
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Select your music genre</p>
                    <div className="flex flex-wrap gap-2">
                      {genres.map((genre) => (
                        <Button
                          key={genre}
                          variant={formData.genre === genre ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, genre }));
                            markStepComplete('2');
                            setCurrentStep('3');
                          }}
                        >
                          {genre}
                        </Button>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="3" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${completedSteps.includes('3') ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary'}`}>
                      {completedSteps.includes('3') ? <Check className="w-4 h-4" /> : '3'}
                    </div>
                    <span className="font-medium">Title</span>
                  </div>
                  {completedSteps.includes('3') && <Check className="w-5 h-5 text-green-500 ml-auto mr-2" />}
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className={titleStepErrors.title ? 'text-destructive' : ''}>
                        Track Title {titleStepErrors.title && <span className="text-destructive">*Required</span>}
                      </Label>
                      <Input
                        placeholder="Enter title..."
                        value={formData.title}
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          // Auto-generate slug from title (replace spaces with hyphens)
                          const autoSlug = newTitle
                            .toLowerCase()
                            .replace(/[^a-z0-9\s-]/g, '')
                            .replace(/\s+/g, '-')
                            .substring(0, 50);
                          setFormData(prev => ({ ...prev, title: newTitle, slug: autoSlug }));
                          if (newTitle) setTitleStepErrors(prev => ({ ...prev, title: false, slug: false }));
                        }}
                        className={titleStepErrors.title ? 'border-destructive' : ''}
                        data-testid="input-track-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={titleStepErrors.artistName ? 'text-destructive' : ''}>
                        Artist Name {titleStepErrors.artistName && <span className="text-destructive">*Required</span>}
                      </Label>
                      <Input
                        placeholder="Enter artist name..."
                        value={formData.artistName}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, artistName: e.target.value }));
                          if (e.target.value) setTitleStepErrors(prev => ({ ...prev, artistName: false }));
                        }}
                        className={titleStepErrors.artistName ? 'border-destructive' : ''}
                        data-testid="input-artist-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={titleStepErrors.slug ? 'text-destructive' : ''}>
                        URL Slug {titleStepErrors.slug && <span className="text-destructive">*Required</span>}
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{getDisplayDomain()}/</span>
                        <Input
                          placeholder="your-track-name"
                          value={formData.slug}
                          onChange={(e) => {
                            const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                            setFormData(prev => ({ ...prev, slug }));
                            if (slug) setTitleStepErrors(prev => ({ ...prev, slug: false }));
                          }}
                          className={titleStepErrors.slug ? 'border-destructive' : ''}
                          data-testid="input-slug"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        // Show validation errors for empty fields
                        const errors = {
                          title: !formData.title,
                          artistName: !formData.artistName,
                          slug: !formData.slug,
                        };
                        setTitleStepErrors(errors);
                        
                        if (formData.title && formData.artistName && formData.slug) {
                          markStepComplete('3');
                          setCurrentStep('4');
                        } else {
                          toast({
                            title: "Missing Required Fields",
                            description: "Please fill in all required fields before continuing.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="4" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${completedSteps.includes('4') ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary'}`}>
                      {completedSteps.includes('4') ? <Check className="w-4 h-4" /> : '4'}
                    </div>
                    <span className="font-medium">Design</span>
                  </div>
                  {completedSteps.includes('4') && <Check className="w-5 h-5 text-green-500 ml-auto mr-2" />}
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Cover Art</Label>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed">
                          {formData.coverArtUrl ? (
                            <img src={formData.coverArtUrl} alt="Cover" className="w-full h-full object-cover" />
                          ) : (
                            <Upload className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="cover-upload"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 500 * 1024) {
                                toast({ title: "Error", description: "File too large. Max 500KB allowed.", variant: "destructive" });
                                return;
                              }
                              const formDataUpload = new FormData();
                              formDataUpload.append('image', file);
                              try {
                                const response = await fetch('/api/upload', {
                                  method: 'POST',
                                  body: formDataUpload,
                                  credentials: 'include',
                                });
                                if (!response.ok) throw new Error('Upload failed');
                                const { url } = await response.json();
                                setFormData(prev => ({ ...prev, coverArtUrl: url }));
                              } catch (error) {
                                toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('cover-upload')?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Cover Art
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.backgroundColor}
                            onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={formData.backgroundColor}
                            onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Text Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.textColor}
                            onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={formData.textColor}
                            onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => { markStepComplete('4'); setCurrentStep('5'); }}>
                      Next
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="5" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${completedSteps.includes('5') ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary'}`}>
                      {completedSteps.includes('5') ? <Check className="w-4 h-4" /> : '5'}
                    </div>
                    <span className="font-medium">Links</span>
                  </div>
                  {completedSteps.includes('5') && <Check className="w-5 h-5 text-green-500 ml-auto mr-2" />}
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Add links to your music on any store and platform</p>
                    
                    <div className="space-y-3">
                      {/* Expanded platforms - full width */}
                      {allStreamingPlatforms.filter(p => isPlatformSelected(p.id) && expandedPlatforms.has(p.id)).map((platform) => {
                        const platformUrl = getPlatformUrl(platform.id);
                        
                        return (
                          <div key={platform.id} className="border rounded-lg overflow-hidden bg-card">
                            <div className="flex items-center justify-between p-3 border-b">
                              <div className="flex items-center gap-2">
                                <platform.icon className="w-5 h-5" style={{ color: platform.color }} />
                                <span className="font-medium">{platform.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => removePlatform(platform.id)}
                                  className="p-1 hover:bg-muted rounded"
                                  data-testid={`button-remove-${platform.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                                </button>
                                <Check className="w-5 h-5 text-green-500" />
                              </div>
                            </div>
                            <div className="p-3 space-y-3">
                              <div className="relative">
                                <Input
                                  placeholder={`https://${platform.id === 'apple_music' ? 'music.apple' : platform.id}.com/...`}
                                  value={platformUrl}
                                  onChange={(e) => updatePlatformUrl(platform.id, e.target.value)}
                                  className="pr-10"
                                  data-testid={`input-url-${platform.id}`}
                                />
                                {platformUrl && (
                                  <a 
                                    href={platformUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                              
                              <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between py-2 border-t">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <input type="checkbox" disabled className="rounded" />
                                    <span>Show "save" option</span>
                                    <span className="text-muted-foreground/50 text-xs">ⓘ</span>
                                  </div>
                                  <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> UNLOCK
                                  </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-t">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <input type="checkbox" disabled className="rounded" />
                                    <span>Capture email address when fans save this title</span>
                                  </div>
                                  <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> UNLOCK
                                  </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-t">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <input type="checkbox" disabled className="rounded" />
                                    <span>Show "add to playlist" option</span>
                                    <span className="text-muted-foreground/50 text-xs">ⓘ</span>
                                  </div>
                                  <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> UNLOCK
                                  </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-t">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <input type="checkbox" disabled className="rounded" />
                                    <span>Add fans to profiles or playlists</span>
                                    <span className="text-muted-foreground/50 text-xs">ⓘ</span>
                                  </div>
                                  <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> UNLOCK
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Collapsed platforms - 2-column grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {allStreamingPlatforms.filter(p => !(isPlatformSelected(p.id) && expandedPlatforms.has(p.id))).map((platform) => {
                          const isSelected = isPlatformSelected(platform.id);
                          
                          return (
                            <button
                              key={platform.id}
                              onClick={() => handlePlatformToggle(platform)}
                              className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                                isSelected ? 'bg-muted/30' : ''
                              }`}
                              data-testid={`platform-${platform.id}`}
                            >
                              <div className="flex items-center gap-2">
                                <platform.icon className="w-5 h-5" style={{ color: platform.color }} />
                                <span className="text-sm">{platform.name}</span>
                              </div>
                              {isSelected ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Plus className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => { 
                        const hasUrls = formData.selectedPlatforms.some(p => p.url);
                        if (hasUrls) {
                          markStepComplete('5'); 
                          setCurrentStep('6'); 
                        }
                      }}
                      disabled={!formData.selectedPlatforms.some(p => p.url)}
                    >
                      Next
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="6" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${completedSteps.includes('6') ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary'}`}>
                      {completedSteps.includes('6') ? <Check className="w-4 h-4" /> : '6'}
                    </div>
                    <span className="font-medium">Release settings</span>
                  </div>
                  {completedSteps.includes('6') && <Check className="w-5 h-5 text-green-500 ml-auto mr-2" />}
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Release Date (optional)</Label>
                      <Input
                        type="date"
                        value={formData.releaseDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                        data-testid="input-release-date"
                      />
                    </div>
                    <Button onClick={() => { markStepComplete('6'); setCurrentStep('7'); }}>
                      Next
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="7" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${completedSteps.includes('7') ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary'}`}>
                      {completedSteps.includes('7') ? <Check className="w-4 h-4" /> : '7'}
                    </div>
                    <span className="font-medium">Audio preview</span>
                  </div>
                  {completedSteps.includes('7') && <Check className="w-5 h-5 text-green-500 ml-auto mr-2" />}
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Preview Audio URL (optional)</Label>
                      <Input
                        placeholder="https://..."
                        value={formData.previewUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, previewUrl: e.target.value }))}
                        data-testid="input-preview-url"
                      />
                      <p className="text-xs text-muted-foreground">Add a link to a preview audio file</p>
                    </div>
                    <Button onClick={() => { markStepComplete('7'); setCurrentStep('8'); }}>
                      Next
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="8" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${completedSteps.includes('8') ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary'}`}>
                      {completedSteps.includes('8') ? <Check className="w-4 h-4" /> : '8'}
                    </div>
                    <span className="font-medium">{t.dashboard.smartLinkWizard.gtmStep}</span>
                  </div>
                  {completedSteps.includes('8') && <Check className="w-5 h-5 text-green-500 ml-auto mr-2" />}
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t.dashboard.smartLinkWizard.gtmLabel}</Label>
                      <Input
                        placeholder={t.dashboard.smartLinkWizard.gtmPlaceholder}
                        value={formData.gtmContainerId}
                        onChange={(e) => setFormData(prev => ({ ...prev, gtmContainerId: e.target.value }))}
                        data-testid="input-gtm-container"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t.dashboard.smartLinkWizard.gtmHelperText}
                      </p>
                    </div>
                    <Button onClick={() => { markStepComplete('8'); setCurrentStep('9'); }}>
                      Next
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="9" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${completedSteps.includes('9') ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary'}`}>
                      {completedSteps.includes('9') ? <Check className="w-4 h-4" /> : '9'}
                    </div>
                    <span className="font-medium">Confirmation</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Title:</span>
                        <span className="font-medium">{formData.title || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Artist:</span>
                        <span className="font-medium">{formData.artistName || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Genre:</span>
                        <span className="font-medium">{formData.genre || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platforms:</span>
                        <span className="font-medium">{formData.selectedPlatforms.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">URL:</span>
                        <span className="font-medium">{getDisplayDomain()}/{formData.slug || '-'}</span>
                      </div>
                    </div>
                    {!isFormComplete && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium text-destructive mb-2">Please complete the following required fields:</p>
                        <ul className="text-sm text-destructive list-disc list-inside space-y-1">
                          {!formData.title && <li>Track / Album Title (Step 3)</li>}
                          {!formData.artistName && <li>Artist Name (Step 3)</li>}
                          {!formData.slug && <li>URL Slug (Step 3)</li>}
                        </ul>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3"
                          onClick={() => setCurrentStep('3')}
                        >
                          Go to Step 3 - Title
                        </Button>
                      </div>
                    )}
                    <Button 
                      className="w-full"
                      onClick={() => savePageMutation.mutate()}
                      disabled={savePageMutation.isPending || !isFormComplete}
                      data-testid={isEditMode ? "button-update-smart-link" : "button-create-smart-link"}
                    >
                      {savePageMutation.isPending 
                        ? (isEditMode ? 'Updating...' : 'Creating...') 
                        : (isEditMode ? 'Update Smart Link' : 'Create Smart Link')}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        <div className="hidden lg:flex w-[400px] bg-muted/30 border-l items-center justify-center p-8">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-6">Preview</h3>
            <div className="relative mx-auto" style={{ width: '280px', height: '560px' }}>
              <div className="absolute inset-0 rounded-[40px] border-8 border-gray-800 bg-gray-800 overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-gray-800 rounded-b-xl z-10" />
                <div 
                  className="h-full w-full overflow-hidden flex flex-col"
                  style={{ backgroundColor: formData.backgroundColor }}
                >
                  <div className="flex-1 flex flex-col items-center justify-start pt-12 px-4">
                    <div className="w-32 h-32 rounded-lg overflow-hidden mb-4 bg-gray-700/50">
                      {formData.coverArtUrl ? (
                        <img src={formData.coverArtUrl} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-12 h-12 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <h4 
                      className="text-lg font-bold mb-1 text-center"
                      style={{ color: formData.textColor }}
                    >
                      {formData.title || 'Track Title'}
                    </h4>
                    <p 
                      className="text-sm opacity-80 mb-6"
                      style={{ color: formData.textColor }}
                    >
                      {formData.artistName || 'Artist Name'}
                    </p>
                    <div className="w-full space-y-2">
                      {(formData.selectedPlatforms.length > 0 ? formData.selectedPlatforms.slice(0, 4) : [
                        { id: 'spotify', name: 'Spotify', icon: SiSpotify, color: '#1DB954' },
                        { id: 'apple_music', name: 'Apple Music', icon: SiApple, color: '#FA243C' },
                        { id: 'soundcloud', name: 'SoundCloud', icon: SiSoundcloud, color: '#FF5500' },
                      ]).map((platform) => (
                        <div 
                          key={platform.id}
                          className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <platform.icon className="w-4 h-4" style={{ color: platform.color }} />
                            <span className="text-sm" style={{ color: formData.textColor }}>{platform.name}</span>
                          </div>
                          <Button size="sm" variant="outline" className="h-7 text-xs bg-white text-black hover:bg-gray-100">
                            Play
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

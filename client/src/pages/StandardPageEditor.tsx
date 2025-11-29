import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ArrowLeft, Save, Loader2, Link as LinkIcon } from 'lucide-react';
import { SiFacebook, SiInstagram, SiTiktok, SiYoutube } from 'react-icons/si';

interface LinkPage {
  id: string;
  userId: string;
  slug: string;
  title: string;
  bio?: string | null;
  avatarUrl?: string | null;
  backgroundColor: string;
  textColor: string;
  gtmContainerId?: string | null;
  pageType: string;
  websiteUrl?: string | null;
  socialLinks?: {
    facebook?: string;
    youtube?: string;
    instagram?: string;
    tiktok?: string;
    custom?: string;
  } | null;
}

interface StandardPageEditorProps {
  editPageId: string;
}

export default function StandardPageEditor({ editPageId }: StandardPageEditorProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    bio: '',
    websiteUrl: '',
    backgroundColor: '#FF6600',
    textColor: '#FFFFFF',
    gtmContainerId: '',
    socialLinks: {
      facebook: '',
      youtube: '',
      instagram: '',
      tiktok: '',
      custom: '',
    },
  });

  const { data: existingPage, isLoading } = useQuery<LinkPage>({
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

  useEffect(() => {
    if (existingPage) {
      setFormData({
        slug: existingPage.slug || '',
        title: existingPage.title || '',
        bio: existingPage.bio || '',
        websiteUrl: existingPage.websiteUrl || '',
        backgroundColor: existingPage.backgroundColor || '#FF6600',
        textColor: existingPage.textColor || '#FFFFFF',
        gtmContainerId: existingPage.gtmContainerId || '',
        socialLinks: {
          facebook: existingPage.socialLinks?.facebook || '',
          youtube: existingPage.socialLinks?.youtube || '',
          instagram: existingPage.socialLinks?.instagram || '',
          tiktok: existingPage.socialLinks?.tiktok || '',
          custom: existingPage.socialLinks?.custom || '',
        },
      });
    }
  }, [existingPage]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('PATCH', `/api/link-page/${editPageId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/link-pages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/link-pages', editPageId] });
      toast({ title: "Success", description: "Page updated successfully!" });
      setLocation('/dashboard');
    },
    onError: (error) => {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/dashboard')} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">{t.dashboard.pages.edit} Page</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Page Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="slug">Your URL</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{getDisplayDomain()}/</span>
                  <Input
                    id="slug"
                    placeholder="yourname"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    data-testid="input-edit-slug"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Display Name</Label>
                <Input
                  id="title"
                  placeholder="Your Name"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  data-testid="input-edit-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell people about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  data-testid="input-edit-bio"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website</Label>
                <Input
                  id="websiteUrl"
                  placeholder="https://yourwebsite.com"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  data-testid="input-edit-website"
                />
              </div>

              <div className="space-y-3">
                <Label>Social Media Links</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center text-[#1877F2]">
                      <SiFacebook className="w-5 h-5" />
                    </div>
                    <Input
                      placeholder="Facebook Page URL"
                      value={formData.socialLinks.facebook}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        socialLinks: { ...formData.socialLinks, facebook: e.target.value }
                      })}
                      data-testid="input-edit-facebook"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center text-[#FF0000]">
                      <SiYoutube className="w-5 h-5" />
                    </div>
                    <Input
                      placeholder="YouTube Channel URL"
                      value={formData.socialLinks.youtube}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        socialLinks: { ...formData.socialLinks, youtube: e.target.value }
                      })}
                      data-testid="input-edit-youtube"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center text-[#E4405F]">
                      <SiInstagram className="w-5 h-5" />
                    </div>
                    <Input
                      placeholder="Instagram Profile URL"
                      value={formData.socialLinks.instagram}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                      })}
                      data-testid="input-edit-instagram"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center text-foreground">
                      <SiTiktok className="w-5 h-5" />
                    </div>
                    <Input
                      placeholder="TikTok Profile URL"
                      value={formData.socialLinks.tiktok}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        socialLinks: { ...formData.socialLinks, tiktok: e.target.value }
                      })}
                      data-testid="input-edit-tiktok"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center text-muted-foreground">
                      <LinkIcon className="w-5 h-5" />
                    </div>
                    <Input
                      placeholder="Custom Link URL"
                      value={formData.socialLinks.custom}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        socialLinks: { ...formData.socialLinks, custom: e.target.value }
                      })}
                      data-testid="input-edit-custom"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bgColor">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="bgColor"
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="flex-1"
                      data-testid="input-edit-bgcolor"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="textColor">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={formData.textColor}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={formData.textColor}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      className="flex-1"
                      data-testid="input-edit-textcolor"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gtm">Google Tag Manager ID (optional)</Label>
                <Input
                  id="gtm"
                  placeholder="GTM-XXXXXXX"
                  value={formData.gtmContainerId}
                  onChange={(e) => setFormData({ ...formData, gtmContainerId: e.target.value })}
                  data-testid="input-edit-gtm"
                />
                <p className="text-xs text-muted-foreground">
                  Enable remarketing by adding your GTM Container ID
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/dashboard')}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1 bg-[#FF6600] hover:bg-[#FF6600]/90"
                  data-testid="button-save"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

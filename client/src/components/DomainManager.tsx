import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
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
  Globe, 
  Check, 
  X, 
  Copy, 
  Loader2, 
  ExternalLink,
  Trash2,
  Plus,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import type { LinkPage } from '@shared/schema';

interface DomainMapping {
  id: string;
  linkPageId: string;
  domainType: 'subdomain' | 'custom';
  hostname: string;
  verificationStatus: 'pending' | 'verifying' | 'verified' | 'failed';
  verificationToken: string | null;
  lastCheckedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface DnsInstructions {
  cnameRecord: {
    type: string;
    name: string;
    value: string;
    ttl: string;
  };
  txtRecord: {
    type: string;
    name: string;
    value: string;
    ttl: string;
  };
}

interface DomainManagerProps {
  page: LinkPage;
}

export function DomainManager({ page }: DomainManagerProps) {
  const { toast } = useToast();
  const [subdomain, setSubdomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [showDnsModal, setShowDnsModal] = useState(false);
  const [dnsInstructions, setDnsInstructions] = useState<DnsInstructions | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<DomainMapping | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const { data: domains = [], isLoading } = useQuery<DomainMapping[]>({
    queryKey: ['/api/domains', page.id],
    queryFn: async () => {
      const res = await fetch(`/api/domains/${page.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch domains');
      return res.json();
    },
  });

  const createSubdomainMutation = useMutation({
    mutationFn: async (data: { pageId: string; subdomain: string }) => {
      return apiRequest('POST', '/api/domains/subdomain', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/domains', page.id] });
      toast({ title: "Success", description: "Subdomain claimed successfully!" });
      setSubdomain('');
    },
    onError: (error) => {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    },
  });

  const createCustomDomainMutation = useMutation({
    mutationFn: async (data: { pageId: string; hostname: string }) => {
      const res = await apiRequest('POST', '/api/domains/custom', data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/domains', page.id] });
      setDnsInstructions(data.dnsInstructions);
      setSelectedDomain(data.domain);
      setShowDnsModal(true);
      setCustomDomain('');
    },
    onError: (error) => {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    },
  });

  const verifyDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const res = await apiRequest('POST', `/api/domains/${domainId}/verify`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/domains', page.id] });
      if (data.verified) {
        toast({ title: "Success", description: "Domain verified and connected!" });
        setShowDnsModal(false);
      } else {
        toast({ 
          title: "Not Verified Yet", 
          description: "DNS records not found. Please wait a few minutes and try again.",
          variant: "destructive" 
        });
      }
    },
    onError: (error) => {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      return apiRequest('DELETE', `/api/domains/${domainId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/domains', page.id] });
      toast({ title: "Success", description: "Domain removed" });
    },
    onError: (error) => {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    },
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast({ description: `${label} copied to clipboard` });
  };

  const getStatusBadge = (status: DomainMapping['verificationStatus']) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" /> Connected</Badge>;
      case 'verifying':
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Verifying</Badge>;
      case 'failed':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" /> Not Connected</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const subdomains = domains.filter(d => d.domainType === 'subdomain');
  const customDomains = domains.filter(d => d.domainType === 'custom');

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Globe className="w-5 h-5" />
            Your Domain
          </CardTitle>
          <CardDescription>
            Set up a custom URL for your page "{page.title}"
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="subdomain" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="subdomain">Free Subdomain</TabsTrigger>
              <TabsTrigger value="custom">Your Own Domain</TabsTrigger>
            </TabsList>

            <TabsContent value="subdomain" className="space-y-4 mt-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Choose your free subdomain</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center">
                      <Input
                        id="subdomain"
                        placeholder="yourname"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="rounded-r-none"
                        data-testid="input-subdomain"
                      />
                      <span className="px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-l-0 rounded-r-md text-sm text-gray-600 dark:text-gray-300">
                        .hubisck.com
                      </span>
                    </div>
                    <Button
                      onClick={() => createSubdomainMutation.mutate({ pageId: page.id, subdomain })}
                      disabled={!subdomain || subdomain.length < 3 || createSubdomainMutation.isPending}
                      data-testid="button-claim-subdomain"
                    >
                      {createSubdomainMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Claim
                        </>
                      )}
                    </Button>
                  </div>
                  {subdomain && (
                    <p className="text-sm text-gray-500">
                      Preview: <span className="font-medium text-primary">{subdomain}.hubisck.com</span>
                    </p>
                  )}
                </div>

                {subdomains.length > 0 && (
                  <div className="pt-4 border-t space-y-2">
                    <Label>Your Subdomains</Label>
                    {subdomains.map((domain) => (
                      <div key={domain.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Globe className="w-4 h-4 text-primary" />
                          <a 
                            href={`https://${domain.hostname}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium hover:text-primary flex items-center gap-1"
                          >
                            {domain.hostname}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(domain.verificationStatus)}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy(`https://${domain.hostname}`, 'URL')}
                          >
                            {copied === 'URL' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Subdomain?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will disconnect {domain.hostname} from your page.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteDomainMutation.mutate(domain.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4 mt-4">
              <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20 space-y-4">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Globe className="w-5 h-5" />
                  Premium Feature
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-domain">Your own domain</Label>
                  <div className="flex gap-2">
                    <Input
                      id="custom-domain"
                      placeholder="mymusic.com or www.mybrand.com"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
                      data-testid="input-custom-domain"
                    />
                    <Button
                      onClick={() => createCustomDomainMutation.mutate({ pageId: page.id, hostname: customDomain })}
                      disabled={!customDomain || createCustomDomainMutation.isPending}
                      data-testid="button-connect-domain"
                    >
                      {createCustomDomainMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Connect Domain'
                      )}
                    </Button>
                  </div>
                </div>

                {customDomains.length > 0 && (
                  <div className="pt-4 border-t border-primary/20 space-y-2">
                    <Label>Your Custom Domains</Label>
                    {customDomains.map((domain) => (
                      <div key={domain.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Globe className="w-4 h-4 text-primary" />
                          <span className="font-medium">{domain.hostname}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(domain.verificationStatus)}
                          {domain.verificationStatus !== 'verified' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDomain(domain);
                                setDnsInstructions({
                                  cnameRecord: {
                                    type: 'CNAME',
                                    name: '@',
                                    value: window.location.host,
                                    ttl: 'Auto or 3600',
                                  },
                                  txtRecord: {
                                    type: 'TXT',
                                    name: '_hubisck-verify',
                                    value: domain.verificationToken || '',
                                    ttl: 'Auto or 3600',
                                  },
                                });
                                setShowDnsModal(true);
                              }}
                              data-testid={`button-verify-${domain.id}`}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Verify
                            </Button>
                          )}
                          {domain.verificationStatus === 'verified' && (
                            <a 
                              href={`https://${domain.hostname}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="icon">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </a>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Domain?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will disconnect {domain.hostname} from your page.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteDomainMutation.mutate(domain.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showDnsModal} onOpenChange={setShowDnsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Connect your own domain in 2 minutes
            </DialogTitle>
          </DialogHeader>
          
          {dnsInstructions && selectedDomain && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">1</span>
                  Go to your domain provider
                </h4>
                <p className="text-sm text-gray-500 ml-8">
                  Hostinger, GoDaddy, Namecheap, Cloudflare, or wherever you registered your domain.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">2</span>
                  Add these DNS records
                </h4>
                
                <div className="ml-8 space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">CNAME Record</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCopy(`${dnsInstructions.cnameRecord.name}\t${dnsInstructions.cnameRecord.value}`, 'CNAME')}
                      >
                        {copied === 'CNAME' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <p className="font-mono font-medium">{dnsInstructions.cnameRecord.type}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <p className="font-mono font-medium">{dnsInstructions.cnameRecord.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Value:</span>
                        <p className="font-mono font-medium break-all">{dnsInstructions.cnameRecord.value}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">TXT Record (for verification)</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCopy(`${dnsInstructions.txtRecord.name}\t${dnsInstructions.txtRecord.value}`, 'TXT')}
                      >
                        {copied === 'TXT' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <p className="font-mono font-medium">{dnsInstructions.txtRecord.type}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <p className="font-mono font-medium">{dnsInstructions.txtRecord.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Value:</span>
                        <p className="font-mono font-medium break-all">{dnsInstructions.txtRecord.value}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Tip:</strong> If your provider doesn't accept CNAME on root domain (@), use an A record pointing to the IP address of our servers, or use a subdomain like www.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">3</span>
                  Click to verify
                </h4>
                <p className="text-sm text-gray-500 ml-8">
                  After adding the DNS records, click the button below. DNS changes can take up to 24 hours to propagate.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline">I'll do this later</Button>
            </DialogClose>
            <Button 
              onClick={() => selectedDomain && verifyDomainMutation.mutate(selectedDomain.id)}
              disabled={verifyDomainMutation.isPending}
              data-testid="button-verify-dns"
            >
              {verifyDomainMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying DNS...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  I've added the records - Verify now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, Globe, CheckCircle2, XCircle, AlertCircle, Copy, RefreshCw, Trash2 } from 'lucide-react';

interface DomainStatus {
  customDomain: string | null;
  customDomainVerified: boolean;
  customDomainVerifiedAt: string | null;
  verificationToken: string | null;
}

interface ConnectResponse {
  success: boolean;
  domain: string;
  verified: boolean;
  verificationToken: string;
  dnsRecords: {
    txtRecord: {
      type: string;
      host: string;
      value: string;
      description: string;
    };
    cnameRecord: {
      type: string;
      host: string;
      value: string;
      description: string;
    } | null;
    aRecord: {
      type: string;
      host: string;
      value: string;
      description: string;
    } | null;
  };
  instructions: string;
}

interface VerifyResponse {
  success: boolean;
  verified: boolean;
  txtVerified?: boolean;
  domain: string;
  message: string;
}

export default function CustomDomainSettings() {
  const { toast } = useToast();
  const [domain, setDomain] = useState('');
  const [dnsRecords, setDnsRecords] = useState<ConnectResponse['dnsRecords'] | null>(null);

  const { data: domainStatus, isLoading } = useQuery<DomainStatus>({
    queryKey: ['/api/account/domains/status'],
  });

  const connectMutation = useMutation({
    mutationFn: async (domain: string) => {
      const res = await apiRequest('POST', '/api/account/domains/connect', { domain });
      return res.json() as Promise<ConnectResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/account/domains/status'] });
      setDnsRecords(data.dnsRecords);
      toast({ 
        title: "Domain connected", 
        description: "Follow the DNS instructions below to verify your domain." 
      });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: (error as Error).message, 
        variant: "destructive" 
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/account/domains/verify', {});
      return res.json() as Promise<VerifyResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/account/domains/status'] });
      if (data.verified) {
        toast({ 
          title: "Domain verified!", 
          description: "Your custom domain is now active." 
        });
        setDnsRecords(null);
      } else {
        toast({ 
          title: "Verification pending", 
          description: data.message,
          variant: "default"
        });
      }
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: (error as Error).message, 
        variant: "destructive" 
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', '/api/account/domains/remove');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account/domains/status'] });
      setDnsRecords(null);
      setDomain('');
      toast({ 
        title: "Domain removed", 
        description: "Your custom domain has been removed." 
      });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: (error as Error).message, 
        variant: "destructive" 
      });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard` });
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (domain.trim()) {
      connectMutation.mutate(domain.trim());
    }
  };

  // Auto-verify every 30 seconds when domain is pending verification
  useEffect(() => {
    if (domainStatus?.customDomain && !domainStatus.customDomainVerified) {
      const interval = setInterval(() => {
        verifyMutation.mutate();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [domainStatus?.customDomain, domainStatus?.customDomainVerified]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasCustomDomain = !!domainStatus?.customDomain;
  const isVerified = domainStatus?.customDomainVerified;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-[#FF6600]" />
          <div>
            <CardTitle>Custom Domain</CardTitle>
            <CardDescription>
              Use your own domain for all your pages
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasCustomDomain ? (
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Your Domain</Label>
              <div className="flex gap-2">
                <Input
                  id="domain"
                  placeholder="mysite.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value.toLowerCase().replace(/^https?:\/\//, ''))}
                  className="flex-1"
                  data-testid="input-custom-domain"
                />
                <Button 
                  type="submit" 
                  disabled={connectMutation.isPending || !domain.trim()}
                  className="bg-[#FF6600] hover:bg-[#FF6600]/90"
                  data-testid="button-connect-domain"
                >
                  {connectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Connect Domain'
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your domain without https:// (e.g., mysite.com or links.mysite.com)
              </p>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5" />
                <div>
                  <p className="font-medium">{domainStatus.customDomain}</p>
                  <p className="text-sm text-muted-foreground">
                    {isVerified 
                      ? 'Your links will appear as: ' 
                      : 'Pending verification'}
                    {isVerified && (
                      <span className="text-[#FF6600]">
                        https://{domainStatus.customDomain}/your-slug
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isVerified ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </div>
            </div>

            {!isVerified && (
              <>
                <div className="space-y-3">
                  <h4 className="font-medium">DNS Configuration Required</h4>
                  <p className="text-sm text-muted-foreground">
                    Add the following DNS records to your domain provider to verify ownership:
                  </p>

                  <div className="space-y-3">
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">TXT Record</Badge>
                        <span className="text-xs text-muted-foreground">Required for verification</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Host:</span>
                          <code className="bg-muted px-2 py-0.5 rounded text-xs">
                            _hubisck-verify.{domainStatus.customDomain}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(`_hubisck-verify.${domainStatus.customDomain}`, 'Host')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Value:</span>
                          <code className="bg-muted px-2 py-0.5 rounded text-xs max-w-[200px] truncate">
                            {domainStatus.verificationToken}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(domainStatus.verificationToken || '', 'Value')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {domainStatus.customDomain && domainStatus.customDomain.split('.').length === 2 ? (
                      <div className="p-3 bg-muted/30 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">A Record</Badge>
                          <span className="text-xs text-muted-foreground">For root domains</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Host:</span>
                            <code className="bg-muted px-2 py-0.5 rounded text-xs">@</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard('@', 'Host')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Value:</span>
                            <code className="bg-muted px-2 py-0.5 rounded text-xs">76.76.21.21</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard('76.76.21.21', 'IP')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-muted/30 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">CNAME Record</Badge>
                          <span className="text-xs text-muted-foreground">For subdomains</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Host:</span>
                            <code className="bg-muted px-2 py-0.5 rounded text-xs">
                              {domainStatus.customDomain?.split('.')[0]}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(domainStatus.customDomain?.split('.')[0] || '', 'Host')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Value:</span>
                            <code className="bg-muted px-2 py-0.5 rounded text-xs">hubisck.com</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard('hubisck.com', 'CNAME')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    DNS changes can take up to 24-48 hours to propagate. We'll automatically check every 30 seconds.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => verifyMutation.mutate()}
                    disabled={verifyMutation.isPending}
                    className="bg-[#FF6600] hover:bg-[#FF6600]/90"
                    data-testid="button-verify-domain"
                  >
                    {verifyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Verify Now
                  </Button>
                </div>
              </>
            )}

            <Button
              variant="outline"
              onClick={() => removeMutation.mutate()}
              disabled={removeMutation.isPending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              data-testid="button-remove-domain"
            >
              {removeMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Remove Domain
            </Button>
          </div>
        )}

        {!hasCustomDomain && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Benefits of Custom Domain</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Professional branding with your own domain</li>
              <li>• All your pages use your custom domain automatically</li>
              <li>• Build trust with your audience</li>
              <li>• Full SSL/HTTPS security included</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

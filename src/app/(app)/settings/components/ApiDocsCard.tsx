// src/components/setting/ApiDocsCard.tsx
'use client';

import { useEffect, useState } from 'react';
import { Code, ExternalLink, Copy, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

type ApiDocsCardProps = {
  userRole?: string;
};

export default function ApiDocsCard({ userRole }: ApiDocsCardProps) {
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const origin = window.location.origin.replace(/\/$/, '');
      setApiBaseUrl(`${origin}/api`);
    }
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch {
        /* noop */
      }
    }
  };

  const openApiDocs = () => {
    if (typeof window !== 'undefined') {
      window.open('/api/docs', '_blank', 'noopener,noreferrer');
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <Card className="glass card-hover text-left">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Developer Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-24 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Documentation */}
      <Card className="glass card-hover text-left">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Developer Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Base URL Section */}
          <div className="space-y-4">
            <Label className="text-base font-medium">API Base URL</Label>
            <div className="flex items-center gap-2">
              <Input value={apiBaseUrl} readOnly className="font-mono text-sm bg-muted" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(apiBaseUrl)}
                title="Copy URL"
                aria-label="Copy URL"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="secondary" onClick={openApiDocs} title="View Docs">
                <ExternalLink className="h-4 w-4 ml-2" />
                API Docs
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Use this base URL for all API requests.
            </p>
          </div>

          {/* Developer Resources */}
          <div className="p-4 border rounded-lg space-y-3">
            <h4 className="font-medium">Technical Specs</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between items-center py-2 border-b last:border-b-0">
                <span>Authentication</span>
                <span className="text-muted-foreground">Bearer Token</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b last:border-b-0">
                <span>Response Format</span>
                <span className="text-muted-foreground">JSON</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b last:border-b-0">
                <span>API Version</span>
                <span className="text-muted-foreground">v1</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span>Rate Limit</span>
                <span className="text-muted-foreground">1000/hour</span>
              </div>
            </div>
          </div>

          {/* Quick API Examples */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <h4 className="font-medium text-sm">Quick Examples</h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 bg-background rounded border">
                <span className="text-muted-foreground">GET</span>{' '}
                <span className="text-blue-600">/api/users/me</span>
              </div>
              <div className="p-2 bg-background rounded border">
                <span className="text-muted-foreground">GET</span>{' '}
                <span className="text-blue-600">/api/users/me/uploads</span>
              </div>
              <div className="p-2 bg-background rounded border">
                <span className="text-muted-foreground">POST</span>{' '}
                <span className="text-green-600">/api/users/me/change-password</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Upload Access (if admin) */}
      {userRole === 'admin' && (
        <Card className="glass card-hover border-yellow-500/50 text-left">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-500/10 rounded-lg">
              <h4 className="font-medium mb-2">Admin Upload Page</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Use the admin panel to upload audio and cover images.
              </p>
              <Button asChild className="btn-gradient">
                <Link href="/upload">
                  <ExternalLink className="h-4 w-4 ml-2" />
                  Go to Upload Panel
                </Link>
              </Button>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Upload audio files (MP3, WAV, FLAC)</p>
              <p>• Upload cover images (JPG, PNG)</p>
              <p>• Manage song metadata</p>
              <p>• Advanced upload settings</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

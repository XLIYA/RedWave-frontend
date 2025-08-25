// src/components/setting/AdminCtaCard.tsx
import { Crown, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function AdminCtaCard() {
  return (
    <Card className="glass card-hover border-yellow-500/50 text-left">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          Admin Upload Center
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Use the dedicated admin panel to upload audio and cover images.
        </p>
        <Button asChild className="btn-gradient">
          <Link href="/upload">
            <ExternalLink className="h-4 w-4 ml-2" />
            Go to Upload Panel
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

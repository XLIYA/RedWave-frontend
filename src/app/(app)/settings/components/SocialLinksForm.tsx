// src/components/setting/SocialLinksForm.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Save, Camera, Instagram, Send, Twitter, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { api } from '@/lib/api'

const profileSchema = z.object({
  bio: z.string().max(500).optional(),
  profileImage: z.string().url().optional().or(z.literal('')),
  socialLinks: z
    .object({
      instagram: z.string().optional(),
      telegram: z.string().optional(),
      twitter: z.string().optional(),
      website: z.string().url().optional().or(z.literal(''))
    })
    .optional()
})

interface SocialLinksFormProps {
  profile: any
  onUpdate: (profile: any) => void
  onMessage: (message: string, isError?: boolean) => void
}

export function SocialLinksForm({ profile, onUpdate, onMessage }: SocialLinksFormProps) {
  const [saving, setSaving] = useState(false)

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: profile.bio || '',
      profileImage: profile.profileImage || '',
      socialLinks: {
        instagram: profile.socialLinks?.instagram || '',
        telegram: profile.socialLinks?.telegram || '',
        twitter: profile.socialLinks?.twitter || '',
        website: profile.socialLinks?.website || ''
      }
    }
  })

  const validateAndFormatSocialLink = (platform: string, value: string) => {
    if (!value) return ''
    switch (platform) {
      case 'instagram':
      case 'telegram':
      case 'twitter':
        return value.startsWith('@') ? value : `@${value}`
      case 'website':
        if (!value.startsWith('http://') && !value.startsWith('https://')) {
          return `https://${value}`
        }
        return value
      default:
        return value
    }
  }

  const handleSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      setSaving(true)

      const formattedSocialLinks = Object.entries(data.socialLinks || {}).reduce((acc, [key, value]) => {
        if (value) {
          acc[key] = validateAndFormatSocialLink(key, value as string)
        }
        return acc
      }, {} as Record<string, string>)

      const updateData = {
        bio: data.bio?.trim() || null,
        profileImage: data.profileImage?.trim() || null,
        socialLinks: Object.keys(formattedSocialLinks).length > 0 ? formattedSocialLinks : null
      }

      const updated = await api.updateMe(updateData)
      onUpdate(updated)
      onMessage('Profile updated successfully')
    } catch (error) {
      onMessage('Failed to update profile', true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card className="glass card-hover text-left">
          <CardHeader>
            <CardTitle>Profile Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={form.watch('profileImage') || undefined} />
                <AvatarFallback className="text-xl font-bold">
                  {profile.username?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2 flex-1">
                <FormField
                  control={form.control}
                  name="profileImage"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Profile image URL</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input placeholder="https://example.com/image.jpg" {...field} />
                          <Button variant="outline" size="icon" type="button">
                            <Camera className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Basic Info */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={profile.username} disabled className="bg-muted" />
                <p className="text-sm text-muted-foreground">Username cannot be changed.</p>
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell something about yourself..." {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Social Links */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Social Networks</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="socialLinks.instagram"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        Instagram
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="@username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="socialLinks.telegram"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Telegram
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="@username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="socialLinks.twitter"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" />
                        Twitter
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="@username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="socialLinks.website"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Website
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="btn-gradient">
                {saving ? 'Saving...' : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}

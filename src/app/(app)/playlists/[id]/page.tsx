export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

import type { Metadata } from 'next';
import PlaylistDetailClient from './PlaylistDetailClient';

type Params = { id: string };

export default async function Page({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  return <PlaylistDetailClient id={id} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Playlist • ${id}` };
}

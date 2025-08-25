export async function getFeed(token: string) {
  const res = await fetch('/api/feed', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load feed');
  return res.json();
}



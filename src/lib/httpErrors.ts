export function toFriendlyError(status: number, raw?: string) {
  if (status === 401) return 'Please sign in.';
  if (status === 403) return 'You don’t have permission to perform this action.';
  if (status === 413) return 'File too large for upload.';
  return raw || 'Something went wrong. Please try again.';
}



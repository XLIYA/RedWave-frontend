export const FF = {
  // turn on via NEXT_PUBLIC_FEATURE_* envs if ever needed
  related: process.env.NEXT_PUBLIC_FEATURE_RELATED === '1',
  queue: process.env.NEXT_PUBLIC_FEATURE_QUEUE === '1',
  history: process.env.NEXT_PUBLIC_FEATURE_HISTORY === '1',
  export: process.env.NEXT_PUBLIC_FEATURE_EXPORT === '1',
  backup: process.env.NEXT_PUBLIC_FEATURE_BACKUP === '1',
  recommendations: process.env.NEXT_PUBLIC_FEATURE_RECOMMENDATIONS === '1',
} as const;



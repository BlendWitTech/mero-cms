import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function usePageLoading() {
  const router = useRouter();

  const push = useCallback(
    async (href: string) => {
      // Show loading bar by triggering page navigation
      router.push(href);
    },
    [router]
  );

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return { push, refresh };
}

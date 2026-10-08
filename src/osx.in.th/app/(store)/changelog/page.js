'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChangelogPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
}

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          router.push('/');
        }
      } catch (error) {
        console.error('Session check error:', error);
        router.push('/');
      }
    };
    checkSession();
  }, [router]);

  return <>{children}</>;
}

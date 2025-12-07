'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking session...');
        const { data } = await supabase.auth.getSession();
        console.log('Session data:', data);
        if (data.session) {
          console.log('User logged in, redirecting to /projects');
          router.push('/projects');
        } else {
          console.log('No session found');
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };
    checkSession();
  }, [router]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
      }}
    >
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '12px' }}>
          Immo DSCR Copilot
        </h1>
        <p>Chargement…</p>
      </div>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function AppPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Vérifie la session dès l'arrivée sur la page
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        // Pas de session => retour à la page d'auth
        router.push('/');
        return;
      }

      setUserEmail(data.session.user.email ?? null);
      setChecking(false);
    };

    checkSession();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <p>Vérification de la session…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div>
          <h1 className="text-lg font-semibold">Simulateur de projets immobiliers</h1>
          <p className="text-xs text-slate-400">
            Connecté en tant que {userEmail}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs px-3 py-1 rounded-full border border-slate-600 hover:bg-slate-800"
        >
          Déconnexion
        </button>
      </header>

      <section className="p-6">
        <div className="border border-slate-800 rounded-2xl p-4">
          <p className="text-sm text-slate-300">
            Ici viendra ton simulateur DSCR et tout le cockpit financier.
          </p>
        </div>
      </section>
    </main>
  );
}

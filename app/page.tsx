'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

// On définie les deux modes possibles : inscription ou connexion
type Mode = 'signin' | 'signup';

export default function AuthPage() {
  const router = useRouter();

  // État de la page (mode, champs, erreurs, etc.)
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Si l'utilisateur est déjà connecté, on le renvoie vers /app automatiquement
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push('/app');
      }
    };
    checkSession();
  }, [router]);

  // Gestion du submit (bouton principal)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'signup') {
        // Création de compte
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split('@')[0],
            },
          },
        });

        if (error) throw error;

        // Selon la config Supabase, il peut y avoir un mail de confirmation
        // Pour l'instant, on redirige directement vers /app
        router.push('/app');
      } else {
        // Connexion
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push('/app');
      }
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
      <div className="w-full max-w-md border border-slate-800 rounded-2xl p-6 shadow-xl bg-slate-900/80">
        <h1 className="text-2xl font-semibold mb-1 text-center">
          THE Immo App
        </h1>
        <p className="text-xs text-slate-400 mb-6 text-center">
          Crée ton compte pour tester si ton projet immobilier tient la route.
        </p>

        {/* Boutons de switch entre inscription et connexion */}
        <div className="flex mb-6 rounded-xl bg-slate-800 p-1">
          <button
            type="button"
            className={`flex-1 py-2 rounded-xl text-sm ${
              mode === 'signup' ? 'bg-slate-50 text-slate-900' : 'text-slate-300'
            }`}
            onClick={() => setMode('signup')}
          >
            Créer un compte
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-xl text-sm ${
              mode === 'signin' ? 'bg-slate-50 text-slate-900' : 'text-slate-300'
            }`}
            onClick={() => setMode('signin')}
          >
            Se connecter
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Nom complet</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Optionnel"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm text-slate-300">Email</label>
            <input
              type="email"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-300">Mot de passe</label>
            <input
              type="password"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl py-2 text-sm font-medium bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Traitement en cours…'
              : mode === 'signup'
              ? 'Créer mon compte'
              : 'Me connecter'}
          </button>
        </form>

        <p className="mt-4 text-[10px] text-slate-500 text-center">
          Cette version est en beta : tu es officiellement cobaye fondateur.
        </p>
      </div>
    </main>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { parseNumber, calculateMonthlyPayment, calculateDSCR, getDSCRMessage } from '../../../lib/calculations';

type Project = {
  id: string;
  name: string | null;
  postal_code: string | null;
  description: string | null;
  price: number | null;
  notary_fees: number | null;
  works: number | null;
  loan_rate: number | null;
  loan_years: number | null;
  insurance: number | null;
  brokerage_fees: number | null;
  monthly_expenses: number | null;
  monthly_payment: number | null;
};

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  // Auto-save
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [hasLoaded, setHasLoaded] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string | null>(null);

  // Bloc 3 – DSCR
  const [loyerMensuel, setLoyerMensuel] = useState('');
  const [chargesMensuelles, setChargesMensuelles] = useState('');
  const [dscr, setDscr] = useState<number | null>(null);
  const [dscrMessage, setDscrMessage] = useState<string | null>(null);

  // Chargement du projet
  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error || !data) {
        console.error(error);
        setErrorMsg("Impossible de charger ce projet.");
        setLoading(false);
        return;
      }

      setProject(data as Project);
      setLoading(false);
      setHasLoaded(true);
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  // Calcul des mensualités en fonction du prix + coûts + taux + durée
  const computeMonthlyPayment = () => {
    if (!project) return 0;

    const principal =
      parseNumber(project.price) +
      parseNumber(project.notary_fees) +
      parseNumber(project.works) +
      parseNumber(project.brokerage_fees);

    const years = project.loan_years ?? 0;
    const rate = project.loan_rate ?? 0;

    return calculateMonthlyPayment(principal, rate, years);
  };

  const handleRecomputeMonthly = () => {
    if (!project) return;
    const mensualite = computeMonthlyPayment();
    const monthlyExpenses =
      mensualite > 0 ? mensualite * 0.1 : parseNumber(project.monthly_expenses);

    setProject({
      ...project,
      monthly_payment: mensualite,
      monthly_expenses: monthlyExpenses,
    });
  };

  // === SAUVEGARDE EN BASE (utilisée par le bouton + l'auto-save) ===
  const saveProject = async (): Promise<boolean> => {
    if (!project) return false;
    setAutoSaveStatus('saving');
    setErrorMsg(null);

    const { id, ...rest } = project;

    // Get current user id from client session
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setErrorMsg('Utilisateur non connecté');
      setAutoSaveStatus('error');
      return false;
    }

    const res = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, updates: rest }),
    });

    if (!res.ok) {
      console.error(await res.json());
      setErrorMsg("Erreur lors de l'enregistrement du projet.");
      setAutoSaveStatus('error');
      return false;
    }
    setAutoSaveStatus('saved');
    return true;
  };

  // Auto-save avec délai (debounce) sur toute modification du projet
  useEffect(() => {
    if (!hasLoaded || !project) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // debounce 3s
    saveTimeoutRef.current = setTimeout(async () => {
      // avoid saving if nothing changed compared to last saved
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = project as Project;
      const payload = JSON.stringify(rest);
      if (lastSavedRef.current === payload) {
        setAutoSaveStatus('idle');
        return;
      }

      const ok = await saveProject();
      if (ok) {
        lastSavedRef.current = payload;
      }
    }, 3000); // 3 secondes après la dernière frappe

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [project, hasLoaded]); // chaque modif relance le timer

  const handleManualSave = async () => {
    await saveProject();
  };

  // Suppression du projet
  const handleDelete = async () => {
    if (!project) return;
    const confirmDelete = window.confirm(
      'Tu confirmes la suppression définitive de ce projet ?'
    );
    if (!confirmDelete) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setErrorMsg('Utilisateur non connecté');
      return;
    }

    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });

    if (!res.ok) {
      console.error(await res.json());
      setErrorMsg("Erreur lors de la suppression du projet.");
      return;
    }

    router.push('/app');
  };

  const handleFieldChange = (
    field: Exclude<keyof Project, 'id' | 'name' | 'postal_code' | 'description'>,
    value: string
  ) => {
    if (!project) return;
    setProject({
      ...project,
      [field]: value === '' ? null : parseFloat(value.replace(',', '.')) || 0,
    });
  };

  const handleTextFieldChange = (
    field: 'name' | 'postal_code' | 'description',
    value: string
  ) => {
    if (!project) return;
    setProject({
      ...project,
      [field]: value,
    });
  };

  const handleCalculateDSCR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    const loyer = parseNumber(loyerMensuel);
    const charges = parseNumber(chargesMensuelles);
    const mensualite = project.monthly_payment ?? 0;

    if (mensualite <= 0) {
      setDscrMessage("La mensualité de crédit doit être renseignée/calculée.");
      setDscr(null);
      return;
    }

    const value = calculateDSCR(loyer, charges, mensualite);
    setDscr(value);
    setDscrMessage(getDSCRMessage(value));
  };

  if (loading || !project) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Chargement du projet…</p>
      </main>
    );
  }

  const renderAutoSaveLabel = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return 'Enregistrement…';
      case 'saved':
        return 'Modifications enregistrées';
      case 'error':
        return 'Erreur de sauvegarde';
      default:
        return '';
    }
  };

  return (
    <main style={{ minHeight: '100vh', padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
        <button onClick={() => router.push('/app')}>
          ← Retour aux projets
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#555' }}>
            {renderAutoSaveLabel()}
          </span>
          <button onClick={handleManualSave}>
            Sauvegarder maintenant
          </button>
          <button
            onClick={handleDelete}
            style={{ backgroundColor: '#fce4e4', border: '1px solid #f44336', color: '#b71c1c' }}
          >
            Supprimer ce projet
          </button>
        </div>
      </div>

      <h1 style={{ fontSize: '26px', marginBottom: '16px' }}>
        Projet : {project.name || 'Sans nom'}
      </h1>

      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

      {/* BLOC 1 – Le projet */}
      <section style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Bloc 1 – Le projet</h2>

        <div style={{ marginBottom: '8px' }}>
          <label>Nom du projet</label>
          <input
            type="text"
            value={project.name ?? ''}
            onChange={(e) => handleTextFieldChange('name', e.target.value)}
            style={{ display: 'block', width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label>Code postal</label>
          <input
            type="text"
            value={project.postal_code ?? ''}
            onChange={(e) => handleTextFieldChange('postal_code', e.target.value)}
            style={{ display: 'block', width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label>Descriptif</label>
          <textarea
            value={project.description ?? ''}
            onChange={(e) => handleTextFieldChange('description', e.target.value)}
            style={{ display: 'block', width: '100%', minHeight: '60px' }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label>Prix (€)</label>
          <input
            type="text"
            value={project.price ?? ''}
            onChange={(e) => handleFieldChange('price', e.target.value)}
            style={{ display: 'block', width: '100%' }}
          />
        </div>
      </section>

      {/* BLOC 2 – Coûts & financement */}
      <section style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Bloc 2 – Coûts & financement</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label>Frais de notaire (€)</label>
            <input
              type="text"
              value={project.notary_fees ?? ''}
              onChange={(e) => handleFieldChange('notary_fees', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label>Travaux (optionnel) (€)</label>
            <input
              type="text"
              value={project.works ?? ''}
              onChange={(e) => handleFieldChange('works', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label>Taux du prêt (% annuel)</label>
            <input
              type="text"
              value={project.loan_rate ?? ''}
              onChange={(e) => handleFieldChange('loan_rate', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label>Durée du prêt (années)</label>
            <input
              type="text"
              value={project.loan_years ?? ''}
              onChange={(e) => handleFieldChange('loan_years', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label>Assurance (€/mois)</label>
            <input
              type="text"
              value={project.insurance ?? ''}
              onChange={(e) => handleFieldChange('insurance', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label>Frais de courtage (€)</label>
            <input
              type="text"
              value={project.brokerage_fees ?? ''}
              onChange={(e) => handleFieldChange('brokerage_fees', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label>Mensualité de crédit (calculée) (€)</label>
            <input
              type="text"
              value={project.monthly_payment ?? ''}
              readOnly
              style={{ width: '100%', backgroundColor: '#f5f5f5' }}
            />
          </div>
          <div>
            <label>Frais mensuels hors crédit (€)</label>
            <input
              type="text"
              value={project.monthly_expenses ?? ''}
              onChange={(e) => handleFieldChange('monthly_expenses', e.target.value)}
              style={{ width: '100%' }}
            />
            <small>Par défaut ~10% de la mensualité.</small>
          </div>
        </div>

        <button type="button" onClick={handleRecomputeMonthly} style={{ marginTop: '12px' }}>
          Recalculer la mensualité et les frais mensuels
        </button>
      </section>

      {/* BLOC 3 – DSCR */}
      <section style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Bloc 3 – Capacité de remboursement (DSCR)</h2>

        <form onSubmit={handleCalculateDSCR}>
          <div style={{ marginBottom: '8px' }}>
            <label>Loyers mensuels attendus (€)</label>
            <input
              type="text"
              value={loyerMensuel}
              onChange={(e) => setLoyerMensuel(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label>Charges mensuelles du bien (hors crédit) (€)</label>
            <input
              type="text"
              value={chargesMensuelles}
              onChange={(e) => setChargesMensuelles(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <button type="submit">
            Calculer le DSCR
          </button>
        </form>

        {dscr !== null && (
          <div style={{ marginTop: '12px' }}>
            <p>DSCR estimé : <strong>{dscr.toFixed(2)}</strong></p>
            {dscrMessage && <p>{dscrMessage}</p>}
          </div>
        )}
      </section>
    </main>
  );
}

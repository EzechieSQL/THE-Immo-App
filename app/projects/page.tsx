'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Project {
  id: string;
  name: string;
  postal_code: string | null;
  price: number | null;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;

        if (!user) {
          router.push('/');
          return;
        }

        setUserEmail(user.email || '');

        const { data, error } = await supabase
          .from('projects')
          .select('id, name, postal_code, price')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading projects:', error);
          return;
        }

        setProjects(data || []);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleCreateProject = async () => {
    setCreatingProject(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.push('/');
        return;
      }

      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const body = await res.json();
      if (!res.ok) {
        console.error(body);
        setCreatingProject(false);
        return;
      }

      router.push(`/projects/${body.id}`);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    const confirmDelete = window.confirm(
      'Tu confirmes la suppression définitive de ce projet ?'
    );
    if (!confirmDelete) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;

    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });

    if (!res.ok) {
      console.error(await res.json());
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  if (loadingProjects) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p>Chargement des projets…</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '24px' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            Tableau de bord – Projets immobiliers
          </h1>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>
            Connecté en tant que {userEmail}
          </p>
        </div>
        <button type="button" onClick={handleLogout}>
          Déconnexion
        </button>
      </header>

      <section>
        <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>Mes projets</h2>

        {loadingProjects ? (
          <p>Chargement des projets…</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '16px',
              marginTop: '12px',
            }}
          >
            {/* Carte pour créer un nouveau projet */}
            <button
              type="button"
              onClick={handleCreateProject}
              disabled={creatingProject}
              style={{
                padding: '16px',
                border: '1px dashed #999',
                borderRadius: '8px',
                background: '#fafafa',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>＋</div>
              <div style={{ fontSize: '14px' }}>
                {creatingProject
                  ? 'Création en cours…'
                  : 'Créer un nouveau projet'}
              </div>
            </button>

            {/* Liste des projets existants */}
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                style={{
                  padding: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: '#fff',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDeleteProject(project.id);
                    }}
                    style={{
                      fontSize: '11px',
                      padding: '4px 6px',
                      backgroundColor: '#fce4e4',
                      border: '1px solid #f44336',
                      color: '#b71c1c',
                      borderRadius: '4px',
                    }}
                  >
                    Supprimer
                  </button>
                </div>

                <h3 style={{ fontSize: '16px', margin: '0 0 8px' }}>
                  {project.name || 'Projet sans nom'}
                </h3>
                <p style={{ fontSize: '12px', margin: '0 0 4px' }}>
                  {project.postal_code
                    ? `Code postal : ${project.postal_code}`
                    : 'Code postal non renseigné'}
                </p>
                <p style={{ fontSize: '12px', margin: 0 }}>
                  {project.price != null
                    ? `Prix : ${project.price} €`
                    : 'Prix non renseigné'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

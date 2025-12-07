# THE-Immo-App — Simulateur immobilier avec copilote IA

Application Next.js 14 + Supabase pour simuler et analyser la rentabilité de projets immobiliers.

## 🚀 Démarrage rapide

### Installation

```bash
npm install
```

### Configuration des variables d'environnement

1. Crée un fichier `.env.local` à la racine du projet :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

- `NEXT_PUBLIC_SUPABASE_URL` : URL publique de ton instance Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Clé publique d'authentification (visible au client)
- `SUPABASE_SERVICE_ROLE_KEY` : Clé serveur avec droits étendus (server-only, **ne jamais exposer**)

### Lancer en développement

```bash
npm run dev
```

Puis ouvre http://localhost:3000 dans ton navigateur.

### Build pour production

```bash
npm run build
npm run start
```

## 📋 Fonctionnalités principales

- **Gestion des projets** : créer, modifier, supprimer des projets immobiliers
- **Calculs financiers** : mensualité de crédit, charges, frais
- **Analyse DSCR** : Debt Service Coverage Ratio pour évaluer la capacité de remboursement
- **Authentification Supabase** : connexion sécurisée via email/mot de passe
- **Auto-save** : sauvegarde automatique des modifications (debounce 3s)

## 🔐 Sécurité

### Row Level Security (RLS)

Les opérations sensibles (create/update/delete) utilisent une clé serveur (`SUPABASE_SERVICE_ROLE_KEY`) qui valide l'**ownership** côté serveur.

**À faire** : appliquer les policies RLS dans Supabase :

1. Ouvre le Supabase Dashboard → SQL Editor
2. Copie et exécute le contenu de `sql/rls_projects.sql`

```sql
-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- SELECT: public projects OR owner
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT
  USING (is_public = true OR auth.uid() = owner_id);

-- INSERT: only if owner matches auth.uid()
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- UPDATE/DELETE: owner only
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE
  USING (auth.uid() = owner_id);
```

### Secrets en production

- **Vercel** : Settings → Environment Variables → ajoute `SUPABASE_SERVICE_ROLE_KEY`
- **GitHub Actions** : Repository Secrets → ajoute `SUPABASE_SERVICE_ROLE_KEY`
- **Netlify** : Build & deploy → Environment → ajoute la clé

## 🧪 Tests

Les fonctions de calcul (mensualité, DSCR) sont testées avec Jest :

```bash
npm run test
npm run test:watch     # mode watch
```

### Fichiers de test

- `lib/calculations.test.ts` : Tests des calculs financiers (mensualité, DSCR)

### Exemple de test

```typescript
describe('calculateMonthlyPayment', () => {
  it('should calculate monthly payment with basic values', () => {
    // Loan: 250,000€ at 3.5% for 25 years
    const payment = calculateMonthlyPayment(250000, 3.5, 25);
    expect(payment).toBeCloseTo(1189.33, 1); // ~1189€/month
  });
});
```

## 🛠️ Outils de développement

### Linting & Formatting

```bash
npm run lint              # Vérifier avec ESLint
npm run format            # Formater avec Prettier
```

### Build & Compilation

```bash
npm run build             # Build Next.js complet
npx tsc --noEmit          # Vérifier TypeScript strict
```

## 📂 Structure du projet

```
/app
  ├── layout.tsx              # Root layout
  ├── page.tsx                # Auth + Tableau de bord
  ├── projects/
  │   ├── [id]/page.tsx       # Détail & édition d'un projet
  │   └── list-client.tsx     # Client component pour la liste
  ├── api/
  │   └── projects/
  │       ├── create/route.ts # POST /api/projects/create
  │       └── [id]/route.ts   # PATCH/DELETE /api/projects/[id]
  └── globals.css             # Tailwind + styles globaux

/lib
  ├── supabaseClient.ts       # Client public (côté client)
  ├── supabaseServer.ts       # Client serveur (côté API routes)
  ├── calculations.ts         # Fonctions de calcul financier
  └── calculations.test.ts    # Tests Jest

/sql
  └── rls_projects.sql        # Policies Row Level Security

/public
  # Assets statiques

.github/workflows/
  └── ci.yml                  # GitHub Actions CI
```

## 🔄 API Routes

### POST `/api/projects/create`

Créer un nouveau projet.

```bash
curl -X POST http://localhost:3000/api/projects/create \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-uuid"}'
```

Réponse :
```json
{"id": "project-uuid"}
```

### PATCH `/api/projects/[id]`

Mettre à jour un projet (server-validated).

```bash
curl -X PATCH http://localhost:3000/api/projects/abc123 \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-uuid", "updates": {"name": "Nouveau nom"}}'
```

### DELETE `/api/projects/[id]`

Supprimer un projet (owner-only).

```bash
curl -X DELETE http://localhost:3000/api/projects/abc123 \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-uuid"}'
```

## 📖 Calculs financiers

### Mensualité de crédit

Formule d'amortissement standard :

$$M = P \times \frac{r}{1 - (1 + r)^{-n}}$$

Où :
- $M$ = Mensualité
- $P$ = Principal (montant emprunté)
- $r$ = Taux mensuel ($\text{taux annuel} / 12 / 100$)
- $n$ = Nombre de mois

Exemple : 250 000€ à 3.5% sur 25 ans → ~1 189€/mois

### DSCR (Debt Service Coverage Ratio)

$$\text{DSCR} = \frac{\text{NOI annuel}}{\text{Service de la dette annuelle}}$$

Où :
- NOI = Revenu locatif − Charges (hors crédit)
- Service de la dette = Mensualité de crédit × 12

Interprétation :
- **DSCR < 1** : Le projet ne couvre pas sa dette (risqué)
- **1 ≤ DSCR < 1.2** : Faible marge de sécurité
- **DSCR ≥ 1.2** : Confortable

## 🚢 Déploiement

### Vercel (recommandé)

1. Push ton code sur GitHub
2. Connecte le repo à Vercel (https://vercel.com/new)
3. Ajoute les variables d'environnement dans **Settings → Environment Variables**
4. Deploy !

### Netlify

1. Connecte le repo (https://app.netlify.com)
2. Build command : `npm run build`
3. Publish directory : `.next`
4. Ajoute les env vars dans **Build & deploy → Environment**

## 📝 Notes

- TypeScript `strict` activé → tous les types sont vérifiés
- ESLint + Prettier configurés → utilise `npm run format` avant commit
- CI/CD automatique via GitHub Actions (lint + build sur PR)
- Debounce auto-save 3s → pas de requête inutile si rien n'a changé

## 🤝 Contribution

1. Fork le repo
2. Crée une branche (`git checkout -b feature/ma-feature`)
3. Commit (`git commit -am 'Add feature'`)
4. Push (`git push origin feature/ma-feature`)
5. Ouvre une PR

## 📄 Licence

Propriétaire (voir `LICENSE`)

---

**Besoin d'aide ?**

- Consulte `README_SUPABASE.md` pour plus de détails sur Supabase
- Vérifie les logs : `npm run dev` affiche les erreurs détaillées
- Teste les calculs : `npm run test`

# Supabase — Instructions rapides

Ce fichier explique comment appliquer les policies RLS et configurer la clé `SUPABASE_SERVICE_ROLE_KEY` en toute sécurité.

1) Appliquer les policies RLS
- Ouvre le Supabase Dashboard → SQL Editor
- Copie le contenu de `sql/rls_projects.sql` et exécute-le (teste d'abord sur staging)

2) Stocker la clé `service_role` dans les secrets de déploiement
- Ne partage jamais la `service_role` dans le frontend ni dans un repo public.
- Dans Vercel : Settings → Environment Variables → add `SUPABASE_SERVICE_ROLE_KEY` (Environment: Production, Preview, Development as needed).
- Dans GitHub Actions / Netlify : ajoute la clé dans les Secrets (Repository Secrets).

3) Variables d'environnement locales
- Crée un fichier `.env.local` (ne pas commit) avec :
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # server-only
```

4) Rotation et sécurité
- Si tu exposes accidentellement une `service_role`, révoque-la immédiatement depuis Supabase Dashboard → Settings → API → rotate keys.
- Préfère créer un projet de staging pour tests lorsque tu dois partager des accès.

5) Notes pour CI
- Assure-toi que `SUPABASE_SERVICE_ROLE_KEY` est défini dans les secrets du runner (GitHub Actions / Vercel) pour que les routes server utilisent la clé server-side.

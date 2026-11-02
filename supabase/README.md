# Supabase

Le site parle **directement** à Supabase (bibliothèque `@supabase/supabase-js`), sans serveur
intermédiaire. Rien n'est à déployer côté Supabase quand on modifie le site.

## Mise en place (une seule fois)

1. **Règles d'accès** : copier le contenu de `connexion-directe.sql` dans
   Supabase > SQL Editor > New query, puis « Run ».
   - tout le monde peut lire le contenu du site ;
   - seul le compte admin peut le modifier ;
   - les visiteurs peuvent seulement incrémenter les compteurs de visite.
2. **Compte admin** : Supabase > Authentication > Users > Add user > Create new user,
   avec l'email indiqué dans `connexion-directe.sql` (traorericealiman@gmail.com),
   un mot de passe, et « Auto Confirm User » coché.
3. (Conseillé) Authentication > Sign In / Providers > Email : désactiver
   « Allow new users to sign up », pour que personne d'autre ne puisse créer de compte.

## Variables du site (`MonPorfolio/.env` et Vercel)

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

La clé « publishable » est faite pour être visible dans le navigateur : ce sont les règles
d'accès de la base qui protègent les données.

## Et si on change la structure d'une table ?

C'est rare (ex. ajouter une colonne). Dans ce cas, coller le petit script SQL fourni dans
le SQL Editor, comme à l'étape 1. Le dossier `migrations/` garde l'historique des changements passés.

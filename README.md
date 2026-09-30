# JS Dottignies — Collecte des informations joueurs

Application statique compatible **GitHub Pages** avec **Firebase Firestore + Firebase Storage + Firebase Authentication**.

## Fonctions

### Formulaire joueur
- Équipe
- Nom et prénom
- Adresse
- E-mail
- Téléphone
- Téléphone d'urgence 1
- Téléphone d'urgence 2
- Case « certificat médical remis au coach »
- Si non remis : ajout obligatoire du certificat en PDF / JPG / PNG / WEBP
- Confirmation de l'envoi

### Espace administrateur
- Connexion par code administrateur uniquement
- Liste de toutes les fiches
- Filtre par équipe
- Recherche par nom / e-mail / téléphone
- Modification des données
- Statut du certificat
- Cotisation : non réglée / partielle / totale
- Suppression d'une fiche
- Export Excel `.xlsx`
- Le filtre actif est respecté lors de l'export

---

# Installation Firebase

## 1. Créer le projet
1. Aller sur Firebase Console.
2. Créer un projet, par exemple `js-dottignies-joueurs`.
3. Ajouter une application **Web**.

## 2. Configurer le site
Ouvrir `firebase-config.js` et remplacer toutes les valeurs `A_REMPLACER` par la configuration fournie par Firebase.

Modifier également :
```js
export const ADMIN_EMAIL = "secretariat@jsdottignies.be";
```

## 3. Firestore
Dans Firebase :
1. Build > Firestore Database
2. Créer la base
3. Copier le contenu de `firestore.rules`
4. Remplacer dans les règles `secretariat@jsdottignies.be` par le même e-mail admin
5. Publier

## 4. Storage
Dans Firebase :
1. Build > Storage
2. Activer Storage
3. Copier le contenu de `storage.rules`
4. Remplacer `secretariat@jsdottignies.be` par le même e-mail admin
5. Publier

## 5. Authentication
Dans Firebase :
1. Build > Authentication
2. Sign-in method
3. Activer **Email/Password**
4. Onglet Users > Add user
5. Créer l'utilisateur administrateur avec exactement l'e-mail défini dans `firebase-config.js`

Ne crée aucun bouton d'inscription publique.

---

# Mise en ligne sur GitHub Pages

1. Créer un repository GitHub, par exemple `jsdottignies-joueurs`
2. Déposer tous les fichiers du dossier à la racine du repository
3. GitHub > Settings > Pages
4. Source : `Deploy from a branch`
5. Branch : `main` / `(root)`
6. Enregistrer
7. GitHub donnera l'adresse publique du formulaire

Le lien à envoyer aux joueurs est l'adresse `index.html`.
L'espace admin est `admin.html`.

---

# Important — données personnelles

Cette application collecte des données personnelles et des certificats médicaux.

À prévoir côté club :
- accès admin limité aux personnes autorisées ;
- durée de conservation définie ;
- suppression des anciens certificats et fiches devenus inutiles ;
- information des joueurs / parents sur l'utilisation de leurs données ;
- ne pas partager le lien admin et ne pas réutiliser le mot de passe.

Pour une utilisation réelle, remplace impérativement l'adresse admin dans les deux fichiers de règles **et** dans `firebase-config.js`.

## Remarque
La suppression d'une fiche joueur supprime la fiche Firestore mais ne supprime pas automatiquement le fichier certificat dans Storage. Cette version privilégie une installation simple sans serveur. Les anciens fichiers peuvent être supprimés depuis Firebase Storage, ou via une Cloud Function dans une version avancée.


## Accès administrateur simplifié

L'écran admin demande uniquement un code. En arrière-plan, Firebase Authentication utilise le compte :

`secretariat@jsdottignies.be`

Le mot de passe Firebase de ce compte doit être exactement le code administrateur choisi :

`JS7711`

Si le mot de passe Firebase de cet utilisateur est différent, l'accès admin ne fonctionnera pas.


## Identité visuelle
Le logo officiel `logo-js-dottignies.png` est inclus et intégré dans l'interface, avec un fond sombre inspiré d'une ambiance basket.

- Le formulaire joueur comprend désormais une case « Cotisation payée ». Cochée = cotisation totale payée ; non cochée = non réglée.

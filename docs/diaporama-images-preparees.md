# Images Sylius dans le diaporama

Le Shop Next.js 16 (App Router) conserve sa sélection commerciale Hiboutik : stock, WWW,
image, tag exact, ordre récent et maintien des ventes du jour existant. Le manifeste
n'ajoute aucun produit. En cas d'échec de lecture commerciale, les messages sont affichés
sans recréer une sélection depuis le manifeste ou la mémoire quotidienne.

## Manifeste

Le navigateur lit `/api/diaporama/<slot>/assets` au démarrage puis toutes les 60 secondes.
La route consulte uniquement
`https://boutique.multimedia-services.fr/diaporama-assets/slots/<slot>/manifest.json`.
Les slots sont validés, le délai amont est de 3,5 secondes et le délai client de 5 secondes.
Le serveur mutualise les demandes pendant 30 secondes. Les derniers manifestes valides
sont conservés dans des caches bornés à huit slots. Les erreurs ne vident pas les images.

Le schéma 1, les dates de génération/contrôle et la durée de fraîcheur sont vérifiés.
Un manifeste ancien reste un cache d'images, jamais une preuve de stock. Chaque entrée
est validée séparément. Les identifiants numériques ou textuels sont normalisés. Les
URL préparées sont exclusivement HTTPS, sur `boutique.multimedia-services.fr`, dans
`/diaporama-assets/`, avec extension `.webp`, sans identifiants dans l'URL.
Le champ informatif `source_url` n'est pas transmis au navigateur.

## Résolution et animation

- Planche : `board_url`, puis `fallback_board_url`, puis photo habituelle.
- Fiche individuelle : `individual_url`, puis `fallback_individual_url`, puis photo habituelle.
- Carte active : halo préparé `neon_board_url` seulement si `status=ready`,
  `effects_ready=true`, `has_transparency=true` et `cutout_applied=true`.
- **Correction explicitement demandée ensuite :** la fiche individuelle utilise aussi
  `neon_individual_url` sous ces mêmes conditions. Cette règle remplace la demande
  initiale qui désactivait les néons individuels.

La photo de base reste visible. Les animations néon ont été restaurées depuis le commit
`eb66ff11ce1d353469d337bb08d3e282b8cc92eb` : halo et épaisseur qui respirent,
traînée avec variation de couleur, point qui suit le contour SVG et variantes de rythme
ou de double poursuite. Le flottement, l'inclinaison et le zoom d'origine sont rétablis
uniquement sur les photos éligibles. Le néon fin de la carte se masque lorsqu'un contour
éligible est affiché pour éviter l'accumulation.

Le navigateur ne détoure pas et n'analyse pas les pixels. La route Next.js Node
`/api/diaporama/<slot>/outline/<id>?context=individual&revision=<empreinte>` vérifie le
manifeste puis extrait le vecteur de l'alpha du WebP **déjà détouré par Sylius** avec
Sharp et l'algorithme de contour existant. L'extraction est bornée à 360 pixels sur le grand
côté, mutualisée et mise en cache par URL versionnée (32 contours serveur, 24 côté client).
Aucune photo n'est modifiée. Le SVG reprend les mêmes animations et filtres lumineux que
le commit de référence ; les grands masques rotatifs ajoutés ensuite sont remplacés.

Seuls les produits `ready`, `effects_ready`, transparents et détourés peuvent obtenir un
contour. La révision doit correspondre et l'URL doit rester sur l'hôte Sylius autorisé.
Un échec d'extraction laisse la photo intacte, avec le halo préfabriqué comme repli.
Les fichiers restent préparés par Sylius, et aucun traitement n'est réinstallé sur la TV.
La fluidité des anciens effets SVG sur une TV Android réelle reste à vérifier.

Les WebP préparés sont affichés directement avec `next/image unoptimized`, sans
réoptimisation ni paramètres anti-cache. Les photos habituelles conservent leur
redimensionnement Next.js existant. Le décodeur et les composants utilisent le même
choix d'URL et les mêmes tailles. Deux images sont préparées simultanément au maximum ;
seules la vue courante et la prochaine sont anticipées. Le cache de préparation est borné
à 18 entrées. Les cartes sont mémoïsées : le changement de carte active ne reconstruit
pas toutes les images.

Chaque candidat dispose d'un délai de chargement/décodage de 7 secondes. En cas d'échec,
on passe au repli suivant, sans boucle. Les URL en échec sont mémorisées cinq minutes
dans un registre borné. Si tous les candidats échouent, une indication « Photo indisponible »
remplace l'image ; le message d'accueil n'est plus bloqué indéfiniment.

## Désactivation

Pour un écran : ajouter `prepared=0`, par exemple :
`/diaporama/vitrine-droite?portrait=1&prepared=0`.

Pour tous les écrans : définir `DIAPORAMA_PREPARED_IMAGES=0` côté serveur Next.js puis
relancer/redéployer selon le processus habituel. Les photos habituelles reprennent le
relais ; aucune modification de Sylius ni suppression d'images n'est nécessaire.

## Validation et limites

Tests : `tests/diaporama-assets.test.ts`, `tests/diaporama-manifest-server.test.ts`,
`tests/image-readiness.test.ts`, plus les tests existants de sélection et d'alternance.
Ils couvrent validation, repli, cache, changements de révision, découpage commercial,
concurrence et activation explicite des néons individuels validés.

Le manifeste réel consulté pendant le raccordement contenait 11 entrées `fallback` ;
il ne permettait donc pas encore d'observer les halos validés sur ces produits.
L'API locale du port 3001 a répondu avec un manifeste valide. Le contrôle automatisé
Chrome a été tenté mais le navigateur s'est arrêté au démarrage dans l'environnement
d'exécution ; les captures et la fluidité réelle ne sont pas validées. Aucun test sur
TV Android physique ni déploiement en production n'est revendiqué.

Validation de la restauration : tests `diaporama-outline-server.test.ts` et
`product-outline.test.ts`, TypeScript et ESLint ciblé. La route locale a renvoyé HTTP 200
pour le produit 351 avec un contour de 360 × 360 et 1185 caractères de tracé. Sharp est
une dépendance directe côté serveur ; les verrous npm et pnpm sont mis à jour.

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

La photo de base reste visible. Le halo préparé est préchargé, puis animé par opacité et
rotation d'une lumière colorée masquée par son alpha existant. Aucun canvas, worker,
analyse des pixels, extraction de contour ou filtre de flou n'est utilisé dans ce parcours.
Sur la fiche individuelle validée, le produit flotte par translation CSS à taille constante. Le halo est élargi et une seule lumière tourne : la surface animée est calculée pour une taille de référence de 320 pixels physiques sur son grand côté. Le fond lumineux reste statique et seule son intensité préparée pulse. Cette version remplace les deux grandes lumières masquées qui pouvaient provoquer des saccades. L'effet est limité à la carte active ou au produit individuel visible. Le néon fin de la
carte s'efface lorsque le halo préparé est chargé, pour éviter de cumuler les contours.
Les dimensions servent notamment à compenser les marges du halo.

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

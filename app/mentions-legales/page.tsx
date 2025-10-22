import Header from "../../components/Header"

export default function MentionsLegales() {
  return (
    <main className="pt-24 p-8 max-w-4xl mx-auto text-gray-800 leading-relaxed">
      <Header />

      <h1 className="text-3xl font-bold mb-6 text-center">Mentions légales</h1>

      <section className="space-y-4">
        <p>
          Conformément aux dispositions des articles 6-III et 19 de la loi n°2004-575 du 21 juin 2004 pour la
          confiance dans l’économie numérique (LCEN), il est précisé aux utilisateurs du site{" "}
          <strong>phenomenedeforce.fr</strong> l’identité des différents intervenants dans le cadre de sa
          réalisation et de son suivi.
        </p>
      </section>

      <h2 className="text-2xl font-semibold mt-8 mb-2">1. Éditeur du site</h2>
      <div className="bg-gray-50 border-l-4 border-black p-4">
        <p>
          <strong>Entreprise individuelle MULTIMEDIA SERVICES</strong>  
          exploitant la marque <strong>PHÉNOMÈNE DE FORCE</strong>
        </p>
        <p>Gérant : <strong>GOURDEL IVAN</strong></p>
        <p>Adresse : 7 Boulevard de la Gare, 22600 Loudéac, France</p>
        <p>SIREN : 985 382 423 — SIRET : 985 382 423 00038</p>
        <p>Numéro de TVA : FR16985382423</p>
        <p>
          Contact :{" "}
          <a href="mailto:contact@phenomenedeforce.fr" className="text-blue-600 hover:underline">
            contact@phenomenedeforce.fr
          </a>
        </p>
      </div>

      <h2 className="text-2xl font-semibold mt-8 mb-2">2. Hébergeur du site</h2>
      <div className="bg-gray-50 border-l-4 border-black p-4">
        <p>
          <strong>Vercel Inc.</strong>  
          340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis  
        </p>
        <p>
          Site web :{" "}
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            https://vercel.com
          </a>
        </p>
      </div>

      <h2 className="text-2xl font-semibold mt-8 mb-2">3. Directeur de la publication</h2>
      <p>
        Le directeur de la publication est <strong>GOURDEL IVAN</strong>, en qualité de responsable légal de
        l’entreprise individuelle MULTIMEDIA SERVICES.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-2">4. Propriété intellectuelle</h2>
      <p>
        L’ensemble des éléments du site <strong>phenomenedeforce.fr</strong> (textes, images, graphismes,
        logo, vidéos, icônes, etc.) sont la propriété exclusive de l’entreprise individuelle MULTIMEDIA SERVICES
        ou de ses partenaires.
      </p>
      <p>
        Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments
        du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable
        de <strong>GOURDEL IVAN</strong>.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-2">5. Protection des données personnelles</h2>
      <p>
        Le site recueille les informations personnelles nécessaires au traitement des commandes et à la
        communication avec les clients. Ces données sont traitées conformément à la loi n°78-17 du 6 janvier
        1978 modifiée et au Règlement européen (UE) 2016/679 (RGPD).
      </p>
      <p>
        Pour toute demande relative à vos données personnelles, vous pouvez écrire à :{" "}
        <a href="mailto:contact@phenomenedeforce.fr" className="text-blue-600 hover:underline">
          contact@phenomenedeforce.fr
        </a>
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-2">6. Responsabilité</h2>
      <p>
        L’entreprise individuelle MULTIMEDIA SERVICES ne pourra être tenue responsable des dommages directs ou
        indirects causés au matériel de l’utilisateur lors de l’accès au site <strong>phenomenedeforce.fr</strong>.
      </p>
      <p>
        Le site utilise des technologies modernes et sécurisées (HTTPS, Stripe pour les paiements). L’utilisateur
        s’engage à accéder au site en utilisant un matériel récent, ne contenant pas de virus et avec un
        navigateur mis à jour.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-2">7. Liens externes</h2>
      <p>
        Le site peut contenir des liens vers d’autres sites internet. PHÉNOMÈNE DE FORCE n’exerce aucun contrôle
        sur le contenu de ces sites et ne saurait être tenu responsable de leur contenu ou de leur politique de
        confidentialité.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-2">8. Cookies</h2>
      <p>
        Le site utilise uniquement des cookies nécessaires à son bon fonctionnement (panier, paiement, langue).
        Aucun cookie publicitaire ou de suivi tiers n’est déposé sans votre consentement explicite.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-2">9. Droit applicable</h2>
      <p>
        Les présentes mentions légales sont régies par le droit français. En cas de litige, et après tentative
        de résolution amiable, les tribunaux compétents seront ceux du ressort de la Cour d’appel de Rennes.
      </p>

      <p className="text-center text-sm text-gray-500 mt-8">
        © {new Date().getFullYear()} PHÉNOMÈNE DE FORCE – Tous droits réservés.
      </p>
    </main>
  )
}

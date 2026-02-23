import CategoriesGrid from "./CategoriesGrid";


export default async function CategoriesPage() {
  // Ici on consomme ton proxy Next (pas de clé Hiboutik dans le client)
  const res = await fetch("http://localhost:3002/api/hiboutik/categories", { next: { revalidate: 900 }, // ✅ 15 min
   });
  // ⚠️ En prod, remplace par une fonction server (hiboutikGetCategories) pour éviter l’URL absolue.
  const categories = res.ok ? await res.json() : [];

  return <CategoriesGrid categories={Array.isArray(categories) ? categories : []} />;
}
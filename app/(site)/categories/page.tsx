import CategoriesGrid from "./CategoriesGrid";
import { hiboutikGetCategories } from "@/app/lib/hiboutik/api";

export default async function CategoriesPage() {
  const categories = await hiboutikGetCategories();
  return <CategoriesGrid categories={categories} />;
}
import PageClient from "./PageClient";
import { HiboutikProduct } from "../../types/ProductType";
import { hiboutikGetGrid } from "@/app/lib/hiboutik-cache";

export default async function HiboutikGridPage() {
  const products = (await hiboutikGetGrid({
    order_by: "updated_at",
    sort: "DESC",
    from: 0,
    to: 99,
  })) as HiboutikProduct[];

  return <PageClient products={products} />;
}
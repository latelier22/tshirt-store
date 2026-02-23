import PageClient from "./PageClient";
import { HiboutikProduct } from "../types/ProductType";
import { hiboutikGetGrid } from "@/app/lib/hiboutik";

export default async function HiboutikGridPage() {
  const products = (await hiboutikGetGrid({
    order_by: "product_id",
    sort: "ASC",
    from: 0,
    to: 99,
  })) as HiboutikProduct[];

  return <PageClient products={products} />;
}
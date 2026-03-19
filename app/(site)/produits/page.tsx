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

  if (products) {
    products.forEach((p) => {
      if (p.images) {
        p.images = p.images.map((img) => decodeURIComponent(img)).filter((img) => img.includes('big_'));
      }
    });
  }


  return <PageClient products={products} />;
}
// app/(site)/layout.tsx
import Header from "@/components/Header";
import FooterVisibility from "@/components/FooterVisibility";
import ProductUpdatesListener from "@/components/ProductUpdatesListener";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProductUpdatesListener />
      <Header />
      <main className="flex-1 pt-20">{children}</main>
      <FooterVisibility />
    </>
  );
}
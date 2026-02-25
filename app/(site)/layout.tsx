// app/(site)/layout.tsx
import Header from "@/components/Header";
import FooterVisibility from "@/components/FooterVisibility";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 pt-20">{children}</main>
      <FooterVisibility />
    </>
  );
}
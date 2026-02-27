import { NextRequest, NextResponse } from "next/server";

const DEFAULT = "fr_FR";
const OTHER_LOCALES = new Set(["en_US"]); // ajoute ici tes autres locales visibles

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Si quelqu’un tape /fr_FR/... => redirige vers /...
  if (pathname === `/${DEFAULT}` || pathname.startsWith(`/${DEFAULT}/`)) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(`/${DEFAULT}`, "") || "/";
    return NextResponse.redirect(url);
  }

  // 2) Optionnel : si tu veux forcer /en_US pour l’anglais selon cookie / header, etc.
  // (sinon tu laisses l'utilisateur naviguer via tes liens)

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|robots.txt|sitemap.xml|api).*)"],
};
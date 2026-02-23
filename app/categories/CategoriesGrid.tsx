"use client";

import Link from "next/link";
import {
  Wrench,
  Puzzle,
  Cable,
  Zap,
  Car,
  Bike,
  HardDrive,
  Plug,
  Smartphone,
  Tablet,
  Watch,
  Gamepad2,
  Shield,
  ShieldCheck,
  Laptop,
  Monitor,
  PackageSearch,
  PlugZap,
  BatteryCharging,
  Speaker,
  Home,
  Truck,
  Sparkles,
  Recycle,
  ShoppingBag,
} from "lucide-react";

type HiboutikCategory = {
  category_id: number;
  category_name?: string; // ✅ API peut renvoyer vide/undefined
  category_id_parent?: number;
  category_enabled?: 0 | 1;
  category_enabled_www?: 0 | 1;
  category_position?: number;
  category_bck_color?: string;
  category_color?: string;
};

function safeStr(v: unknown): string {
  return String(v ?? "").trim();
}

function slugify(input: unknown) {
  const s = safeStr(input);
  if (!s) return "categorie";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Normalisation légère pour matcher tes variantes (NEUF/NEUVE, accents, apostrophes, etc.)
function normName(input: unknown) {
  const s = safeStr(input);
  if (!s) return "";
  return s
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/’/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const ICONS: Record<string, any> = {
  "MAIN D'OEUVRE": Wrench,
  ACCESSOIRES: Puzzle,
  CABLES: Cable,
  CHARGEUR: Zap,
  VOITURE: Car,
  "TROTTINETTE/VELO": Bike,
  TROTTINETTE: Bike,
  STOCKAGE: HardDrive,
  ADAPTATEUR: Plug,

  TELEPHONES: Smartphone,
  TABLETTES: Tablet,
  MONTRES: Watch,

  CONSOLES: Gamepad2,
  PS5: Gamepad2,

  PROTECTION: Shield,
  "COQUE/ETUI IPHONE": ShieldCheck,
  "COQUE/ETUI SAMSUNG": ShieldCheck,

  ORDINATEUR: Laptop,

  DALLE: Monitor,
  "DALLE ": Monitor,
  ECRAN: Monitor,

  "PIECES DETACHEES": PackageSearch,
  "PIECES DETACHÉES": PackageSearch,

  IPHONE: Smartphone,
  "CONNECTEUR DE CHARGE": PlugZap,

  "BATTERIE IPHONE": BatteryCharging,
  "BATTERIE SAMSUNG": BatteryCharging,

  "ENCEINTE BLUETOOTH": Speaker,
  "APPAREIL MAISON": Home,
  LIVRAISON: Truck,

  NEUF: Sparkles,
  NEUVE: Sparkles,
  "OCCASION/RECONDITIONNE": Recycle,
  "OCCASION/RECONDITIONNÉ": Recycle,
  "OCCASSION/RECONDITIONNEE": Recycle,
  "OCCASSION/RECONDITIONNÉE": Recycle,
};

function pickIcon(name: unknown) {
  const key = normName(name);
  return ICONS[key] ?? ShoppingBag;
}

export default function CategoriesGrid({ categories }: { categories: HiboutikCategory[] }) {
  const list = Array.isArray(categories) ? categories : [];

  // ✅ On filtre d’abord les catégories sans nom (sinon crash SSR)
  const roots = list
    .filter((c) => safeStr(c.category_name) !== "")
    .filter((c) => (c.category_enabled ?? 1) === 1)
    .filter((c) => (c.category_enabled_www ?? 1) === 1)
    .filter((c) => (c.category_id_parent ?? 0) === 0)
    .sort((a, b) => (a.category_position ?? 0) - (b.category_position ?? 0));

  return (
    <main className="mx-auto max-w-6xl px-6 mt-28 mb-40">
      <div className="flex items-end justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">Catégories</h1>
        <div className="text-sm opacity-70">{roots.length} catégories</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {roots.map((c) => {
          const name = safeStr(c.category_name);
          const Icon = pickIcon(name);
          const slug = `${slugify(name)}-${c.category_id}`;

          const bg = c.category_bck_color ?? "#111111";
          const fg = c.category_color ?? "#ffffff";

          return (
            <Link
              key={c.category_id}
              href={`/categories/${slug}`}
              className="group rounded-2xl border border-white/10 bg-black/40 hover:bg-black/55 transition p-4 flex flex-col gap-3"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: bg, color: fg }}
                aria-hidden="true"
              >
                <Icon size={22} />
              </div>

              <div className="min-h-[2.5rem]">
                <div className="font-semibold leading-snug group-hover:opacity-90">{name}</div>
                <div className="text-xs opacity-65 mt-1">Voir les produits</div>
              </div>
            </Link>
          );
        })}
      </div>

      {roots.length === 0 && (
        <div className="mt-10 text-sm opacity-70">Aucune catégorie visible pour le moment.</div>
      )}
    </main>
  );
}
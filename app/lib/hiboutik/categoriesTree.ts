export type HiboutikCategory = {
  category_id: number;
  category_name: string;
  category_id_parent: number; // 0 = racine
  category_enabled?: 0 | 1;
  category_position?: number;
};

export type CatNode = HiboutikCategory & { children: CatNode[] };

export function buildCategoryTree(cats: HiboutikCategory[]): CatNode[] {
  // option : ne garder que enabled
  const filtered = cats.filter(c => c.category_enabled !== 0);

  // tri par position si présent
  filtered.sort((a, b) => (a.category_position ?? 0) - (b.category_position ?? 0));

  const byId = new Map<number, CatNode>();
  for (const c of filtered) byId.set(c.category_id, { ...c, children: [] });

  const roots: CatNode[] = [];
  for (const c of filtered) {
    const node = byId.get(c.category_id)!;
    const parentId = c.category_id_parent ?? 0;

    if (parentId && byId.has(parentId)) byId.get(parentId)!.children.push(node);
    else roots.push(node);
  }

  return roots;
}
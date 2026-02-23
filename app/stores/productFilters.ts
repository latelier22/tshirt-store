import { create } from "zustand";
import { persist } from "zustand/middleware";

type ProductFilterState = {
  hideOutOfStock: boolean;
  hideNoImage: boolean;
  query: string;

  toggleOutOfStock: () => void;
  toggleNoImage: () => void;

  setQuery: (v: string) => void;
  clearQuery: () => void;
};

export const useProductFilters = create<ProductFilterState>()(
  persist(
    (set) => ({
      hideOutOfStock: true,
      hideNoImage: true,
      query: "",

      toggleOutOfStock: () => set((s) => ({ hideOutOfStock: !s.hideOutOfStock })),
      toggleNoImage: () => set((s) => ({ hideNoImage: !s.hideNoImage })),

      setQuery: (v) => set({ query: v }),
      clearQuery: () => set({ query: "" }),
    }),
    { name: "product-filters" }
  )
);
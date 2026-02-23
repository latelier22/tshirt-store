type StockEntry = { stock_available?: 0 | 1 | boolean; [k: string]: any; };

type HiboutikProduct = {
  product_id: number;
  product_model?: string;
  product_price?: string;
  product_discount_price?: string;
  product_desc?: string;
  product_barcode?: string;
  stock_available_global?: 0 | 1 | boolean;
  stock_available?: StockEntry[];
  images?: string[];
  thumb?: string;
  image?: string;
};

export type { HiboutikProduct, StockEntry };

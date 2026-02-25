type StockEntry = { stock_available?: 0 | 1 | boolean; [k: string]: any; };

type HiboutikProduct = {
  tags(tags: any): unknown;
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


export type HiboutikTagDetail = {
  tag_id: number;
  tag: string;
  tag_desc?: string;
  tag_enabled?: 0 | 1;
  tag_enabled_www?: 0 | 1;
};

export type HiboutikTagCategory = {
  tag_cat: string;
  tag_cat_desc?: string;
  tag_cat_id: number;
  tag_cat_enabled?: 0 | 1;
  tag_cat_enabled_www?: 0 | 1;
  tag_details: HiboutikTagDetail[];
};

export type TagIndexEntry = {
  tag_id: number;
  tag: string;
  tag_cat_id: number;
  tag_cat: string;
};

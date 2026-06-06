export interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  discountPercentage?: string;
  image: string;
  category: string;
  code?: string;
  tags?: string[];
  description?: string;
}

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  image: string;
  rating: number;
  reviewsCount: number;
  text: string;
}

export interface CollectionItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
}

export interface CategoryStat {
  code: string;
  name: string;
  count: number;
  image: string;
  quote: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

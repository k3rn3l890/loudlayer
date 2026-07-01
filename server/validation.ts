import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().max(100).optional().default(""),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const GoogleAuthSchema = z.object({
  credential: z.string().min(1, "Google credential is required"),
});

export const CreateProductSchema = z.object({
  slug: z.string().min(1, "Slug is required").max(200),
  name: z.string().min(1, "Name is required").max(200),
  price: z.number().min(0, "Price must be non-negative"),
  discount_price: z.number().nullable().optional(),
  discount_percentage: z.string().nullable().optional(),
  image: z.string().optional().default("/placeholder-product.svg"),
  category: z.string().optional().default(""),
  code: z.string().nullable().optional(),
  description: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  stock: z.number().int().min(0).optional().default(0),
});

export const UpdateProductSchema = z.object({
  slug: z.string().max(200).optional(),
  name: z.string().max(200).optional(),
  price: z.number().min(0).optional(),
  discount_price: z.number().nullable().optional(),
  discount_percentage: z.string().nullable().optional(),
  image: z.string().optional(),
  category: z.string().optional(),
  code: z.string().nullable().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  stock: z.number().int().min(0).optional(),
  visible: z.boolean().optional(),
});

const CartItemSchema = z.object({
  product: z.object({
    id: z.number(),
    price: z.number().optional(),
    stock: z.number().optional(),
  }),
  quantity: z.number().int().min(1),
  selectedSize: z.string().optional().default(""),
});

export const UpdateCartSchema = z.object({
  items: z.array(CartItemSchema).optional(),
});

export const CreateOrderSchema = z.object({
  items: z.array(z.object({
    product_id: z.number(),
    name: z.string().optional(),
    price: z.number().min(0),
    quantity: z.number().int().min(1),
    size: z.string().optional().default(""),
    image: z.string().optional().default(""),
  })).min(1, "Order must contain at least one item"),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  shipping_address: z.string().optional(),
  notes: z.string().optional(),
});

export const CreateReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  body: z.string().max(2000).optional().default(""),
});

export const UpdateStatusSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
  notes: z.string().optional(),
});

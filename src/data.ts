import { Product, Testimonial, CategoryStat, CollectionItem } from "./types";
import heroImage from "../loudlayer_assets/heroSection_image-.png";
import momentsImage1 from "../loudlayer_assets/momentsImage_1.jpg";
import momentsImage2 from "../loudlayer_assets/momentsImage_2.jpg";
import statsSectionShirt from "../loudlayer_assets/statsSectionShirt.jpg";
import statsSectionJacket from "../loudlayer_assets/statsSectionJacket.jpg";
import statsSectionTrouser from "../loudlayer_assets/statsSectionTrouser_2.jpg";
import statsSectionSweatsuits from "../loudlayer_assets/statsSectionSweatsuits.jpg";
import testimonial1 from "../loudlayer_assets/testimonial1.jpg";
import testimonial2 from "../loudlayer_assets/testimonial2.jpg";
import testimonial3 from "../loudlayer_assets/testimonial3.jpg";
import mementoJacket from "../loudlayer_assets/mementoJacket.jpg";
import mementoFemaleJacket from "../loudlayer_assets/mementofemaleJacket.jpg";
import mementoShirtsFemaleShirts from "../loudlayer_assets/mementoshirtsfemaleShirts.jpg";
import spotlightArchive from "../loudlayer_assets/spotlight_archive.jpg";

export const HERO_IMAGE = heroImage; // Center staged avant-garde high collar model

export const PARTNERS = [
  { name: "slack", iconType: "Slack" },
  { name: "Dropbox", iconType: "Dropbox" },
  { name: "Webflow", iconType: "Webflow" },
  { name: "Spotify", iconType: "Spotify" },
  { name: "Dropbox", iconType: "Dropbox" },
  { name: "Remessa", iconType: "Remessa" }
];

export const MOMENTS_PRODUCTS: Product[] = [
  {
    id: "m1",
    slug: "international-going-distance-2026",
    name: "©International - going distance 2026",
    price: 120,
    image: momentsImage1,
    category: "Outer",
    code: "G-DIST-01",
    description: "Where Elegance Meets Sustainability, Luxury Made Accessible"
  },
  {
    id: "m2",
    slug: "international-just-do-it-2026",
    name: "©International - just do it 2026",
    price: 180,
    discountPercentage: "45%",
    image: momentsImage2,
    category: "Jacket",
    code: "JD-JKT-26",
    description: "Every item combines meticulous stitching with heavy cotton details, customized for optimal street insulation."
  }
];

export const CATEGORY_STATS: CategoryStat[] = [
  {
    code: "01",
    name: "Shirt",
    count: 174,
    image: statsSectionShirt,
    quote: "Heavy knit essentials designed with breathable fibers for maximum layout comfort."
  },
  {
    code: "02",
    name: "Jacket",
    count: 361,
    image: statsSectionJacket,
    quote: "Wind-resistant shells complete with modular clips and durable weatherlining layers."
  },
  {
    code: "03",
    name: "Trousers",
    count: 368,
    image: statsSectionTrouser,
    quote: "Raw selvedge indigo weaves structured to provide room and fluid dynamic silhouettes."
  },
  {
    code: "04",
    name: "Sweatsuits",
    count: 117,
    image: statsSectionSweatsuits,
    quote: "Avant-garde statements designed to capture kinetic motion across concrete cities."
  },
];

export const STATS_MODEL_IMAGE = "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=800"; // Street sportswear white orange tracksuit model

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    author: "",
    role: "Fashion Stylist",
    image: testimonial1,
    rating: 5.0,
    reviewsCount: 49,
    text: "Everything is absolutely perfect! From the fabric quality to the flawless fit every piece feels premium. This brand has completely transformed my wardrobe."
  },
  {
    id: "t2",
    author: "",
    role: "Global Creative Lead",
    image: testimonial2,
    rating: 5.0,
    reviewsCount: 32,
    text: "The technical zippers, taped seams, and oversized visual structure capture active urban energy like no other label. High craftsmanship combined with pure wearability."
  },
  {
    id: "t3",
    author: "",
    role: "Senior Apparel Buyer",
    image: testimonial3,
    rating: 4.9,
    reviewsCount: 56,
    text: "Meticulous focus on modern technical silhouettes. Customers consistently highlight the drape and raw styling appeal. Easily our fastest-selling quarterly collection."
  }
];

export const DISCOVER_PRODUCTS: Product[] = [
  {
    id: "c1",
    slug: "velour-orange-trek-shell",
    name: "velour - Orange Trek Shell",
    price: 195,
    category: "Jacket",
    image: heroImage,
    code: "VEL-OTR-01",
    tags: ["Technical", "Active Insulation"]
  },
  {
    id: "c2",
    slug: "velour-sage-windshield",
    name: "velour - Sage Windshield",
    price: 210,
    category: "Outer",
    image: mementoJacket,
    code: "VEL-SW-02",
    tags: ["Waterproof", "Adjustable Cords"]
  },
  {
    id: "c3",
    slug: "velour-premium-heavy-tshirt",
    name: "velour - Premium Heavy T-Shirt",
    price: 85,
    category: "Shirt",
    image: mementoFemaleJacket,
    code: "VEL-HTS-03",
    tags: ["Oversized", "100% Organic Cotton"]
  },
  {
    id: "c4",
    slug: "velour-block-field-track",
    name: "velour - Block Field Track",
    price: 240,
    category: "Jacket",
    image: mementoShirtsFemaleShirts,
    code: "VEL-BFT-04",
    tags: ["Modular Fit", "Breathable Mesh"]
  }
];

export const DIRECTORY_SPOTLIGHT = {
  title: "Statement Pieces 2025",
  description: "Your go-to wardrobe staples, crafted for comfort and effortless style.",
  image: spotlightArchive,
  tags: ["Premium", "Limited Edition"]
};

export const DIRECTORY_ACCORDIONS = [
  {
    id: "dir-1",
    title: "Everyday Essentials 2026",
    content: "Designed for day-in day-out versatile modular styling, including organic heavy cotton jersey fits, raw-edge basic t-shirts, and light fleece underlayers.",
    date: "2026 Edition"
  },
  {
    id: "dir-2",
    title: "Timeless Classics 2026",
    content: "Classic tailoring intersecting technical utility block details. Standard double-breasted heavy wool trench coats and water-resistant tailored overshirts.",
    date: "Aesthetic Archives"
  },
  {
    id: "dir-3",
    title: "Seasonal Collections 2025",
    content: "High-contrast color profiles paired with high-frequency heat-sealed protective shells, engineered specifically to resist coastal wind currents and rainstorms.",
    date: "Legacy Drop"
  }
];

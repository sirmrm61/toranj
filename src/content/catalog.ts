import type { GownMode, GownStyle, GownType } from "@/generated/prisma/enums";

export type TransitionName = "liquid" | "ripple" | "sweep" | "curtain" | "particles" | "radial";

export type CatalogGown = {
  slug: string;
  /** Latin file-name key for placeholder images. */
  key: string;
  name: string;
  tagline: string;
  description: string;
  fabric: string;
  type: GownType;
  style: GownStyle;
  neckline: string;
  sleeve: string;
  color: string;
  /** Hex used to render the placeholder illustration. */
  hex: string;
  mode: GownMode;
  priceRange: string;
  featured: boolean;
  /** Shown in the landing hero with this shader transition. */
  hero?: TransitionName;
};

/** Seed catalog. Real photos replace the generated placeholders in public/gowns-media. */
export const catalog: CatalogGown[] = [
  {
    slug: "ترنج-مروارید",
    key: "morvarid",
    name: "مروارید",
    tagline: "دامن پفی با تور چندلایه و کرست مرواریددوزی",
    description: "مدل پرنسسی با دامن پفی چندلایه از تور ایتالیایی، کرست دست‌دوز با مروارید و دنباله بلند. مناسب مراسم‌های باشکوه.",
    fabric: "تور ایتالیایی، ساتن، مروارید دست‌دوز",
    type: "BRIDAL",
    style: "PUFFY",
    neckline: "دکلته",
    sleeve: "بدون آستین",
    color: "سفید",
    hex: "#fbfaf7",
    mode: "SALE",
    priceRange: "۹۰ تا ۱۴۰ میلیون تومان",
    featured: true,
    hero: "liquid",
  },
  {
    slug: "ترنج-ماه",
    key: "mah",
    name: "ماه",
    tagline: "مدل ماهی با گیپور فرانسوی",
    description: "لباس عروس مدل ماهی که فرم بدن را زیبا نشان می‌دهد؛ گیپور فرانسوی روی بالاتنه و دامنی که از زانو باز می‌شود.",
    fabric: "گیپور فرانسوی، کرپ",
    type: "BRIDAL",
    style: "MERMAID",
    neckline: "قایقی",
    sleeve: "آستین بلند گیپور",
    color: "شیری",
    hex: "#f4ecdc",
    mode: "BOTH",
    priceRange: "۷۰ تا ۱۱۰ میلیون تومان",
    featured: true,
    hero: "ripple",
  },
  {
    slug: "ترنج-نسیم",
    key: "nasim",
    name: "نسیم",
    tagline: "ساده و مینیمال با ساتن براق",
    description: "طراحی مینیمال از ساتن براق با یقه هفت و پشت باز؛ انتخابی برای عروس‌هایی که سادگی و ظرافت را دوست دارند.",
    fabric: "ساتن ابریشم",
    type: "BRIDAL",
    style: "SIMPLE",
    neckline: "یقه هفت",
    sleeve: "بندی",
    color: "شامپاینی",
    hex: "#efe0c4",
    mode: "RENT",
    priceRange: "اجاره از ۱۸ میلیون تومان",
    featured: true,
    hero: "sweep",
  },
  {
    slug: "ترنج-شکوفه",
    key: "shokoufeh",
    name: "شکوفه",
    tagline: "دامن A-line با گل‌های سه‌بعدی",
    description: "دامن کلوش A-line با گل‌های سه‌بعدی پارچه‌ای و آستین افتاده؛ رمانتیک و سبک برای مراسم باغ.",
    fabric: "تور نرم، گل‌های ارگانزا",
    type: "BRIDAL",
    style: "A_LINE",
    neckline: "یقه افتاده",
    sleeve: "آستین افتاده",
    color: "صورتی بسیار روشن",
    hex: "#f7e3e3",
    mode: "SALE",
    priceRange: "۶۰ تا ۹۰ میلیون تومان",
    featured: true,
    hero: "curtain",
  },
  {
    slug: "ترنج-ستاره",
    key: "setareh",
    name: "ستاره",
    tagline: "سنگ‌دوزی کامل با دنباله سلطنتی",
    description: "لباس عروس سنگ‌دوزی‌شده با دنباله سه‌متری و تور ستاره‌ای؛ درخششی متفاوت زیر نور.",
    fabric: "تور پولکی، کریستال",
    type: "BRIDAL",
    style: "A_LINE",
    neckline: "قلبی",
    sleeve: "بدون آستین",
    color: "سفید",
    hex: "#ffffff",
    mode: "SALE",
    priceRange: "۱۲۰ تا ۱۸۰ میلیون تومان",
    featured: false,
    hero: "particles",
  },
  {
    slug: "ترنج-یاس",
    key: "yas",
    name: "یاس",
    tagline: "لباس نامزدی کوتاه و شیک",
    description: "لباس نامزدی با دامن میدی، کمربند ساتن و آستین پفی کوتاه؛ مناسب جشن نامزدی و عقد محضری.",
    fabric: "میکادو",
    type: "ENGAGEMENT",
    style: "A_LINE",
    neckline: "یقه گرد",
    sleeve: "آستین پفی کوتاه",
    color: "شیری",
    hex: "#f6efe2",
    mode: "BOTH",
    priceRange: "۲۵ تا ۴۰ میلیون تومان",
    featured: true,
    hero: "radial",
  },
  {
    slug: "ترنج-شب",
    key: "shab",
    name: "شب",
    tagline: "لباس مجلسی مخمل سرمه‌ای",
    description: "لباس مجلسی بلند از مخمل سرمه‌ای با چاک جانبی و سرشانه سنگ‌دوزی‌شده.",
    fabric: "مخمل",
    type: "EVENING",
    style: "MERMAID",
    neckline: "یک‌شانه",
    sleeve: "بدون آستین",
    color: "سرمه‌ای",
    hex: "#28305a",
    mode: "RENT",
    priceRange: "اجاره از ۶ میلیون تومان",
    featured: false,
  },
  {
    slug: "ترنج-آرام",
    key: "aram",
    name: "آرام",
    tagline: "لباس ساقدوش ساده و هماهنگ",
    description: "لباس ساقدوش از شیفون با رنگ‌بندی متنوع؛ قابل سفارش در چند سایز به‌صورت هماهنگ.",
    fabric: "شیفون",
    type: "BRIDESMAID",
    style: "SIMPLE",
    neckline: "یقه هفت",
    sleeve: "بندی",
    color: "یاسی",
    hex: "#cdbfe0",
    mode: "BOTH",
    priceRange: "۸ تا ۱۲ میلیون تومان",
    featured: false,
  },
];

export const gownImagePaths = (key: string) => [1, 2, 3].map((i) => `/gowns-media/${key}-${i}.webp`);

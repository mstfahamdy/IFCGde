import { DriverProfile } from './types';

export const PRODUCT_CATALOG = [
  "Mama Choice (10*10 - 4*2.5 Kg.) Transparent",
  "Mama Choice Pommes Frites Transparent (4*2.5 Kg.) Trade.",
  "Mama Choice (7*7 - 4*2.5 Kg.) Transparent",
  "Mama Choice Crinkle Fries (11*11 - 4*2.5 Kg) transparent",
  "Mama Choice (10*10 - 4*2.5 Kg.) colored",
  "Mama Choice (10*10 - 10*1 Kg.) colored",
  "Mama Choice (7*7 - 4*2.5 Kg.) colored",
  "Mama Choice (7*7 - 10*1 Kg.) colored",
  "Hot & Crispy (10*10 - 4*2.5 Kg.) Transparent",
  "Hot & Crispy (7*7 - 4*2.5 Kg.) Transparent",
  "Hot & Crispy Crinkle Fries Transparent (4*2.5 kg.)",
  "Hot & Crispy Crinkle Slices Transparent (4*2.5 kg.)",
  "Hot & Crispy Steak Fries Transparent (13*13 - 4*2.5 kg.)",
  "Hot & Crispy Crinkle Fries Colored (10*1 kg.)",
  "Hot & Crispy (10*10 - 4*2.5 Kg.) colored",
  "Hot & Crispy (10*10 - 10*1 Kg.) colored",
  "Hot & Crispy (7*7 - 4*2.5 Kg.) colored",
  "Hot & Crispy (7*7 - 10*1 Kg.) colored",
  "Hot & Crispy Cut (12*750 gr.) colored",
  "Hot & Crispy Wedges (12*750 gr.) colored",
  "Hot & Crispy Country Fries (10*10 - 12*75. gr.) colored",
  "Hot & Crispy Sweet Potato Colored (10*10 - 10*1 Kg.)",
  "Hot & Crispy Sweet Potatoes (10*10 - 4*2.5 Kg.)",
  "Golden Fields Premium Fries Transparent (10*10 - 4*2.5 kg.)",
  "Golden Fields Premium Fries Transparent (7*7 - 4*2.5 kg.)",
  "Golden Fields Premium Crinkle Fries Transparent (4*2.5 kg.)",
  "Golden Fields Sweet Potato Transparent (10*10 - 4*2.5 kg.)",
  "Second Degree (4*2.5 Kg.) transparent",
  "Second Degree (3*2.5 Kg.) transparent"
];

export const CUSTOMER_LIST = [
  { name: "الفهد", location: "بنها" },
  { name: "الفيحاء", location: "" },
  { name: "العلا مصر", location: "المنصورة" },
  { name: "الشروق", location: "" },
  { name: "الواحة الجديدة", location: "شرم الشيخ" },
  { name: "الزهراء", location: "" },
  { name: "إيه إم فوود", location: "" },
  { name: "أولاد خليل", location: "شرم الشيخ" },
  { name: "تشيكن أند ميت 2000", location: "أسوان" },
  { name: "دلتا فوود", location: "أكتوبر" },
  { name: "فيريست تريد", location: "القاهرة" },
  { name: "الدولية", location: "الجيزة" },
  { name: "جلال فراجلو", location: "" },
  { name: "لطفى العيسوى", location: "بورسعيد" },
  { name: "مجدى نجيب", location: "" },
  { name: "زغلول", location: "القاهرة" },
  { name: "ميتا تريد", location: "اسكندرية" },
  { name: "ميلانو", location: "الغردقة" },
  { name: "ميكس فوود", location: "العاشر من رمضان" },
  { name: "محمد على (حلوان)", location: "" },
  { name: "محمد ابراهيم", location: "" },
  { name: "موسى الأقصر", location: "الأقصر" },
  { name: "ماستر فوود ", location: "دمياط" },
  { name: "رياض أبو سعدة", location: "مطروح" },
  { name: "صموائيل", location: "الفيوم" },
  { name: "جنوب سيناء شرم الشيخ", location: "شرم الشيخ" },
  { name: "جنوب سيناء الغردقة", location: "الغردقة" },
  { name: "يونايتد بنى سويف", location: "بنى سويف" },
  { name: "يونايتد الإسماعيلية", location: "الإسماعيلية" },
  { name: "(اليوسف -المنيا)واى أند إية", location: "المنيا" },
  { name: "اليرموك", location: "شرم الشيخ" }
];

export const WAREHOUSES = [
    "المصنع",
    "ثلاجات المصنع الجديد",
    "اللوجيستيك",
    "الجمرك",
    "الأهرام"
];

export const DELIVERY_SHIFTS = [
    "أول نقلة",
    "ثانى نقلة",
    "باليل"
];

export const DRIVERS_FLEET: DriverProfile[] = [
    { name: "Mohamed Ahmed", phone: "01012345678", carNumber: "ABC-123" },
    { name: "Abd El Atty", phone: "01198765432", carNumber: "XYZ-789" },
    { name: "Mahmoud Trtsha", phone: "01234567890", carNumber: "DEF-456" },
    { name: "Osama", phone: "01000000000", carNumber: "TEST-000" }
];

export const MOCK_SHAREPOINT_URL = "https://your-company.sharepoint.com/sites/sales/_api/web/lists/getbytitle('SalesOrders')/items";
// Supabase Configuration
// Replace these with your actual Supabase project credentials
// Get them from: https://app.supabase.com/project/_/settings/api

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "YOUR_SUPABASE_URL";
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";

// Application Configuration
export const APP_CONFIG = {
  appName: "Master-Dashboard",
  defaultCurrency: "₹",
  taxRate: 0.05, // 5% GST
  orderPrefix: "ORD",

  // Subscription plans
  // Merge this into your existing APP_CONFIG object in src/config/config.ts,
// replacing whatever `plans` currently contains. Keep the rest of
// APP_CONFIG (appName, defaultCurrency, organizationTypes, etc.) untouched.

plans: {
  trial: {
    name: "Free Trial",
    price: 0,
    duration: "7 days free — full Premium access",
    features: [
      "QR Code Ordering",
      "Friends & Family Discounts",
      "Role-Based Access Control",
      "RAG Bot — Talk to Your Data",
    ],
  },
  standard: {
    name: "Standard",
    price: 999,
    duration: "month",
    features: [
      "QR Code Ordering",
      "Friends & Family Discounts",
    ],
  },
  premium: {
    name: "Premium",
    price: 1999,
    duration: "month",
    features: [
      "QR Code Ordering",
      "Friends & Family Discounts",
      "Role-Based Access Control",
      "RAG Bot — Talk to Your Data",
    ],
  },
},

  // Organizations types
  organizationTypes: [
    "Kitchen",
    "Salon",
    "Academy",
    "Sports Club",
    "Wellness",
    "Venue Booking",
  ],

  // Menu categories
  menuCategories: [
    "Starters",
    "Main Course",
    "Breakfast",
    "Lunch",
    "Dinner",
    "Beverages",
    "Desserts",
    "Snacks",
    "Other",
  ],

  // Order statuses
  orderStatuses: {
    pending: { label: "Pending", color: "warning" },
    accepted: { label: "Accepted", color: "accent-secondary" },
    preparing: { label: "Preparing", color: "accent-secondary" },
    ready: { label: "Ready", color: "success" },
    completed: { label: "Completed", color: "success" },
    cancelled: { label: "Cancelled", color: "error" },
    rejected: { label: "Rejected", color: "error" },
  },

  // Payment methods
  paymentMethods: ["Cash", "UPI", "Card", "Other"],

  // Registration sources
  heardFromOptions: [
    "Google Search",
    "Social Media",
    "Friend/Referral",
    "Advertisement",
    "Other",
  ],
};
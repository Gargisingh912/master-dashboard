/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║        MASTER OPERATIONS DASHBOARD — gargi.ai            ║
 * ║  Restaurant · Salon · Sports Academy                     ║
 * ║                                                          ║
 * ║  Supabase-ready: swap DEMO_DATA for real DB calls        ║
 * ║  Mobile-first: works on phone, tablet, desktop           ║
 * ║  White-label: change BUSINESS_CONFIG to rebrand instantly ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * SETUP:
 *   npm install @supabase/supabase-js recharts
 *
 * SUPABASE CONNECTION (uncomment in useSupabase hook below):
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=your_key
 *
 * TO REBRAND FOR A CLIENT:
 *   Edit BUSINESS_CONFIG object — name, niche, colors, logo
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis,
} from "recharts";

// ═══════════════════════════════════════════════════════════════
//  WHITE-LABEL CONFIG — edit this to rebrand for any client
// ═══════════════════════════════════════════════════════════════
const BUSINESS_CONFIG = {
  name:    "My Business",        // ← client's business name
  tagline: "Operations Dashboard",
  niche:   "restaurant",         // "restaurant" | "salon" | "sports"
  logo:    "◈",                  // emoji or first letter
  city:    "Jabalpur",
  currency:"₹",
  // Override accent color per niche (or set custom)
  customAccent: null,            // e.g. "#FF6B6B" — null = auto from niche
};

// ═══════════════════════════════════════════════════════════════
//  NICHE THEMES — auto-applied based on BUSINESS_CONFIG.niche
// ═══════════════════════════════════════════════════════════════
const NICHE_THEMES = {
  restaurant: {
    accent:    "#FF6B35",
    accent2:   "#FFB347",
    accent3:   "#FF8C69",
    icon:      "🍽️",
    label:     "Restaurant / Cloud Kitchen",
    navItems:  ["overview","orders","menu","inventory","delivery","finances","social","settings"],
    navIcons:  ["◈","🛒","🍜","📦","🛵","💰","📱","⚙"],
    navLabels: ["Overview","Orders","Menu","Inventory","Delivery","Finances","Social","Settings"],
  },
  salon: {
    accent:    "#E879A0",
    accent2:   "#F9A8D4",
    accent3:   "#C084FC",
    icon:      "💇‍♀️",
    label:     "Salon & Beauty Studio",
    navItems:  ["overview","appointments","clients","services","inventory","finances","social","settings"],
    navIcons:  ["◈","📋","👥","💇","📦","💰","📱","⚙"],
    navLabels: ["Overview","Appointments","Clients","Services","Inventory","Finances","Social","Settings"],
  },
  sports: {
    accent:    "#22D3EE",
    accent2:   "#818CF8",
    accent3:   "#34D399",
    icon:      "🏆",
    label:     "Sports & Educational Academy",
    navItems:  ["overview","students","attendance","fees","performance","finances","social","settings"],
    navIcons:  ["◈","👨‍🎓","📅","💳","🏆","💰","📱","⚙"],
    navLabels: ["Overview","Students","Attendance","Fees","Performance","Finances","Social","Settings"],
  },
};

// ═══════════════════════════════════════════════════════════════
//  SUPABASE HOOK — swap DEMO_DATA for real queries here
// ═══════════════════════════════════════════════════════════════
function useData(niche) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ── SUPABASE INTEGRATION POINT ─────────────────────────────
    // Uncomment and replace with real Supabase calls:
    //
    // import { createClient } from '@supabase/supabase-js'
    // const sb = createClient(
    //   import.meta.env.VITE_SUPABASE_URL,
    //   import.meta.env.VITE_SUPABASE_ANON_KEY
    // )
    //
    // const fetchAll = async () => {
    //   const [orders, inventory, finances, social] = await Promise.all([
    //     sb.from('orders').select('*').order('created_at', { ascending: false }).limit(50),
    //     sb.from('inventory').select('*'),
    //     sb.from('transactions').select('*').order('date', { ascending: false }),
    //     sb.from('social_posts').select('*').order('scheduled_at', { ascending: false }),
    //   ])
    //   setData({ orders: orders.data, inventory: inventory.data, ... })
    //   setLoading(false)
    // }
    // fetchAll()
    //
    // ── REALTIME (live dashboard updates) ─────────────────────
    // const channel = sb.channel('dashboard')
    //   .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' },
    //     () => fetchAll())
    //   .subscribe()
    // return () => sb.removeChannel(channel)
    // ──────────────────────────────────────────────────────────

    // Demo data while Supabase not connected
    setTimeout(() => {
      setData(DEMO_DATA[niche]);
      setLoading(false);
    }, 600);
  }, [niche]);

  return { data, loading };
}

// ═══════════════════════════════════════════════════════════════
//  DEMO DATA  (replace with Supabase data)
// ═══════════════════════════════════════════════════════════════
const mkRevenue = (base, variance = 0.3) =>
  ["Jan","Feb","Mar","Apr","May","Jun"].map((m, i) => ({
    month: m,
    revenue: Math.round(base * (0.7 + i * 0.08 + Math.random() * variance) / 1000) * 1000,
    expenses: Math.round(base * (0.45 + i * 0.04 + Math.random() * 0.15) / 1000) * 1000,
  }));

const DEMO_DATA = {
  restaurant: {
    kpis: {
      todayOrders: 47, todayRevenue: 38400, pendingOrders: 8,
      totalRevenue: 284000, avgTicket: 415, rating: 4.3,
      totalExpenses: 168000, netProfit: 116000,
    },
    revenueChart: mkRevenue(280000),
    ordersChart: [
      {t:"Mon",orders:38},{t:"Tue",orders:52},{t:"Wed",orders:41},
      {t:"Thu",orders:67},{t:"Fri",orders:89},{t:"Sat",orders:94},{t:"Sun",orders:78},
    ],
    platformChart: [
      {name:"Zomato",value:42,color:"#FF2B2B"},
      {name:"Swiggy",value:31,color:"#FF6B00"},
      {name:"Direct",value:18,color:"#22D3EE"},
      {name:"Dine-in",value:9,color:"#A78BFA"},
    ],
    topItems: [
      {name:"Butter Chicken",orders:184,revenue:69920},
      {name:"Chicken Biryani",orders:142,revenue:49700},
      {name:"Paneer Tikka",orders:98,revenue:27440},
      {name:"Dal Makhani",orders:87,revenue:19140},
      {name:"Garlic Naan",orders:201,revenue:6030},
    ],
    recentOrders: [
      {id:"#1047",customer:"Rahul S.",platform:"Zomato",items:"Butter Chicken + Naan",amount:480,status:"delivered",time:"12m ago"},
      {id:"#1046",customer:"Priya P.",platform:"Swiggy",items:"Biryani + Raita",amount:370,status:"preparing",time:"18m ago"},
      {id:"#1045",customer:"Amit K.",platform:"Direct",items:"Paneer Tikka + Lassi",amount:520,status:"pending",time:"25m ago"},
      {id:"#1044",customer:"Neha R.",platform:"Zomato",items:"Dal Makhani + Rice",amount:310,status:"delivered",time:"41m ago"},
      {id:"#1043",customer:"Vikram D.",platform:"Swiggy",items:"Chicken Wings x2",amount:640,status:"cancelled",time:"55m ago"},
    ],
    inventory: [
      {item:"Chicken",qty:18,unit:"kg",reorder:10,status:"ok"},
      {item:"Basmati Rice",qty:12,unit:"kg",reorder:15,status:"low"},
      {item:"Paneer",qty:4,unit:"kg",reorder:5,status:"reorder"},
      {item:"Tomatoes",qty:22,unit:"kg",reorder:8,status:"ok"},
      {item:"Cream",qty:2,unit:"litre",reorder:4,status:"reorder"},
    ],
    social: {
      instagram:{followers:"4.2K",reach:"18K",engagement:"5.1%",posts:12},
      facebook:{followers:"2.8K",reach:"9K",engagement:"2.8%",posts:8},
      zomato:{rating:"4.3",reviews:284,orders:1240},
    },
    notifications: [
      {type:"warning",msg:"Paneer stock critical — only 4kg remaining",time:"15m ago"},
      {type:"success",msg:"₹38,400 revenue today — 12% above target",time:"1h ago"},
      {type:"info",msg:"8 orders pending delivery confirmation",time:"2h ago"},
      {type:"error",msg:"Swiggy integration sync failed — check API",time:"3h ago"},
    ],
  },

  salon: {
    kpis: {
      todayAppointments: 14, todayRevenue: 22800, pendingAppts: 4,
      totalRevenue: 198000, avgTicket: 1628, rating: 4.7,
      totalExpenses: 112000, netProfit: 86000,
    },
    revenueChart: mkRevenue(180000, 0.25),
    appointmentsChart: [
      {t:"Mon",appts:9},{t:"Tue",appts:12},{t:"Wed",appts:8},
      {t:"Thu",appts:15},{t:"Fri",appts:18},{t:"Sat",appts:22},{t:"Sun",appts:11},
    ],
    platformChart: [
      {name:"Walk-in",value:38,color:"#E879A0"},
      {name:"Phone",value:29,color:"#F9A8D4"},
      {name:"Instagram",value:21,color:"#C084FC"},
      {name:"App",value:12,color:"#34D399"},
    ],
    topServices: [
      {name:"Hair Color (Full)",bookings:84,revenue:210000},
      {name:"Bridal Makeup",bookings:22,revenue:176000},
      {name:"Keratin Treatment",bookings:38,revenue:190000},
      {name:"Manicure (Gel)",bookings:112,revenue:100800},
      {name:"Facial - Premium",bookings:76,revenue:114000},
    ],
    recentAppointments: [
      {id:"APT-081",client:"Priya M.",service:"Hair Color + Facial",staff:"Neha",amount:3200,status:"completed",time:"11:00"},
      {id:"APT-082",client:"Sunita R.",service:"Bridal Makeup",staff:"Sunita P.",amount:8000,status:"in-progress",time:"13:00"},
      {id:"APT-083",client:"Ananya S.",service:"Gel Mani + Pedicure",staff:"Rani",amount:2100,status:"confirmed",time:"15:00"},
      {id:"APT-084",client:"Kavya D.",service:"Keratin Treatment",staff:"Neha",amount:5000,status:"scheduled",time:"16:30"},
      {id:"APT-085",client:"Deepa N.",service:"Cleanup + Threading",staff:"Sunita P.",amount:550,status:"cancelled",time:"17:00"},
    ],
    inventory: [
      {item:"Loreal Hair Color",qty:8,unit:"tubes",reorder:5,status:"ok"},
      {item:"Keratin Solution",qty:2,unit:"bottles",reorder:2,status:"reorder"},
      {item:"Rica Wax",qty:3,unit:"tins",reorder:2,status:"ok"},
      {item:"O3+ Facial Kit",qty:4,unit:"kits",reorder:3,status:"low"},
      {item:"Gel Nail Polish",qty:18,unit:"bottles",reorder:10,status:"ok"},
    ],
    clients: {
      total: 284, vip: 42, regular: 180, newThisMonth: 18, loyaltyPoints: 84200,
    },
    social: {
      instagram:{followers:"8.4K",reach:"42K",engagement:"6.2%",posts:22},
      facebook:{followers:"3.1K",reach:"12K",engagement:"3.1%",posts:10},
    },
    notifications: [
      {type:"info",msg:"Sunita Rao birthday today — send loyalty offer",time:"9:00 AM"},
      {type:"warning",msg:"Keratin Solution out of stock — reorder now",time:"10m ago"},
      {type:"success",msg:"4.9 star review from Priya Mehta on Google",time:"2h ago"},
      {type:"info",msg:"APT-082 Bridal Makeup started — 3hrs session",time:"1h ago"},
    ],
  },

  sports: {
    kpis: {
      totalStudents: 186, activeStudents: 174, attendanceToday: 142,
      totalRevenue: 312000, pendingFees: 48000, avgScore: 74.2,
      totalExpenses: 198000, netProfit: 114000,
    },
    revenueChart: mkRevenue(300000, 0.2),
    attendanceChart: [
      {t:"Mon",present:138,absent:36},{t:"Tue",present:151,absent:23},
      {t:"Wed",present:142,absent:32},{t:"Thu",present:158,absent:16},
      {t:"Fri",present:147,absent:27},{t:"Sat",present:112,absent:62},{t:"Sun",present:84,absent:90},
    ],
    courseChart: [
      {name:"Cricket",value:48,color:"#22D3EE"},
      {name:"Football",value:32,color:"#34D399"},
      {name:"Academics",value:42,color:"#818CF8"},
      {name:"Dance",value:28,color:"#F9A8D4"},
      {name:"Music",value:22,color:"#FCD34D"},
      {name:"Others",value:14,color:"#FB923C"},
    ],
    topCourses: [
      {name:"Cricket Coaching",students:48,revenue:120000},
      {name:"Mathematics Tuition",students:42,revenue:63000},
      {name:"Football Coaching",students:32,revenue:70400},
      {name:"Classical Dance",students:28,revenue:61600},
      {name:"Music - Guitar",students:22,revenue:44000},
    ],
    recentStudents: [
      {id:"STU-186",name:"Arjun Sharma",course:"Cricket",fee:2500,status:"active",joined:"Today"},
      {id:"STU-185",name:"Priya Patel",course:"Dance",fee:2200,status:"active",joined:"Yesterday"},
      {id:"STU-184",name:"Rahul Gupta",course:"Maths",fee:1500,status:"active",joined:"2d ago"},
      {id:"STU-183",name:"Ananya Singh",course:"Football",fee:2200,status:"on-leave",joined:"1w ago"},
      {id:"STU-182",name:"Karan Mehta",course:"Guitar",fee:2000,status:"active",joined:"1w ago"},
    ],
    feeStatus: {paid: 138, pending: 32, partial: 12, scholarship: 4},
    social: {
      instagram:{followers:"3.2K",reach:"14K",engagement:"4.4%",posts:16},
      youtube:{subscribers:"1.1K",views:"28K",watchTime:"1.2K hrs"},
    },
    notifications: [
      {type:"warning",msg:"32 students have pending fees for June",time:"Today"},
      {type:"success",msg:"Arjun Sharma won District Cricket Tournament",time:"Yesterday"},
      {type:"info",msg:"Annual Day performance scheduled — 12 Jun",time:"2d ago"},
      {type:"warning",msg:"Volleyball court maintenance due this week",time:"3d ago"},
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
//  DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════
const BASE = {
  bg:      "#080C14",
  surface: "#0C1220",
  card:    "#101828",
  border:  "#1C2B42",
  borderL: "#243550",
  text:    "#F0F6FF",
  textMid: "#7B9EC4",
  textDim: "#3A5270",
  green:   "#34D399",
  red:     "#F87171",
  yellow:  "#FBBF24",
  orange:  "#FB923C",
  purple:  "#A78BFA",
};

const getNicheAccent = (niche) => {
  if (BUSINESS_CONFIG.customAccent) return BUSINESS_CONFIG.customAccent;
  return NICHE_THEMES[niche]?.accent || "#6EE7B7";
};

// ═══════════════════════════════════════════════════════════════
//  SHARED UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════
const f = (...parts) => parts.filter(Boolean).join(" ");

const Card = ({ children, style = {}, glow = false, accent }) => (
  <div style={{
    background: BASE.card,
    border: `1px solid ${glow ? (accent + "55") : BASE.border}`,
    borderRadius: 16,
    padding: "18px 20px",
    boxShadow: glow ? `0 0 24px ${accent}18` : "none",
    ...style,
  }}>
    {children}
  </div>
);

const Badge = ({ children, color, size = "sm" }) => (
  <span style={{
    background: color + "22",
    color,
    border: `1px solid ${color}44`,
    borderRadius: 20,
    padding: size === "sm" ? "2px 9px" : "4px 12px",
    fontSize: size === "sm" ? 10 : 12,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    display: "inline-block",
  }}>{children}</span>
);

const StatusBadge = ({ status }) => {
  const map = {
    delivered: [BASE.green, "Delivered"],
    completed: [BASE.green, "Completed"],
    preparing: [BASE.yellow, "Preparing"],
    "in-progress": [BASE.yellow, "In Progress"],
    pending: [BASE.orange, "Pending"],
    confirmed: ["#60A5FA", "Confirmed"],
    scheduled: ["#60A5FA", "Scheduled"],
    cancelled: [BASE.red, "Cancelled"],
    active: [BASE.green, "Active"],
    "on-leave": [BASE.yellow, "On Leave"],
    ok: [BASE.green, "OK"],
    low: [BASE.yellow, "Low Stock"],
    reorder: [BASE.red, "Reorder"],
  };
  const [color, label] = map[status] || [BASE.textMid, status];
  return <Badge color={color}>{label}</Badge>;
};

const KpiCard = ({ label, value, sub, color, icon, trend }) => (
  <div style={{
    background: BASE.card,
    border: `1px solid ${BASE.border}`,
    borderRadius: 16,
    padding: "16px 18px",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  }}>
    <div style={{
      position: "absolute", top: -20, right: -20,
      width: 70, height: 70, borderRadius: "50%",
      background: color + "14", pointerEvents: "none",
    }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <span style={{ color: BASE.textMid, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 18 }}>{icon}</span>
    </div>
    <div style={{ color: BASE.text, fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {trend != null && (
        <span style={{ color: trend >= 0 ? BASE.green : BASE.red, fontSize: 11, fontWeight: 700 }}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
        </span>
      )}
      {sub && <span style={{ color: BASE.textDim, fontSize: 11 }}>{sub}</span>}
    </div>
  </div>
);

const SectionHead = ({ title, action, actionLabel, actionColor }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
    <h2 style={{ color: BASE.text, fontSize: 13, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
    {action && (
      <button onClick={action} style={{
        background: (actionColor || BASE.green) + "18",
        color: actionColor || BASE.green,
        border: `1px solid ${(actionColor || BASE.green)}33`,
        borderRadius: 8, padding: "5px 12px", fontSize: 11,
        fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
      }}>{actionLabel}</button>
    )}
  </div>
);

const CustomTooltip = ({ active, payload, label, accent }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: BASE.surface, border: `1px solid ${BASE.border}`,
      borderRadius: 10, padding: "10px 14px",
    }}>
      <p style={{ color: BASE.textMid, fontSize: 10, margin: "0 0 6px", fontWeight: 700 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || accent, fontSize: 12, fontWeight: 700, margin: "2px 0" }}>
          {p.name}: {typeof p.value === "number" && p.value > 1000
            ? `₹${p.value.toLocaleString()}`
            : p.value}
        </p>
      ))}
    </div>
  );
};

const Empty = ({ msg = "No data yet", icon = "○" }) => (
  <div style={{ padding: "32px 16px", textAlign: "center", color: BASE.textDim }}>
    <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
    <p style={{ fontSize: 12, margin: 0 }}>{msg}</p>
  </div>
);

const Loader = ({ accent }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      border: `3px solid ${BASE.border}`,
      borderTopColor: accent,
      animation: "spin 0.8s linear infinite",
    }} />
  </div>
);

const NotifIcon = ({ type }) => {
  const map = { warning: ["⚠", BASE.yellow], success: ["✓", BASE.green], info: ["ℹ", "#60A5FA"], error: ["✕", BASE.red] };
  const [icon, color] = map[type] || ["ℹ", "#60A5FA"];
  return (
    <span style={{
      width: 22, height: 22, borderRadius: "50%",
      background: color + "25", color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 900, flexShrink: 0,
    }}>{icon}</span>
  );
};

// ═══════════════════════════════════════════════════════════════
//  OVERVIEW PAGE (shared across all niches)
// ═══════════════════════════════════════════════════════════════
const OverviewPage = ({ data, niche, accent }) => {
  if (!data) return <Loader accent={accent} />;

  const { kpis, revenueChart, notifications } = data;
  const theme = NICHE_THEMES[niche];
  const cur = BUSINESS_CONFIG.currency;

  // Build niche-specific KPI cards
  const kpiCards = niche === "restaurant"
    ? [
        { label: "Today's Orders", value: kpis.todayOrders, icon: "🛒", color: "#60A5FA", sub: `${kpis.pendingOrders} pending`, trend: 8 },
        { label: "Today's Revenue", value: `${cur}${kpis.todayRevenue.toLocaleString()}`, icon: "💰", color: accent, sub: "Daily total", trend: 12 },
        { label: "Avg Ticket", value: `${cur}${kpis.avgTicket}`, icon: "🎟", color: BASE.purple, sub: "Per order", trend: 3 },
        { label: "Rating", value: `⭐ ${kpis.rating}`, icon: "⭐", color: BASE.yellow, sub: "All platforms" },
        { label: "Total Revenue", value: `${cur}${(kpis.totalRevenue / 1000).toFixed(0)}K`, icon: "📈", color: BASE.green, sub: "All time", trend: 16 },
        { label: "Net Profit", value: `${cur}${(kpis.netProfit / 1000).toFixed(0)}K`, icon: "✦", color: accent, sub: `${Math.round(kpis.netProfit / kpis.totalRevenue * 100)}% margin` },
      ]
    : niche === "salon"
    ? [
        { label: "Today's Appointments", value: kpis.todayAppointments, icon: "📋", color: accent, sub: `${kpis.pendingAppts} pending`, trend: 5 },
        { label: "Today's Revenue", value: `${cur}${kpis.todayRevenue.toLocaleString()}`, icon: "💰", color: "#60A5FA", sub: "Daily total", trend: 18 },
        { label: "Avg Ticket", value: `${cur}${kpis.avgTicket.toLocaleString()}`, icon: "🎟", color: BASE.purple, sub: "Per appointment", trend: 7 },
        { label: "Rating", value: `⭐ ${kpis.rating}`, icon: "⭐", color: BASE.yellow, sub: "Google & others" },
        { label: "Total Revenue", value: `${cur}${(kpis.totalRevenue / 1000).toFixed(0)}K`, icon: "📈", color: BASE.green, sub: "All time", trend: 22 },
        { label: "Net Profit", value: `${cur}${(kpis.netProfit / 1000).toFixed(0)}K`, icon: "✦", color: accent, sub: `${Math.round(kpis.netProfit / kpis.totalRevenue * 100)}% margin` },
      ]
    : [
        { label: "Total Students", value: kpis.totalStudents, icon: "👨‍🎓", color: accent, sub: `${kpis.activeStudents} active`, trend: 6 },
        { label: "Today's Attendance", value: kpis.attendanceToday, icon: "📅", color: "#60A5FA", sub: `${Math.round(kpis.attendanceToday / kpis.activeStudents * 100)}% rate` },
        { label: "Monthly Revenue", value: `${cur}${(kpis.totalRevenue / 1000).toFixed(0)}K`, icon: "💰", color: BASE.green, sub: "Fees collected", trend: 9 },
        { label: "Pending Fees", value: `${cur}${(kpis.pendingFees / 1000).toFixed(0)}K`, icon: "⚠", color: BASE.yellow, sub: "Need collection" },
        { label: "Avg Performance", value: `${kpis.avgScore}%`, icon: "🏆", color: BASE.purple, sub: "Across all courses" },
        { label: "Net Profit", value: `${cur}${(kpis.netProfit / 1000).toFixed(0)}K`, icon: "✦", color: accent, sub: `${Math.round(kpis.netProfit / kpis.totalRevenue * 100)}% margin` },
      ];

  const chartDataKey1 = niche === "sports" ? "present" : "revenue";
  const chartDataKey2 = niche === "sports" ? "absent" : "expenses";
  const weeklyChart = niche === "restaurant" ? data.ordersChart : niche === "salon" ? data.appointmentsChart : data.attendanceChart;
  const weeklyKey = niche === "restaurant" ? "orders" : niche === "salon" ? "appts" : "present";
  const weeklyLabel = niche === "restaurant" ? "Orders" : niche === "salon" ? "Appointments" : "Present";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {kpiCards.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      {/* Revenue chart */}
      <Card>
        <SectionHead title="Revenue vs Expenses — 6 Months" />
        <ResponsiveContainer width="100%" height={170}>
          <AreaChart data={revenueChart} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="ovRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accent} stopOpacity={0.35} />
                <stop offset="95%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ovExp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BASE.red} stopOpacity={0.25} />
                <stop offset="95%" stopColor={BASE.red} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={BASE.border} />
            <XAxis dataKey="month" tick={{ fill: BASE.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: BASE.textDim, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${cur}${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<CustomTooltip accent={accent} />} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke={accent} fill="url(#ovRev)" strokeWidth={2.5} />
            <Area type="monotone" dataKey="expenses" name="Expenses" stroke={BASE.red} fill="url(#ovExp)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Weekly activity + pie side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card>
          <SectionHead title={`Weekly ${weeklyLabel}`} />
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={weeklyChart} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={BASE.border} />
              <XAxis dataKey="t" tick={{ fill: BASE.textDim, fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: BASE.textDim, fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip accent={accent} />} />
              <Bar dataKey={weeklyKey} name={weeklyLabel} fill={accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionHead title={niche === "restaurant" ? "By Platform" : niche === "salon" ? "Booking Source" : "By Course"} />
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie
                data={niche === "sports" ? data.courseChart : data.platformChart}
                cx="50%" cy="50%" innerRadius={32} outerRadius={52}
                paddingAngle={2} dataKey="value"
              >
                {(niche === "sports" ? data.courseChart : data.platformChart).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip accent={accent} />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", marginTop: 4 }}>
            {(niche === "sports" ? data.courseChart : data.platformChart).slice(0, 4).map((p, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: BASE.textMid }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, display: "inline-block" }} />
                {p.name}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Notifications */}
      <Card>
        <SectionHead title="Recent Alerts" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifications.map((n, i) => {
            const colors = { warning: BASE.yellow, success: BASE.green, info: "#60A5FA", error: BASE.red };
            const c = colors[n.type];
            return (
              <div key={i} style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                padding: "10px 12px", background: c + "0D",
                borderRadius: 10, border: `1px solid ${c}22`,
              }}>
                <NotifIcon type={n.type} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: BASE.text, fontSize: 12, margin: 0, lineHeight: 1.4 }}>{n.msg}</p>
                  <p style={{ color: BASE.textDim, fontSize: 10, margin: "2px 0 0" }}>{n.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  RESTAURANT PAGES
// ═══════════════════════════════════════════════════════════════
const RestaurantOrdersPage = ({ data, accent }) => {
  const [filter, setFilter] = useState("all");
  if (!data) return <Loader accent={accent} />;
  const statuses = ["all", "pending", "preparing", "delivered", "cancelled"];
  const filtered = filter === "all" ? data.recentOrders : data.recentOrders.filter(o => o.status === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
        <KpiCard label="Today's Orders" value={data.kpis.todayOrders} color={accent} icon="🛒" sub="All statuses" />
        <KpiCard label="Today's Revenue" value={`₹${data.kpis.todayRevenue.toLocaleString()}`} color={BASE.green} icon="💰" sub="Delivered orders" />
        <KpiCard label="Pending" value={data.kpis.pendingOrders} color={BASE.yellow} icon="⏳" sub="Need attention" />
        <KpiCard label="Avg Ticket" value={`₹${data.kpis.avgTicket}`} color={BASE.purple} icon="🎟" sub="Per order" />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            background: filter === s ? accent + "22" : "transparent",
            color: filter === s ? accent : BASE.textDim,
            border: `1px solid ${filter === s ? accent + "55" : BASE.border}`,
            borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize",
          }}>{s === "all" ? "All Orders" : s}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((o, i) => (
          <Card key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ color: accent, fontSize: 12, fontWeight: 800 }}>{o.id}</span>
                  <Badge color="#60A5FA" size="sm">{o.platform}</Badge>
                </div>
                <p style={{ color: BASE.text, fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>{o.customer}</p>
                <p style={{ color: BASE.textMid, fontSize: 11, margin: 0 }}>{o.items}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: BASE.green, fontSize: 15, fontWeight: 900, margin: "0 0 4px" }}>₹{o.amount}</p>
                <StatusBadge status={o.status} />
                <p style={{ color: BASE.textDim, fontSize: 10, margin: "4px 0 0" }}>{o.time}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const RestaurantInventoryPage = ({ data, accent }) => {
  if (!data) return <Loader accent={accent} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {[
          { label: "Items OK", value: data.inventory.filter(i => i.status === "ok").length, color: BASE.green },
          { label: "Low Stock", value: data.inventory.filter(i => i.status === "low").length, color: BASE.yellow },
          { label: "Reorder Now", value: data.inventory.filter(i => i.status === "reorder").length, color: BASE.red },
        ].map((s, i) => (
          <div key={i} style={{ background: BASE.card, border: `1px solid ${s.color}44`, borderRadius: 14, padding: 14, textAlign: "center" }}>
            <p style={{ color: s.color, fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>{s.value}</p>
            <p style={{ color: BASE.textDim, fontSize: 10, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.inventory.map((item, i) => (
          <Card key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ color: BASE.text, fontSize: 13, fontWeight: 700, margin: "0 0 4px" }}>{item.item}</p>
                <p style={{ color: BASE.textMid, fontSize: 11, margin: 0 }}>
                  {item.qty} {item.unit} · Reorder at {item.reorder} {item.unit}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <StatusBadge status={item.status} />
                <div style={{ marginTop: 8, height: 4, width: 80, background: BASE.border, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(100, (item.qty / (item.reorder * 2)) * 100)}%`,
                    background: item.status === "ok" ? BASE.green : item.status === "low" ? BASE.yellow : BASE.red,
                    borderRadius: 4,
                  }} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const TopItemsPage = ({ data, accent, label, itemKey, revenueKey }) => {
  if (!data) return <Loader accent={accent} />;
  const items = data.topItems || data.topServices || data.topCourses || [];
  const nameKey = "name";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Card>
        <SectionHead title={`Top ${label} by Revenue`} />
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={items} layout="vertical" margin={{ top: 4, right: 60, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={BASE.border} horizontal={false} />
            <XAxis type="number" tick={{ fill: BASE.textDim, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
            <YAxis type="category" dataKey={nameKey} tick={{ fill: BASE.textMid, fontSize: 9 }} axisLine={false} tickLine={false} width={90} />
            <Tooltip content={<CustomTooltip accent={accent} />} />
            <Bar dataKey={revenueKey} name="Revenue" fill={accent} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      {items.map((item, i) => (
        <Card key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                width: 32, height: 32, borderRadius: 10, background: accent + "22",
                color: accent, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 900, flexShrink: 0,
              }}>{i + 1}</span>
              <div>
                <p style={{ color: BASE.text, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{item[nameKey]}</p>
                <p style={{ color: BASE.textMid, fontSize: 11, margin: 0 }}>
                  {(item[itemKey] || item.bookings || item.students || item.orders)} {label === "Items" ? "orders" : label === "Services" ? "bookings" : "students"}
                </p>
              </div>
            </div>
            <p style={{ color: BASE.green, fontSize: 14, fontWeight: 900, margin: 0 }}>
              ₹{(item[revenueKey] || item.revenue).toLocaleString()}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  SALON PAGES
// ═══════════════════════════════════════════════════════════════
const SalonAppointmentsPage = ({ data, accent }) => {
  const [filter, setFilter] = useState("all");
  if (!data) return <Loader accent={accent} />;
  const statuses = ["all", "completed", "in-progress", "confirmed", "scheduled", "cancelled"];
  const filtered = filter === "all" ? data.recentAppointments : data.recentAppointments.filter(a => a.status === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
        <KpiCard label="Today's Bookings" value={data.kpis.todayAppointments} color={accent} icon="📋" sub={`${data.kpis.pendingAppts} pending`} />
        <KpiCard label="Today's Revenue" value={`₹${data.kpis.todayRevenue.toLocaleString()}`} color={BASE.green} icon="💰" sub="Completed" />
        <KpiCard label="Total Clients" value={data.clients?.total || 0} color="#60A5FA" icon="👥" sub={`${data.clients?.vip || 0} VIP`} />
        <KpiCard label="Avg Ticket" value={`₹${data.kpis.avgTicket.toLocaleString()}`} color={BASE.purple} icon="🎟" sub="Per appointment" />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            background: filter === s ? accent + "22" : "transparent",
            color: filter === s ? accent : BASE.textDim,
            border: `1px solid ${filter === s ? accent + "55" : BASE.border}`,
            borderRadius: 20, padding: "5px 12px", fontSize: 10, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize",
          }}>{s === "all" ? "All" : s.replace("-", " ")}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((a, i) => (
          <Card key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ color: accent, fontSize: 11, fontWeight: 800 }}>{a.id}</span>
                  <span style={{ color: BASE.textMid, fontSize: 11 }}>{a.time}</span>
                </div>
                <p style={{ color: BASE.text, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{a.client}</p>
                <p style={{ color: BASE.textMid, fontSize: 11, margin: "0 0 4px" }}>{a.service}</p>
                <span style={{ color: BASE.textDim, fontSize: 10 }}>Staff: {a.staff}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: BASE.green, fontSize: 15, fontWeight: 900, margin: "0 0 6px" }}>₹{a.amount.toLocaleString()}</p>
                <StatusBadge status={a.status} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const SalonClientsPage = ({ data, accent }) => {
  if (!data) return <Loader accent={accent} />;
  const { clients } = data;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
        <KpiCard label="Total Clients" value={clients.total} color={accent} icon="👥" sub="All time" />
        <KpiCard label="VIP Members" value={clients.vip} color={BASE.yellow} icon="⭐" sub="Top tier" />
        <KpiCard label="Regular" value={clients.regular} color="#60A5FA" icon="👤" sub="Active clients" />
        <KpiCard label="New This Month" value={clients.newThisMonth} color={BASE.green} icon="✨" sub="New sign-ups" />
      </div>
      <Card>
        <SectionHead title="Client Tiers Distribution" />
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={[
                { name: "VIP", value: clients.vip, color: BASE.yellow },
                { name: "Regular", value: clients.regular, color: "#60A5FA" },
                { name: "New", value: clients.newThisMonth, color: BASE.green },
              ]}
              cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value"
            >
              {[BASE.yellow, "#60A5FA", BASE.green].map((c, i) => <Cell key={i} fill={c} />)}
            </Pie>
            <Tooltip content={<CustomTooltip accent={accent} />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 4 }}>
          {[["VIP", BASE.yellow], ["Regular", "#60A5FA"], ["New", BASE.green]].map(([n, c]) => (
            <span key={n} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: BASE.textMid }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block" }} />{n}
            </span>
          ))}
        </div>
      </Card>
      <Card>
        <SectionHead title="Loyalty Program" />
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: BASE.yellow, fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>{clients.loyaltyPoints?.toLocaleString() || 0}</p>
            <p style={{ color: BASE.textDim, fontSize: 10, margin: 0, textTransform: "uppercase" }}>Total Points</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: accent, fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>{Math.round((clients.loyaltyPoints || 0) / clients.total)}</p>
            <p style={{ color: BASE.textDim, fontSize: 10, margin: 0, textTransform: "uppercase" }}>Avg Per Client</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: BASE.green, fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>₹{Math.round((clients.loyaltyPoints || 0) * 0.5).toLocaleString()}</p>
            <p style={{ color: BASE.textDim, fontSize: 10, margin: 0, textTransform: "uppercase" }}>Points Value</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  SPORTS ACADEMY PAGES
// ═══════════════════════════════════════════════════════════════
const SportsStudentsPage = ({ data, accent }) => {
  const [filter, setFilter] = useState("all");
  if (!data) return <Loader accent={accent} />;
  const filtered = filter === "all" ? data.recentStudents : data.recentStudents.filter(s => s.status === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
        <KpiCard label="Total Students" value={data.kpis.totalStudents} color={accent} icon="👨‍🎓" sub="Enrolled" />
        <KpiCard label="Active" value={data.kpis.activeStudents} color={BASE.green} icon="✓" sub={`${Math.round(data.kpis.activeStudents / data.kpis.totalStudents * 100)}% active`} />
        <KpiCard label="Pending Fees" value={`₹${(data.kpis.pendingFees / 1000).toFixed(0)}K`} color={BASE.yellow} icon="⚠" sub="Collection needed" />
        <KpiCard label="Avg Performance" value={`${data.kpis.avgScore}%`} color={BASE.purple} icon="🏆" sub="All students" />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["all", "active", "on-leave"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            background: filter === s ? accent + "22" : "transparent",
            color: filter === s ? accent : BASE.textDim,
            border: `1px solid ${filter === s ? accent + "55" : BASE.border}`,
            borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize",
          }}>{s === "all" ? "All Students" : s.replace("-", " ")}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((s, i) => (
          <Card key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: accent + "22", color: accent,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 900,
                }}>{s.name.charAt(0)}</div>
                <div>
                  <p style={{ color: BASE.text, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{s.name}</p>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ color: BASE.textMid, fontSize: 11 }}>{s.course}</span>
                    <StatusBadge status={s.status} />
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: BASE.green, fontSize: 14, fontWeight: 900, margin: "0 0 2px" }}>₹{s.fee.toLocaleString()}/mo</p>
                <p style={{ color: BASE.textDim, fontSize: 10, margin: 0 }}>Joined {s.joined}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const SportsAttendancePage = ({ data, accent }) => {
  if (!data) return <Loader accent={accent} />;
  const rate = Math.round(data.kpis.attendanceToday / data.kpis.activeStudents * 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
        <KpiCard label="Present Today" value={data.kpis.attendanceToday} color={BASE.green} icon="✓" sub={`${rate}% attendance`} />
        <KpiCard label="Absent Today" value={data.kpis.activeStudents - data.kpis.attendanceToday} color={BASE.red} icon="✕" sub="Need follow-up" />
      </div>
      <Card>
        <SectionHead title="Weekly Attendance Overview" />
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.attendanceChart} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={BASE.border} />
            <XAxis dataKey="t" tick={{ fill: BASE.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: BASE.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip accent={accent} />} />
            <Bar dataKey="present" name="Present" fill={BASE.green} radius={[4, 4, 0, 0]} stackId="a" />
            <Bar dataKey="absent" name="Absent" fill={BASE.red} radius={[4, 4, 0, 0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <SectionHead title="Overall Rate This Month" />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", width: 80, height: 80 }}>
            <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="40" cy="40" r="34" fill="none" stroke={BASE.border} strokeWidth="8" />
              <circle cx="40" cy="40" r="34" fill="none" stroke={accent} strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 34 * rate / 100} ${2 * Math.PI * 34}`}
                strokeLinecap="round" />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
              <span style={{ color: accent, fontSize: 14, fontWeight: 900 }}>{rate}%</span>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            {[["Present", data.kpis.attendanceToday, BASE.green], ["Absent", data.kpis.activeStudents - data.kpis.attendanceToday, BASE.red]].map(([l, v, c]) => (
              <div key={l}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: BASE.textMid, fontSize: 11 }}>{l}</span>
                  <span style={{ color: c, fontSize: 11, fontWeight: 700 }}>{v}</span>
                </div>
                <div style={{ height: 4, background: BASE.border, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(v / data.kpis.activeStudents) * 100}%`, background: c, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

const FeeTrackerPage = ({ data, accent }) => {
  if (!data) return <Loader accent={accent} />;
  const { feeStatus } = data;
  const total = Object.values(feeStatus).reduce((a, b) => a + b, 0);
  const feeColors = { paid: BASE.green, pending: BASE.red, partial: BASE.yellow, scholarship: BASE.purple };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
        <KpiCard label="Fees Collected" value={`₹${(data.kpis.totalRevenue / 1000).toFixed(0)}K`} color={BASE.green} icon="💰" sub="This month" trend={9} />
        <KpiCard label="Pending Amount" value={`₹${(data.kpis.pendingFees / 1000).toFixed(0)}K`} color={BASE.red} icon="⚠" sub="Needs collection" />
        <KpiCard label="Paid Students" value={feeStatus.paid} color={BASE.green} icon="✓" sub={`${Math.round(feeStatus.paid / total * 100)}% of total`} />
        <KpiCard label="Scholarships" value={feeStatus.scholarship} color={BASE.purple} icon="🎓" sub="Fee waived" />
      </div>

      <Card>
        <SectionHead title="Fee Collection Status" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Object.entries(feeStatus).map(([status, count]) => (
            <div key={status}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: BASE.textMid, fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>{status}</span>
                <span style={{ color: feeColors[status], fontSize: 12, fontWeight: 800 }}>{count} students</span>
              </div>
              <div style={{ height: 6, background: BASE.border, borderRadius: 6, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${(count / total) * 100}%`,
                  background: feeColors[status],
                  borderRadius: 6, transition: "width 0.4s",
                }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHead title="Fee Status Breakdown" />
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={Object.entries(feeStatus).map(([k, v]) => ({ name: k, value: v, color: feeColors[k] }))}
              cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="value">
              {Object.keys(feeStatus).map((k, i) => <Cell key={i} fill={feeColors[k]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip accent={accent} />} />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  SHARED PAGES (Finances, Social, Inventory, Settings)
// ═══════════════════════════════════════════════════════════════
const FinancesPage = ({ data, niche, accent }) => {
  if (!data) return <Loader accent={accent} />;
  const { kpis, revenueChart } = data;
  const cur = BUSINESS_CONFIG.currency;
  const margin = Math.round(kpis.netProfit / kpis.totalRevenue * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
        <KpiCard label="Total Revenue" value={`${cur}${(kpis.totalRevenue / 1000).toFixed(0)}K`} color={BASE.green} icon="📈" sub="All time" trend={14} />
        <KpiCard label="Total Expenses" value={`${cur}${(kpis.totalExpenses / 1000).toFixed(0)}K`} color={BASE.red} icon="📉" sub="All time" />
        <KpiCard label="Net Profit" value={`${cur}${(kpis.netProfit / 1000).toFixed(0)}K`} color={accent} icon="💎" sub="After expenses" trend={margin} />
        <KpiCard label="Profit Margin" value={`${margin}%`} color={BASE.purple} icon="%" sub="Net/Revenue" />
      </div>

      <Card>
        <SectionHead title="6-Month Revenue Trend" />
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={revenueChart} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="finRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BASE.green} stopOpacity={0.35} />
                <stop offset="95%" stopColor={BASE.green} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="finExp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BASE.red} stopOpacity={0.25} />
                <stop offset="95%" stopColor={BASE.red} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={BASE.border} />
            <XAxis dataKey="month" tick={{ fill: BASE.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: BASE.textDim, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${cur}${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<CustomTooltip accent={accent} />} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke={BASE.green} fill="url(#finRev)" strokeWidth={2.5} />
            <Area type="monotone" dataKey="expenses" name="Expenses" stroke={BASE.red} fill="url(#finExp)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionHead title="Monthly Net Profit" />
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={revenueChart.map(d => ({ ...d, net: d.revenue - d.expenses }))} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={BASE.border} />
            <XAxis dataKey="month" tick={{ fill: BASE.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: BASE.textDim, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${cur}${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<CustomTooltip accent={accent} />} />
            <Bar dataKey="net" name="Net Profit" fill={accent} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionHead title="Supabase Integration" actionLabel="Connect DB" actionColor={accent} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {["transactions", "monthly_summary", "expense_categories"].map(table => (
            <div key={table} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 12px", background: BASE.surface, borderRadius: 10,
              border: `1px solid ${BASE.border}`,
            }}>
              <div>
                <p style={{ color: BASE.text, fontSize: 12, fontWeight: 600, margin: "0 0 2px", fontFamily: "monospace" }}>{table}</p>
                <p style={{ color: BASE.textDim, fontSize: 10, margin: 0 }}>Supabase table · Not connected</p>
              </div>
              <Badge color={BASE.textDim}>Pending</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const SocialPage = ({ data, niche, accent }) => {
  if (!data) return <Loader accent={accent} />;
  const { social } = data;
  const platformColors = { instagram: "#E879A0", facebook: "#60A5FA", youtube: "#F87171", zomato: "#F87171", whatsapp: "#34D399", twitter: "#60A5FA" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {Object.entries(social).map(([platform, stats]) => {
        const color = platformColors[platform] || accent;
        return (
          <Card key={platform} glow accent={color}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ color, fontSize: 14, fontWeight: 900, textTransform: "capitalize" }}>{platform}</span>
              <Badge color={color}>Connected</Badge>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {Object.entries(stats).map(([k, v]) => (
                <div key={k} style={{ background: BASE.surface, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                  <p style={{ color, fontSize: 16, fontWeight: 900, margin: "0 0 3px" }}>{v}</p>
                  <p style={{ color: BASE.textDim, fontSize: 9, margin: 0, textTransform: "capitalize", letterSpacing: "0.05em" }}>{k.replace(/([A-Z])/g, " $1").trim()}</p>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      <Card>
        <SectionHead title="Content Ideas for this Week" />
        {(niche === "restaurant"
          ? ["🍽 Feature your chef's special — Reel", "📦 Unboxing new seasonal menu — Story", "⭐ Share a 5-star customer review — Post", "🎬 Behind the scenes cooking — Reel"]
          : niche === "salon"
          ? ["✨ Before & After transformation — Reel", "💅 New nail art collection — Post", "🎂 Client birthday shoutout — Story", "💇 How to maintain keratin at home — Video"]
          : ["🏅 Student achievement spotlight — Post", "🎯 Training drill of the week — Reel", "📊 Monthly progress update — Story", "🏆 Tournament victory celebration — Post"]
        ).map((idea, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            background: BASE.surface, borderRadius: 10, border: `1px solid ${BASE.border}`,
            marginBottom: 8,
          }}>
            <span style={{ color: accent, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>#{i + 1}</span>
            <p style={{ color: BASE.text, fontSize: 12, margin: 0 }}>{idea}</p>
          </div>
        ))}
      </Card>
    </div>
  );
};

const SettingsPage = ({ niche, accent }) => {
  const [bizName, setBizName] = useState(BUSINESS_CONFIG.name);
  const [selNiche, setSelNiche] = useState(niche);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card glow accent={accent}>
        <SectionHead title="Business Configuration" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Business Name", value: bizName, setter: setBizName, placeholder: "Enter business name" },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label}>
              <label style={{ color: BASE.textMid, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>{label}</label>
              <input value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  border: `1px solid ${BASE.border}`, background: BASE.surface,
                  color: BASE.text, fontSize: 13, fontFamily: "inherit",
                  boxSizing: "border-box", outline: "none",
                }} />
            </div>
          ))}
          <div>
            <label style={{ color: BASE.textMid, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6 }}>Business Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {Object.entries(NICHE_THEMES).map(([key, theme]) => (
                <button key={key} onClick={() => setSelNiche(key)} style={{
                  padding: "12px 8px", borderRadius: 12,
                  border: `2px solid ${selNiche === key ? accent : BASE.border}`,
                  background: selNiche === key ? accent + "18" : BASE.surface,
                  color: selNiche === key ? accent : BASE.textMid,
                  cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}>
                  <span style={{ fontSize: 20 }}>{theme.icon}</span>
                  <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHead title="Supabase Database" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { key: "VITE_SUPABASE_URL", placeholder: "https://xxxx.supabase.co" },
            { key: "VITE_SUPABASE_ANON_KEY", placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          ].map(({ key, placeholder }) => (
            <div key={key}>
              <label style={{ color: BASE.textMid, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6, fontFamily: "monospace" }}>{key}</label>
              <input placeholder={placeholder} style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1px solid ${BASE.border}`, background: BASE.surface,
                color: BASE.textMid, fontSize: 12, fontFamily: "monospace",
                boxSizing: "border-box", outline: "none",
              }} />
            </div>
          ))}
          <button style={{
            background: accent, color: "#000", border: "none", borderRadius: 10,
            padding: "12px", fontSize: 13, fontWeight: 800, cursor: "pointer",
            fontFamily: "inherit", marginTop: 4,
          }}>Connect Supabase →</button>
        </div>
      </Card>

      <Card>
        <SectionHead title="n8n Webhook Endpoints" />
        {(niche === "restaurant"
          ? ["new-order","daily-report","low-stock-alert","finance-sync"]
          : niche === "salon"
          ? ["new-appointment","birthday-offer","low-stock-alert","review-request"]
          : ["new-student","fee-reminder","attendance-report","performance-report"]
        ).map(hook => (
          <div key={hook} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 12px", background: BASE.surface, borderRadius: 10,
            border: `1px solid ${BASE.border}`, marginBottom: 8,
          }}>
            <div>
              <p style={{ color: BASE.text, fontSize: 12, fontFamily: "monospace", fontWeight: 600, margin: "0 0 2px" }}>/webhook/{hook}</p>
              <p style={{ color: BASE.textDim, fontSize: 10, margin: 0 }}>POST · Ready to connect</p>
            </div>
            <Badge color={BASE.yellow}>n8n</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const niche = BUSINESS_CONFIG.niche;
  const theme = NICHE_THEMES[niche];
  const accent = getNicheAccent(niche);
  const { data, loading } = useData(niche);

  const [activePage, setActivePage] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const navigate = useCallback((page) => {
    setActivePage(page);
    setMenuOpen(false);
  }, []);

  // Render the active page component
  const renderPage = () => {
    if (loading) return <Loader accent={accent} />;
    const pg = activePage;

    // Shared pages
    if (pg === "finances") return <FinancesPage data={data} niche={niche} accent={accent} />;
    if (pg === "social") return <SocialPage data={data} niche={niche} accent={accent} />;
    if (pg === "settings") return <SettingsPage niche={niche} accent={accent} />;
    if (pg === "overview") return <OverviewPage data={data} niche={niche} accent={accent} />;

    // Restaurant pages
    if (niche === "restaurant") {
      if (pg === "orders") return <RestaurantOrdersPage data={data} accent={accent} />;
      if (pg === "inventory") return <RestaurantInventoryPage data={data} accent={accent} />;
      if (pg === "menu") return <TopItemsPage data={data} accent={accent} label="Items" itemKey="orders" revenueKey="revenue" />;
      if (pg === "delivery") return <RestaurantOrdersPage data={data} accent={accent} />;
    }

    // Salon pages
    if (niche === "salon") {
      if (pg === "appointments") return <SalonAppointmentsPage data={data} accent={accent} />;
      if (pg === "clients") return <SalonClientsPage data={data} accent={accent} />;
      if (pg === "services") return <TopItemsPage data={data} accent={accent} label="Services" itemKey="bookings" revenueKey="revenue" />;
      if (pg === "inventory") return <RestaurantInventoryPage data={data} accent={accent} />;
    }

    // Sports pages
    if (niche === "sports") {
      if (pg === "students") return <SportsStudentsPage data={data} accent={accent} />;
      if (pg === "attendance") return <SportsAttendancePage data={data} accent={accent} />;
      if (pg === "fees") return <FeeTrackerPage data={data} accent={accent} />;
      if (pg === "performance") return <TopItemsPage data={data} accent={accent} label="Courses" itemKey="students" revenueKey="revenue" />;
    }

    return <OverviewPage data={data} niche={niche} accent={accent} />;
  };

  const currentIdx = theme.navItems.indexOf(activePage);
  const pageTitle = theme.navLabels[currentIdx] || "Overview";

  return (
    <div style={{ minHeight: "100vh", background: BASE.bg, color: BASE.text, fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: ${BASE.surface}; }
        ::-webkit-scrollbar-thumb { background: ${BASE.border}; border-radius: 4px; }
        button, input, select, textarea { font-family: inherit; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes splash { 0%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
        .page-anim { animation: fadeUp 0.25s ease; }

        /* Desktop layout */
        @media (min-width: 768px) {
          .app-shell { flex-direction: row !important; }
          .sidebar { display: flex !important; }
          .mobile-top { display: none !important; }
          .mobile-btm { display: none !important; }
          .main-area { padding: 28px 32px !important; padding-bottom: 28px !important; }
          .page-header { padding: 18px 32px !important; }
          .kpi-grid { grid-template-columns: repeat(3,1fr) !important; }
        }
        @media (min-width: 1024px) {
          .kpi-grid { grid-template-columns: repeat(3,1fr) !important; }
          .chart-row { grid-template-columns: 2fr 1fr !important; }
        }
      `}</style>

      {/* ── Splash screen ── */}
      {!splashDone && (
        <div style={{
          position: "fixed", inset: 0, background: BASE.bg, zIndex: 9999,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 16, animation: "splash 1.2s ease forwards",
          pointerEvents: "none",
        }}>
          <div style={{ fontSize: 48 }}>{theme.icon}</div>
          <p style={{ color: accent, fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em" }}>
            {BUSINESS_CONFIG.name}
          </p>
          <p style={{ color: BASE.textDim, fontSize: 13 }}>{theme.label}</p>
          <div style={{
            width: 40, height: 3, background: BASE.border, borderRadius: 4, overflow: "hidden", marginTop: 8
          }}>
            <div style={{
              height: "100%", background: accent, borderRadius: 4,
              animation: "splash 1.2s ease forwards", width: "100%",
            }} />
          </div>
        </div>
      )}

      <div className="app-shell" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* ── Desktop Sidebar ── */}
        <aside className="sidebar" style={{
          display: "none", width: 220, background: BASE.surface,
          borderRight: `1px solid ${BASE.border}`,
          position: "sticky", top: 0, height: "100vh", flexShrink: 0,
          flexDirection: "column",
        }}>
          {/* Logo */}
          <div style={{ padding: "20px 18px", borderBottom: `1px solid ${BASE.border}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${accent}, ${theme.accent2 || accent})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 900, color: "#000", flexShrink: 0,
            }}>{BUSINESS_CONFIG.logo}</div>
            <div>
              <p style={{ color: BASE.text, fontSize: 14, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>{BUSINESS_CONFIG.name}</p>
              <p style={{ color: BASE.textDim, fontSize: 10, margin: 0 }}>{theme.label}</p>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
            {theme.navItems.map((key, i) => {
              const on = activePage === key;
              return (
                <button key={key} onClick={() => navigate(key)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  borderRadius: 10, border: "none", cursor: "pointer",
                  background: on ? accent + "20" : "transparent",
                  color: on ? accent : BASE.textDim,
                  fontSize: 13, fontWeight: on ? 700 : 500, textAlign: "left",
                  transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: 15, lineHeight: 1 }}>{theme.navIcons[i]}</span>
                  <span>{theme.navLabels[i]}</span>
                </button>
              );
            })}
          </nav>

          {/* Niche switcher */}
          <div style={{ padding: "12px 8px", borderTop: `1px solid ${BASE.border}` }}>
            <p style={{ color: BASE.textDim, fontSize: 9, margin: "0 0 8px 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Switch Niche</p>
            {Object.entries(NICHE_THEMES).map(([key, t]) => (
              <div key={key} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                borderRadius: 8, background: niche === key ? accent + "15" : "transparent",
                marginBottom: 2, cursor: "default",
              }}>
                <span style={{ fontSize: 12 }}>{t.icon}</span>
                <span style={{ color: niche === key ? accent : BASE.textDim, fontSize: 11, fontWeight: niche === key ? 700 : 400 }}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </span>
                {niche === key && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: accent }} />}
              </div>
            ))}
            <p style={{ color: BASE.textDim, fontSize: 9, margin: "8px 0 0 4px" }}>Edit BUSINESS_CONFIG to switch</p>
          </div>

          {/* User */}
          <div style={{ padding: "14px 18px", borderTop: `1px solid ${BASE.border}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", background: accent + "22",
              display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontWeight: 900, fontSize: 12,
            }}>A</div>
            <div>
              <p style={{ color: BASE.text, fontSize: 11, fontWeight: 700, margin: 0 }}>Admin</p>
              <p style={{ color: BASE.textDim, fontSize: 9, margin: 0 }}>{BUSINESS_CONFIG.city}</p>
            </div>
          </div>
        </aside>

        {/* ── Mobile Top Bar ── */}
        <header className="mobile-top" style={{
          background: BASE.surface, borderBottom: `1px solid ${BASE.border}`,
          padding: "11px 16px", display: "flex", alignItems: "center",
          justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: `linear-gradient(135deg, ${accent}, ${theme.accent2 || accent})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 900, color: "#000",
            }}>{BUSINESS_CONFIG.logo}</div>
            <div>
              <p style={{ color: BASE.text, fontSize: 13, fontWeight: 900, margin: 0 }}>{BUSINESS_CONFIG.name}</p>
              <p style={{ color: BASE.textDim, fontSize: 9, margin: 0 }}>{pageTitle}</p>
            </div>
          </div>
          <button onClick={() => setMenuOpen(o => !o)} style={{
            background: BASE.card, border: `1px solid ${BASE.border}`,
            borderRadius: 8, padding: "7px 10px", color: BASE.textMid, cursor: "pointer", fontSize: 16,
          }}>☰</button>
        </header>

        {/* ── Mobile Slide Menu ── */}
        {menuOpen && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
          }} onClick={() => setMenuOpen(false)}>
            <div style={{
              background: BASE.surface, borderBottom: `1px solid ${BASE.border}`,
              padding: "16px",
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{theme.icon}</span>
                  <p style={{ color: BASE.text, fontSize: 15, fontWeight: 900, margin: 0 }}>{BUSINESS_CONFIG.name}</p>
                </div>
                <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", color: BASE.textMid, fontSize: 20, cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {theme.navItems.map((key, i) => (
                  <button key={key} onClick={() => navigate(key)} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "12px 14px",
                    borderRadius: 12, border: `1px solid ${activePage === key ? accent + "55" : BASE.border}`,
                    background: activePage === key ? accent + "18" : BASE.card,
                    color: activePage === key ? accent : BASE.textMid,
                    fontSize: 13, fontWeight: activePage === key ? 700 : 500,
                    cursor: "pointer",
                  }}>
                    <span style={{ fontSize: 16 }}>{theme.navIcons[i]}</span>
                    <span>{theme.navLabels[i]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Main Content ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Page header */}
          <div className="page-header" style={{
            padding: "12px 16px", borderBottom: `1px solid ${BASE.border}`,
            background: BASE.surface, display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <h1 style={{ color: BASE.text, fontSize: 16, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>{pageTitle}</h1>
              <p style={{ color: BASE.textDim, fontSize: 10, margin: "2px 0 0" }}>
                {theme.label} · {BUSINESS_CONFIG.city}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: BASE.green, boxShadow: `0 0 6px ${BASE.green}`, display: "inline-block" }} />
              <span style={{ color: BASE.textDim, fontSize: 11 }}>Live</span>
            </div>
          </div>

          {/* Page content */}
          <main className="main-area page-anim" key={activePage} style={{
            flex: 1, padding: "16px", overflowY: "auto", paddingBottom: 80,
          }}>
            {renderPage()}
          </main>
        </div>

        {/* ── Mobile Bottom Nav ── */}
        <nav className="mobile-btm" style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
          background: BASE.surface, borderTop: `1px solid ${BASE.border}`,
          display: "flex", padding: "8px 0",
          paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
        }}>
          {theme.navItems.slice(0, 5).map((key, i) => {
            const on = activePage === key;
            return (
              <button key={key} onClick={() => navigate(key)} style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                background: "none", border: "none", cursor: "pointer", padding: "4px 2px",
                color: on ? accent : BASE.textDim, transition: "color 0.15s",
              }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{theme.navIcons[i]}</span>
                <span style={{ fontSize: 9, fontWeight: on ? 700 : 500 }}>{theme.navLabels[i]}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
import { APP_CONFIG } from "../config/config";

/**
 * Format currency value
 */
export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${APP_CONFIG.defaultCurrency}0.00`;
  }
  return `${APP_CONFIG.defaultCurrency}${amount.toFixed(2)}`;
};

/**
 * Generate unique slug from restaurant name
 */
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
};

/**
 * Generate random order number
 */
export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${APP_CONFIG.orderPrefix}${timestamp}${random}`;
};

/**
 * Generate temporary password
 */
export const generateTempPassword = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/**
 * Calculate order totals
 */
export const calculateOrderTotals = (items: any[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.item_total, 0);
  const tax = subtotal * APP_CONFIG.taxRate;
  const total = subtotal + tax;

  return { subtotal, tax, total };
};

/**
 * Format date and time
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhone = (phone: string): boolean => {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone.replace(/[\s\-()]/g, ""));
};

/**
 * Hash password using SHA-256
 * Works on both HTTP and HTTPS (mobile and desktop)
 */
export const hashPassword = async (password: string): Promise<string> => {
  // Use crypto-js for consistent hashing across all platforms
  const CryptoJS = (await import("crypto-js")).default;
  return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Get status color class
 */
export const getStatusColor = (status: string): string => {
  const statusConfig =
    APP_CONFIG.orderStatuses[status as keyof typeof APP_CONFIG.orderStatuses];
  return statusConfig?.color || "neutral";
};

/**
 * Calculate item price with size and addons
 */
export const calculateItemPrice = (
  basePrice: number,
  selectedSize?: { price: number },
  selectedAddons?: { price: number }[]
): number => {
  let price = selectedSize ? selectedSize.price : basePrice;
  if (selectedAddons && selectedAddons.length > 0) {
    price += selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  }
  return price;
};

/**
 * Download file
 */
export const downloadFile = (url: string, filename: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Play notification sound using Web Audio API
 * Loud, 5-second repeating alarm designed for busy kitchens
 */
let alarmInterval: any = null;
let activeAudioCtx: AudioContext | null = null;
let vibrationInterval: any = null;
let _silentMode = false;

let _hasInteracted = false;
if (typeof window !== 'undefined') {
  const markInteracted = () => {
    _hasInteracted = true;
    window.removeEventListener('click', markInteracted);
    window.removeEventListener('keydown', markInteracted);
    window.removeEventListener('touchstart', markInteracted);
  };
  window.addEventListener('click', markInteracted);
  window.addEventListener('keydown', markInteracted);
  window.addEventListener('touchstart', markInteracted);
}

export const safeVibrate = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate && _hasInteracted) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // ignore
    }
  }
};

/**
 * Silent mode: mutes audio alarm but keeps vibration going
 */
export const isSilentMode = (): boolean => _silentMode;

export const setSilentMode = (silent: boolean) => {
  _silentMode = silent;
  if (silent) {
    // Stop audio but keep vibration
    if (alarmInterval) {
      clearInterval(alarmInterval);
      alarmInterval = null;
    }
    if (activeAudioCtx && activeAudioCtx.state !== "closed") {
      activeAudioCtx.close().catch(() => {});
      activeAudioCtx = null;
    }
  }
};

/**
 * Start vibration pattern (for mobile devices)
 */
export const startVibration = () => {
  if (vibrationInterval) return;
  const vibrate = () => {
    safeVibrate([200, 100, 200, 100, 200]);
  };
  vibrate();
  vibrationInterval = setInterval(vibrate, 1500);
};

export const stopVibration = () => {
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }
  safeVibrate(0);
};

export const startContinuousAlarm = () => {
  // Always start vibration
  startVibration();

  // Skip audio if silent mode
  if (_silentMode) return;
  if (alarmInterval) return; // already running

  const playBurst = () => {
    if (_silentMode) return; // recheck in case toggled mid-alarm
    try {
      if (!activeAudioCtx || activeAudioCtx.state === "closed") {
        activeAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (activeAudioCtx.state === "suspended") {
        activeAudioCtx.resume();
      }
      const ctx = activeAudioCtx;
      const now = ctx.currentTime;

      const burstPattern = [
        { freq: 987.77, start: 0.0, dur: 0.18 }, // B5
        { freq: 1318.51, start: 0.2, dur: 0.22 }, // E6
        { freq: 987.77, start: 0.45, dur: 0.18 }, // B5
        { freq: 1318.51, start: 0.65, dur: 0.35 }, // E6
      ];

      burstPattern.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "square"; // loud piercing waveform for kitchens
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.9, now + start);
        gain.gain.exponentialRampToValueAtTime(0.01, now + start + dur);
        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } catch (e) {
      console.warn("Audio alarm playback error:", e);
    }
  };

  playBurst();
  alarmInterval = setInterval(playBurst, 1500);
};

export const stopContinuousAlarm = () => {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  if (activeAudioCtx && activeAudioCtx.state !== "closed") {
    activeAudioCtx.close().catch(() => {});
    activeAudioCtx = null;
  }
  stopVibration();
};

export const playNotificationSound = () => {
  startContinuousAlarm();
  // Auto stop after 5 minutes if not manually stopped
  setTimeout(stopContinuousAlarm, 300000);
};

/**
 * Play sound (alias for playNotificationSound)
 */
export const playSound = (
  _type: "notification" | "success" | "error" = "notification"
) => {
  playNotificationSound();
};

/**
 * Compress a UUID to a shorter 22-character Base62 string
 */
export const uuidToBase62 = (uuid: string): string => {
  if (!uuid) return "";
  const hex = uuid.replace(/-/g, "");
  let num = BigInt("0x" + hex);
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let base62 = "";
  while (num > 0n) {
    base62 = chars[Number(num % 62n)] + base62;
    num = num / 62n;
  }
  return base62.padStart(22, "0");
};

/**
 * Decompress a 22-character Base62 string back to a UUID
 */
export const base62ToUuid = (base62: string): string => {
  if (!base62 || base62.length !== 22) return base62;
  try {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let num = 0n;
    for (let i = 0; i < base62.length; i++) {
      const charIndex = chars.indexOf(base62[i]);
      if (charIndex === -1) return base62;
      num = num * 62n + BigInt(charIndex);
    }
    const hex = num.toString(16).padStart(32, "0");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  } catch {
    return base62;
  }
};

/**
 * Compute best-selling menu item IDs using the same logic as the
 * "Highest Selling Dishes" KPI on the dashboard Overview:
 *   - Consider only orders placed in the last 30 days
 *   - Aggregate total quantity sold per menuItemId
 *   - Return up to top-5 IDs sorted by quantity descending
 *   - No minimum threshold — any item sold in the window qualifies
 */
export const getBestSellingIds = (
  orders: Array<{ date: string; items: Array<{ menuItemId: string; quantity: number }> }>,
  topN = 5
): string[] => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // last 30 days

  const counts: Record<string, number> = {};

  orders.forEach((order) => {
    if (!order.date) return;
    const orderDate = new Date(order.date);
    if (orderDate < cutoff) return; // outside 30-day window
    order.items.forEach((item) => {
      counts[item.menuItemId] = (counts[item.menuItemId] || 0) + item.quantity;
    });
  });

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
    .map(([id]) => id);
};

export const MEAL_FLOW_KEYWORDS: { rank: number; keywords: string[] }[] = [
  { rank: 0, keywords: ["starter", "appetizer", "soup", "salad"] },
  { rank: 1, keywords: ["main", "entree", "entrée", "course"] },
  { rank: 2, keywords: ["side", "add on", "addon", "extra"] },
  { rank: 3, keywords: ["dessert", "sweet"] },
  { rank: 4, keywords: ["beverage", "drink", "cocktail", "wine", "juice", "mocktail"] },
];

export const getMealFlowRank = (category: string): number => {
  const lower = category.toLowerCase();
  const match = MEAL_FLOW_KEYWORDS.find((group) =>
    group.keywords.some((kw) => lower.includes(kw))
  );
  return match ? match.rank : 99; // unmatched categories go last
};

export const getDietRank = (type?: string): number => {
  if (type === 'veg' || type === 'vegan') return 0;
  if (type === 'nonveg') return 1;
  return 2; // items with no diet_type set, sorted last
};

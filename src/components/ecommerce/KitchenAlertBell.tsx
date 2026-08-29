import { useState, useEffect, useRef } from "react";
import { supabase } from "../../config/supabase";
import { BellRing, Bell, Check } from "lucide-react";
import { safeVibrate } from "../../utils/helpers";

interface OrderPayload {
  id: string;
  customer: any;
  items: any;
  created_at: string;
}

interface KitchenAlertBellProps {
  organizationId?: string;
}

export default function KitchenAlertBell({ organizationId }: KitchenAlertBellProps) {
  const [isActive, setIsActive] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<OrderPayload[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const alarmIntervalRef = useRef<number | null>(null);

  // Request Wake Lock on mount (so screen doesn't sleep)
  useEffect(() => {
    const requestWakeLock = async () => {
      if ("wakeLock" in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
          console.log("Screen Wake Lock acquired.");
        } catch (err) {
          console.error("Wake Lock error:", err);
        }
      }
    };
    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
        wakeLockRef.current = null;
      }
    };
  }, []);

  // Supabase subscription
  useEffect(() => {
    if (!isActive || !organizationId) return;

    const channel = supabase
      .channel("kitchen-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          setPendingOrders((prev) => [...prev, payload.new as OrderPayload]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isActive, organizationId]);

  // Alarm playback logic
  useEffect(() => {
    if (pendingOrders.length > 0 && isActive) {
      if (!alarmIntervalRef.current) {
        playAlarmLoop();
      }
    } else {
      stopAlarmLoop();
    }
    
    return () => stopAlarmLoop();
  }, [pendingOrders, isActive]);

  const playSirenTone = () => {
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state !== "suspended") {
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        
        // Envelope to avoid popping clicks
        gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + startTime + 0.05);
        gain.gain.setValueAtTime(0.5, ctx.currentTime + startTime + duration - 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };

      // Play pattern: high beep, low beep, high beep
      playTone(880, 0, 0.4);
      playTone(660, 0.5, 0.4);
      playTone(880, 1.0, 0.4);
    }

    // Trigger vibration on devices that support it
    safeVibrate([400, 200, 400, 200, 400]);
  };

  const playAlarmLoop = () => {
    playSirenTone(); // play immediately
    alarmIntervalRef.current = window.setInterval(() => {
      playSirenTone();
    }, 4000); // repeat every 4 seconds
  };

  const stopAlarmLoop = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  };

  const handleToggle = () => {
    if (isActive) {
      setIsActive(false);
      setPendingOrders([]); // clear pending orders when stopped
      if (audioCtxRef.current) {
        audioCtxRef.current.suspend();
      }
    } else {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass && !audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      } else if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
      setIsActive(true);
    }
  };

  const handleAccept = (id: string) => {
    setPendingOrders((prev) => prev.filter((order) => order.id !== id));
  };

  return (
    <div className="bento-glass p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 flex items-center gap-2">
            <BellRing size={20} className={isActive ? "text-brand-500 animate-pulse" : "text-gray-400"} />
            Kitchen Alert Bell
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isActive 
              ? "Listening for incoming orders. Make sure your volume is turned up." 
              : "Enable alerts to hear a loud alarm when new orders arrive."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-colors shadow-lg ${
              isActive 
                ? "bg-error-500 hover:bg-error-600 text-white shadow-error-500/30" 
                : "bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/30"
            }`}
          >
            {isActive ? (
              <>
                <BellRing size={18} />
                Stop Alerts
              </>
            ) : (
              <>
                <Bell size={18} />
                Start Kitchen Alerts
              </>
            )}
          </button>
        </div>
      </div>

      {pendingOrders.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-semibold text-error-600 dark:text-error-400 uppercase tracking-wide">
            {pendingOrders.length} Pending Order{pendingOrders.length !== 1 ? 's' : ''}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingOrders.map((order) => (
              <div 
                key={order.id} 
                className="flex items-center justify-between p-4 rounded-xl border border-error-200 bg-error-50 dark:bg-error-500/10 dark:border-error-500/20"
              >
                <div>
                  <p className="font-bold text-gray-800 dark:text-white/90">
                    {order.customer?.name || "New Customer"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Order ID: {order.id.substring(0, 8)}...
                  </p>
                </div>
                <button
                  onClick={() => handleAccept(order.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-error-500 hover:bg-error-600 text-white font-semibold text-sm transition-colors shadow-md shadow-error-500/20"
                >
                  <Check size={16} strokeWidth={3} />
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

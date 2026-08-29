import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config/supabase";
import { useAuth } from "./useAuth";

export type EventType = "task" | "reminder" | "event";
export type EventCategory = "Primary" | "Success" | "Warning" | "Danger";

export interface CalendarEvent {
  id: string;
  organization_id: string;
  created_by: string;
  title: string;
  description?: string;
  event_type: EventType;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  is_all_day: boolean;
  category: EventCategory;
  is_completed: boolean;
  reminder_time?: string;
  created_at: string;
  updated_at: string;
}

export function useCalendar() {
  const { org } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!org?.id) return;
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("organization_id", org.id)
        .order("start_date", { ascending: true });

      if (err) throw err;
      setEvents(data || []);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching events:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [org?.id]);

  useEffect(() => {
    fetchEvents();

    // Subscribe to realtime changes
    if (!org?.id) return;
    const subscription = supabase
      .channel("calendar_events_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "calendar_events",
          filter: `organization_id=eq.${org.id}`,
        },
        () => {
          fetchEvents(); // Simple refetch on any change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchEvents, org?.id]);

  const addEvent = async (eventData: Partial<CalendarEvent>) => {
    if (!org?.id) return { error: "No org context" };
    try {
      const { data, error: err } = await supabase
        .from("calendar_events")
        .insert([{ ...eventData, organization_id: org.id }])
        .select()
        .single();
      
      if (err) throw err;
      return { data, error: null };
    } catch (err: any) {
      console.error("Error adding event:", err);
      return { data: null, error: err.message };
    }
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      const { data, error: err } = await supabase
        .from("calendar_events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
        
      if (err) throw err;
      return { data, error: null };
    } catch (err: any) {
      console.error("Error updating event:", err);
      return { data: null, error: err.message };
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error: err } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", id);
        
      if (err) throw err;
      return { error: null };
    } catch (err: any) {
      console.error("Error deleting event:", err);
      return { error: err.message };
    }
  };

  const toggleTaskCompletion = async (id: string, currentStatus: boolean) => {
    return updateEvent(id, { is_completed: !currentStatus });
  };

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    toggleTaskCompletion
  };
}

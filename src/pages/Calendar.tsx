import React, { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Modal } from "../components/ui/Modal";
import { useModal } from "../hooks/useModal";
import PageMeta from "../components/common/PageMeta";
import { useCalendar, CalendarEvent, EventType, EventCategory } from "../hooks/useCalendar";
import { CheckCircle2, Clock, Calendar as CalendarIcon, Trash2, X } from "lucide-react";

const categoryColors: Record<EventCategory, string> = {
  Danger: "danger",
  Success: "success",
  Primary: "primary",
  Warning: "warning",
};

const Calendar: React.FC = () => {
  const { events, addEvent, updateEvent, deleteEvent, toggleTaskCompletion } = useCalendar();
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    event_type: EventType;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    is_all_day: boolean;
    category: EventCategory;
  }>({
    title: "",
    description: "",
    event_type: "event",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    is_all_day: true,
    category: "Primary",
  });
  
  const [activeTab, setActiveTab] = useState<"all" | EventType>("all");

  const resetForm = () => {
    setSelectedEvent(null);
    setFormData({
      title: "",
      description: "",
      event_type: "event",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      start_time: "",
      end_time: "",
      is_all_day: true,
      category: "Primary",
    });
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetForm();
    setFormData(prev => ({
      ...prev,
      start_date: selectInfo.startStr,
      end_date: selectInfo.endStr || selectInfo.startStr,
      is_all_day: selectInfo.allDay
    }));
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const ev = events.find(e => e.id === clickInfo.event.id);
    if (!ev) return;
    
    setSelectedEvent(ev);
    setFormData({
      title: ev.title,
      description: ev.description || "",
      event_type: ev.event_type,
      start_date: ev.start_date,
      end_date: ev.end_date || ev.start_date,
      start_time: ev.start_time || "",
      end_time: ev.end_time || "",
      is_all_day: ev.is_all_day,
      category: ev.category,
    });
    openModal();
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    const dataToSave = {
      title: formData.title,
      description: formData.description,
      event_type: formData.event_type,
      start_date: formData.start_date,
      end_date: formData.end_date || undefined,
      start_time: formData.is_all_day ? undefined : formData.start_time || undefined,
      end_time: formData.is_all_day ? undefined : formData.end_time || undefined,
      is_all_day: formData.is_all_day,
      category: formData.category,
    };

    if (selectedEvent) {
      await updateEvent(selectedEvent.id, dataToSave);
    } else {
      await addEvent(dataToSave);
    }
    closeModal();
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    if (confirm("Are you sure you want to delete this?")) {
      await deleteEvent(selectedEvent.id);
      closeModal();
    }
  };

  // Format events for FullCalendar
  const calendarEvents = events
    .filter(ev => activeTab === "all" || ev.event_type === activeTab)
    .map(ev => ({
      id: ev.id,
      title: ev.title,
      start: ev.is_all_day ? ev.start_date : `${ev.start_date}T${ev.start_time}`,
      end: ev.is_all_day ? ev.end_date : (ev.end_time ? `${ev.end_date || ev.start_date}T${ev.end_time}` : undefined),
      allDay: ev.is_all_day,
      extendedProps: {
        category: ev.category,
        type: ev.event_type,
        is_completed: ev.is_completed,
      }
    }));

  const todayStr = new Date().toISOString().split("T")[0];
  const todayTasks = events.filter(e => 
    e.event_type === "task" && 
    (e.start_date === todayStr || (!e.is_completed && e.start_date < todayStr))
  );

  return (
    <>
      <PageMeta title="Calendar & Tasks" description="Manage events, tasks, and reminders" />
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full mb-10">
        
        {/* Main Calendar View */}
        <div className="xl:col-span-9 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 md:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Calendar</h2>
            
            <div className="flex flex-wrap items-center gap-2 bg-gray-50 dark:bg-white/[0.02] p-1 rounded-xl border border-gray-100 dark:border-gray-800">
              <button 
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "all" ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                All
              </button>
              <button 
                onClick={() => setActiveTab("event")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "event" ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Events
              </button>
              <button 
                onClick={() => setActiveTab("task")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "task" ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Tasks
              </button>
              <button 
                onClick={() => setActiveTab("reminder")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "reminder" ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Reminders
              </button>
            </div>
          </div>

          <div className="custom-calendar">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "addEventButton dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={calendarEvents}
              selectable={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventContent={renderEventContent}
              height="auto"
              customButtons={{
                addEventButton: {
                  text: "+ New Event",
                  click: () => {
                    resetForm();
                    openModal();
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Right Sidebar - Today's Tasks */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 dark:text-white/90">Today's Tasks</h3>
              <span className="bg-brand-50 text-brand-600 text-xs font-bold px-2 py-1 rounded-md">{todayTasks.length}</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {todayTasks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No tasks for today! 🎉</p>
              ) : (
                todayTasks.map(task => (
                  <div key={task.id} className={`p-3 rounded-xl border transition-all ${task.is_completed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200 shadow-sm hover:border-brand-300'}`}>
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                         <input 
                            type="checkbox"
                            id={`task-${task.id}`}
                            checked={task.is_completed}
                            onChange={() => toggleTaskCompletion(task.id, task.is_completed)}
                            className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                         />
                      </div>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
                        const ev = events.find(e => e.id === task.id);
                        if(ev) {
                          setSelectedEvent(ev);
                          setFormData({
                            title: ev.title,
                            description: ev.description || "",
                            event_type: ev.event_type,
                            start_date: ev.start_date,
                            end_date: ev.end_date || ev.start_date,
                            start_time: ev.start_time || "",
                            end_time: ev.end_time || "",
                            is_all_day: ev.is_all_day,
                            category: ev.category,
                          });
                          openModal();
                        }
                      }}>
                        <p className={`text-sm font-semibold truncate ${task.is_completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                          {task.title}
                        </p>
                        {task.is_all_day ? (
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><CalendarIcon size={12}/> All day</p>
                        ) : (
                           <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock size={12}/> {task.start_time}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => { resetForm(); setFormData(p => ({...p, event_type: "task"})); openModal(); }}
              className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              + Add Task
            </button>
          </div>
        </div>

      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
            {selectedEvent ? "Edit" : "New"} {formData.event_type.charAt(0).toUpperCase() + formData.event_type.slice(1)}
          </h3>
          <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Type Selector */}
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {(["event", "task", "reminder"] as EventType[]).map(type => (
              <button
                key={type}
                onClick={() => setFormData(p => ({ ...p, event_type: type }))}
                className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${formData.event_type === type ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {type}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
              placeholder="E.g., Team Meeting"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              placeholder="Add details..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <input
                type="checkbox"
                id="all-day"
                checked={formData.is_all_day}
                onChange={() => setFormData(p => ({...p, is_all_day: !p.is_all_day}))}
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="all-day" className="text-sm font-medium text-gray-700 cursor-pointer">
              All day event
            </label>
          </div>

          {!formData.is_all_day && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={e => setFormData(p => ({ ...p, start_time: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={e => setFormData(p => ({ ...p, end_time: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color Label</label>
            <div className="flex gap-3">
              {(Object.keys(categoryColors) as EventCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFormData(p => ({ ...p, category: cat }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                    formData.category === cat ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full bg-${categoryColors[cat]}-500`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
          {selectedEvent ? (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} /> Delete
            </button>
          ) : <div/>}
          
          <div className="flex gap-3">
            <button
              onClick={closeModal}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.title.trim()}
              className="px-6 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

const renderEventContent = (eventInfo: any) => {
  const cat = eventInfo.event.extendedProps.category as string;
  const type = eventInfo.event.extendedProps.type as string;
  const isCompleted = eventInfo.event.extendedProps.is_completed as boolean;
  
  const colorMap: Record<string, string> = {
    Danger: "bg-red-500 border-red-600 text-white",
    Success: "bg-success-500 border-success-600 text-white",
    Primary: "bg-brand-500 border-brand-600 text-white",
    Warning: "bg-warning-500 border-warning-600 text-white",
  };
  
  const colorClass = colorMap[cat] || colorMap.Primary;

  let Icon = CalendarIcon;
  if (type === "task") Icon = CheckCircle2;
  if (type === "reminder") Icon = Clock;

  return (
    <div className={`flex items-center gap-1.5 p-1 rounded-md border ${colorClass} ${isCompleted ? 'opacity-60 line-through' : ''} text-xs shadow-sm overflow-hidden w-full`}>
      <Icon size={12} className="shrink-0 opacity-80" />
      <span className="truncate font-medium">{eventInfo.event.title}</span>
    </div>
  );
};

export default Calendar;

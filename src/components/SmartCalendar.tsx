"use client";

import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Task } from "@/types";
import { useState } from "react";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface SmartCalendarProps {
  tasks: Task[];
}

export function SmartCalendar({ tasks }: SmartCalendarProps) {
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

  const events = tasks.map((task) => {
    const due = new Date(task.due_date);
    return {
      id: task.id,
      title: task.task_title,
      start: due,
      end: due,
      allDay: true,
      resource: task,
    };
  });

  const eventStyleGetter = (event: any) => {
    let backgroundColor = "#3b82f6"; // blue-500
    if (event.resource.status === "Done") backgroundColor = "#10b981"; // emerald-500
    else if (event.resource.status === "In Progress") backgroundColor = "#f59e0b"; // amber-500

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
        fontSize: "0.85rem",
        padding: "2px 4px",
      },
    };
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        eventPropGetter={eventStyleGetter}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        popup
        tooltipAccessor={(e) => `${e.title}\nStatus: ${e.resource.status}\nType: ${e.resource.task_type}`}
      />
      <style jsx global>{`
        .rbc-calendar {
          font-family: inherit;
        }
        .rbc-btn-group button {
          color: #475569;
          border-color: #cbd5e1;
        }
        .rbc-btn-group button.rbc-active {
          background-color: #f1f5f9;
          color: #0f172a;
          box-shadow: none;
        }
        .rbc-toolbar button:active, .rbc-toolbar button:focus {
          outline: none;
          background-image: none;
          box-shadow: none;
        }
        .rbc-today {
          background-color: #eff6ff;
        }
        .rbc-header {
          padding: 8px 0;
          font-weight: 600;
          color: #334155;
        }
      `}</style>
    </div>
  );
}

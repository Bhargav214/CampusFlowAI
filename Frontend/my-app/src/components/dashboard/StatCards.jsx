import React from "react";
import { Users, CalendarCheck, GraduationCap, AlertTriangle } from "lucide-react";
import StatCard from "../ui/StatCard";

export default function StatCards({ data = {} }) {
  const cards = [
    {
      label: "Total Students",
      value: data.students ?? data.total_students ?? 0,
      icon: Users,
      trend: "Enrolled",
      variant: "default",
    },
    {
      label: "Average Attendance",
      value: typeof (data.attendance ?? data.average_attendance) === "number"
        ? `${(data.attendance ?? data.average_attendance)}%`
        : (data.attendance ?? data.average_attendance ?? "0%"),
      icon: CalendarCheck,
      trend: "Campus-wide",
      variant: "success",
    },
    {
      label: "Average Marks",
      value: data.marks ?? data.average_marks ?? 0,
      icon: GraduationCap,
      trend: "Performance",
      variant: "default",
    },
    {
      label: "High Risk Students",
      value: data.risk ?? data.high_risk ?? 0,
      icon: AlertTriangle,
      trend: "Action needed",
      variant: "danger",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
        marginBottom: "20px",
      }}
    >
      {cards.map((c, i) => (
        <StatCard
          key={i}
          label={c.label}
          value={c.value}
          icon={c.icon}
          trend={c.trend}
          variant={c.variant}
        />
      ))}
    </div>
  );
}

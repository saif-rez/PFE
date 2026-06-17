import React from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: "default" | "warning" | "success";
  delay?: number;
}

const highlightStyles = {
  default: "bg-card",
  warning: "bg-warning/5 ring-1 ring-warning/20",
  success: "bg-success/5 ring-1 ring-success/20",
};

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, highlight = "default", delay = 0 }) => {
  return (
    <div
      className={`rounded-lg p-5 shadow-sm shadow-primary/5 ${highlightStyles[highlight]} animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default KpiCard;

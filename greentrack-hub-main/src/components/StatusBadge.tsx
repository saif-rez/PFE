import React from "react";

interface StatusBadgeProps {
  statut: string;
  size?: "sm" | "md";
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  "Actif": { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  "En pause": { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  "Terminé": { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  "En attente": { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  "Approuvé": { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  "Rejeté": { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ statut, size = "sm" }) => {
  const config = statusConfig[statut] || statusConfig["Actif"];
  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {statut}
    </span>
  );
};

export default StatusBadge;

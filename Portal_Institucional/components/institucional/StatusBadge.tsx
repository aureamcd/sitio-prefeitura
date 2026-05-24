/**
 * ========================================================
 * COMPONENTE: StatusBadge
 * ========================================================
 * Badge visual reutilizável para exibir o status de
 * solicitações e-SIC / Ouvidoria com ícone + cor.
 *
 * @module components/institucional/StatusBadge
 */
"use client";

import { ESIC_STATUS_CONFIG } from "@/lib/types/esic";
import { OUVIDORIA_STATUS_CONFIG } from "@/lib/types/ouvidoria";
import type { EsicStatus } from "@/lib/types/esic";
import type { OuvidoriaStatus } from "@/lib/types/ouvidoria";

interface StatusBadgeProps {
  status: EsicStatus | OuvidoriaStatus;
  canal?: "esic" | "ouvidoria";
  size?: "sm" | "md";
}

export default function StatusBadge({
  status,
  canal = "esic",
  size = "sm",
}: StatusBadgeProps) {
  const config =
    canal === "ouvidoria"
      ? OUVIDORIA_STATUS_CONFIG[status as OuvidoriaStatus]
      : ESIC_STATUS_CONFIG[status as EsicStatus];

  if (!config) return null;

  const sizeClasses =
    size === "md"
      ? "px-3 py-1.5 text-xs"
      : "px-2 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full border ${sizeClasses} ${config.color} ${config.bgColor} ${config.borderColor}`}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

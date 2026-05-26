/**
 * ========================================================
 * COMPONENTE: Toast (Notificação)
 * ========================================================
 * Sistema de feedback visual com auto-dismiss.
 *
 * Tipos: success | error | info
 *
 * @module components/institucional/Toast
 */
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastData {
  type: "success" | "error" | "info";
  message: string;
}

interface ToastProps extends ToastData {
  onClose: () => void;
  duration?: number;
}

const TOAST_CONFIG = {
  success: {
    bg: "bg-green-50 border-green-200",
    text: "text-green-800",
    icon: CheckCircle2,
    iconColor: "text-green-600",
  },
  error: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-800",
    icon: AlertCircle,
    iconColor: "text-red-600",
  },
  info: {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-800",
    icon: Info,
    iconColor: "text-blue-600",
  },
};

export default function Toast({
  type,
  message,
  onClose,
  duration = 5000,
}: ToastProps) {
  const [visible, setVisible] = useState(false);
  const config = TOAST_CONFIG[type];
  const Icon = config.icon;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-[100] max-w-sm w-full border rounded-xl p-4 shadow-xl flex items-start gap-3 transition-all duration-300 ${
        config.bg
      } ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
    >
      <Icon size={20} className={`${config.iconColor} shrink-0 mt-0.5`} />
      <p className={`text-sm font-medium flex-1 ${config.text}`}>{message}</p>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        className="p-1 rounded-lg hover:bg-black/5 transition"
        aria-label="Fechar"
      >
        <X size={16} className="text-gray-400" />
      </button>
    </div>
  );
}

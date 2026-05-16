"use client";

import { Download } from "lucide-react";

interface PrintButtonProps {
  label: string;
  subLabel?: string;
}

export default function PrintButton({ label, subLabel }: PrintButtonProps) {
  return (
    <button
      onClick={() => window.print()}
      className="group flex items-center gap-3 bg-white border border-gray-200 p-3.5 rounded-lg hover:border-[#173572] hover:shadow-sm transition-all text-left w-full sm:w-auto"
    >
      <div className="bg-gray-100 p-2 rounded-md group-hover:bg-blue-50 transition-colors">
        <Download size={20} className="text-gray-500 group-hover:text-[#173572]" />
      </div>
      <div>
        <p className="font-medium text-gray-800 text-sm group-hover:text-[#173572] transition-colors">
          {label}
        </p>
        {subLabel && <p className="text-xs text-gray-500 mt-0.5">{subLabel}</p>}
      </div>
    </button>
  );
}

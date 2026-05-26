/**
 * ========================================================
 * COMPONENTE: InstitutionalForm
 * ========================================================
 *
 * Formulário config-driven reutilizável para e-SIC e Ouvidoria.
 *
 * @module components/institucional/InstitutionalForm
 */
"use client";

import { useState, FormEvent } from "react";
import { Loader2, Send, Upload, Paperclip, FileCheck } from "lucide-react";
import ProtocolSuccess from "./ProtocolSuccess";
import Toast, { ToastData } from "./Toast";

/* ── Tipo de cada campo ── */
export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "checkbox" | "file";
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  width?: "full" | "half";
  accept?: string;
}

/* ── Props do componente ── */
interface InstitutionalFormProps {
  title: string;
  description?: string;
  fields: FieldConfig[];
  apiUrl: string;
  canal: "esic" | "ouvidoria";
  formId: string;
}

export default function InstitutionalForm({
  title,
  description,
  fields,
  apiUrl,
  canal,
  formId,
}: InstitutionalFormProps) {
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [protocolo, setProtocolo] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, fieldName: string) {
    const file = e.target.files?.[0];
    if (file) {
      setFileNames(prev => ({ ...prev, [fieldName]: file.name }));
    } else {
      setFileNames(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const hasFile = fields.some(f => f.type === "file");

    try {
      let res;
      if (hasFile) {
        res = await fetch(apiUrl, {
          method: "POST",
          body: formData,
        });
      } else {
        const body: Record<string, string | boolean> = {};
        fields.forEach((field) => {
          if (field.type === "checkbox") {
            body[field.name] = formData.get(field.name) === "on";
          } else {
            const value = formData.get(field.name) as string;
            if (value) body[field.name] = value.trim();
          }
        });

        res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        setToast({ type: "error", message: data.error || "Erro ao enviar." });
        setLoading(false);
        return;
      }

      setProtocolo(data.protocolo);
    } catch {
      setToast({ type: "error", message: "Erro de conexão. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  if (protocolo) {
    return (
      <ProtocolSuccess
        protocolo={protocolo}
        canal={canal}
        onReset={() => setProtocolo(null)}
      />
    );
  }

  return (
    <>
      <div className="mb-5">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        )}
      </div>

      <form id={formId} onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((field) => {
            const isFullWidth = field.width === "full" || field.type === "textarea" || field.type === "checkbox" || field.type === "file";
            const wrapperClass = isFullWidth ? "sm:col-span-2" : "";

            return (
              <div key={field.name} className={wrapperClass}>
                {field.type === "checkbox" ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      name={field.name}
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-[#173572] focus:ring-[#173572]/30"
                    />
                    <span className="text-sm text-gray-700">{field.label}</span>
                    {field.hint && (
                      <span className="text-xs text-gray-400 ml-1">
                        ({field.hint})
                      </span>
                    )}
                  </label>
                ) : (
                  <>
                    <label
                      htmlFor={`${formId}-${field.name}`}
                      className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-0.5"
                    >
                      {field.label}
                      {field.required && (
                        <span className="text-red-400 ml-0.5">*</span>
                      )}
                    </label>

                    {field.type === "select" && (
                      <select
                        id={`${formId}-${field.name}`}
                        name={field.name}
                        required={field.required}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#173572]/20 focus:border-[#173572] transition-all text-gray-900"
                      >
                        <option value="">Selecione...</option>
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === "textarea" && (
                      <textarea
                        id={`${formId}-${field.name}`}
                        name={field.name}
                        required={field.required}
                        placeholder={field.placeholder}
                        rows={field.rows || 4}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#173572]/20 focus:border-[#173572] transition-all text-gray-900 resize-none"
                      />
                    )}

                    {field.type === "file" && (
                      <div className="relative">
                        <label
                          htmlFor={`${formId}-${field.name}`}
                          className={`
                            flex flex-col items-center justify-center w-full min-h-[110px] px-4 py-4 
                            bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl 
                            cursor-pointer transition-all duration-300
                            hover:bg-blue-50/50 hover:border-[#173572]/30 group
                            ${fileNames[field.name] ? 'border-[#173572]/40 bg-blue-50/30' : ''}
                          `}
                        >
                          <div className="flex flex-col items-center justify-center space-y-2">
                            {fileNames[field.name] ? (
                              <>
                                <div className="bg-green-100 p-2 rounded-lg text-green-700 animate-in zoom-in duration-300">
                                  <FileCheck size={24} />
                                </div>
                                <p className="text-xs font-bold text-gray-700 max-w-[250px] truncate">
                                  {fileNames[field.name]}
                                </p>
                                <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Arquivo selecionado</span>
                              </>
                            ) : (
                              <>
                                <div className="bg-white p-2.5 rounded-xl text-gray-400 shadow-sm border border-gray-100 group-hover:text-[#173572] group-hover:scale-110 transition-all">
                                  <Upload size={24} />
                                </div>
                                <div className="text-center">
                                  <p className="text-xs font-bold text-gray-500 group-hover:text-gray-700">
                                    Clique para anexar ou arraste o arquivo
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    PDF, JPG ou PNG (Máx 10MB)
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                          <input
                            id={`${formId}-${field.name}`}
                            name={field.name}
                            type="file"
                            required={field.required}
                            accept={field.accept}
                            onChange={(e) => handleFileChange(e, field.name)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}

                    {!["select", "textarea", "checkbox", "file"].includes(field.type) && (
                      <input
                        id={`${formId}-${field.name}`}
                        name={field.name}
                        type={field.type}
                        required={field.required}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#173572]/20 focus:border-[#173572] transition-all text-gray-900"
                      />
                    )}

                    {field.hint && (
                      <p className="text-[11px] text-gray-400 mt-1 ml-0.5">
                        {field.hint}
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full max-w-sm py-4 bg-[#173572] text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#0d1f42] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#173572]/30 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none mt-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <Send size={20} />
                Enviar Solicitação
              </>
            )}
          </button>
        </div>
      </form>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
}

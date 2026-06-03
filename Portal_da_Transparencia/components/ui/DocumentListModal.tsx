import { useEffect } from 'react';
import { FileText, X, Download } from 'lucide-react';

interface Documento {
  id: string;
  nome_arquivo: string;
  caminho_r2: string;
  tipo_documento: string;
}

interface DocumentListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  documentos: Documento[];
}

// Mapeamento visual das cores baseadas no tipo de documento
function getBadgeStyle(tipo: string) {
  const lower = tipo.toLowerCase();
  if (lower.includes('edital')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (lower.includes('extrato')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (lower.includes('aditivo')) return 'bg-purple-100 text-purple-800 border-purple-200';
  if (lower.includes('aviso')) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (lower.includes('contrato')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
}

export default function DocumentListModal({ isOpen, onClose, title, documentos = [] }: DocumentListModalProps) {
  // Prevent scrolling on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-50 w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold leading-6 text-gray-900 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            Documentos: {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
          {documentos.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-500">Nenhum documento anexado.</p>
            </div>
          ) : (
            documentos.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-4 truncate">
                  <div className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${getBadgeStyle(doc.tipo_documento || 'Outros')}`}>
                    {doc.tipo_documento || 'Documento'}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-gray-800 truncate" title={doc.nome_arquivo}>
                      {doc.nome_arquivo}
                    </p>
                  </div>
                </div>
                <a
                  href={doc.caminho_r2}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 ml-4 flex items-center justify-center p-2 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Baixar Documento"
                >
                  <Download size={18} />
                </a>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="inline-flex justify-center rounded-lg border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

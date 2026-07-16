import { useEffect } from 'react';
import { FileText, X, Download } from 'lucide-react';

interface Documento {
  id: string;
  nome_arquivo: string;
  caminho_r2?: string;
  url_arquivo?: string;
  arquivo_url?: string;
  url?: string;
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
            documentos.map((doc) => {
              const urlDownload = doc.url_arquivo || doc.arquivo_url || (doc as any).url || (
                doc.caminho_r2
                  ? (doc.caminho_r2.startsWith('http')
                      ? doc.caminho_r2
                      : `https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev/${doc.caminho_r2.replace(/^\//, '')}`)
                  : '#'
              );

              return (
                <a
                  key={doc.id || Math.random().toString()}
                  href={urlDownload}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-blue-50/60 hover:border-blue-300 transition-all group shadow-2xs"
                  title="Clique para abrir ou baixar o documento"
                >
                  <div className="flex items-center gap-3.5 truncate">
                    <div className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${getBadgeStyle(doc.tipo_documento || 'Outros')}`}>
                      {doc.tipo_documento || 'Documento'}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 truncate">
                        {doc.nome_arquivo || 'Arquivo sem nome'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 ml-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 transition-colors shadow-xs">
                    <Download size={15} />
                    <span>Baixar</span>
                  </div>
                </a>
              );
            })
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

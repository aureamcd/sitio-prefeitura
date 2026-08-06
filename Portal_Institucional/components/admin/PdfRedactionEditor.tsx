"use client";

import React, { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Rnd } from "react-rnd";
import { X, Save, Plus, Loader2, MousePointer, Trash2 } from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure pdfjs worker to run in browser
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface RedactionBox {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PdfRedactionEditorProps {
  fileUrl?: string;
  fileObj?: File;
  onSave: (redactedFile: File) => void;
  onCancel: () => void;
}

export default function PdfRedactionEditor({ fileUrl, fileObj, onSave, onCancel }: PdfRedactionEditorProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [boxes, setBoxes] = useState<RedactionBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pdfScale, setPdfScale] = useState(1.5);
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);

  // Load the file as ArrayBuffer for both react-pdf and pdf-lib
  useEffect(() => {
    async function loadFile() {
      try {
        let buffer: ArrayBuffer;
        if (fileObj) {
          buffer = await fileObj.arrayBuffer();
        } else if (fileUrl) {
          const res = await fetch(fileUrl);
          buffer = await res.arrayBuffer();
        } else {
          throw new Error("Nenhum arquivo fornecido");
        }
        setFileData(buffer);
      } catch (err) {
        console.error("Error loading PDF", err);
        alert("Erro ao carregar PDF para tarjamento.");
      }
    }
    loadFile();
  }, [fileUrl, fileObj]);

  // When react-pdf finishes loading the document
  async function onDocumentLoadSuccess(pdf: any) {
    setNumPages(pdf.numPages);
    
    // Auto-detect CPFs and RGs
    try {
      const detectedBoxes: RedactionBox[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: pdfScale });

        for (const item of textContent.items) {
          const str = item.str || "";
          
          // Regex for CPF and basic RG formats
          const hasCpf = /\d{3}[.\s-]*\d{3}[.\s-]*\d{3}/.test(str);
          const hasRg = /\b(?:RG|R\.G\.)\s*[A-Z0-9-]+\b/i.test(str) || /(?<!\d)\d{1,2}[.\s-]?\d{3}[.\s-]?\d{3}[.\s-]?(?:\d|X|x)(?!\d)/.test(str);
          
          if (hasCpf || hasRg) {
            // pdfjs returns coordinates in PDF space (bottom-left origin)
            // We need to convert them to viewport space (top-left origin)
            const tx = pdfjs.Util.transform(viewport.transform, item.transform);
            
            // tx[4] is x, tx[5] is y (baseline)
            // item.width and item.height are in PDF space, we need to scale them
            const rectX = tx[4];
            const rectY = tx[5] - (item.height * pdfScale); // Move up from baseline
            const rectW = item.width * pdfScale + 10; // Extra padding
            const rectH = item.height * pdfScale + 4;
            
            detectedBoxes.push({
              id: Math.random().toString(36).substring(7),
              pageIndex: i - 1,
              x: rectX - 5, // Left padding
              y: rectY,
              width: rectW,
              height: rectH
            });
          }
        }
      }
      setBoxes(detectedBoxes);
    } catch (err) {
      console.error("Auto-detect failed:", err);
    }
    
    setLoading(false);
  }

  // Handle adding a manual box to a specific page
  function addManualBox(pageIndex: number) {
    setBoxes(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        pageIndex,
        x: 100,
        y: 100,
        width: 150,
        height: 20
      }
    ]);
  }

  // Apply redactions and generate new File
  async function applyRedactions() {
    if (!fileData) return;
    setSaving(true);
    try {
      const pdfDoc = await PDFDocument.load(fileData);
      const pages = pdfDoc.getPages();

      for (const box of boxes) {
        if (box.pageIndex >= pages.length) continue;
        const page = pages[box.pageIndex];
        const { height } = page.getSize();
        
        // Convert screen coordinates back to PDF points
        // screen points = pdf points * pdfScale
        const pdfX = box.x / pdfScale;
        const pdfY = box.y / pdfScale;
        const pdfW = box.width / pdfScale;
        const pdfH = box.height / pdfScale;

        // PDF-lib uses bottom-left origin for Y
        const drawY = height - pdfY - pdfH;

        page.drawRectangle({
          x: pdfX,
          y: drawY,
          width: pdfW,
          height: pdfH,
          color: rgb(0, 0, 0)
        });
      }

      const pdfBytes = await pdfDoc.save();
      const redactedFile = new File([pdfBytes], "Documento_Tarjado.pdf", { type: "application/pdf" });
      onSave(redactedFile);
    } catch (err) {
      console.error("Error applying redaction", err);
      alert("Erro ao aplicar a tarja.");
    } finally {
      setSaving(false);
    }
  }

  if (!fileData) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
          <p className="font-medium">Carregando documento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Tools */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col shrink-0 shadow-lg z-10">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <MousePointer className="text-blue-600" size={20} />
            Editor de Tarjas
          </h2>
          <button onClick={onCancel} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h3 className="font-bold text-blue-900 text-sm mb-2">Instruções</h3>
            <ul className="text-xs text-blue-800 space-y-2 list-disc pl-4">
              <li>Revisamos o documento e destacamos automaticamente possíveis <b>CPFs e RGs</b>.</li>
              <li>Você pode <b>clicar e arrastar</b> qualquer caixa preta para reposicioná-la.</li>
              <li>Puxe pelas <b>bordas vermelhas</b> para aumentar ou diminuir o tamanho da tarja.</li>
              <li>Se uma caixa for errada, clique no ícone de lixeira nela para removê-la.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-3">Tarjas Detectadas ({boxes.length})</h3>
            <div className="space-y-2">
              {boxes.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Nenhum dado sensível detectado automaticamente.</p>
              ) : (
                <p className="text-sm text-gray-600">Arraste as caixas no documento ao lado para ajustá-las.</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 bg-gray-50 space-y-3">
          <button
            onClick={applyRedactions}
            disabled={saving || loading}
            className="w-full py-3 px-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Aplicar Tarjas e Salvar
          </button>
          <button
            onClick={onCancel}
            disabled={saving}
            className="w-full py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl flex items-center justify-center transition"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* PDF Viewer Area */}
      <div className="flex-1 bg-gray-500 overflow-auto relative flex justify-center p-8">
        <div className="relative shadow-2xl bg-white">
          <Document
            file={fileData}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center p-20">
                <Loader2 className="animate-spin text-white" size={40} />
              </div>
            }
          >
            {Array.from(new Array(numPages), (el, index) => (
              <div key={`page_${index + 1}`} className="relative border-b-8 border-gray-500 pb-8 mb-8 last:mb-0 last:pb-0 last:border-0">
                
                {/* Add Manual Box Button for this page */}
                <div className="absolute top-2 right-2 z-10">
                  <button 
                    onClick={() => addManualBox(index)}
                    className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow hover:bg-blue-700 transition"
                  >
                    <Plus size={14} /> Adicionar Tarja Manual
                  </button>
                </div>

                <Page
                  pageNumber={index + 1}
                  scale={pdfScale}
                  renderAnnotationLayer={false}
                  className="shadow-sm"
                />

                {/* Overlays for this page */}
                {boxes.filter(b => b.pageIndex === index).map(box => (
                  <Rnd
                    key={box.id}
                    size={{ width: box.width, height: box.height }}
                    position={{ x: box.x, y: box.y }}
                    onDragStop={(e, d) => {
                      setBoxes(boxes.map(b => b.id === box.id ? { ...b, x: d.x, y: d.y } : b));
                    }}
                    onResizeStop={(e, direction, ref, delta, position) => {
                      setBoxes(boxes.map(b => b.id === box.id ? {
                        ...b,
                        width: parseInt(ref.style.width),
                        height: parseInt(ref.style.height),
                        x: position.x,
                        y: position.y
                      } : b));
                    }}
                    bounds="parent"
                    className="absolute z-20 group"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }} // semi-transparent black for preview
                    resizeHandleStyles={{
                      bottomRight: { border: "2px solid red", right: -5, bottom: -5, width: 10, height: 10, backgroundColor: "white" },
                      bottomLeft: { border: "2px solid red", left: -5, bottom: -5, width: 10, height: 10, backgroundColor: "white" },
                      topRight: { border: "2px solid red", right: -5, top: -5, width: 10, height: 10, backgroundColor: "white" },
                      topLeft: { border: "2px solid red", left: -5, top: -5, width: 10, height: 10, backgroundColor: "white" },
                    }}
                  >
                    <button
                      onClick={() => setBoxes(boxes.filter(b => b.id !== box.id))}
                      className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </Rnd>
                ))}
              </div>
            ))}
          </Document>
        </div>
      </div>
    </div>
  );
}

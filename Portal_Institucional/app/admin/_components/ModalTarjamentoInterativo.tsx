"use client";

import React, { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  ShieldAlert, CheckCircle2, X, Trash2, Plus, Sparkles, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, Loader2, AlertTriangle, HelpCircle, Move,
} from "lucide-react";

// Configuração do Worker do PDF.js
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export type TarjaBox = {
  id: string;
  pageIndex: number; // 0-indexed
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  label?: string; // ex: "CPF", "RG", "Endereço", "Manual"
};

type Props = {
  pdfUrl: string;
  onClose: () => void;
  onSuccess: (newUrl: string) => void;
};

export default function ModalTarjamentoInterativo({ pdfUrl, onClose, onSuccess }: Props) {
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1); // 1-indexed
  const [scale, setScale] = useState(1.3);

  const [tarjas, setTarjas] = useState<TarjaBox[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Modos de interação com o mouse
  const [interactionMode, setInteractionMode] = useState<"none" | "drag" | "resize" | "draw">("none");
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [drawBox, setDrawBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // 1. Carregar documento PDF
  useEffect(() => {
    let isMounted = true;
    async function loadPdf() {
      try {
        setLoadingPdf(true);
        setError(null);
        const res = await fetch(pdfUrl);
        if (!res.ok) throw new Error(`Não foi possível carregar o arquivo PDF (${res.status})`);
        const buffer = new Uint8Array(await res.arrayBuffer());

        const loadingTask = pdfjsLib.getDocument({ data: buffer });
        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoadingPdf(false);

        // Rodar autodetecção ao carregar
        await runAutoScan(doc);
      } catch (err: any) {
        console.error("Erro ao carregar PDF no modal:", err);
        if (isMounted) {
          setError(err.message || "Erro ao carregar PDF para auditoria LGPD.");
          setLoadingPdf(false);
        }
      }
    }
    loadPdf();
    return () => { isMounted = false; };
  }, [pdfUrl]);

  // 2. Renderizar página atual no Canvas
  useEffect(() => {
    if (!pdfDoc) return;
    let renderTask: any = null;

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        setViewportSize({ width: viewport.width, height: viewport.height });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("Erro ao renderizar página:", err);
        }
      }
    }
    renderPage();
    return () => {
      if (renderTask) renderTask.cancel();
    };
  }, [pdfDoc, currentPage, scale]);

  // 3. Algoritmo de Inteligência Automática (Pessoa Física, CPF, RG, Endereços)
  async function runAutoScan(docObj = pdfDoc) {
    if (!docObj) return;
    setScanning(true);
    const novasTarjas: TarjaBox[] = [];

    try {
      for (let pIdx = 1; pIdx <= docObj.numPages; pIdx++) {
        const page = await docObj.getPage(pIdx);
        const textContent = await page.getTextContent();

        for (const item of textContent.items as any[]) {
          const str = item.str || "";
          if (!str.trim()) continue;

          // Exigir métricas de transformação
          const tx = item.transform[4];
          const ty = item.transform[5];
          const fontSize = Math.abs(item.transform[0]) || 11;

          // Regex para CPF
          const regexCpf = /\d{3}[.\s-]*\d{3}[.\s-]*\d{3}(?:[.\s-]*\d{2})?/g;
          let match;
          while ((match = regexCpf.exec(str)) !== null) {
            const prefix = str.substring(0, match.index);
            const matchWidth = (item.width / Math.max(str.length, 1)) * match[0].length;
            const prefixWidth = (item.width / Math.max(str.length, 1)) * prefix.length;

            novasTarjas.push({
              id: Math.random().toString(36).substring(2, 9),
              pageIndex: pIdx - 1,
              pdfX: tx + prefixWidth - 1,
              pdfY: ty - 2,
              pdfWidth: Math.max(matchWidth + 2, 60),
              pdfHeight: fontSize + 3,
              label: "CPF",
            });
          }

          // Regex para RG
          const regexRg = /(?:RG|Identidade|C\.I\.|SSP)[^\d]*(\d{1,3}(?:\.\d{3}){1,2}(?:[-–]\w{1,2})?|\d{5,10}(?:[-–]\w{1,2})?)/gi;
          while ((match = regexRg.exec(str)) !== null) {
            const prefix = str.substring(0, match.index);
            const matchWidth = (item.width / Math.max(str.length, 1)) * match[0].length;
            const prefixWidth = (item.width / Math.max(str.length, 1)) * prefix.length;

            novasTarjas.push({
              id: Math.random().toString(36).substring(2, 9),
              pageIndex: pIdx - 1,
              pdfX: tx + prefixWidth - 1,
              pdfY: ty - 2,
              pdfWidth: Math.max(matchWidth + 2, 50),
              pdfHeight: fontSize + 3,
              label: "RG",
            });
          }

          // Regex para Endereço Residencial
          const regexEnd = /(?:residente|domiciliado|situado)\s+(?:e\s+domiciliado\s+)?(?:na|no|à|ao|em)\s+([^\.\;\n]{15,80})/gi;
          while ((match = regexEnd.exec(str)) !== null) {
            const prefix = str.substring(0, match.index);
            const matchWidth = (item.width / Math.max(str.length, 1)) * match[0].length;
            const prefixWidth = (item.width / Math.max(str.length, 1)) * prefix.length;

            novasTarjas.push({
              id: Math.random().toString(36).substring(2, 9),
              pageIndex: pIdx - 1,
              pdfX: tx + prefixWidth - 1,
              pdfY: ty - 2,
              pdfWidth: Math.max(matchWidth + 4, 120),
              pdfHeight: fontSize + 3,
              label: "Endereço",
            });
          }
        }
      }
      setTarjas(novasTarjas);
    } catch (err) {
      console.error("Erro no AutoScan:", err);
    } finally {
      setScanning(false);
    }
  }

  // 4. Conversões de Coordenadas (Tela <-> PDF User Space)
  async function screenToPdfCoords(screenX: number, screenY: number, screenW: number, screenH: number) {
    if (!pdfDoc) return { pdfX: 0, pdfY: 0, pdfWidth: 0, pdfHeight: 0 };
    const page = await pdfDoc.getPage(currentPage);
    const viewport = page.getViewport({ scale });

    // No PDF, y=0 é no canto inferior da página
    const pdfX = screenX / scale;
    const pdfHeight = screenH / scale;
    const pdfY = (viewport.height - screenY - screenH) / scale;
    const pdfWidth = screenW / scale;

    return { pdfX, pdfY, pdfWidth, pdfHeight };
  }

  function pdfToScreenCoords(box: TarjaBox) {
    // Retorna { x, y, width, height } em pixels na tela do canvas atual
    const x = box.pdfX * scale;
    const width = box.pdfWidth * scale;
    const height = box.pdfHeight * scale;
    const y = viewportSize.height - (box.pdfY * scale) - height;
    return { x, y, width, height };
  }

  // 5. Manipuladores de Mouse (Desenho Manual, Arrasto e Redimensionamento)
  const handleMouseDown = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (interactionMode !== "none" || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Se clicou fora das caixas, inicia desenho manual
    if (!selectedId) {
      setInteractionMode("draw");
      setDrawBox({ startX: mouseX, startY: mouseY, currentX: mouseX, currentY: mouseY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (interactionMode === "draw" && drawBox) {
      setDrawBox({ ...drawBox, currentX: mouseX, currentY: mouseY });
    } else if (interactionMode === "drag" && selectedId) {
      const dx = (mouseX - dragStart.x) / scale;
      // No PDF y cresce para cima
      const dy = (dragStart.y - mouseY) / scale;

      setTarjas((prev) =>
        prev.map((t) => (t.id === selectedId ? { ...t, pdfX: t.pdfX + dx, pdfY: t.pdfY + dy } : t))
      );
      setDragStart({ x: mouseX, y: mouseY });
    }
  };

  const handleMouseUp = async () => {
    if (interactionMode === "draw" && drawBox) {
      const left = Math.min(drawBox.startX, drawBox.currentX);
      const top = Math.min(drawBox.startY, drawBox.currentY);
      const width = Math.abs(drawBox.currentX - drawBox.startX);
      const height = Math.abs(drawBox.currentY - drawBox.startY);

      if (width > 8 && height > 8) {
        const { pdfX, pdfY, pdfWidth, pdfHeight } = await screenToPdfCoords(left, top, width, height);
        const novaBox: TarjaBox = {
          id: Math.random().toString(36).substring(2, 9),
          pageIndex: currentPage - 1,
          pdfX,
          pdfY,
          pdfWidth,
          pdfHeight,
          label: "Manual",
        };
        setTarjas((prev) => [...prev, novaBox]);
        setSelectedId(novaBox.id);
      }
      setDrawBox(null);
    }
    setInteractionMode("none");
  };

  // 6. Gravação Definitiva
  const handleConfirmar = async () => {
    if (tarjas.length === 0) {
      alert("Nenhuma tarja configurada. Se não houver dados sensíveis, basta fechar.");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch("/api/admin/lgpd/aplicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfUrl, tarjas }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar arquivo tarjado.");

      onSuccess(data.url);
    } catch (err: any) {
      console.error("Erro ao confirmar tarjamento:", err);
      alert(`Falha ao carimbar PDF: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const tarjasPaginAtual = tarjas.filter((t) => t.pageIndex === currentPage - 1);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900/95 backdrop-blur-md">
      {/* ── Cabeçalho Superior ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-wide flex items-center gap-2">
              Auditoria de Dados Sensíveis (LGPD)
              <span className="text-xs bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full font-semibold border border-yellow-400/30">
                Edição Interativa
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Revise, mova, adicione ou exclua as tarjas pretas antes de publicar. Pessoas físicas protegidas automaticamente.
            </p>
          </div>
        </div>

        {/* Ferramentas do Cabeçalho */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => runAutoScan()}
            disabled={scanning || loadingPdf}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-xl border border-gray-700 transition disabled:opacity-50"
            title="Refazer varredura automática"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin text-yellow-400" /> : <Sparkles className="w-4 h-4 text-yellow-400" />}
            Rodar Automação
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm("Deseja apagar todas as tarjas marcadas neste documento?")) setTarjas([]);
            }}
            disabled={tarjas.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold rounded-xl border border-red-800/40 transition disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpar Todas ({tarjas.length})
          </button>

          <div className="h-6 w-px bg-gray-800 mx-1" />

          <button
            type="button"
            onClick={handleConfirmar}
            disabled={saving || loadingPdf}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Confirmar e Gravar Tarjas
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Barra de Ferramentas / Controles da Página ── */}
      <div className="flex items-center justify-between px-6 py-2 bg-gray-850 border-b border-gray-800 text-xs text-gray-300">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Página:</span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || loadingPdf}
            className="p-1 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-white px-2">
            {currentPage} de {numPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages || loadingPdf}
            className="p-1 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-yellow-400 font-medium flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            Dica: Clique e arraste para mover. Para criar nova tarja, clique no espaço livre e arraste o mouse.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400">Zoom:</span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.7, s - 0.2))}
            className="p-1 bg-gray-800 hover:bg-gray-700 rounded-lg"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-bold text-white w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
            className="p-1 bg-gray-800 hover:bg-gray-700 rounded-lg"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Área Central de Visualização do PDF + Overlay de Tarjas ── */}
      <div className="flex-1 overflow-auto bg-gray-950 flex justify-center p-8 relative select-none">
        {loadingPdf && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400 bg-gray-950/80 z-20">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
            <span className="text-sm font-semibold">Carregando e varrendo PDF...</span>
          </div>
        )}

        {error && (
          <div className="m-auto p-6 bg-red-950/60 border border-red-800/80 rounded-2xl max-w-md text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <p className="text-sm text-red-200 font-semibold">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold"
            >
              Voltar ao Formulário
            </button>
          </div>
        )}

        {/* Contentor do Canvas e Camada Interativa */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="relative shadow-2xl rounded-lg overflow-hidden bg-white cursor-crosshair border border-gray-800"
          style={{ width: viewportSize.width || "auto", height: viewportSize.height || "auto" }}
        >
          <canvas ref={canvasRef} className="block pointer-events-none" />

          {/* Renderização das Caixas de Tarja desta Página */}
          {tarjasPaginAtual.map((t) => {
            const sc = pdfToScreenCoords(t);
            const isSelected = selectedId === t.id;

            return (
              <div
                key={t.id}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setSelectedId(t.id);
                  setInteractionMode("drag");
                  const rect = containerRef.current!.getBoundingClientRect();
                  setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
                className={`absolute group transition-all duration-75 flex items-center justify-center ${
                  isSelected ? "z-20 ring-2 ring-yellow-400 ring-offset-1" : "z-10"
                }`}
                style={{
                  left: sc.x,
                  top: sc.y,
                  width: sc.width,
                  height: sc.height,
                  backgroundColor: "rgba(0, 0, 0, 0.92)",
                  border: "1.5px solid #FACC15",
                  cursor: "move",
                }}
                title="Clique e arraste para mover"
              >
                {/* Etiqueta pequena do tipo de dado */}
                <span className="text-[9px] font-black tracking-wider text-yellow-400 uppercase pointer-events-none select-none opacity-80 group-hover:opacity-100">
                  {t.label || "LGPD"}
                </span>

                {/* Botão para Excluir Tarja */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setTarjas((prev) => prev.filter((item) => item.id !== t.id));
                  }}
                  className="absolute -top-3 -right-3 w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition z-30"
                  title="Remover tarja"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {/* Renderização do Desenho Manual em Tempo Real */}
          {drawBox && (
            <div
              className="absolute z-30 bg-black/80 border-2 border-dashed border-yellow-400 pointer-events-none"
              style={{
                left: Math.min(drawBox.startX, drawBox.currentX),
                top: Math.min(drawBox.startY, drawBox.currentY),
                width: Math.abs(drawBox.currentX - drawBox.startX),
                height: Math.abs(drawBox.currentY - drawBox.startY),
              }}
            />
          )}
        </div>
      </div>

      {/* ── Rodapé Informativo ── */}
      <div className="px-6 py-3 bg-gray-900 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
        <div>
          Total de tarjas no documento: <strong className="text-yellow-400 font-bold">{tarjas.length}</strong> (nesta página: {tarjasPaginAtual.length})
        </div>
        <div className="flex items-center gap-4">
          <span>Ao confirmar, as tarjas pretas serão gravadas de forma definitiva (vetorial) no PDF.</span>
        </div>
      </div>
    </div>
  );
}

import os
import sys
import fitz  # PyMuPDF

sys.stdout.reconfigure(encoding='utf-8')

folder = "C:/Users/Áurea Letícia/Downloads/Emendas_2024_2026_Extracted"
out_png = os.path.join(folder, "pngs")
os.makedirs(out_png, exist_ok=True)

files = [f for f in os.listdir(folder) if f.endswith(".pdf")]
print(f"=== PROCESSANDO {len(files)} ARQUIVOS COM PYMUPDF ===")

for f in sorted(files):
    pdf_path = os.path.join(folder, f)
    try:
        doc = fitz.open(pdf_path)
        print(f"\n========================================\nARQUIVO: {f} (Paginas: {len(doc)})")
        
        # 1. Extrair texto da primeira página
        page1 = doc[0]
        
        # 2. Renderizar página 1 para PNG
        pix = page1.get_pixmap(dpi=150)
        png_path = os.path.join(out_png, f.replace(".pdf", ".png"))
        pix.save(png_path)
        print(f" [OK] PNG salvo em: {png_path}")
        
    except Exception as e:
        print(f" [ERRO] em {f}: {e}")

'use client';

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { pdf, type DocumentProps } from '@react-pdf/renderer';
import { Loader2 } from 'lucide-react';

/** Ancho máximo de página en pantalla (px CSS): más allá solo se ve borroso, no más legible. */
const ANCHO_MAXIMO = 900;

/**
 * Vista previa de un PDF para quien no tiene permiso de descarga. En lugar de
 * `PDFViewer` (el visor del navegador, que siempre ofrece descargar e imprimir
 * y guarda con Ctrl+S), genera el PDF en memoria y dibuja cada página como
 * imagen en un <canvas> con pdf.js: el archivo PDF nunca llega a la página.
 *
 * No es una barrera de seguridad (quien ve la pantalla puede tomar una
 * captura): solo evita que la interfaz ofrezca la descarga.
 *
 * @param documento el <Document> de @react-pdf a mostrar; memorizarlo en el
 *                  llamador, cada referencia nueva vuelve a generar el PDF
 */
export default function VisorPdfSinDescarga({ documento }: { documento: ReactElement<DocumentProps> }) {
  const paginas = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');

  useEffect(() => {
    let cancelado = false;
    let destruir: (() => Promise<void>) | undefined;

    (async () => {
      setEstado('cargando');
      try {
        const pdfjs = await import('pdfjs-dist');
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url,
          ).toString();
        }
        const datos = new Uint8Array(await (await pdf(documento).toBlob()).arrayBuffer());
        if (cancelado) return;

        const tarea = pdfjs.getDocument({ data: datos });
        destruir = () => tarea.destroy();
        const doc = await tarea.promise;

        const ancho = Math.min((paginas.current?.clientWidth ?? ANCHO_MAXIMO) - 32, ANCHO_MAXIMO);
        const densidad = window.devicePixelRatio || 1;
        const lienzos: HTMLCanvasElement[] = [];

        for (let n = 1; n <= doc.numPages; n++) {
          const pagina = await doc.getPage(n);
          const escala = ancho / pagina.getViewport({ scale: 1 }).width;
          const viewport = pagina.getViewport({ scale: escala * densidad });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = `${Math.floor(viewport.width / densidad)}px`;
          canvas.className = 'mx-auto mb-4 block bg-white shadow-card';
          canvas.setAttribute('aria-label', `Página ${n} de ${doc.numPages}`);
          await pagina.render({ canvas, viewport }).promise;
          if (cancelado) return;
          lienzos.push(canvas);
        }

        paginas.current?.replaceChildren(...lienzos);
        setEstado('listo');
      } catch {
        if (!cancelado) setEstado('error');
      }
    })();

    return () => {
      cancelado = true;
      void destruir?.();
    };
  }, [documento]);

  return (
    <div className="relative h-full overflow-y-auto" onContextMenu={(e) => e.preventDefault()}>
      {/* Solo los canvas de pdf.js viven aquí: React nunca renderiza hijos en este div */}
      <div ref={paginas} className="px-4 pt-4" />
      {estado !== 'listo' && (
        <div className="absolute inset-0 grid place-items-center bg-canvas/80 text-sm text-ink-muted">
          {estado === 'cargando' ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Generando vista previa…
            </span>
          ) : (
            'No fue posible generar la vista previa.'
          )}
        </div>
      )}
    </div>
  );
}

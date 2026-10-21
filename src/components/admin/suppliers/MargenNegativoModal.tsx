import { useEffect, useId, useRef } from 'react';
import { Button } from '../../ui/shadcn';

export default function MargenNegativoModal({ warnings, onConfirm, onCancel }: {
  warnings: { sku: string; precio: string; costo: string }[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onCancel(); }}
      className="hu-w-full hu-max-w-lg hu-rounded-2xl hu-border hu-border-slate-200 hu-bg-white hu-p-6 hu-text-slate-900 hu-shadow-2xl backdrop:hu-bg-black/60">
      <h2 id={titleId} className="hu-mt-0 hu-text-xl hu-font-bold">Confirmar margen negativo</h2>
      <div className="hu-max-h-80 hu-overflow-y-auto">
        {warnings.map((warning) => (
          <p key={warning.sku} className="hu-text-sm">
            <strong>{warning.sku}</strong>: Atención: El precio de venta (${warning.precio}) es menor al costo base de la presentación (${warning.costo}). ¿Desea continuar con esta parametrización?
          </p>
        ))}
      </div>
      <div className="hu-mt-5 hu-flex hu-justify-end hu-gap-3">
        <Button type="button" variant="secondary" autoFocus onClick={onCancel}>Cancelar</Button>
        <Button type="button" variant="destructive" onClick={onConfirm}>Confirmar y publicar</Button>
      </div>
    </dialog>
  );
}

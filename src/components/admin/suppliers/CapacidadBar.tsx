import { decimalText } from '../../../utils/packagingCalculations';

export default function CapacidadBar({ utilizada, capacidad, unidad }: {
  utilizada: bigint;
  capacidad: bigint;
  unidad: string;
}) {
  const exceeded = utilizada > capacidad;
  const percent = capacidad > 0n ? Number(utilizada * 10000n / capacidad) / 100 : 0;
  return (
    <div className="hu-grid hu-gap-2">
      <p className="hu-m-0 hu-text-sm hu-font-semibold">
        Capacidad utilizada: {decimalText(utilizada)} / {decimalText(capacidad)} {unidad} ({percent}%)
      </p>
      <div role="progressbar" aria-label="Capacidad utilizada" aria-valuemin={0} aria-valuemax={100}
        aria-valuenow={Math.min(100, percent)} aria-valuetext={`${percent}%: ${decimalText(utilizada)} de ${decimalText(capacidad)} ${unidad}`}
        className="hu-h-3 hu-overflow-hidden hu-rounded-full hu-bg-slate-200">
        <div className={`hu-h-full hu-transition-all ${exceeded ? 'hu-bg-red-700' : 'hu-bg-green-700'}`}
          style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
      {exceeded && <p className="hu-m-0 hu-text-sm hu-font-semibold hu-text-red-700" role="alert">
        El total empaquetado ({decimalText(utilizada)}{unidad}) supera la capacidad máxima del contenedor ({decimalText(capacidad)}{unidad})
      </p>}
    </div>
  );
}

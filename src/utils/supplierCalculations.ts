import type { ContainerCreateRequest } from '../Interfaces/supplier';

function toScaledInteger(value: number, decimalPlaces: number): bigint {
  if (!Number.isFinite(value) || value < 0) return 0n;
  const [whole, fraction = ''] = value.toFixed(decimalPlaces).split('.');
  const scale = 10n ** BigInt(decimalPlaces);
  return BigInt(whole) * scale + BigInt(fraction);
}

export function calculateContainerSubtotalCents(container: Pick<
  ContainerCreateRequest,
  'capacidadUnidadesBase' | 'costoBasePorUnidad'
>): bigint {
  const capacityMilliUnits = toScaledInteger(container.capacidadUnidadesBase, 3);
  const costCents = toScaledInteger(container.costoBasePorUnidad, 2);
  return (capacityMilliUnits * costCents + 500n) / 1_000n;
}

export function calculateLotTotalCents(containers: readonly Pick<
  ContainerCreateRequest,
  'capacidadUnidadesBase' | 'costoBasePorUnidad'
>[]): bigint {
  return containers.reduce((total, container) => total + calculateContainerSubtotalCents(container), 0n);
}

export function centsToAmount(cents: bigint): number {
  return Number(cents) / 100;
}

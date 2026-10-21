export function decimalUnits(value: string | number, places = 3): bigint {
  const text = String(value).trim();
  if (!/^\d+(\.\d+)?$/.test(text)) return 0n;
  const [whole, fraction = ''] = text.split('.');
  return BigInt(whole) * 10n ** BigInt(places) + BigInt(fraction.padEnd(places, '0').slice(0, places));
}

export function decimalText(value: bigint, places = 3): string {
  const negative = value < 0n;
  const digits = (negative ? -value : value).toString().padStart(places + 1, '0');
  const fraction = digits.slice(-places).replace(/0+$/, '');
  return `${negative ? '-' : ''}${digits.slice(0, -places)}${fraction ? `.${fraction}` : ''}`;
}

export function presentationCostCents(content: string | number, baseCost: number): bigint {
  return (decimalUnits(content) * decimalUnits(baseCost, 2) + 500n) / 1000n;
}

export function consumedCapacity(rows: readonly { contenidoUnidad: string | number; unidadesCreadas: string | number }[]): bigint {
  return rows.reduce((sum, row) => {
    const packages = String(row.unidadesCreadas);
    return sum + (/^\d+$/.test(packages) ? decimalUnits(row.contenidoUnidad) * BigInt(packages) : 0n);
  }, 0n);
}

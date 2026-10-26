const DECIMAL = /^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/;

/** Convierte un decimal JSON (incluida notacion cientifica) a texto plano sin pasar por Number. */
export function normalizeDecimal(value: string): string {
  const match = DECIMAL.exec(value.trim());
  if (!match) throw new Error(`Importe decimal invalido: ${value}`);
  const [, sign, integer, fraction = '', exponentText = '0'] = match;
  const digits = `${integer}${fraction}`;
  const point = integer.length + Number(exponentText);
  let intPart: string;
  let fracPart: string;
  if (point <= 0) {
    intPart = '0';
    fracPart = `${'0'.repeat(-point)}${digits}`;
  } else if (point >= digits.length) {
    intPart = `${digits}${'0'.repeat(point - digits.length)}`;
    fracPart = '';
  } else {
    intPart = digits.slice(0, point);
    fracPart = digits.slice(point);
  }
  intPart = intPart.replace(/^0+(?=\d)/, '');
  const isZero = /^0*$/.test(intPart + fracPart);
  return `${sign && !isZero ? '-' : ''}${intPart}${fracPart ? `.${fracPart}` : ''}`;
}

/** Formato COP (`$10.000` o `$10.000,50`) sin redondear ni recalcular el importe del servidor. */
export function formatDecimalCOP(value: string): string {
  const plain = normalizeDecimal(value);
  const negative = plain.startsWith('-');
  const [integer, fraction = ''] = plain.replace('-', '').split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const significant = fraction.replace(/0+$/, '');
  const decimals = significant ? `,${significant.padEnd(2, '0')}` : '';
  return `${negative ? '-' : ''}$${grouped}${decimals}`;
}

export function isPositiveDecimal(value: string): boolean {
  const plain = normalizeDecimal(value);
  return !plain.startsWith('-') && /[1-9]/.test(plain);
}

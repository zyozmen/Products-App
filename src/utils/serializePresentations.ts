import type { PresentationCreateRequest } from '../Interfaces/supplier';

// Decimal input remains text until serialization so all 15 integer digits survive JSON transport.
export function serializePresentations(rows: PresentationCreateRequest[]): string {
  return `[${rows.map(({ contenidoUnidad, precioVenta, ...rest }) => {
    const content = String(contenidoUnidad);
    const price = String(precioVenta);
    if (!/^\d{1,15}(?:\.\d{1,3})?$/.test(content) || !/^\d{1,15}(?:\.\d{1,2})?$/.test(price)) {
      throw new Error('Contenido o precio inválido para la solicitud de empaquetado.');
    }
    const literal = (value: string) => value.replace(/^0+(?=\d)/, '');
    return `${JSON.stringify(rest).slice(0, -1)},"contenidoUnidad":${literal(content)},"precioVenta":${literal(price)}}`;
  }).join(',')}]`;
}

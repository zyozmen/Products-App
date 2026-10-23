export interface MarketplacePhoto {
  nombre: string;
  extension: 'png' | 'jpg' | 'jpeg' | 'webp';
  filepart: string;
}

export interface MarketplacePresentation {
  presentacionId: string;
  sku: string;
  nombre: string;
  contenidoUnidad: number;
  unidadBase: string;
  precioVenta: number;
  stockDisponible: number;
  fotografia: MarketplacePhoto | null;
}

export interface MarketplaceStrain {
  cepaId: string;
  nombre: string;
  fotografia: MarketplacePhoto | null;
  precioDesde: number;
  presentaciones: MarketplacePresentation[];
}

export interface MarketplacePage {
  content: MarketplaceStrain[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface MarketplaceListFilters {
  categoryIds?: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
}

export interface MarketplaceDetail extends MarketplaceStrain {
  presentacionSeleccionadaId: string;
}

export interface Cepa {
  id: string;
  nombre: string;
  version: number;
  fotografia?: MarketplacePhoto | null;
  categoryIds?: number[];
}

export interface CepasPage {
  cepas: Cepa[];
  total: number;
}

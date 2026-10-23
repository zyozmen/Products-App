import axios from 'axios';
import { getApiBaseUrl } from './apiConfig.js';
import type { Cepa, CepasPage, MarketplaceDetail, MarketplaceListFilters, MarketplacePage } from '../Interfaces/marketplace';

const endpoint = (path: string) => `${getApiBaseUrl()}${path}`;

export const marketplaceService = {
  async list(search = '', page = 0, size = 20, filters: MarketplaceListFilters = {}): Promise<MarketplacePage> {
    const { data } = await axios.get<MarketplacePage>(endpoint('/marketplace/presentaciones'), {
      params: { buscar: search.trim(), page, size, ...filters },
      paramsSerializer: { indexes: null },
    });
    return data;
  },

  async detail(cepaId: string, presentacionId: string): Promise<MarketplaceDetail> {
    const { data } = await axios.get<MarketplaceDetail>(
      endpoint(`/marketplace/cepas/${encodeURIComponent(cepaId)}/presentaciones/${encodeURIComponent(presentacionId)}`),
    );
    return data;
  },

  async listCepas(page = 0, size = 20): Promise<CepasPage> {
    const { data, headers } = await axios.get<Cepa[]>(endpoint('/cepas'), { params: { page, size } });
    const total = Number(headers['x-total-count']);
    if (!Number.isSafeInteger(total) || total < 0) {
      throw new Error('No se pudo leer el encabezado X-Total-Count de cepas.');
    }
    return { cepas: data, total };
  },

  async getCepa(id: string): Promise<Cepa> {
    const { data } = await axios.get<Cepa>(endpoint(`/cepas/${encodeURIComponent(id)}`));
    return data;
  },

  async createCepa(nombre: string, categoryIds: number[] = []): Promise<Cepa> {
    const { data } = await axios.post<Cepa>(endpoint('/cepas'), { nombre, categoryIds });
    return data;
  },

  async renameCepa(cepa: Cepa, nombre: string, categoryIds?: number[]): Promise<Cepa> {
    const { data } = await axios.put<Cepa>(endpoint(`/cepas/${encodeURIComponent(cepa.id)}`), {
      nombre,
      version: cepa.version,
      ...(categoryIds === undefined ? {} : { categoryIds }),
    });
    return data;
  },

  async uploadCepaPhoto(id: string, photo: File): Promise<void> {
    const form = new FormData();
    form.append('fotoPrincipal', photo);
    await axios.post(
      endpoint(`/v1/images/${encodeURIComponent(id)}?target=CEPA`),
      form,
    );
  },
};

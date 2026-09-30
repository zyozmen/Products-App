import { toProductList, toProduct } from '../Interfaces/ProductInterface';
import BaseRequestService from './BaseRequestService';

const rawProductsApiUrl = String(import.meta.env.VITE_APP_PRODUCTS_API_URL ?? '').trim();
const nodeEnv = String(import.meta.env.NODE_ENV ?? import.meta.env.PROD ?? '').toLowerCase();
const isProduction = nodeEnv === 'true' || nodeEnv === 'production';

const resolveApiBaseUrl = () => {
    if (rawProductsApiUrl) {
        return rawProductsApiUrl;
    }

    if (!isProduction) {
        return 'http://localhost:8080/api/productos';
    }

    return '/api/productos';
};

const normalizeApiUrl = (value) => {
    const trimmedValue = String(value ?? '').trim();

    if (!trimmedValue) {
        return '/api/productos';
    }

    try {
        const parsedUrl = new URL(trimmedValue, 'http://localhost');
        if (/^https?:\/\//i.test(trimmedValue) && parsedUrl.pathname) {
            return parsedUrl.pathname.replace(/\/$/, '') || '/';
        }
    } catch {
        // Ignore invalid URLs and fall back to the raw value.
    }

    return trimmedValue.replace(/\/$/, '');
};

const productsApiUrl = normalizeApiUrl(resolveApiBaseUrl());

const toCategory = (raw = {}) => ({
    category_id: String(raw.category_id ?? raw.id ?? '').trim(),
    name: String(raw.name ?? raw.nombre ?? raw.Description ?? '').trim(),
    slug: String(raw.slug ?? '').trim(),
    products_count: Number(raw.products_count ?? 0),
});

const toCategoryList = (raw) => {
    if (!Array.isArray(raw)) {
        return [];
    }
    return raw.map(toCategory).filter((category) => category.category_id);
};

class ProductosService extends BaseRequestService {
    constructor() {
        super();
        this.url = productsApiUrl;
        this.categoriesUrl = `${productsApiUrl}/categories`;
        this.listarProductos = this.listarProductos.bind(this);
        this.detalleProducto = this.detalleProducto.bind(this);
        this.crearProducto = this.crearProducto.bind(this);
        this.actualizarProducto = this.actualizarProducto.bind(this);
        this.subirImagenesProducto = this.subirImagenesProducto.bind(this);
        this.listarCategorias = this.listarCategorias.bind(this);
    }

    listarProductos(page = 0, size = 15, filters = {}) {
        const {
            searchTerm = '',
            categoryIds = [],
            sortBy = '',
            minPrice,
            maxPrice,
            minRating,
            maxRating,
        } = filters;

        const normalizedSearch = String(searchTerm ?? '').trim();

        const queryParams = new URLSearchParams({
            page: String(page),
            size: String(size),
        });

        if (normalizedSearch) {
            queryParams.set('name', normalizedSearch);
        }

        const normalizedSortBy = String(sortBy ?? '').trim();
        if (normalizedSortBy) {
            queryParams.set('sort_by', normalizedSortBy);
        }

        if (minPrice !== undefined && minPrice !== null) {
            queryParams.set('min_price', String(minPrice));
        }

        if (maxPrice !== undefined && maxPrice !== null) {
            queryParams.set('max_price', String(maxPrice));
        }

        if (minRating !== undefined && minRating !== null) {
            queryParams.set('min_rating', String(minRating));
        }

        if (maxRating !== undefined && maxRating !== null) {
            queryParams.set('max_rating', String(maxRating));
        }

        if (Array.isArray(categoryIds) && categoryIds.length > 0) {
            categoryIds.forEach((categoryId) => {
                queryParams.append('category_ids', String(categoryId));
            });
        }

        const requestUrl = `${this.url}?${queryParams.toString()}`;
        return this.executeGetRequest(requestUrl)
                .then((data) => {
                    const products = toProductList(data).map((product) => ({
                    id: product.id,
                    name: product.name,
                    category_ids: product.category_ids,
                    current_price: product.price.current,
                    original_price: product.price.original,
                    price_currency: product.price.currency,
                    average_rating: product.ranking.average_rating,
                    total_reviews: product.ranking.total_reviews,
                    foto_principal: product.foto_principal || '',
                    }));

                    return {
                        products,
                        pagination: {
                            pageNumber: Number(data?.pageable?.pageNumber ?? data?.number ?? page),
                            pageSize: Number(data?.pageable?.pageSize ?? data?.size ?? size),
                            totalElements: Number(data?.totalElements ?? products.length),
                            totalPages: Number(data?.totalPages ?? (products.length > 0 ? 1 : 0)),
                            numberOfElements: Number(data?.numberOfElements ?? products.length),
                            first: Boolean(data?.first ?? true),
                            last: Boolean(data?.last ?? true),
                            empty: Boolean(data?.empty ?? products.length === 0),
                        },
                    };
                })
                .catch(error => {
                    console.error(error);
                    throw error;
                });

    }

    detalleProducto(id) {
            return this.executeGetRequest(`${this.url}/${id}`)
                .then(data => toProduct(data))
                .catch(error => {
                    console.error(error);
                    throw error;
                });
        }

    crearProducto(product) {
        return this.executePostRequest(`${this.url}`, product)
            .then(data => toProduct(data))
            .catch(error => {
                console.error(error);
                throw error;
            });
    }

    actualizarProducto(id, product) {
        return this.executePutRequest(`${this.url}/${id}`, product)
            .then(data => toProduct(data))
            .catch(error => {
                console.error(error);
                throw error;
            });
    }

    subirImagenesProducto(productId, fotoPrincipal, fotosSecundarias) {
        const formData = new FormData();
        if (fotoPrincipal) {
            formData.append('fotoPrincipal', fotoPrincipal);
        }
        if (Array.isArray(fotosSecundarias) && fotosSecundarias.length > 0) {
            fotosSecundarias.forEach((file) => {
                formData.append('fotosSecundarias', file);
            });
        }
        // Nota: Asegúrate de que el endpoint del backend mapee a la ruta correcta. 
        // Si tu backend mapea a la ruta en español ("/{idProducto}/imagenes"), cambia "/images" por "/imagenes" abajo.
        return this.executePostRequest(`${this.url}/${productId}/images`, formData)
            .catch(error => {
                console.error("Error al subir las imágenes del producto:", error);
                throw error;
            });
    }

    listarDestacados() {
        return this.executeGetRequest(`${this.url}/featured`)
                .then(data => toProductList(data))
                .catch(error => {
                    console.error(error);
                    throw error;
                });

    }

    async listarCategorias() {
        try {
            const data = await this.executeGetRequest(this.categoriesUrl);
            return toCategoryList(data);
        } catch (firstError) {
            // Fallback for backends that expose the endpoint in Spanish.
            try {
                const data = await this.executeGetRequest(this.categoriesUrl);
                return toCategoryList(data);
            } catch (fallbackError) {
                console.error(firstError);
                console.error(fallbackError);
                throw fallbackError;
            }
        }
    }
}

const productosService = new ProductosService();

export default productosService;
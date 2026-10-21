import axios from 'axios';
import { getApiBaseUrl } from './apiConfig.js';

// Contrato: /api/v1/categories (JSON) + carga de imagen en /api/v1/images/{id} (multipart).
// El JWT lo agrega el interceptor de axios (httpClient). No se fija Content-Type en multipart.
const v1Url = (path = '') => `${getApiBaseUrl()}/v1${path}`;

// Origen del backend para resolver imágenes relativas (`/api/v1/categories/7/image`).
const backendOrigin = () => getApiBaseUrl().replace(/\/api$/, '');

export const toCategory = (raw = {}) => ({
    category_id: String(raw.id ?? raw.category_id ?? '').trim(),
    name: String(raw.name ?? '').trim(),
    slug: String(raw.slug ?? '').trim(),
    description: String(raw.description ?? '').trim(),
    image_url: String(raw.imageUrl ?? raw.image_url ?? '').trim(),
    products_count: raw.products_count === undefined ? undefined : Number(raw.products_count),
    image_version: raw.image_version,
});

export const resolveCategoryImage = (imageUrl) => {
    if (!imageUrl) return null;
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
    return `${backendOrigin()}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

export const getCategoryImageSrc = (category) => {
    const src = resolveCategoryImage(category?.image_url);
    if (!src) return '/img/category-placeholder.svg';
    return category.image_version ? `${src}?v=${category.image_version}` : src;
};

const toRequest = ({ name, description }) => ({
    name: String(name ?? '').trim(),
    description: String(description ?? '').trim() || null,
});

class CategoryService {
    async getCategories() {
        const { data } = await axios.get(v1Url('/categories'));
        return Array.isArray(data) ? data.map(toCategory).filter((category) => category.category_id) : [];
    }

    async createCategory(category) {
        const { data } = await axios.post(v1Url('/categories'), toRequest(category));
        return toCategory(data);
    }

    // Omitir imageUrl conserva la imagen anterior.
    async updateCategory(id, category) {
        const { data } = await axios.put(v1Url(`/categories/${encodeURIComponent(id)}`), toRequest(category));
        return toCategory(data);
    }

    async uploadCategoryImage(id, file) {
        const formData = new FormData();
        formData.append('target', 'CATEGORY');
        formData.append('fotoPrincipal', file);
        const { data } = await axios.post(v1Url(`/images/${encodeURIComponent(id)}`), formData);
        return { ...toCategory(data), image_version: Date.now() };
    }

    // Crea/edita y luego sube la imagen. Si la carga falla, la categoría ya existe: se devuelve `imageFailed`
    // para reintentar solo la carga (nunca repetir el POST de creación).
    async saveCategory({ id, name, description, image }) {
        const saved = id
            ? await this.updateCategory(id, { name, description })
            : await this.createCategory({ name, description });
        if (!image) return { category: saved, imageFailed: false };
        try {
            return { category: await this.uploadCategoryImage(saved.category_id, image), imageFailed: false };
        } catch (error) {
            return { category: saved, imageFailed: true, imageError: error };
        }
    }
}

const categoryService = new CategoryService();

export default categoryService;

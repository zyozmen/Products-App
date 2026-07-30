export const emptyCategory = () => ({ name: "", slug: "", category_id: "" });

export const emptyComment = () => ({
    username: "",
    rating: "",
    title: "",
    body: "",
    comment_id: "",
    user_id: "",
    created_at: "",
});

export const createInitialForm = () => ({
    // Basic info
    name: "",
    slug: "",
    description: "",
    sku: "",
    status: "ACTIVE",
    created_at: "",
    updated_at: "",

    // Price
    price_current: "",
    price_original: "",
    price_currency: "USD",
    price_discount_percentage: "",
    price_tax_inclusive: false,

    // Ranking
    ranking_average_rating: "",
    ranking_total_reviews: "",
    ranking_5_star: "",
    ranking_4_star: "",
    ranking_3_star: "",
    ranking_2_star: "",
    ranking_1_star: "",

    // Dynamic arrays
    categories: [emptyCategory()],
    recent_comments: [],
});

export const updateFlatField = (form, target) => {
    const { name, value, type, checked } = target;
    return {
        ...form,
        [name]: type === "checkbox" ? checked : value,
    };
};

export const updateCategoryField = (form, index, field, value) => ({
    ...form,
    categories: form.categories.map((cat, i) =>
        i === index ? { ...cat, [field]: value } : cat
    ),
});

export const updateCategoryById = (form, index, value, availableCategories) => {
    const trimmedValue = value.trim();
    const selectedCategory = availableCategories.find(
        (category) => category.category_id === trimmedValue
    );

    return {
        ...form,
        categories: form.categories.map((cat, i) => {
            if (i !== index) {
                return cat;
            }

            if (!trimmedValue) {
                return emptyCategory();
            }

            if (!selectedCategory) {
                return { ...cat, category_id: value };
            }

            return {
                ...cat,
                category_id: selectedCategory.category_id,
                name: selectedCategory.name || cat.name,
                slug: selectedCategory.slug || cat.slug,
            };
        }),
    };
};

export const updateCategoryByName = (form, index, value, availableCategories) => {
    const normalizedValue = value.trim().toLowerCase();
    const selectedCategory = availableCategories.find(
        (category) => category.name.trim().toLowerCase() === normalizedValue
    );

    return {
        ...form,
        categories: form.categories.map((cat, i) => {
            if (i !== index) {
                return cat;
            }

            if (!selectedCategory) {
                return { ...cat, name: value };
            }

            return {
                ...cat,
                name: selectedCategory.name,
                category_id: selectedCategory.category_id,
                slug: selectedCategory.slug || cat.slug,
            };
        }),
    };
};

export const appendCategory = (form) => ({
    ...form,
    categories: [...form.categories, emptyCategory()],
});

export const removeCategoryAt = (form, index) => ({
    ...form,
    categories: form.categories.filter((_, i) => i !== index),
});

export const updateCommentField = (form, index, field, value) => ({
    ...form,
    recent_comments: form.recent_comments.map((comment, i) =>
        i === index ? { ...comment, [field]: value } : comment
    ),
});

export const appendComment = (form) => ({
    ...form,
    recent_comments: [...form.recent_comments, emptyComment()],
});

export const removeCommentAt = (form, index) => ({
    ...form,
    recent_comments: form.recent_comments.filter((_, i) => i !== index),
});

export const normalize = (value) => String(value || "").trim().toLowerCase();

export const isExistingCategorySelected = (category, availableCategories) => {
    const categoryId = category.category_id.trim();
    return (
        !!categoryId &&
        availableCategories.some(
            (existingCategory) => existingCategory.category_id === categoryId
        )
    );
};

export const validateProductForm = (form, availableCategories) => {
    if (!form.name.trim()) return "Product name is required.";
    if (!form.description.trim()) return "Product description is required.";
    if (Number(form.price_current) <= 0) return "Current price must be greater than zero.";
    if (
        form.price_original &&
        Number(form.price_original) < Number(form.price_current)
    ) {
        return "Original price must be greater than or equal to the current price.";
    }

    const hasAtLeastOneCategory = form.categories.some(
        (category) => category.category_id.trim() || category.name.trim()
    );

    if (!hasAtLeastOneCategory) {
        return "At least one category is required.";
    }

    for (const category of form.categories) {
        const categoryId = category.category_id.trim();
        const categoryName = normalize(category.name);
        const categorySlug = normalize(category.slug);

        if (!categoryId && !categoryName && !categorySlug) {
            continue;
        }

        const isExistingCategoryById = availableCategories.some(
            (existingCategory) => existingCategory.category_id === categoryId
        );

        if (isExistingCategoryById) {
            continue;
        }

        const hasExistingName = categoryName
            ? availableCategories.some(
                (existingCategory) => normalize(existingCategory.name) === categoryName
            )
            : false;

        if (hasExistingName) {
            return `Category name "${category.name}" already exists. Use the existing category or choose another name.`;
        }

        const hasExistingSlug = categorySlug
            ? availableCategories.some(
                (existingCategory) => normalize(existingCategory.slug) === categorySlug
            )
            : false;

        if (hasExistingSlug) {
            return `Category slug "${category.slug}" already exists. Use the existing category or choose another slug.`;
        }
    }

    return "";
};

export const createSlug = (name) =>
    name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

export const buildProductPayload = (form) => {
    const current = Number(form.price_current);
    const original = form.price_original ? Number(form.price_original) : current;

    return {
        name: form.name.trim(),
        nombre: form.name.trim(),
        slug: form.slug.trim() || createSlug(form.name),
        description: form.description.trim(),
        descripcion: form.description.trim(),
        sku: form.sku.trim(),
        status: form.status,
        created_at: form.created_at || undefined,
        updated_at: form.updated_at || undefined,

        categories: form.categories
            .filter((c) => c.name.trim() || c.slug.trim() || c.category_id.trim())
            .map((c) => ({
                category_id: c.category_id.trim(),
                name: c.name.trim(),
                slug: c.slug.trim(),
            })),

        price: {
            current,
            original,
            currency: form.price_currency,
            discount_percentage: Number(form.price_discount_percentage) || 0,
            tax_inclusive: form.price_tax_inclusive,
        },
        precio: current,

        ranking: {
            average_rating: Number(form.ranking_average_rating) || 0,
            total_reviews: Number(form.ranking_total_reviews) || 0,
            rating_distribution: {
                "5_star": Number(form.ranking_5_star) || 0,
                "4_star": Number(form.ranking_4_star) || 0,
                "3_star": Number(form.ranking_3_star) || 0,
                "2_star": Number(form.ranking_2_star) || 0,
                "1_star": Number(form.ranking_1_star) || 0,
            },
        },

        recent_comments: form.recent_comments
            .filter((c) => c.username.trim())
            .map((c) => ({
                username: c.username.trim(),
                rating: Number(c.rating) || 0,
                title: c.title.trim(),
                body: c.body.trim(),
                comment_id: c.comment_id.trim(),
                user_id: c.user_id.trim(),
                created_at: c.created_at,
            })),
    };
};

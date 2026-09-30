const LANG_STORAGE_KEY = 'growShopLanguage';

class TranslationService {
    constructor() {
        this.listeners = [];
        this.currentLanguage = this.loadLanguage();
        this.translations = {
            ES: {
                // Header (All displayed texts in Spanish)
                my_account: 'Mi Cuenta',
                sign_in: 'Iniciar sesión',
                create_product: 'Crear Producto',
                logout: 'Cerrar sesión',
                customer_service: 'Servicio al Cliente',
                search_placeholder: 'Buscar productos',
                language_dropdown: 'ES',
                view_favs: 'Ver favoritos',
                view_cart: 'Ver carrito',
                customer_service_num: '+57 312 4058166',

                // NavBar
                cafe_premium: 'Café Premium',
                flor_premium: 'Flor Premium',
                flor_en_sale: 'Flor en Oferta',
                hidroponia: 'Hidroponía',
                contacto: 'Contacto',

                // Welcome / Dashboard / Carousel / Categories / Featured
                save_20: 'Ahorra 20%',
                special_offer: 'Oferta Especial',
                shop_now: 'Comprar Ahora',
                categories: 'Categorías',
                products_count: '100 Productos',
                featured_products: 'Productos Destacados',

                // Footer
                get_in_touch: 'Ponerse en Contacto',
                footer_touch_text: 'No dolore ipsum accusam no lorem. Invidunt sed clita kasd clita et et dolor sed dolor. Rebum tempor no vero est magna amet no',
                quick_shop: 'Tienda Rápida',
                home: 'Inicio',
                our_shop: 'Nuestra Tienda',
                shop_detail: 'Detalle de Tienda',
                shopping_cart: 'Carrito de Compras',
                checkout: 'Pagar',
                contact_us: 'Contáctenos',
                newsletter: 'Boletín informativo',
                newsletter_text: 'Duo stet tempor ipsum sit amet magna ipsum tempor est',
                email_placeholder: 'Su dirección de correo electrónico',
                sign_up: 'Registrarse',
                follow_us: 'Síguenos',
                all_rights_reserved: 'Todos los derechos reservados. Diseñado por',

                // Cart / Shopping Cart
                cart: 'Carrito',
                product: 'Producto',
                price: 'Precio',
                quantity: 'Cantidad',
                total: 'Total',
                remove: 'Eliminar',
                cart_summary: 'Resumen del Carrito',
                subtotal: 'Subtotal',
                shipping: 'Envío',
                calculated_later: 'Calculado al finalizar la compra',
                proceed_checkout: 'Proceder al pago',
                coupon_code: 'Código de cupón',
                apply_coupon: 'Aplicar cupón',
                empty_cart: 'Tu carrito de compras está vacío.',
                delivery_details: 'Detalles de la Entrega',
                recipient_name: 'Nombre del destinatario',
                address: 'Dirección',
                address_complement: 'Complemento de la dirección (opcional)',
                contact_phone: 'Teléfono de contacto',
                thank_you_purchase: 'Gracias por comprar con nosotros',
                order_opened_whatsapp: 'Tu pedido se abrió en WhatsApp.',
                accept: 'Aceptar',
                tax: 'Impuesto',

                // Login
                login: 'Iniciar Sesión',
                username: 'Nombre de usuario',
                password: 'Contraseña',
                error_login: 'Usuario o contraseña incorrectos',
                username_required: 'El nombre de usuario es obligatorio',
                password_required: 'La contraseña es obligatoria',
                error_component_title: 'Un error ha ocurrido. Contacte al soporte técnico.',
                create_account: 'Crear cuenta',
                or_use_email: 'o usa tu correo para registrarte',
                name: 'Nombre',
                email: 'Correo electrónico',
                forgot_password: '¿Olvidaste tu contraseña?',
                welcome_back: '¡Bienvenido de nuevo!',
                welcome_back_text: 'Para mantenerte conectado con nosotros, inicia sesión con tu información personal',
                hello_friend: '¡Hola, Amigo!',
                journey_text: 'Ingresa tus datos personales y comienza tu viaje con nosotros',
                invalid_credentials: 'Credenciales inválidas',
                user_name_label: 'Nombre de usuario',

                // Create Product
                create_product_title: 'Crear Producto',
                create_product_subtitle: 'Agrega un nuevo producto y publícalo en el catálogo.',
                basic_info_title: 'Información Básica',
                name_label: 'Nombre *',
                sku_label: 'SKU',
                description_label: 'Descripción *',
                slug_label: 'Slug',
                slug_placeholder: 'Generado a partir del nombre si se deja vacío',
                status_label: 'Estado',
                status_active: 'ACTIVO',
                status_draft: 'BORRADOR',
                status_inactive: 'INACTIVO',
                price_title: 'Precio',
                current_price_label: 'Precio Actual *',
                currency_label: 'Moneda',
                discount_percentage_label: 'Porcentaje de Descuento %',
                tax_inclusive_label: 'Precio con impuestos incluidos',
                categories_title: 'Categorías *',
                categories_subtitle: 'Agrega o selecciona al menos una categoría antes de crear el producto.',
                add_category_btn: '+ Agregar Categoría',
                saving_btn: 'Guardando...',
                create_product_btn: 'Crear Producto',
                edit_product_title: 'Editar Producto',
                edit_product_subtitle: 'Modifica los campos a continuación para actualizar el producto.',
                update_product_btn: 'Actualizar Producto',
                categories_load_error: 'No se pudieron cargar las categorías. Todavía puedes escribir el id de la categoría manualmente.',
                product_creation_error: 'El producto no pudo ser creado.',
                product_load_error: 'No se pudieron cargar los detalles del producto.',
                product_update_error: 'El producto no pudo ser actualizado.',
                images_title: 'Imágenes del Producto',
                main_image_label: 'Foto Principal (Solo puede tener una)',
                secondary_images_label: 'Fotos Secundarias (Máximo 5 imágenes)',
                cannot_add_more_secondary_img: 'Solo puedes agregar un máximo de 5 imágenes secundarias.',
                select_file_btn: 'Seleccionar archivo',
                remove_img_btn: 'Eliminar',
                main_image_help: 'Sube la imagen de portada de tu producto.',
                secondary_images_help: 'Sube hasta 5 fotos adicionales.',

                // Shop
                filter_by_name: 'Filtrar por Nombre',
                filter_by_price: 'Filtrar por Precio',
                filter_by_category: 'Filtrar por Categoría',
                filter_name_placeholder: 'Filtrar por nombre de producto',
                clear_btn: 'Limpiar',
                all_price: 'Todo Precio',
                all_categories: 'Todas las Categorías',
                loading_categories: 'Cargando categorías...',
                loading_products: 'Cargando productos...',
                could_not_load_categories: 'No se pudieron cargar las categorías.',
                could_not_load_products: 'No se pudieron cargar los productos.',
                previous: 'Anterior',
                next: 'Siguiente',
                showing: 'Mostrando',
                of: 'de',
                page: 'Página',
                product_not_found: 'Producto no encontrado',
                product_added_to_cart: 'Tu producto fue añadido al carrito',
                sorting: 'Clasificación',
                default_sort: 'Predeterminado',
                price_sort: 'Precio',
                rating_sort: 'Mejor Calificación'
            },
            EN: {
                // Header
                my_account: 'My Account',
                sign_in: 'Sign in',
                create_product: 'Create Product',
                logout: 'Logout',
                customer_service: 'Customer Service',
                search_placeholder: 'Search for products',
                language_dropdown: 'EN',
                view_favs: 'View favorites',
                view_cart: 'View cart',
                customer_service_num: '+57 312 4058166',

                // NavBar
                cafe_premium: 'Premium Coffee',
                flor_premium: 'Premium Flower',
                flor_en_sale: 'Flower on Sale',
                hidroponia: 'Hydroponics',
                contacto: 'Contact',

                // Welcome / Dashboard / Carousel / Categories / Featured
                save_20: 'Save 20%',
                special_offer: 'Special Offer',
                shop_now: 'Shop Now',
                categories: 'Categories',
                products_count: '100 Products',
                featured_products: 'Featured Products',

                // Footer
                get_in_touch: 'Get In Touch',
                footer_touch_text: 'No dolore ipsum accusam no lorem. Invidunt sed clita kasd clita et et dolor sed dolor. Rebum tempor no vero est magna amet no',
                quick_shop: 'Quick Shop',
                home: 'Home',
                our_shop: 'Our Shop',
                shop_detail: 'Shop Detail',
                shopping_cart: 'Shopping Cart',
                checkout: 'Checkout',
                contact_us: 'Contact Us',
                newsletter: 'Newsletter',
                newsletter_text: 'Duo stet tempor ipsum sit amet magna ipsum tempor est',
                email_placeholder: 'Your Email Address',
                sign_up: 'Sign Up',
                follow_us: 'Follow Us',
                all_rights_reserved: 'All Rights Reserved. Designed by',

                // Cart / Shopping Cart
                cart: 'Cart',
                product: 'Product',
                price: 'Price',
                quantity: 'Quantity',
                total: 'Total',
                remove: 'Remove',
                cart_summary: 'Cart Summary',
                subtotal: 'Subtotal',
                shipping: 'Shipping',
                calculated_later: 'Calculated at checkout',
                proceed_checkout: 'Proceed to Checkout',
                coupon_code: 'Coupon Code',
                apply_coupon: 'Apply Coupon',
                empty_cart: 'Your shopping cart is empty.',
                delivery_details: 'Delivery Details',
                recipient_name: 'Recipient Name',
                address: 'Address',
                address_complement: 'Address complement (optional)',
                contact_phone: 'Contact Phone',
                thank_you_purchase: 'Thank you for shopping with us',
                order_opened_whatsapp: 'Your order was opened in WhatsApp.',
                accept: 'Accept',
                tax: 'Tax',

                // Login
                login: 'Login',
                username: 'Username',
                password: 'Password',
                error_login: 'Invalid username or password',
                username_required: 'Username is required',
                password_required: 'Password is required',
                error_component_title: 'An error occurred. Contact tech support.',
                create_account: 'Create Account',
                or_use_email: 'or use your email for registration',
                name: 'Name',
                email: 'Email',
                forgot_password: 'Forgot your password?',
                welcome_back: 'Welcome Back!',
                welcome_back_text: 'To keep connected with us please login with your personal info',
                hello_friend: 'Hello, Friend!',
                journey_text: 'Enter your personal details and start journey with us',
                invalid_credentials: 'Invalid Credentials',
                user_name_label: 'User Name',

                // Create Product
                create_product_title: 'Create Product',
                create_product_subtitle: 'Add a new product and publish it to the catalog.',
                basic_info_title: 'Basic Information',
                name_label: 'Name *',
                sku_label: 'SKU',
                description_label: 'Description *',
                slug_label: 'Slug',
                slug_placeholder: 'Generated from name if left empty',
                status_label: 'Status',
                status_active: 'ACTIVE',
                status_draft: 'DRAFT',
                status_inactive: 'INACTIVE',
                price_title: 'Price',
                current_price_label: 'Current Price *',
                currency_label: 'Currency',
                discount_percentage_label: 'Discount %',
                tax_inclusive_label: 'Tax inclusive price',
                categories_title: 'Categories *',
                categories_subtitle: 'Add or select at least one category before creating the product.',
                add_category_btn: '+ Add Category',
                saving_btn: 'Saving...',
                create_product_btn: 'Create Product',
                edit_product_title: 'Edit Product',
                edit_product_subtitle: 'Modify the fields below to update the product.',
                update_product_btn: 'Update Product',
                categories_load_error: 'Categories could not be loaded. You can still type the category id manually.',
                product_creation_error: 'The product could not be created.',
                product_load_error: 'Product details could not be loaded.',
                product_update_error: 'The product could not be updated.',
                images_title: 'Product Images',
                main_image_label: 'Main Photo (Only one allowed)',
                secondary_images_label: 'Secondary Photos (Maximum of 5 images)',
                cannot_add_more_secondary_img: 'You can only add a maximum of 5 secondary images.',
                select_file_btn: 'Select file',
                remove_img_btn: 'Remove',
                main_image_help: 'Upload the cover image of your product.',
                secondary_images_help: 'Upload up to 5 additional photos.',

                // Shop
                filter_by_name: 'Filter by Name',
                filter_by_price: 'Filter by Price',
                filter_by_category: 'Filter by Category',
                filter_name_placeholder: 'Filter by product name',
                clear_btn: 'Clear',
                all_price: 'All Price',
                all_categories: 'All Categories',
                loading_categories: 'Loading categories...',
                loading_products: 'Loading products...',
                could_not_load_categories: 'Could not load categories.',
                could_not_load_products: 'Could not load products.',
                previous: 'Previous',
                next: 'Next',
                showing: 'Showing',
                of: 'of',
                page: 'Page',
                product_not_found: 'Product not found',
                product_added_to_cart: 'Your product was added to the cart',
                sorting: 'Sorting',
                default_sort: 'Default',
                price_sort: 'Price',
                rating_sort: 'Best Rating'
            }
        };
    }

    loadLanguage() {
        try {
            const stored = localStorage.getItem(LANG_STORAGE_KEY);
            return stored === 'EN' ? 'EN' : 'ES';
        } catch (error) {
            console.error('Error loading language from storage:', error);
            return 'ES';
        }
    }

    getLanguage() {
        return this.currentLanguage;
    }

    setLanguage(lang) {
        const nextLang = lang === 'EN' ? 'EN' : 'ES';
        if (this.currentLanguage !== nextLang) {
            this.currentLanguage = nextLang;
            try {
                localStorage.setItem(LANG_STORAGE_KEY, nextLang);
            } catch (error) {
                console.error('Error saving language to storage:', error);
            }
            this.notifyListeners();
        }
    }

    notifyListeners() {
        this.listeners.forEach((listener) => listener(this.currentLanguage));
    }

    subscribe(listener) {
        this.listeners.push(listener);
        // Invoke listener initially
        listener(this.currentLanguage);
        return () => {
            this.listeners = this.listeners.filter((registered) => registered !== listener);
        };
    }

    t(key) {
        const lang = this.currentLanguage;
        const translation = this.translations[lang] && this.translations[lang][key];
        if (translation !== undefined) {
            return translation;
        }
        const fallback = this.translations['ES'][key];
        if (fallback !== undefined) {
            return fallback;
        }
        return key;
    }
}

const translationService = new TranslationService();
export default translationService;

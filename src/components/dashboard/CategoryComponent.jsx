import React, { Component } from 'react';
import translationService from '../../services/TranslationService';
import productosService from '../../services/ProductosService';
import navigationComponent from '../navigation/NavigationComponent.jsx';
import './CategoryComponent.css';

class CategoryComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentLanguage: translationService.getLanguage(),
            category: []
        };
        this.unsubscribeFromLanguage = null;
        this.handleCategoryClick = this.handleCategoryClick.bind(this);
    }

    async componentDidMount() {
        this.unsubscribeFromLanguage = translationService.subscribe((lang) => {
            this.setState({ currentLanguage: lang });
        });

        try {
            const categories = await productosService.listarCategorias();
            this.setState({ category: categories || [] });
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    componentWillUnmount() {
        if (this.unsubscribeFromLanguage) {
            this.unsubscribeFromLanguage();
        }
    }

    handleCategoryClick(categoryId) {
        this.props.navigate(`/shop?category=${encodeURIComponent(categoryId)}`);
    }

    render() {
        const t = (key) => translationService.t(key);
        const { category, currentLanguage } = this.state;
        const productsLabel = currentLanguage === 'EN' ? 'Products' : 'Productos';

        return (
            <div className="container-fluid pt-5">
                <h2 className="section-title position-relative text-uppercase mx-xl-5 mb-4">
                    <span className="bg-secondary pr-3">{t('categories')}</span>
                </h2>
                <div className="row px-xl-5 pb-3">
                    {category.map(cat => (
                        <div className="col-lg-3 col-md-4 col-sm-6 pb-1" key={cat.category_id}>
                            <button 
                                type="button" 
                                className="text-decoration-none btn btn-link p-0 w-100 text-left"
                                onClick={() => this.handleCategoryClick(cat.category_id)}
                                style={{ border: 'none', background: 'none' }}
                            >
                                <div className="cat-item d-flex align-items-center mb-4">
                                    <div className="overflow-hidden category-image-wrapper">
                                        <img className="img-fluid" src={`/img/cat-${cat.category_id}.jpg`} alt={cat.name} />
                                    </div>
                                    <div className="flex-fill pl-3">
                                        <h6 className="text-dark font-weight-bold mb-1">{cat.name}</h6>
                                        <small className="text-body">{cat.products_count} {productsLabel}</small>
                                    </div>
                                </div>
                            </button>
                        </div>
                    ))}
                    {category.length === 0 && (
                        <div className="col text-center py-4">
                            <p className="text-muted">Cargando categorías...</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default navigationComponent(CategoryComponent);
import React, { Component } from 'react';
import SwiperCarousel from '../ui/SwiperCarousel';
import translationService from '../../services/TranslationService';
import './CarrouselComponent.css';

class CarrouselComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentLanguage: translationService.getLanguage(),
            carrousel:
                [
                    { id: 1, Description: '' },
                    { id: 2, Description: '' }
                ]

        };
        this.unsubscribeFromLanguage = null;
    }

    componentDidMount() {
        this.unsubscribeFromLanguage = translationService.subscribe((lang) => {
            this.setState({ currentLanguage: lang });
        });
    }

    componentWillUnmount() {
        if (this.unsubscribeFromLanguage) {
            this.unsubscribeFromLanguage();
        }
    }

    render() {
        const t = (key) => translationService.t(key);
        return (
            <>
                {/* Carousel Start */}
                <div className="container-fluid mb-3">
                    <div className="row px-xl-5">
                        <div className="col-lg-8">
                            <SwiperCarousel
                                items={this.state.carrousel.map((carrousel, index) => ({
                                    id: carrousel.id,
                                    title: carrousel.Description,
                                    description: 'Lorem rebum magna amet lorem magna erat diam stet. Sadips duo stet amet amet ndiam elitr ipsum diam',
                                    image: `/img/carousel-${index + 1}.jpg`,
                                }))}
                            />
                        </div>
                        <div className="col-lg-4">
                            <div className="product-offer mb-30 offer-card">
                                <img className="img-fluid" src="/logo192.png" alt="" />
                                <div className="offer-text">
                                    <h6 className="text-white text-uppercase">{t('save_20')}</h6>
                                    <h3 className="text-white mb-3">{t('special_offer')}</h3>
                                    <button type="button" className="btn btn-primary">
                                        {t('shop_now')}
                                    </button>
                                </div>
                            </div>
                            <div className="product-offer mb-30 offer-card">
                                <img className="img-fluid" src="/logo512.png" alt="" />
                                <div className="offer-text">
                                    <h6 className="text-white text-uppercase">{t('save_20')}</h6>
                                    <h3 className="text-white mb-3">{t('special_offer')}</h3>
                                    <button type="button" className="btn btn-primary">
                                        {t('shop_now')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Carousel End */}
            </>


        );
    }
}
export default CarrouselComponent;
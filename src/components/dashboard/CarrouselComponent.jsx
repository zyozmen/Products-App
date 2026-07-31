import React, { Component } from 'react';
import SwiperCarousel from '../ui/SwiperCarousel';

class CarrouselComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            carrousel:
                [
                    { id: 1, Description: 'Category Name 1' },
                    { id: 2, Description: 'Category Name 2' },
                    { id: 3, Description: 'Category Name 3' },
                    { id: 4, Description: 'Category Name 4' },
                    { id: 5, Description: 'Category Name 5' }
                ]

        };
    }
    render() {
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
                            <div className="product-offer mb-30" style={{ height: 200 }}>
                                <img className="img-fluid" src="/logo192.png" alt="" />
                                <div className="offer-text">
                                    <h6 className="text-white text-uppercase">Save 20%</h6>
                                    <h3 className="text-white mb-3">Special Offer</h3>
                                    <a href="" className="btn btn-primary">
                                        Shop Now
                                    </a>
                                </div>
                            </div>
                            <div className="product-offer mb-30" style={{ height: 200 }}>
                                <img className="img-fluid" src="/logo512.png" alt="" />
                                <div className="offer-text">
                                    <h6 className="text-white text-uppercase">Save 20%</h6>
                                    <h3 className="text-white mb-3">Special Offer</h3>
                                    <a href="" className="btn btn-primary">
                                        Shop Now
                                    </a>
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
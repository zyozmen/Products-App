import React, { Component } from 'react';

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
                            <div
                                id="header-carousel"
                                className="carousel slide carousel-fade mb-30 mb-lg-0"
                                data-ride="carousel"
                            >

                                <ol className="carousel-indicators">
                                    {this.state.carrousel.map((carrousel, index) => (
                                        <li
                                            key={carrousel.id}
                                            data-target="#header-carousel"
                                            data-slide-to={index}
                                            className={index === 0 ? 'active' : ''}
                                        />
                                    ))}
                                </ol>
                                <div className="carousel-inner">
                                    {this.state.carrousel.map((carrousel, index) => (
                                        <div
                                            className={`carousel-item position-relative ${index === 0 ? 'active' : ''}`}
                                            style={{ height: 430 }}>
                                            <img
                                                className="position-absolute w-100 h-100"
                                                src={`/img/carousel-${index + 1}.jpg`}
                                                style={{ objectFit: "cover" }}
                                            />
                                            <div className="carousel-caption d-flex flex-column align-items-center justify-content-center">
                                                <div className="p-3" style={{ maxWidth: 700 }}>
                                                    <h1 className="display-4 text-white mb-3 animate__animated animate__fadeInDown">
                                                        {carrousel.Description}
                                                    </h1>
                                                    <p className="mx-md-5 px-5 animate__animated animate__bounceIn">
                                                        Lorem rebum magna amet lorem magna erat diam stet. Sadips
                                                        duo stet amet amet ndiam elitr ipsum diam
                                                    </p>
                                                    <a
                                                        className="btn btn-outline-light py-2 px-4 mt-3 animate__animated animate__fadeInUp"
                                                        href="#"
                                                    >
                                                        Shop Now
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
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
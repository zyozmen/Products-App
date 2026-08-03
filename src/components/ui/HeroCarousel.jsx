import React, { useState } from 'react';
import './HeroCarousel.css';

const HeroCarousel = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="carousel slide carousel-fade mb-30 mb-lg-0 hero-carousel">
      <ol className="carousel-indicators">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`hero-carousel-indicator ${index === activeIndex ? 'active' : ''}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Ir al slide ${index + 1}`}
          />
        ))}
      </ol>
      <div className="carousel-inner">
        {items.map((item, index) => (
          <div key={item.id} className={`carousel-item position-relative hero-carousel-item ${index === activeIndex ? 'active' : ''}`}>
            <img className="position-absolute w-100 h-100 hero-carousel-image" src={item.image} alt={item.title} />
            <div className="carousel-caption d-flex flex-column align-items-center justify-content-center">
              <div className="p-3 hero-carousel-caption">
                <h1 className="display-4 text-white mb-3 animate__animated animate__fadeInDown">{item.title}</h1>
                <p className="mx-md-5 px-5 animate__animated animate__bounceIn">{item.description}</p>
                <button type="button" className="btn btn-outline-light py-2 px-4 mt-3 animate__animated animate__fadeInUp">Shop Now</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="carousel-control-prev" onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))}>
        <i className="fa fa-2x fa-angle-left text-dark" />
      </button>
      <button type="button" className="carousel-control-next" onClick={() => setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))}>
        <i className="fa fa-2x fa-angle-right text-dark" />
      </button>
    </div>
  );
};

export default HeroCarousel;

import React, { useState } from 'react';
import './ImageCarousel.css';

const ImageCarousel = ({ items, altPrefix = 'Slide' }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="carousel slide image-carousel">
      <div className="carousel-inner bg-light">
        {items.map((item, index) => (
          <div key={item.id || `${altPrefix}-${index}`} className={`carousel-item ${index === activeIndex ? 'active' : ''}`}>
            <img className="w-100 h-100" src={item.src} alt={`${altPrefix} ${index + 1}`} />
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

export default ImageCarousel;

import React, { useEffect, useState } from 'react';
import translationService from '../../services/TranslationService';
import './ImageCarousel.css';

const ImageCarousel = ({
  items,
  altPrefix,
  previousLabel,
  nextLabel,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [, setCurrentLanguage] = useState(translationService.getLanguage());
  const resolvedAltPrefix = altPrefix || translationService.t('slide_label');
  const resolvedPreviousLabel = previousLabel || translationService.t('image_navigation_previous');
  const resolvedNextLabel = nextLabel || translationService.t('image_navigation_next');

  useEffect(() => translationService.subscribe(setCurrentLanguage), []);

  return (
    <div className="carousel slide image-carousel">
      <div className="carousel-inner bg-light">
        {items.map((item, index) => (
          <div key={item.id || `${resolvedAltPrefix}-${index}`} className={`carousel-item ${index === activeIndex ? 'active' : ''}`}>
            <img className="w-100 h-100" src={item.src} alt={`${resolvedAltPrefix} ${index + 1}`} />
          </div>
        ))}
      </div>
      <button type="button" className="carousel-control-prev" aria-label={resolvedPreviousLabel} onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))}>
        <i className="fa fa-2x fa-angle-left text-dark" />
      </button>
      <button type="button" className="carousel-control-next" aria-label={resolvedNextLabel} onClick={() => setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))}>
        <i className="fa fa-2x fa-angle-right" />
      </button>
    </div>
  );
};

export default ImageCarousel;

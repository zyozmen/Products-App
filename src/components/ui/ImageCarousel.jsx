import React, { useEffect, useState } from 'react';
import translationService from '../../services/TranslationService';

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
    <div className="hu-relative hu-aspect-[4/3] hu-overflow-hidden hu-bg-slate-100" aria-roledescription="carousel">
      <div className="hu-h-full hu-w-full" aria-live="polite">
        {items.map((item, index) => (
          <div key={item.id || `${resolvedAltPrefix}-${index}`} className={`${index === activeIndex ? 'hu-flex' : 'hu-hidden'} hu-h-full hu-w-full hu-items-center hu-justify-center`}>
            <img className="hu-h-full hu-w-full hu-object-contain" src={item.src} alt={`${resolvedAltPrefix} ${index + 1}`} />
          </div>
        ))}
      </div>
      {items.length > 1 && <button type="button" className="hu-absolute hu-left-2 hu-top-1/2 hu-grid hu-h-10 hu-w-10 hu--translate-y-1/2 hu-place-items-center hu-rounded-full hu-bg-white/90 hu-text-slate-900 hu-shadow hover:hu-bg-white" aria-label={resolvedPreviousLabel} onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))}>
        <i className="fa fa-angle-left" aria-hidden="true" />
      </button>
      }
      {items.length > 1 && <button type="button" className="hu-absolute hu-right-2 hu-top-1/2 hu-grid hu-h-10 hu-w-10 hu--translate-y-1/2 hu-place-items-center hu-rounded-full hu-bg-white/90 hu-text-slate-900 hu-shadow hover:hu-bg-white" aria-label={resolvedNextLabel} onClick={() => setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))}>
        <i className="fa fa-angle-right" aria-hidden="true" />
      </button>}
    </div>
  );
};

export default ImageCarousel;

import { useState } from 'react';
import useTranslation from '../../hooks/useTranslation.js';

function HeroCarousel({ items }) {
  const t = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex];
  if (!activeItem) return null;

  const move = (direction) => {
    setActiveIndex((index) => (index + direction + items.length) % items.length);
  };

  return (
    <section className="hu-relative hu-h-[430px] hu-overflow-hidden hu-rounded-2xl hu-bg-slate-900" aria-roledescription="carousel">
      <img className="hu-absolute hu-inset-0 hu-h-full hu-w-full hu-object-cover" src={activeItem.image} alt={activeItem.title} />
      <div className="hu-absolute hu-inset-0 hu-flex hu-items-center hu-justify-center hu-bg-slate-950/50 hu-p-6">
        <div className="hu-max-w-3xl hu-text-center">
          <h1 className="hu-mb-3 hu-text-4xl hu-font-bold hu-text-white">{activeItem.title}</h1>
          <p className="hu-mx-auto hu-max-w-2xl hu-text-white">{activeItem.description}</p>
          <button type="button" className="hu-mt-3 hu-cursor-pointer hu-rounded-lg hu-border hu-border-white hu-bg-transparent hu-px-4 hu-py-2 hu-font-semibold hu-text-white hover:hu-bg-white hover:hu-text-slate-900">{t('shop_now')}</button>
        </div>
      </div>
      {items.length > 1 && (
        <>
          <div className="hu-absolute hu-bottom-4 hu-left-1/2 hu-flex hu--translate-x-1/2 hu-gap-2">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`hu-h-2.5 hu-w-2.5 hu-cursor-pointer hu-rounded-full hu-border-0 ${index === activeIndex ? 'hu-bg-white' : 'hu-bg-white/50'}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`${t('slide_label')} ${index + 1}`}
                aria-current={index === activeIndex}
              />
            ))}
          </div>
          <button type="button" className="hu-absolute hu-left-3 hu-top-1/2 hu-rounded-full hu-border-0 hu-bg-white/90 hu-p-3 hu-text-slate-900" onClick={() => move(-1)} aria-label={t('image_navigation_previous')}>‹</button>
          <button type="button" className="hu-absolute hu-right-3 hu-top-1/2 hu-rounded-full hu-border-0 hu-bg-white/90 hu-p-3 hu-text-slate-900" onClick={() => move(1)} aria-label={t('image_navigation_next')}>›</button>
        </>
      )}
    </section>
  );
}

export default HeroCarousel;

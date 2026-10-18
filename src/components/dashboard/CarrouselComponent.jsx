import SwiperCarousel from '../ui/SwiperCarousel.jsx';
import useTranslation from '../../hooks/useTranslation.js';
import { Button } from '../ui/shadcn';

function CarrouselComponent() {
    const t = useTranslation();
    const items = [1, 2].map((id, index) => ({
        id,
        title: t('special_offer'),
        description: t('hero_description'),
        image: `/img/carousel-${index + 1}.jpg`,
    }));

    return (
        <section className="hu-mx-auto hu-grid hu-max-w-7xl hu-gap-5 hu-px-4 hu-py-6 sm:hu-px-6 lg:hu-grid-cols-3 lg:hu-px-8">
            <div className="hu-overflow-hidden hu-rounded-2xl lg:hu-col-span-2">
                <SwiperCarousel items={items} />
            </div>
            <div className="hu-grid hu-gap-5 sm:hu-grid-cols-2 lg:hu-grid-cols-1">
                {['/logo192.png', '/logo512.png'].map((image, index) => (
                    <article key={image} className="hu-relative hu-flex hu-min-h-48 hu-items-center hu-overflow-hidden hu-rounded-2xl hu-bg-slate-800 hu-p-6">
                        <img className="hu-absolute hu-inset-0 hu-h-full hu-w-full hu-object-cover hu-opacity-35" src={image} alt="" />
                        <div className="hu-relative hu-z-10">
                            <p className="hu-mb-2 hu-mt-0 hu-text-xs hu-font-bold hu-uppercase hu-tracking-wide hu-text-green-300">{t('save_20')}</p>
                            <h2 className="hu-mb-4 hu-mt-0 hu-text-xl hu-font-bold hu-text-white">{t('special_offer')}</h2>
                            <Button type="button" variant="secondary">{t('shop_now')}</Button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default CarrouselComponent;

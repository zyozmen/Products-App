import SwiperCarousel from '../ui/SwiperCarousel.jsx';
import useTranslation from '../../hooks/useTranslation.js';
import { Button } from '../ui/shadcn';

function CarrouselComponent() {
    const t = useTranslation();
    const items = [{
        id: 1,
        title: t('hero_title_line1'),
        highlight: t('hero_title_highlight'),
        description: t('hero_subtitle'),
        cta: t('hero_cta'),
        image: '/img/hero-home.jpg',
    }];

    return (
        <>
            <SwiperCarousel items={items} />
        </>
    );
}

export default CarrouselComponent;

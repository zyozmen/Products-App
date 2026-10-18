import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import useTranslation from '../../hooks/useTranslation.js';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const SwiperCarousel = ({ items }) => {
  const t = useTranslation();

  return (
    <Swiper
      modules={[Navigation, Pagination, Autoplay]}
      spaceBetween={0}
      slidesPerView={1}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 4000, disableOnInteraction: false }}
      loop
      className="hu-w-full"
    >
      {items.map((item) => (
        <SwiperSlide key={item.id}>
          <div className="hu-relative hu-h-[430px]">
            <img className="hu-h-full hu-w-full hu-object-cover" src={item.image} alt={item.title} />
            <div className="hu-absolute hu-inset-0 hu-flex hu-flex-col hu-items-center hu-justify-center hu-bg-slate-950/50">
              <div className="hu-max-w-3xl hu-p-6 hu-text-center">
                <h1 className="hu-mb-3 hu-text-4xl hu-font-bold hu-text-white">{item.title}</h1>
                <p className="hu-mx-5 hu-text-white">{item.description}</p>
                <button type="button" className="hu-mt-3 hu-cursor-pointer hu-rounded-lg hu-border hu-border-white hu-bg-transparent hu-px-4 hu-py-2 hu-font-semibold hu-text-white hover:hu-bg-white hover:hu-text-slate-900">{t('shop_now')}</button>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default SwiperCarousel;

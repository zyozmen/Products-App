import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const SwiperCarousel = ({ items }) => {
  const multiple = items.length > 1;

  return (
    <Swiper
      modules={[Navigation, Pagination, Autoplay]}
      spaceBetween={0}
      slidesPerView={1}
      navigation={multiple}
      pagination={multiple ? { clickable: true } : false}
      autoplay={multiple ? { delay: 6000, disableOnInteraction: false } : false}
      loop={multiple}
      className="hu-w-full"
    >
      {items.map((item) => (
        <SwiperSlide key={item.id}>
          <div className="hu-relative hu-flex hu-min-h-[640px] hu-items-center hu-bg-green-950 hu-bg-cover hu-bg-[position:70%_center] hu-pb-16 hu-pt-36 lg:hu-h-[88vh]" style={{ backgroundImage: `url(${item.image})` }}>
            <div className="hu-w-full hu-px-6 sm:hu-px-12 lg:hu-px-[8%]">
              <div className="hu-relative hu-max-w-3xl">
                <span className="hu-absolute -hu-left-10 -hu-top-4 hu-hidden hu-select-none hu-font-display hu-text-8xl hu-leading-none hu-text-black/40 sm:hu-block" aria-hidden="true">&ldquo;</span>
                <h1 className="hu-m-0 hu-font-display hu-text-3xl hu-font-black hu-leading-tight hu-text-white sm:hu-text-5xl">
                  {item.title}{' '}
                  <span className="hu-text-green-400">{item.highlight}</span>
                  <span className="hu-ml-2 hu-select-none hu-text-black/40" aria-hidden="true">&rdquo;</span>
                </h1>
                <p className="hu-mb-8 hu-mt-8 hu-max-w-xl hu-text-lg hu-leading-relaxed hu-text-white">{item.description}</p>
                <Link to="/shop" className="hu-inline-flex hu-items-center hu-gap-2 hu-rounded-full hu-bg-green-50 hu-px-8 hu-py-3 hu-text-base hu-font-semibold hu-text-slate-900 hu-no-underline hover:hu-bg-white">
                  {item.cta}
                  <i className="fas fa-chevron-right hu-text-xs" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};


export default SwiperCarousel;

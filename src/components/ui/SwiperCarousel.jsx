import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const SwiperCarousel = ({ items }) => {
  return (
    <Swiper
      modules={[Navigation, Pagination, Autoplay]}
      spaceBetween={0}
      slidesPerView={1}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 4000, disableOnInteraction: false }}
      loop
      className="w-100"
    >
      {items.map((item) => (
        <SwiperSlide key={item.id}>
          <div className="position-relative" style={{ height: 430 }}>
            <img className="w-100 h-100" src={item.image} alt={item.title} style={{ objectFit: 'cover' }} />
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark bg-opacity-50">
              <div className="p-3 text-center" style={{ maxWidth: 700 }}>
                <h1 className="display-4 text-white mb-3">{item.title}</h1>
                <p className="mx-md-5 px-5 text-white">{item.description}</p>
                <a className="btn btn-outline-light py-2 px-4 mt-3" href="#">Shop Now</a>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default SwiperCarousel;

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './SwiperCarousel.css';

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
          <div className="position-relative swiper-hero-slide">
            <img className="w-100 h-100 swiper-hero-image" src={item.image} alt={item.title} />
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark bg-opacity-50">
              <div className="p-3 text-center swiper-hero-content">
                <h1 className="display-4 text-white mb-3">{item.title}</h1>
                <p className="mx-md-5 px-5 text-white">{item.description}</p>
                <button type="button" className="btn btn-outline-light py-2 px-4 mt-3">Shop Now</button>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default SwiperCarousel;

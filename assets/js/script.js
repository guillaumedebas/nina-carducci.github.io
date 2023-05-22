import { Lightbox } from "./lightbox.js"
import { filterInit } from "./filter.js"
import { Carousel } from "./carousel.js"

new Carousel(document.querySelector('#carousel1'), {
  slidesToScroll: 1,
  slidesVisible: 1,
  loop: false,
  pagination: true,
  infinite: true,
  autoScroll: true,
  autoScrollTime: 3000,
  breakTime:2000
})
filterInit()
Lightbox.init()
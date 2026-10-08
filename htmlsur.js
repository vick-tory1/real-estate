$(function () {
  let headerElem = $('header');
  let logo = $('#logo');
  let navMenu = $('#nav-menu');
  let navToggle = $('#nav-toggle');

 $('#properties-slider').slick({
      slidesToShow: 4,
      slidesToScroll: 1,
      prevArrow: '<button type="button" class="slick-arrow slick-prev" aria-label="Previous properties"><span class="fas fa-arrow-left" aria-hidden="true"></span></button>',
      nextArrow: '<button type="button" class="slick-arrow slick-next" aria-label="Next properties"><span class="fas fa-arrow-right" aria-hidden="true"></span></button>',
      responsive: [
          {
              breakpoint: 1100,
              settings: {
                  slidesToShow: 3,
                  slidesToScroll: 1,
                  infinite: true,
              }
          },
          {
              breakpoint: 767,
              settings: {
                  slidesToShow: 2,
                  slidesToScroll: 1,
                  infinite: true,
              }
          },
          {
              breakpoint: 530,
              settings: {
                  slidesToShow: 1,
                  slidesToScroll: 1,
                  infinite: true,
              }
          }
      ]
 });

 $('#testimonials-slider').slick({
      infinite: true,
      slidesToShow: 1,
      slidesToScroll: 1,
      prevArrow: '<button type="button" class="slick-arrow slick-prev" aria-label="Previous testimonial"><span class="fas fa-arrow-left" aria-hidden="true"></span></button>',
      nextArrow: '<button type="button" class="slick-arrow slick-next" aria-label="Next testimonial"><span class="fas fa-arrow-right" aria-hidden="true"></span></button>'
 });

 navToggle.on('click', () => {
     navMenu.css('right', '0');
 });

 $('#close-flyout').on('click', () => {
      navMenu.css('right', '-100%');
 });

 $(document).on('click', (e) => {
     let target = $(e.target);
     if (!(target.closest('#nav-toggle').length > 0 || target.closest('#nav-menu').length > 0)) {
         navMenu.css('right', '-100%');
     }
 });

 $(document).scroll(() => {
     let scrollTop = $(document).scrollTop();

     if (scrollTop > 0) {
         navMenu.addClass('is-sticky');
         logo.css('color', '#71a957');
         headerElem.css('background', '#fff');
         navToggle.css('border-color', '#000');
         navToggle.find('.strip').css('background-color', '#000');
     } else {
         navMenu.removeClass('is-sticky');
         logo.css('color', '#71a957');
         headerElem.css('background', 'transparent');
         navToggle.css('bordre-color', '#fff');
         navToggle.find('.strip').css('background-color', '#fff');
     }

     headerElem.css(scrollTop >= 200 ? {'padding': '0.5rem', 'box-shadow': '0 -4px 10px 1px #999'} : {'padding': '1rem 0', 'box-shadow': 'none' });
 });

 $(document).trigger('scroll');
});

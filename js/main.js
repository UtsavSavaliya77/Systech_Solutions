/**
 * Systech Solutions - Master Frontend Controller
 * Drives all animations, counters, sliders, video, and interactions
 */

(function () {
  'use strict';

  // Global shims for WordPress/Elementor compatibility
  window.wp = window.wp || { i18n: { setLocaleData: function(){}, __: function(s){ return s; }, _x: function(s){ return s; } } };
  window.elementorFrontendConfig = window.elementorFrontendConfig || { isEditMode: false, is_rtl: false };

  // Dismiss Preloader immediately
  function dismissPreloader() {
    var preloader = document.getElementById('custom-preloader');
    if (preloader && preloader.style.display !== 'none') {
      preloader.style.transition = 'opacity 0.4s ease, visibility 0.4s ease';
      preloader.style.opacity = '0';
      preloader.style.pointerEvents = 'none';
      setTimeout(function () {
        preloader.style.display = 'none';
        if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
      }, 400);
    }
  }

  // Trigger dismiss as early as possible
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(dismissPreloader, 350);
  } else {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(dismissPreloader, 350); });
    window.addEventListener('load', dismissPreloader);
  }
  // Safety timeout: dismiss after 1.2s no matter what
  setTimeout(dismissPreloader, 1200);

  document.addEventListener('DOMContentLoaded', function () {

    // 1. Background Video Autoplay in Hero Section
    var videoEls = document.querySelectorAll('.elementor-background-video-hosted, .elementor-background-video-container video');
    videoEls.forEach(function (video) {
      if (!video.getAttribute('src') && !video.querySelector('source')) {
        video.src = 'assets/images/homepage-vid-v2.mp4';
      }
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.loop = true;
      var playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(function () {
          var triggerPlay = function () {
            video.play();
            window.removeEventListener('click', triggerPlay);
            window.removeEventListener('scroll', triggerPlay);
            window.removeEventListener('touchstart', triggerPlay);
          };
          window.addEventListener('click', triggerPlay, { passive: true });
          window.addEventListener('scroll', triggerPlay, { passive: true });
          window.addEventListener('touchstart', triggerPlay, { passive: true });
        });
      }
    });

    // 2. Scroll Reveal Animations (fadeInUp, fadeInDown, fadeIn with exact delays)
    var animElements = document.querySelectorAll('.elementor-invisible');
    function triggerAnimation(el) {
      var settings = el.getAttribute('data-settings');
      var animName = 'fadeInUp';
      var animDelay = 0;
      if (settings) {
        try {
          var s = JSON.parse(settings);
          if (s.animation) animName = s.animation;
          if (s._animation) animName = s._animation;
          if (s.animation_delay) animDelay = parseInt(s.animation_delay, 10);
          if (s._animation_delay) animDelay = parseInt(s._animation_delay, 10);
        } catch (e) {}
      }
      setTimeout(function () {
        el.classList.remove('elementor-invisible');
        el.classList.add('animated', animName);
      }, animDelay);
    }

    if (animElements.length && 'IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            triggerAnimation(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05, rootMargin: '150px 0px 150px 0px' });
      animElements.forEach(function (el) { revealObserver.observe(el); });
    } else {
      animElements.forEach(triggerAnimation);
    }

    // 3. Interactive Statistics Counters
    var counters = document.querySelectorAll('.elementor-counter-number');
    if (counters.length && 'IntersectionObserver' in window) {
      var counterObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            var target = parseInt(el.getAttribute('data-to-value'), 10) || 0;
            var duration = parseInt(el.getAttribute('data-duration'), 10) || 2000;
            var startTime = null;

            function animateCount(timestamp) {
              if (!startTime) startTime = timestamp;
              var progress = Math.min((timestamp - startTime) / duration, 1);
              var ease = 1 - Math.pow(1 - progress, 3);
              el.textContent = Math.floor(ease * target);
              if (progress < 1) {
                window.requestAnimationFrame(animateCount);
              } else {
                el.textContent = target;
              }
            }
            window.requestAnimationFrame(animateCount);
            observer.unobserve(el);
          }
        });
      }, { threshold: 0.2 });
      counters.forEach(function (c) { counterObserver.observe(c); });
    }

    // 4. Testimonial Swiper Slider (Reads data-config or defaults to single-slide)
    if (typeof Swiper !== 'undefined') {
      var sliderWrappers = document.querySelectorAll('.elementskit-testimonial-slider, .swiper, .swiper-container');
      sliderWrappers.forEach(function (wrapper) {
        var swiperEl = wrapper.classList.contains('swiper') ? wrapper : wrapper.querySelector('.swiper, .swiper-container');
        if (!swiperEl || swiperEl.swiper) return;

        var rawConfig = wrapper.getAttribute('data-config') || swiperEl.getAttribute('data-config');
        var config = {};
        if (rawConfig) {
          try {
            config = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig;
          } catch (e) {}
        }

        var slidesPerView = config.slidesPerView || 1;
        var spaceBetween = typeof config.spaceBetween !== 'undefined' ? config.spaceBetween : 24;
        var speed = config.speed || 1000;
        var loop = typeof config.loop !== 'undefined' ? !!config.loop : true;
        var autoplay = config.autoplay ? {
          delay: 4500,
          disableOnInteraction: false,
          pauseOnMouseEnter: !!config.pauseOnHover
        } : false;

        var paginationEl = wrapper.querySelector('.swiper-pagination') || swiperEl.querySelector('.swiper-pagination');
        if (!paginationEl) {
          paginationEl = document.createElement('div');
          paginationEl.className = 'swiper-pagination';
          wrapper.appendChild(paginationEl);
        }

        var breakpoints = config.breakpoints || {
          320: { slidesPerView: 1, spaceBetween: 10 },
          768: { slidesPerView: 1, spaceBetween: 10 },
          1024: { slidesPerView: 1, spaceBetween: 24 }
        };

        new Swiper(swiperEl, {
          slidesPerView: slidesPerView,
          spaceBetween: spaceBetween,
          speed: speed,
          loop: loop,
          autoplay: autoplay,
          pagination: {
            el: paginationEl,
            clickable: true
          },
          breakpoints: breakpoints
        });
      });
    }

    // 5. Sticky Header
    var header = document.querySelector('.elementor-location-header, .site-header, header');
    if (header) {
      var checkScroll = function () {
        if (window.scrollY > 10) {
          header.classList.add('elementor-sticky--active');
        } else {
          header.classList.remove('elementor-sticky--active');
        }
      };
      window.addEventListener('scroll', checkScroll, { passive: true });
      checkScroll();
    }

    // 6. Mobile Menu Hamburger Drawer (Smooth Offcanvas Controller & Zero-Jump Background Scroll Lock)
    function openMobileDrawer() {
      var drawer = document.querySelector('.elementskit-menu-container');
      var overlayEl = document.querySelector('.elementskit-menu-overlay');
      if (drawer) drawer.classList.add('active');
      if (overlayEl) overlayEl.classList.add('active');
      document.body.classList.add('mobile-menu-open');
    }

    function closeMobileDrawer() {
      var drawer = document.querySelector('.elementskit-menu-container');
      var overlayEl = document.querySelector('.elementskit-menu-overlay');
      if (drawer) {
        drawer.classList.remove('active');
      }
      if (overlayEl) overlayEl.classList.remove('active');
      document.body.classList.remove('mobile-menu-open');
    }

    document.addEventListener('click', function (e) {
      var hamburger = e.target.closest('.elementskit-menu-hamburger');
      var close = e.target.closest('.elementskit-menu-close');
      var overlay = e.target.closest('.elementskit-menu-overlay');
      var navLink = e.target.closest('.elementskit-menu-container a');
      var drawer = document.querySelector('.elementskit-menu-container');

      if (hamburger) {
        e.preventDefault();
        e.stopPropagation();
        if (drawer && drawer.classList.contains('active')) {
          closeMobileDrawer();
        } else {
          openMobileDrawer();
        }
        return;
      }

      if (close || overlay) {
        e.preventDefault();
        e.stopPropagation();
        closeMobileDrawer();
        return;
      }

      if (navLink) {
        closeMobileDrawer();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        var drawer = document.querySelector('.elementskit-menu-container');
        if (drawer && drawer.classList.contains('active')) {
          closeMobileDrawer();
        }
      }
    });

    // Prevent background touch and wheel scrolling on the overlay without blocking window thread
    var overlayElement = document.querySelector('.elementskit-menu-overlay');
    if (overlayElement) {
      overlayElement.addEventListener('touchmove', function (e) {
        e.preventDefault();
      }, { passive: false });
      overlayElement.addEventListener('wheel', function (e) {
        e.preventDefault();
      }, { passive: false });
    }

    // 7. Sticky Elements Controller (Matches Elementor Pro sticky behavior)
    var stickyElements = document.querySelectorAll('[data-settings*="sticky"]');
    if (stickyElements.length) {
      stickyElements.forEach(function (el) {
        var rawSettings = el.getAttribute('data-settings');
        if (!rawSettings) return;
        try {
          var settings = typeof rawSettings === 'string' ? JSON.parse(rawSettings) : rawSettings;
          if (settings.sticky === 'top') {
            el.classList.add('elementor-sticky');
            var offset = parseInt(settings.sticky_offset, 10) || 10;
            var onDevices = settings.sticky_on || ['desktop'];
            
            var onScroll = function () {
              if ((onDevices.indexOf('desktop') !== -1 || onDevices.indexOf('tablet') !== -1) && window.innerWidth >= 768) {
                var rect = el.getBoundingClientRect();
                if (rect.top <= offset + 5) {
                  el.classList.add('elementor-sticky--active', 'elementor-section--handles-inside', 'elementor-sticky--effects');
                } else {
                  el.classList.remove('elementor-sticky--active', 'elementor-section--handles-inside', 'elementor-sticky--effects');
                }
              }
            };
            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll();
          }
        } catch (e) {}
      });
    }

    // 8. Elementor Nested Accordion Controller (Smooth Drawer Animation)
    var accordions = document.querySelectorAll('.elementor-widget-n-accordion');
    if (accordions.length) {
      accordions.forEach(function (widget) {
        var items = widget.querySelectorAll('.e-n-accordion-item');
        var rawSettings = widget.getAttribute('data-settings');
        var maxOne = true;
        var openDuration = 350;
        var closeDuration = 280;

        if (rawSettings) {
          try {
            var parsed = JSON.parse(rawSettings);
            if (parsed.max_items_expended === 'none' || parsed.max_items_expended === 'multiple') {
              maxOne = false;
            }
            if (parsed.n_accordion_animation_duration && parsed.n_accordion_animation_duration.size) {
              openDuration = parseInt(parsed.n_accordion_animation_duration.size, 10) || 350;
              closeDuration = Math.round(openDuration * 0.8);
            }
          } catch (e) {}
        }

        // Wrap each item's content in a dedicated zero-padding, overflow-hidden drawer
        items.forEach(function (item) {
          var content = item.querySelector('[role="region"]') || item.querySelector('.e-con');
          if (content && !content.parentElement.classList.contains('e-n-accordion-drawer')) {
            var drawer = document.createElement('div');
            drawer.className = 'e-n-accordion-drawer';
            drawer.style.cssText = 'overflow: hidden; height: 0px; opacity: 0; padding: 0; margin: 0; border: none;';
            content.parentNode.insertBefore(drawer, content);
            drawer.appendChild(content);
          }
        });

        function closeItem(item) {
          if (!item.hasAttribute('open') && !item._isOpening) return;
          var drawer = item.querySelector('.e-n-accordion-drawer');
          var summary = item.querySelector('.e-n-accordion-item-title');
          if (summary) summary.setAttribute('aria-expanded', 'false');

          if (!drawer) {
            item.removeAttribute('open');
            return;
          }

          clearTimeout(item._timer);
          item._isOpening = false;
          item._isClosing = true;

          var currentHeight = drawer.offsetHeight;
          drawer.style.overflow = 'hidden';
          drawer.style.height = currentHeight + 'px';
          drawer.style.opacity = '1';

          // Force reflow
          drawer.offsetHeight;

          drawer.style.transition = 'height ' + closeDuration + 'ms cubic-bezier(0.25, 1, 0.5, 1), opacity ' + (closeDuration * 0.8) + 'ms ease';
          drawer.style.height = '0px';
          drawer.style.opacity = '0';

          item._timer = setTimeout(function () {
            item._isClosing = false;
            item.removeAttribute('open');
            drawer.style.transition = '';
          }, closeDuration);
        }

        function openItem(item) {
          var drawer = item.querySelector('.e-n-accordion-drawer');
          var content = drawer ? drawer.firstElementChild : null;
          var summary = item.querySelector('.e-n-accordion-item-title');
          if (summary) summary.setAttribute('aria-expanded', 'true');

          if (!drawer || !content) {
            item.setAttribute('open', '');
            return;
          }

          clearTimeout(item._timer);
          item._isClosing = false;
          item._isOpening = true;

          // Zero-flash baseline setup
          drawer.style.transition = 'none';
          drawer.style.overflow = 'hidden';
          drawer.style.height = '0px';
          drawer.style.opacity = '0';

          item.setAttribute('open', '');

          // Read full natural height
          var targetHeight = content.offsetHeight;

          // Force reflow
          drawer.offsetHeight;

          drawer.style.transition = 'height ' + openDuration + 'ms cubic-bezier(0.25, 1, 0.5, 1), opacity ' + openDuration + 'ms ease';
          drawer.style.height = targetHeight + 'px';
          drawer.style.opacity = '1';

          item._timer = setTimeout(function () {
            item._isOpening = false;
            drawer.style.height = 'auto';
            drawer.style.overflow = 'visible';
            drawer.style.transition = '';
          }, openDuration + 20);
        }

        items.forEach(function (item) {
          var summary = item.querySelector('.e-n-accordion-item-title');
          if (!summary) return;

          summary.addEventListener('click', function (e) {
            e.preventDefault();
            var isOpen = item.hasAttribute('open') && !item._isClosing;

            if (isOpen) {
              closeItem(item);
            } else {
              if (maxOne) {
                items.forEach(function (sibling) {
                  if (sibling !== item && (sibling.hasAttribute('open') || sibling._isOpening)) {
                    closeItem(sibling);
                  }
                });
              }
              openItem(item);
            }
          });
        });
      });
    }

    // 9. Contact Form Interactive Handler
    var contactForm = document.querySelector('.metform-form-content');
    if (contactForm) {
      var submitBtn = contactForm.querySelector('.elementor-widget-button a');
      var responseWrap = contactForm.querySelector('.mf-main-response-wrap');
      var responseMsg = responseWrap ? responseWrap.querySelector('p') : null;

      if (submitBtn) {
        submitBtn.addEventListener('click', function (e) {
          e.preventDefault();
          var inputs = contactForm.querySelectorAll('.mf-input');
          var allValid = true;

          inputs.forEach(function (input) {
            if (!input.value || !input.value.trim()) {
              allValid = false;
              input.style.borderColor = '#ff4405';
            } else {
              input.style.borderColor = '';
            }
          });

          if (!allValid) {
            if (responseWrap && responseMsg) {
              responseWrap.setAttribute('data-show', '1');
              responseWrap.style.backgroundColor = '#f8d7da';
              responseWrap.style.color = '#721c24';
              responseWrap.style.borderColor = '#f5c6cb';
              var icon = responseWrap.querySelector('i');
              if (icon) icon.className = 'fas fa-exclamation-triangle';
              responseMsg.textContent = 'Please fill in all required fields.';
            }
          } else {
            if (responseWrap && responseMsg) {
              responseWrap.setAttribute('data-show', '1');
              responseWrap.style.backgroundColor = '#d4edda';
              responseWrap.style.color = '#155724';
              responseWrap.style.borderColor = '#c3e6cb';
              var icon = responseWrap.querySelector('i');
              if (icon) icon.className = 'fas fa-check';
              responseMsg.textContent = 'Thank you! Your message has been sent successfully.';
            }
            inputs.forEach(function (input) {
              input.value = '';
              input.style.borderColor = '';
            });
          }
        });
      }
    }

    // 10. Scroll to Top Button Interaction
    var scrollTopBtn = document.getElementById('ast-scroll-top');
    if (scrollTopBtn) {
      function checkScrollTop() {
        if (window.scrollY > 300) {
          scrollTopBtn.style.display = 'block';
          scrollTopBtn.style.opacity = '1';
        } else {
          scrollTopBtn.style.opacity = '0';
          setTimeout(function () {
            if (window.scrollY <= 300) scrollTopBtn.style.display = 'none';
          }, 300);
        }
      }
      window.addEventListener('scroll', checkScrollTop, { passive: true });
      checkScrollTop();

      scrollTopBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

  });
})();

(function() {
  'use strict';

  const STATE = {
    burgerOpen: false,
    formsSubmitting: new Set(),
    scrollPosition: 0
  };

  const CONFIG = {
    headerSelector: 'header.navbar',
    burgerToggleSelector: '.navbar-toggler',
    navCollapseSelector: '.navbar-collapse',
    navLinksSelector: '.nav-link',
    formSelector: '.needs-validation',
    scrollOffset: 80,
    debounceDelay: 150
  };

  const VALIDATORS = {
    email: /^[^s@]+@[^s@]+.[^s@]+$/,
    name: /^[a-zA-ZÀ-ÿs-']{2,50}$/,
    phone: /^[ds+-()]{10,20}$/,
    messageMinLength: 10
  };

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function getHeaderHeight() {
    const header = document.querySelector(CONFIG.headerSelector);
    return header ? header.offsetHeight : CONFIG.scrollOffset;
  }

  function initBurgerMenu() {
    const toggle = document.querySelector(CONFIG.burgerToggleSelector);
    const nav = document.querySelector(CONFIG.navCollapseSelector);
    const navLinks = document.querySelectorAll(CONFIG.navLinksSelector);

    if (!toggle || !nav) return;

    const openMenu = () => {
      STATE.burgerOpen = true;
      nav.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('u-no-scroll');
    };

    const closeMenu = () => {
      STATE.burgerOpen = false;
      nav.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('u-no-scroll');
    };

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      STATE.burgerOpen ? closeMenu() : openMenu();
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (STATE.burgerOpen) closeMenu();
      });
    });

    document.addEventListener('click', (e) => {
      if (STATE.burgerOpen && !nav.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && STATE.burgerOpen) {
        closeMenu();
        toggle.focus();
      }
    });

    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth >= 768 && STATE.burgerOpen) {
        closeMenu();
      }
    }, CONFIG.debounceDelay));
  }

  function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"], a[href*="/#"]');

    links.forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href || href === '#' || href === '#!') return;

        let targetId;
        if (href.includes('/#')) {
          targetId = href.split('/#')[1];
        } else if (href.startsWith('#')) {
          targetId = href.substring(1);
        } else {
          return;
        }

        const target = document.getElementById(targetId);
        if (target) {
          e.preventDefault();
          const headerHeight = getHeaderHeight();
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          if (window.history && window.history.pushState) {
            window.history.pushState(null, '', `#${targetId}`);
          }
        }
      });
    });
  }

  function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll(CONFIG.navLinksSelector);

    if (sections.length === 0 || navLinks.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: `-${getHeaderHeight()}px 0px -70% 0px`,
      threshold: 0
    };

    const setActiveLink = (id) => {
      navLinks.forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('aria-current');

        const href = link.getAttribute('href');
        if (href === `#${id}` || href === `/#${id}`) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        }
      });
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
  }

  function initPortfolioFilter() {
    const filterButtons = document.querySelectorAll('[data-filter]');
    const portfolioItems = document.querySelectorAll('[data-category]');

    if (filterButtons.length === 0 || portfolioItems.length === 0) return;

    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        const filter = this.getAttribute('data-filter');

        filterButtons.forEach(btn => btn.classList.remove('is-active'));
        this.classList.add('is-active');

        portfolioItems.forEach(item => {
          const category = item.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  function showNotification(message, type = 'info') {
    let container = document.getElementById('notification-container');

    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'position-fixed top-0 end-0 p-3';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.setAttribute('role', 'alert');
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    container.appendChild(notification);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 150);
    }, 5000);
  }

  function validateField(field) {
    const fieldName = field.getAttribute('name');
    const fieldValue = field.value.trim();
    const fieldType = field.getAttribute('type');
    let isValid = true;
    let errorMessage = '';

    if (field.hasAttribute('required') && !fieldValue) {
      isValid = false;
      errorMessage = 'Toto pole je povinné.';
    } else if (fieldValue) {
      if (fieldType === 'email' || fieldName === 'email') {
        if (!VALIDATORS.email.test(fieldValue)) {
          isValid = false;
          errorMessage = 'Zadajte platnú emailovú adresu.';
        }
      } else if (fieldName === 'firstName' || fieldName === 'lastName') {
        if (!VALIDATORS.name.test(fieldValue)) {
          isValid = false;
          errorMessage = 'Meno môže obsahovať len písmená, medzery, pomlčky a apostrofy.';
        }
      } else if (fieldType === 'tel' || fieldName === 'phone') {
        if (fieldValue && !VALIDATORS.phone.test(fieldValue)) {
          isValid = false;
          errorMessage = 'Zadajte platné telefónne číslo.';
        }
      } else if (field.tagName === 'TEXTAREA' || fieldName === 'message') {
        if (fieldValue.length < VALIDATORS.messageMinLength) {
          isValid = false;
          errorMessage = `Správa musí obsahovať aspoň ${VALIDATORS.messageMinLength} znakov.`;
        }
      }
    }

    if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
      isValid = false;
      errorMessage = 'Musíte súhlasiť s podmienkami.';
    }

    let feedbackElement = field.parentElement.querySelector('.invalid-feedback');
    if (!feedbackElement) {
      feedbackElement = document.createElement('div');
      feedbackElement.className = 'invalid-feedback';
      field.parentElement.appendChild(feedbackElement);
    }

    if (isValid) {
      field.classList.remove('is-invalid');
      feedbackElement.textContent = '';
    } else {
      field.classList.add('is-invalid');
      feedbackElement.textContent = errorMessage;
    }

    return isValid;
  }

  function initFormValidation() {
    const forms = document.querySelectorAll(CONFIG.formSelector);

    forms.forEach(form => {
      const formId = form.id || 'form-' + Math.random().toString(36).substr(2, 9);
      form.id = formId;

      const honeypot = document.createElement('input');
      honeypot.type = 'text';
      honeypot.name = 'website';
      honeypot.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;';
      honeypot.tabIndex = -1;
      honeypot.setAttribute('autocomplete', 'off');
      form.appendChild(honeypot);

      const fields = form.querySelectorAll('input, textarea, select');
      fields.forEach(field => {
        if (field.name !== 'website') {
          field.addEventListener('blur', () => validateField(field));
          field.addEventListener('input', debounce(() => {
            if (field.classList.contains('is-invalid')) {
              validateField(field);
            }
          }, 300));
        }
      });

      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (STATE.formsSubmitting.has(formId)) return;

        if (honeypot.value) {
          console.warn('Spam detected');
          return;
        }

        let isFormValid = true;
        fields.forEach(field => {
          if (field.name !== 'website') {
            if (!validateField(field)) {
              isFormValid = false;
            }
          }
        });

        if (!isFormValid) {
          form.classList.add('was-validated');
          showNotification('Prosím, opravte chyby vo formulári.', 'danger');
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : '';

        STATE.formsSubmitting.add(formId);

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Odosielanie...';
        }

        const formData = new FormData(form);
        formData.delete('website');

        const data = {};
        formData.forEach((value, key) => {
          data[key] = value;
        });

        try {
          const response = await fetch('process.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
          });

          const result = await response.json();

          if (result.success) {
            showNotification('Správa bola úspešne odoslaná!', 'success');
            setTimeout(() => {
              window.location.href = 'thank_you.html';
            }, 1000);
          } else {
            showNotification(result.message || 'Nastala chyba pri odosielaní. Skúste znova.', 'danger');
          }
        } catch (error) {
          showNotification('Chyba spojenia. Skúste to prosím neskôr.', 'danger');
        } finally {
          STATE.formsSubmitting.delete(formId);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
          }
        }
      });
    });
  }

  function initScrollToTop() {
    const scrollBtn = document.querySelector('[data-scroll-to-top]');
    if (!scrollBtn) return;

    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        scrollBtn.classList.add('visible');
      } else {
        scrollBtn.classList.remove('visible');
      }
    };

    scrollBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    window.addEventListener('scroll', debounce(toggleVisibility, CONFIG.debounceDelay));
    toggleVisibility();
  }

  function initModalBackdrop() {
    const modals = document.querySelectorAll('.modal');

    modals.forEach(modal => {
      modal.addEventListener('show.bs.modal', () => {
        document.body.classList.add('modal-open');
      });

      modal.addEventListener('hidden.bs.modal', () => {
        document.body.classList.remove('modal-open');
      });
    });
  }

  function initCountUp() {
    const counters = document.querySelectorAll('[data-count-up]');

    if (counters.length === 0) return;

    const animateCounter = (element) => {
      const target = parseInt(element.getAttribute('data-count-up'));
      const duration = parseInt(element.getAttribute('data-duration')) || 2000;
      const startTime = performance.now();
      const startValue = 0;

      const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.floor(progress * (target - startValue) + startValue);

        element.textContent = currentValue;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          element.textContent = target;
        }
      };

      requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
          entry.target.classList.add('counted');
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
  }

  function initLazyLoading() {
    const images = document.querySelectorAll('img:not([loading])');
    const videos = document.querySelectorAll('video:not([loading])');

    images.forEach(img => {
      if (!img.hasAttribute('data-critical')) {
        img.setAttribute('loading', 'lazy');
      }
    });

    videos.forEach(video => {
      video.setAttribute('loading', 'lazy');
    });
  }

  function init() {
    initBurgerMenu();
    initSmoothScroll();
    initScrollSpy();
    initPortfolioFilter();
    initFormValidation();
    initScrollToTop();
    initModalBackdrop();
    initCountUp();
    initLazyLoading();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

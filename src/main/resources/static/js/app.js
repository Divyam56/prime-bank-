(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    // 1. Mobile Menu / Hamburger Toggle
    var hamburger = document.querySelector('.hamburger');
    var nav = document.querySelector('.main-nav');
    if (hamburger && nav) {
      hamburger.addEventListener('click', function () {
        var isOpen = nav.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    // 2. Flash Banner Dismissal & Auto-dismiss for success
    var flashBanners = document.querySelectorAll('.flash');
    flashBanners.forEach(function (banner) {
      var closeBtn = banner.querySelector('.flash-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          banner.style.display = 'none';
        });
      }
      if (banner.classList.contains('flash-success')) {
        setTimeout(function () {
          banner.style.opacity = '0';
          banner.style.transition = 'opacity 0.5s ease';
          setTimeout(function () {
            banner.style.display = 'none';
          }, 500);
        }, 6000);
      }
    });

    // 3. Dynamic Footer Copyright Year
    var yearEl = document.getElementById('current-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }

    // 4. Form Confirmation on [data-confirm]
    var confirmedForms = document.querySelectorAll('form[data-confirm]');
    confirmedForms.forEach(function (form) {
      form.addEventListener('submit', function (e) {
        var message = form.getAttribute('data-confirm') || 'Are you sure you want to proceed?';
        if (!window.confirm(message)) {
          e.preventDefault();
        }
      });
    });

    // 5. Trim text, search, and email inputs on form submission
    var allForms = document.querySelectorAll('form');
    allForms.forEach(function (form) {
      form.addEventListener('submit', function () {
        var inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="search"]');
        inputs.forEach(function (input) {
          if (input.value) {
            input.value = input.value.trim();
          }
        });
      });
    });
  });
})();

'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * useScrollReveal — replaces IntersectionObserver with GSAP ScrollTrigger
 * Applies staggered fade-up animation to elements matching the selector.
 * 
 * @param {string} selector - CSS selector for elements to animate (default: '.gsap-reveal')
 * @param {Array} deps - React dependency array for re-running the effect
 * @param {Object} options - Optional GSAP animation options
 */
export function useScrollReveal(selector = '.gsap-reveal', deps = [], options = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const elements = gsap.utils.toArray(selector);
      
      elements.forEach((el) => {
        gsap.fromTo(el,
          {
            y: options.y ?? 40,
            opacity: 0,
            scale: options.scale ?? 0.97,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: options.duration ?? 0.8,
            ease: options.ease ?? 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: options.start ?? 'top 88%',
              end: options.end ?? 'bottom 20%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return containerRef;
}

/**
 * useStaggerReveal — staggered animation for grid children
 * Applies staggered animation to children of a parent selector.
 * 
 * @param {string} parentSelector - CSS selector for the parent container
 * @param {string} childSelector - CSS selector for child elements (default: '> *')
 * @param {Array} deps - React dependency array
 * @param {Object} options - Optional GSAP animation options
 */
export function useStaggerReveal(parentSelector, childSelector = '> *', deps = [], options = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const parents = gsap.utils.toArray(parentSelector);
      
      parents.forEach((parent) => {
        const children = parent.querySelectorAll(childSelector);
        if (children.length === 0) return;

        gsap.fromTo(children,
          {
            y: options.y ?? 30,
            opacity: 0,
            scale: options.scale ?? 0.95,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: options.duration ?? 0.6,
            stagger: options.stagger ?? 0.08,
            ease: options.ease ?? 'power3.out',
            scrollTrigger: {
              trigger: parent,
              start: options.start ?? 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return containerRef;
}

/**
 * useHeroAnimation — cinematic entrance for hero sections
 * Chains multiple animations with a GSAP timeline.
 * 
 * @param {Array} deps - React dependency array
 */
export function useHeroAnimation(deps = []) {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
      });

      // Hero banner entrance
      tl.fromTo('.hero-banner-wrap',
        { y: 50, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 1 }
      );

      // Hero glow pulse
      tl.fromTo('.hero-glow',
        { scale: 0.6, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2, ease: 'power2.out' },
        '-=0.7'
      );

      // Stats cards stagger from the right
      tl.fromTo('.stat-card',
        { x: 40, opacity: 0, scale: 0.92 },
        { x: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' },
        '-=0.5'
      );
    }, containerRef);

    return () => ctx.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return containerRef;
}

/**
 * useCountUp — animate number count up when visible
 * 
 * @param {string} selector - CSS selector for elements with data-count attribute
 * @param {Array} deps - React dependency array
 */
export function useCountUp(selector = '.gsap-count', deps = []) {
  useEffect(() => {
    const elements = gsap.utils.toArray(selector);
    
    elements.forEach((el) => {
      const target = parseInt(el.dataset.count || el.textContent.replace(/[^0-9]/g, ''), 10);
      if (isNaN(target)) return;

      const obj = { val: 0 };
      
      gsap.to(obj, {
        val: target,
        duration: 1.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        onUpdate: () => {
          el.textContent = Math.round(obj.val).toLocaleString();
        },
      });
    });

    return () => ScrollTrigger.getAll().forEach(st => st.kill());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * useNavbarAnimation — smooth entrance for the top navbar
 * 
 * @param {Array} deps - React dependency array
 */
export function useNavbarAnimation(deps = []) {
  const navRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.topbar-inner',
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.1 }
      );
    }, navRef);

    return () => ctx.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return navRef;
}

/**
 * usePageTransition — entrance animation for page content
 * 
 * @param {Array} deps - React dependency array
 */
export function usePageTransition(deps = []) {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return containerRef;
}

/**
 * useFooterReveal — scroll-triggered reveal for footer sections
 * 
 * @param {Array} deps - React dependency array
 */
export function useFooterReveal(deps = []) {
  const footerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(footerRef.current?.querySelectorAll('.footer-col') || [],
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, footerRef);

    return () => ctx.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return footerRef;
}

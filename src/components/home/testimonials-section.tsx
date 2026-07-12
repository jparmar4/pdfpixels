'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Users } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Marketing Manager',
    initials: 'SM',
    color: 'from-violet-500 to-purple-600',
    text: 'PdfPixels has been a game-changer for our team. We compress hundreds of PDFs weekly and the quality is always outstanding. The speed is incredible compared to other tools.',
    stars: 5,
  },
  {
    name: 'James Rodriguez',
    role: 'Freelance Designer',
    initials: 'JR',
    color: 'from-cyan-500 to-blue-600',
    text: 'The image compression and background removal tools are absolutely perfect. I use them daily for client work. Clean interface, fast results, and no watermarks.',
    stars: 5,
  },
  {
    name: 'Emily Chen',
    role: 'University Researcher',
    initials: 'EC',
    color: 'from-emerald-500 to-teal-600',
    text: 'I love how simple everything is. No signup, no ads, no nonsense. Just upload, process, download. The HEIC to JPG converter saved me so much time.',
    stars: 5,
  },
  {
    name: 'Michael Brooks',
    role: 'Small Business Owner',
    initials: 'MB',
    color: 'from-amber-500 to-orange-600',
    text: 'Merge PDF is my most-used feature. Combining invoices and reports into one file has never been easier. It handles large files without breaking a sweat.',
    stars: 5,
  },
  {
    name: 'Lisa Thompson',
    role: 'Content Creator',
    initials: 'LT',
    color: 'from-fuchsia-500 to-pink-600',
    text: 'The resize and crop tools are perfect for social media. I batch process images all the time and PdfPixels handles it flawlessly. Highly recommended!',
    stars: 5,
  },
  {
    name: 'David Kim',
    role: 'Software Engineer',
    initials: 'DK',
    color: 'from-sky-500 to-indigo-600',
    text: 'As a developer, I appreciate clean tools that just work. PdfPixels nails this — fast API-like performance with a beautiful UI. Split PDF is fantastic.',
    stars: 5,
  },
];

export function TestimonialsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [activeDot, setActiveDot] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setIsVisible(e.isIntersecting),
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!scrollRef.current || isHovered || !isVisible) return;
    const container = scrollRef.current;
    let scrollPos = 0;
    let animationId: number;

    const autoScroll = () => {
      scrollPos += 0.5;
      if (scrollPos >= container.scrollWidth / 2) {
        scrollPos = 0;
      }
      container.scrollLeft = scrollPos;
      animationId = requestAnimationFrame(autoScroll);
    };

    animationId = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(animationId);
  }, [isHovered, isVisible]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const cardWidth = 316;
      const idx = Math.round(container.scrollLeft / cardWidth) % testimonials.length;
      setActiveDot(idx);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToIndex = useCallback((idx: number) => {
    if (!scrollRef.current) return;
    const cardWidth = 316;
    scrollRef.current.scrollTo({ left: idx * cardWidth, behavior: 'smooth' });
    setActiveDot(idx);
  }, []);

  const scrollPrev = useCallback(() => {
    const prevIdx = activeDot === 0 ? testimonials.length - 1 : activeDot - 1;
    scrollToIndex(prevIdx);
  }, [activeDot, scrollToIndex]);

  const scrollNext = useCallback(() => {
    const nextIdx = (activeDot + 1) % testimonials.length;
    scrollToIndex(nextIdx);
  }, [activeDot, scrollToIndex]);

  return (
    <section ref={sectionRef} className="py-16 md:py-20 bg-background border-t border-border/50 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl relative z-10">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em] px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-4">
            <Users className="w-3.5 h-3.5" />
            Loved by thousands
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mt-3 mb-4">
            What Our <span className="text-foreground">Users Say</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Trusted by professionals, creators, and teams around the world.
          </p>
        </div>

        <div className="relative">
          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-20 w-10 h-10 rounded-full glass-card shadow-premium flex items-center justify-center hover:border-primary/30 transition-all hidden md:flex"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-20 w-10 h-10 rounded-full glass-card shadow-premium flex items-center justify-center hover:border-primary/30 transition-all hidden md:flex"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className="absolute left-0 top-0 bottom-3 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-3 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div
            ref={scrollRef}
            className="scroll-carousel px-2"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {[...testimonials, ...testimonials].map((testimonial, idx) => (
              <div key={`test-${idx}`} className="testimonial-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                    {testimonial.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: testimonial.stars }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-6">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollToIndex(idx)}
                className={`rounded-full transition-all duration-300 ${
                  activeDot === idx
                    ? 'w-6 h-2 bg-primary'
                    : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

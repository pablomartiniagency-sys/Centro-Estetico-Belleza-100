import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, ViewChildren, QueryList, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatButtonModule, RouterLink],
  templateUrl: './home.page.html',
  styleUrl: './home.page.css'
})
export class HomePage implements AfterViewInit, OnDestroy {
  @ViewChild('heroClip') heroClip!: ElementRef;
  @ViewChild('heroSection') heroSection!: ElementRef;
  @ViewChild('magneticBtn') magneticBtn!: ElementRef;
  
  @ViewChild('storyText1') storyText1!: ElementRef;
  @ViewChild('storyText2') storyText2!: ElementRef;
  
  @ViewChild('pinSection') pinSection!: ElementRef;
  @ViewChild('pinBg') pinBg!: ElementRef;
  @ViewChild('pinText1') pinText1!: ElementRef;
  @ViewChild('pinText2') pinText2!: ElementRef;
  
  @ViewChild('horizontalSection') horizontalSection!: ElementRef;
  @ViewChild('horizontalContainer') horizontalContainer!: ElementRef;
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object, private el: ElementRef) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      gsap.registerPlugin(ScrollTrigger);
      // Wait a tiny bit for render
      setTimeout(() => this.initAnimations(), 100);
    }
  }

  initAnimations() {
    // 0. Intro Cinematic (Clip Path Reveal)
    const introTl = gsap.timeline();
    
    // Animar la apertura del telón
    introTl.to(this.heroClip.nativeElement, {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 1.5,
      ease: 'power4.inOut'
    }, 0);
    
    // Hacer zoom out a la imagen
    introTl.to(this.heroSection.nativeElement, {
      scale: 1,
      duration: 1.5,
      ease: 'power4.inOut'
    }, 0);

    // Revelar los textos línea a línea (usando el wrapper oculto)
    const textReveals = this.el.nativeElement.querySelectorAll('.reveal-inner');
    introTl.fromTo(textReveals, 
      { y: '100%' }, 
      { y: '0%', duration: 1, stagger: 0.2, ease: 'power3.out' }, 
      1 // Start slightly after clip path begins opening
    );

    // 1. Hero Parallax on Scroll
    gsap.to(this.heroSection.nativeElement, {
      backgroundPosition: `50% 30%`,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-wrapper',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    // 2. Story 1: Text Fade Up
    gsap.fromTo([this.storyText1.nativeElement, this.storyText2.nativeElement], 
      { y: 50, opacity: 0 }, 
      { 
        y: 0, 
        opacity: 1, 
        duration: 1, 
        stagger: 0.3,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: this.storyText1.nativeElement,
          start: 'top 80%',
        }
      }
    );

    // 3. Trust Block Stagger
    const trustItems = this.el.nativeElement.querySelectorAll('.trust-item');
    gsap.fromTo(trustItems, 
      { y: 50, opacity: 0 }, 
      { 
        y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: 'power2.out',
        scrollTrigger: {
          trigger: '.trust-grid',
          start: 'top 85%'
        }
      }
    );

    // 4. Pinning Section: "Si tu piel ya no es la misma..."
    const pinTl = gsap.timeline({
      scrollTrigger: {
        trigger: this.pinSection.nativeElement,
        start: 'top top',
        end: '+=100%', 
        pin: true,
        scrub: true
      }
    });

    pinTl.to(this.pinBg.nativeElement, { scale: 1.1, ease: 'none', duration: 1 }, 0)
         .to(this.pinText1.nativeElement, { opacity: 0, y: -50, duration: 0.4 }, 0.1)
         .fromTo(this.pinText2.nativeElement, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.4 }, 0.4);

    // 5. Horizontal Scroll Section (THE WOW FACTOR)
    // Calculamos cuánto tenemos que desplazar el contenedor a la izquierda
    const container = this.horizontalContainer.nativeElement;
    
    // Wait for layout to settle to calculate width
    const getScrollAmount = () => -(container.scrollWidth - window.innerWidth);
    
    const horizontalTl = gsap.to(container, {
      x: getScrollAmount,
      ease: 'none',
      scrollTrigger: {
        trigger: this.horizontalSection.nativeElement,
        start: 'top top',
        end: () => `+=${container.scrollWidth}`, // Scroll height equals width of panels
        pin: true,
        scrub: 1, // Smooth scrub
        invalidateOnRefresh: true // Recalculate on resize
      }
    });

    // Parallax on images INSIDE horizontal scroll
    const parallaxImages = this.el.nativeElement.querySelectorAll('.treatment-image');
    parallaxImages.forEach((img: HTMLElement) => {
      gsap.to(img, {
        backgroundPosition: '100% 50%',
        ease: 'none',
        scrollTrigger: {
          trigger: this.horizontalSection.nativeElement,
          start: 'top top',
          end: () => `+=${container.scrollWidth}`,
          scrub: true
        }
      });
    });



  }

  ngOnDestroy() {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }
}

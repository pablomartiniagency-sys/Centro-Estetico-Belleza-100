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
  

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private el: ElementRef) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      gsap.registerPlugin(ScrollTrigger);
      // Wait a tiny bit for render
      setTimeout(() => this.initAnimations(), 100);
    }
  }

  initAnimations() {
    let mm = gsap.matchMedia();

    mm.add({
      isDesktop: "(min-width: 769px)",
      isMobile: "(max-width: 768px)"
    }, (context) => {
      let { isDesktop, isMobile } = context.conditions as any;

      // 0. Intro Cinematic
      const introTl = gsap.timeline();
      
      if (isDesktop) {
        introTl.to(this.heroClip.nativeElement, {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.5,
          ease: 'power4.inOut'
        }, 0);
      } else {
        gsap.set(this.heroClip.nativeElement, { clipPath: 'inset(0% 0% 0% 0%)' });
      }

      introTl.fromTo(this.heroSection.nativeElement, 
        { scale: isDesktop ? 1.2 : 1 },
        { scale: 1, duration: 1.5, ease: 'power4.inOut' }, 
        0
      );

      const textReveals = this.el.nativeElement.querySelectorAll('.reveal-inner');
      introTl.fromTo(textReveals, 
        { y: '100%' }, 
        { y: '0%', duration: 1, stagger: 0.2, ease: 'power3.out' }, 
        isDesktop ? 1 : 0.2 
      );

      // 1. Hero Parallax
      if (isDesktop) {
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
      }

      // 2. Story 1: Text Fade Up
      gsap.fromTo([this.storyText1.nativeElement, this.storyText2.nativeElement], 
        { y: 50, opacity: 0 }, 
        { 
          y: 0, opacity: 1, duration: 1, stagger: 0.3, ease: 'power2.out',
          scrollTrigger: {
            trigger: this.storyText1.nativeElement,
            start: 'top 80%',
          }
        }
      );

      // 3. Trust Block
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

      // 4. Pinning Section
      if (isDesktop) {
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
      } else {
        gsap.fromTo([this.pinText1.nativeElement, this.pinText2.nativeElement],
          { y: 30, opacity: 0 },
          { 
            y: 0, opacity: 1, stagger: 0.2, duration: 0.8,
            scrollTrigger: {
              trigger: this.pinSection.nativeElement,
              start: 'top 70%'
            }
          }
        );
      }


      return () => {};
    });
  }

  ngOnDestroy() {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }
}

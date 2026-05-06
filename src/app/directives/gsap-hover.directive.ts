import { Directive, ElementRef, HostListener, OnInit } from '@angular/core';
import { gsap } from 'gsap';

@Directive({
  selector: '[appGsapHover]'
})
export class GsapHoverDirective implements OnInit {
  private hoverAnimation: gsap.core.Tween | undefined;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    // Definimos la animación de GSAP, pero pausada al inicio
    this.hoverAnimation = gsap.to(this.el.nativeElement, {
      y: -10,
      scale: 1.02,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      duration: 0.4,
      ease: 'power2.out',
      paused: true
    });
  }

  @HostListener('mouseenter') onMouseEnter() {
    this.hoverAnimation?.play();
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.hoverAnimation?.reverse();
  }
}

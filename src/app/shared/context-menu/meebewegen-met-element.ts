import { MENU_SCROLL_STRATEGY, MENU_TRIGGER } from '@angular/cdk/menu';
import {
  FlexibleConnectedPositionStrategy,
  OverlayRef,
  ScrollStrategy,
} from '@angular/cdk/overlay';
import { DOCUMENT, ElementRef, inject, Injectable, Injector } from '@angular/core';

/**
 * Laat een geopend menu meebewegen met het element als de pagina of een container eromheen scrolt.
 * Is het element helemaal uit beeld gescrold, dan sluit het menu.
 *
 * De standaardstrategie van de CDK volgt alleen scrollende containers met `cdkScrollable`; deze
 * strategie volgt elke container, zoals het rooster.
 */
@Injectable()
export class MeebewegenMetElement implements ScrollStrategy {
  private readonly element: HTMLElement = inject(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private overlayRef?: OverlayRef;
  /**
   * Waar het menu opende, ten opzichte van de linkerbovenhoek van het element. Alleen nodig voor
   * een context menu: de CDK zet dat vast op de muispositie in het venster, waardoor het bij
   * scrollen los komt te staan van het element. Een overflow menu hangt aan het element zelf.
   */
  private verschuiving?: { x: number; y: number };

  /** Onthoudt waar op het element het context menu opende. */
  veranker(event: MouseEvent): void {
    const rect = this.element.getBoundingClientRect();
    this.verschuiving = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  attach(overlayRef: OverlayRef): void {
    this.overlayRef = overlayRef;
  }

  enable(): void {
    // Scroll-events bubbelen niet; met capture vangen we ook scrollende containers, zoals het rooster.
    this.document.addEventListener('scroll', this.onScroll, { capture: true, passive: true });
  }

  disable(): void {
    this.document.removeEventListener('scroll', this.onScroll, { capture: true });
  }

  detach(): void {
    this.disable();
    this.overlayRef = undefined;
  }

  private readonly onScroll = (event: Event) => {
    if (!this.overlayRef || this.overlayRef.overlayElement.contains(event.target as Node)) {
      return;
    }
    const rect = this.element.getBoundingClientRect();
    const view = this.document.defaultView!;
    if (
      rect.bottom < 0 ||
      rect.top > view.innerHeight ||
      rect.right < 0 ||
      rect.left > view.innerWidth
    ) {
      this.injector.get(MENU_TRIGGER).close();
      return;
    }
    if (this.verschuiving) {
      const positie = this.overlayRef.getConfig()
        .positionStrategy as FlexibleConnectedPositionStrategy;
      positie.setOrigin({ x: rect.left + this.verschuiving.x, y: rect.top + this.verschuiving.y });
    }
    this.overlayRef.updatePosition();
  };
}

/** Providers voor een menutrigger, zodat het menu meebeweegt met het element. */
export const MEEBEWEGEN_MET_ELEMENT_PROVIDERS = [
  MeebewegenMetElement,
  {
    provide: MENU_SCROLL_STRATEGY,
    useFactory: () => {
      const strategie = inject(MeebewegenMetElement);
      return () => strategie;
    },
  },
];

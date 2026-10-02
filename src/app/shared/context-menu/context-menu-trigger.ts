import { CdkContextMenuTrigger, MENU_SCROLL_STRATEGY } from '@angular/cdk/menu';
import {
  FlexibleConnectedPositionStrategy,
  OverlayRef,
  ScrollStrategy,
} from '@angular/cdk/overlay';
import {
  DestroyRef,
  Directive,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  Injectable,
  Injector,
  input,
  signal,
} from '@angular/core';
import { ContextMenu, isVisible } from './context-menu';

/**
 * Laat een geopend menu meebewegen met het element als de pagina of een container eromheen scrolt.
 * De CDK zet het menu vast op de muispositie in het venster, waardoor het bij scrollen los komt te
 * staan van het element. Is het element helemaal uit beeld gescrold, dan sluit het menu.
 */
@Injectable()
class MeebewegenMetElement implements ScrollStrategy {
  private readonly element: HTMLElement = inject(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private overlayRef?: OverlayRef;
  /** Waar het menu opende, ten opzichte van de linkerbovenhoek van het element. */
  private verschuiving = { x: 0, y: 0 };

  /** Onthoudt waar op het element het menu opende. */
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
      this.injector.get(CdkContextMenuTrigger).close();
      return;
    }
    const positie = this.overlayRef.getConfig()
      .positionStrategy as FlexibleConnectedPositionStrategy;
    positie.setOrigin({ x: rect.left + this.verschuiving.x, y: rect.top + this.verschuiving.y });
    this.overlayRef.updatePosition();
  };
}

/**
 * Opent een `ContextMenu` met de rechtermuisknop en geeft `appContextMenuContext` door aan de
 * acties. Werkt op elk element, zoals een `div` of `button`.
 *
 * Voor toetsenbordgebruikers opent het menu met Shift+F10 of de menutoets, maar alleen als het
 * element focus kan krijgen: geef een `div` daarom `tabindex="0"` en een toegankelijke naam
 * (`aria-label`). Een `button` is standaard al focusbaar.
 *
 * Zolang het menu open is, krijgt het element de class `context-menu-open`. Bij scrollen beweegt
 * het menu mee met het element.
 */
@Directive({
  selector: '[appContextMenu]',
  hostDirectives: [CdkContextMenuTrigger],
  providers: [
    MeebewegenMetElement,
    {
      provide: MENU_SCROLL_STRATEGY,
      useFactory: () => {
        const strategie = inject(MeebewegenMetElement);
        return () => strategie;
      },
    },
  ],
  host: {
    '[class.context-menu-open]': 'isOpen()',
    '(contextmenu)': 'scrollStrategie.veranker($event)',
  },
})
export class ContextMenuTrigger<T> {
  /** Het menu dat geopend wordt. */
  readonly menu = input.required<ContextMenu<T>>({ alias: 'appContextMenu' });
  /** De context voor dit element, bijvoorbeeld de examenafname. */
  readonly context = input.required<T>({ alias: 'appContextMenuContext' });
  /**
   * Schakelt het context menu uit; de rechtermuisknop toont dan het standaard browsermenu. Dat
   * gebeurt ook vanzelf als geen enkele actie zichtbaar is voor de context.
   */
  readonly disabled = input(false, { alias: 'appContextMenuDisabled' });

  /** Of het menu voor dit element open staat, bijvoorbeeld om het te markeren. */
  readonly isOpen = signal(false);

  private readonly trigger = inject(CdkContextMenuTrigger, { self: true });
  protected readonly scrollStrategie = inject(MeebewegenMetElement, { self: true });

  constructor() {
    this.trigger.menuData = { $implicit: this.context };

    effect(() => {
      this.trigger.menuTemplateRef = this.menu().template();
      const context = this.context();
      const heeftActies = this.menu()
        .actions()
        .some((action) => isVisible(action, context));
      this.trigger.disabled = this.disabled() || !heeftActies;
    });

    const opened = this.trigger.opened.subscribe(() => this.isOpen.set(true));
    const closed = this.trigger.closed.subscribe(() => this.isOpen.set(false));
    inject(DestroyRef).onDestroy(() => {
      opened.unsubscribe();
      closed.unsubscribe();
    });
  }
}

import { CdkContextMenuTrigger } from '@angular/cdk/menu';
import { DestroyRef, Directive, effect, inject, input, signal } from '@angular/core';
import { ContextMenu, isVisible } from './context-menu';
import { MEEBEWEGEN_MET_ELEMENT_PROVIDERS, MeebewegenMetElement } from './meebewegen-met-element';

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
 *
 * Een context menu is niet vindbaar voor iedereen; zet daarom ook een `appOverflowMenu` (⋮) bij het
 * element, of maak de acties op een andere manier bereikbaar.
 */
@Directive({
  selector: '[appContextMenu]',
  hostDirectives: [CdkContextMenuTrigger],
  providers: MEEBEWEGEN_MET_ELEMENT_PROVIDERS,
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

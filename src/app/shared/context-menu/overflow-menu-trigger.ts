import { CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { computed, DestroyRef, Directive, effect, inject, input, signal } from '@angular/core';
import { ContextMenu, isVisible } from './context-menu';
import { MEEBEWEGEN_MET_ELEMENT_PROVIDERS } from './meebewegen-met-element';

/** Onder de knop, rechts uitgelijnd; past dat niet, dan links uitgelijnd of boven de knop. */
const POSITIES: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom' },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
];

/**
 * Opent een `ContextMenu` als overflow menu: met een klik op de knop, of met Enter, Spatie of
 * pijl-omlaag. Het menu hangt onder de knop. Gebruik het op een `button` met een toegankelijke
 * naam (`aria-label`), of gebruik `app-overflow-menu-knop` voor de ⋮-knop uit het designsysteem.
 *
 * Hetzelfde menu kan ook als context menu (`appContextMenu`) aan een element hangen; de gebruiker
 * ziet dan op beide plekken dezelfde acties.
 *
 * Heeft de context geen zichtbare acties, dan is de knop uitgeschakeld. Zolang het menu open is,
 * krijgt de knop de class `overflow-menu-open`.
 */
@Directive({
  selector: 'button[appOverflowMenu]',
  hostDirectives: [CdkMenuTrigger],
  providers: MEEBEWEGEN_MET_ELEMENT_PROVIDERS,
  host: {
    '[class.overflow-menu-open]': 'isOpen()',
    '[disabled]': '!heeftActies()',
  },
})
export class OverflowMenuTrigger<T> {
  /** Het menu dat geopend wordt. */
  readonly menu = input.required<ContextMenu<T>>({ alias: 'appOverflowMenu' });
  /** De context voor deze knop, bijvoorbeeld de examenafname. */
  readonly context = input.required<T>({ alias: 'appOverflowMenuContext' });

  /** Of het menu voor deze knop open staat. */
  readonly isOpen = signal(false);

  protected readonly heeftActies = computed(() => {
    const context = this.context();
    return this.menu()
      .actions()
      .some((action) => isVisible(action, context));
  });

  private readonly trigger = inject(CdkMenuTrigger, { self: true });

  constructor() {
    this.trigger.menuData = { $implicit: this.context };
    this.trigger.menuPosition = POSITIES;

    effect(() => {
      this.trigger.menuTemplateRef = this.menu().template();
      if (!this.heeftActies()) {
        this.trigger.close();
      }
    });

    const opened = this.trigger.opened.subscribe(() => this.isOpen.set(true));
    const closed = this.trigger.closed.subscribe(() => this.isOpen.set(false));
    inject(DestroyRef).onDestroy(() => {
      opened.unsubscribe();
      closed.unsubscribe();
    });
  }
}

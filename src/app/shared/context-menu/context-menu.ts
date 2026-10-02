import { CdkMenu, CdkMenuItem } from '@angular/cdk/menu';
import { Component, input, output, Signal, TemplateRef, viewChild } from '@angular/core';

/** Een actie in het context menu. De callbacks krijgen de context waarvoor het menu is geopend. */
export interface ContextMenuAction<T> {
  /** Unieke sleutel van de actie, bijvoorbeeld om de gekozen actie te herkennen. */
  id: string;
  /** Tekst in het menu. */
  label: string;
  /**
   * Toont de actie alleen als dit voor de context `true` geeft, bijvoorbeeld "Maak los" alleen bij
   * een vastgezette afname. Zonder `visible` is de actie altijd zichtbaar.
   */
  visible?: (context: T) => boolean;
  /** Toont de actie wel, maar maakt hem niet kiesbaar voor deze context. */
  disabled?: (context: T) => boolean;
}

/** Of de actie voor deze context getoond wordt. */
export function isVisible<T>(action: ContextMenuAction<T>, context: T): boolean {
  return action.visible?.(context) ?? true;
}

/** De gekozen actie, samen met de context waarvoor het menu was geopend. */
export interface ContextMenuSelection<T> {
  action: ContextMenuAction<T>;
  context: T;
}

/**
 * Template-context die aan de CDK-trigger wordt meegegeven. De context gaat mee als signal: de CDK
 * hergebruikt het gerenderde menu zolang de template gelijk blijft, waardoor een gewone waarde
 * verouderd raakt als de context daarna wijzigt.
 */
export interface ContextMenuTemplateContext<T> {
  $implicit: Signal<T>;
}

/**
 * Generiek context menu in Uno-stijl (DUO), gebouwd op `@angular/cdk/menu`.
 *
 * Declareer het menu één keer per pagina en koppel het met de directive `appContextMenu` aan
 * zoveel elementen als nodig; elk element geeft zijn eigen context mee. Het menu opent met de
 * rechtermuisknop, of met Shift+F10 of de menutoets als het element focus heeft.
 *
 * ```html
 * <app-context-menu #menu [actions]="acties" (actionSelected)="onActie($event)" />
 * <div tabindex="0" [appContextMenu]="menu" [appContextMenuContext]="afname">…</div>
 * ```
 *
 * Heeft een element geen zichtbare acties, dan opent het menu niet.
 *
 * Het menu is bedoeld voor snelle toegang tot veelgebruikte acties. Zorg dat alle acties ook op
 * een andere manier bereikbaar zijn (bijvoorbeeld in een drawer), want niet iedere gebruiker weet
 * dat er een context menu is.
 */
@Component({
  selector: 'app-context-menu',
  imports: [CdkMenu, CdkMenuItem],
  styleUrl: './context-menu.css',
  template: `
    <ng-template #menu let-context>
      <div cdkMenu class="context-menu" [attr.aria-label]="label()">
        @for (action of actions(); track action.id) {
          @if (isVisible(action, context())) {
            <button
              cdkMenuItem
              type="button"
              class="context-menu__item"
              [cdkMenuItemDisabled]="action.disabled?.(context()) ?? false"
              (cdkMenuItemTriggered)="actionSelected.emit({ action, context: context() })"
            >
              {{ action.label }}
            </button>
          }
        }
      </div>
    </ng-template>
  `,
})
export class ContextMenu<T> {
  /** De acties in het menu, in de getoonde volgorde. */
  readonly actions = input.required<readonly ContextMenuAction<T>[]>();
  /** Toegankelijke naam van het menu voor screenreaders. */
  readonly label = input('Acties');

  /** Wordt uitgestuurd als de gebruiker een actie kiest; daarna sluit het menu. */
  readonly actionSelected = output<ContextMenuSelection<T>>();

  protected readonly isVisible = isVisible;

  /** De menu-template; wordt gebruikt door de `appContextMenu`-directive. */
  readonly template = viewChild.required<TemplateRef<ContextMenuTemplateContext<T>>>('menu');
}

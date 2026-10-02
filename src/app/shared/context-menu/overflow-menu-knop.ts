import { Component, input } from '@angular/core';
import { ContextMenu } from './context-menu';
import { OverflowMenuTrigger } from './overflow-menu-trigger';

/**
 * De ⋮-knop die een overflow menu opent, in Uno-stijl (DUO): doorzichtig, bij hover neutral 200 en
 * ingedrukt of met open menu neutral 300.
 *
 * ```html
 * <app-overflow-menu-knop [menu]="menu" [context]="afname" label="Acties voor afname 10:00" />
 * ```
 */
@Component({
  selector: 'app-overflow-menu-knop',
  imports: [OverflowMenuTrigger],
  styleUrl: './overflow-menu-knop.css',
  template: `
    <button
      type="button"
      class="overflow-menu-knop"
      [appOverflowMenu]="menu()"
      [appOverflowMenuContext]="context()"
      [attr.aria-label]="label()"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="19" r="2" />
      </svg>
    </button>
  `,
})
export class OverflowMenuKnop<T> {
  /** Het menu dat geopend wordt. */
  readonly menu = input.required<ContextMenu<T>>();
  /** De context voor deze knop, bijvoorbeeld de examenafname. */
  readonly context = input.required<T>();
  /** Toegankelijke naam, bijvoorbeeld "Acties voor afname 2-AK 10:00". */
  readonly label = input.required<string>();
}

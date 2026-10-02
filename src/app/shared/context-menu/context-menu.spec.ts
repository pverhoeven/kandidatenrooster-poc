import { FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContextMenu, ContextMenuAction, ContextMenuSelection } from './context-menu';
import { ContextMenuTrigger } from './context-menu-trigger';
import { OverflowMenuKnop } from './overflow-menu-knop';

interface Item {
  naam: string;
  vast: boolean;
}

@Component({
  imports: [ContextMenu, ContextMenuTrigger, OverflowMenuKnop],
  template: `
    <app-context-menu
      #menu
      [actions]="alleenVerborgen() ? verborgen : actions"
      (actionSelected)="selected.push($event)"
    />
    @for (item of items(); track item.naam) {
      <div class="item" [appContextMenu]="menu" [appContextMenuContext]="item">{{ item.naam }}</div>
      <app-overflow-menu-knop [menu]="menu" [context]="item" [label]="'Acties voor ' + item.naam" />
    }
  `,
})
class Host {
  readonly actions: ContextMenuAction<Item>[] = [
    { id: 'open', label: 'Open' },
    { id: 'maak-los', label: 'Maak los', visible: (item) => item.vast },
    { id: 'verwijder', label: 'Verwijder', disabled: (item) => item.vast },
  ];
  readonly alleenVerborgen = signal(false);
  readonly verborgen: ContextMenuAction<Item>[] = [
    { id: 'nooit', label: 'Nooit', visible: () => false },
  ];
  readonly items = signal<Item[]>([
    { naam: 'a', vast: true },
    { naam: 'b', vast: false },
  ]);
  readonly selected: ContextMenuSelection<Item>[] = [];
}

describe('ContextMenu', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<Host>>;

  const rightClick = async (index: number) => {
    const target = fixture.nativeElement.querySelectorAll('.item')[index] as HTMLElement;
    target.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 }),
    );
    await fixture.whenStable();
    return target;
  };
  const menuItems = () =>
    Array.from(document.querySelectorAll<HTMLButtonElement>('.context-menu__item'));
  const labels = () => menuItems().map((item) => item.textContent?.trim());

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  it('opens on right-click with actions for the clicked context', async () => {
    const target = await rightClick(0);

    expect(document.querySelector('[role="menu"]')).toBeTruthy();
    expect(labels()).toEqual(['Open', 'Maak los', 'Verwijder']);
    expect(menuItems()[2].getAttribute('aria-disabled')).toBe('true');
    expect(target.classList).toContain('context-menu-open');
  });

  it('emits the selected action together with its context', async () => {
    await rightClick(1);
    expect(labels()).toEqual(['Open', 'Verwijder']);

    menuItems()[1].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.selected).toEqual([
      { action: fixture.componentInstance.actions[2], context: { naam: 'b', vast: false } },
    ]);
    expect(document.querySelector('[role="menu"]')).toBeNull();
  });

  it('does not emit disabled actions', async () => {
    await rightClick(0);
    menuItems()[2].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.selected).toEqual([]);
  });

  it('uses the latest context when the item changes after the menu was first opened', async () => {
    await rightClick(0);
    menuItems()[0].click();
    await fixture.whenStable();

    fixture.componentInstance.items.update(([a, b]) => [{ ...a, vast: false }, b]);
    await fixture.whenStable();
    await rightClick(0);

    expect(labels()).toEqual(['Open', 'Verwijder']);
    menuItems()[0].click();
    expect(fixture.componentInstance.selected[1].context).toEqual({ naam: 'a', vast: false });
  });

  it('does not open when no action is visible for the context', async () => {
    fixture.componentInstance.alleenVerborgen.set(true);
    await fixture.whenStable();

    const target = fixture.nativeElement.querySelector('.item') as HTMLElement;
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    await fixture.whenStable();

    expect(document.querySelector('[role="menu"]')).toBeNull();
    expect(event.defaultPrevented).toBe(false);
  });

  describe('when scrolling', () => {
    const scrollTo = (target: HTMLElement, rect: Partial<DOMRect>) => {
      vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        right: 100,
        bottom: 50,
        ...rect,
      } as DOMRect);
      document.body.dispatchEvent(new Event('scroll'));
    };

    afterEach(() => vi.restoreAllMocks());

    it('keeps the menu at the same spot on the element', async () => {
      const target = await rightClick(0);
      const { left, top } = target.getBoundingClientRect();
      const setOrigin = vi.spyOn(FlexibleConnectedPositionStrategy.prototype, 'setOrigin');

      scrollTo(target, { left: 30, top: 40 });

      expect(setOrigin).toHaveBeenCalledWith({ x: 10 - left + 30, y: 10 - top + 40 });
      expect(document.querySelector('[role="menu"]')).toBeTruthy();
    });

    it('closes the menu when the element is scrolled out of view', async () => {
      const target = await rightClick(0);

      scrollTo(target, { top: -100, bottom: -50 });
      await fixture.whenStable();

      expect(document.querySelector('[role="menu"]')).toBeNull();
      expect(target.classList).not.toContain('context-menu-open');
    });
  });

  describe('as overflow menu', () => {
    const knop = (index: number) =>
      fixture.nativeElement.querySelectorAll('.overflow-menu-knop')[index] as HTMLButtonElement;
    const klik = async (index: number) => {
      knop(index).click();
      await fixture.whenStable();
    };

    it('opens on click with the same actions as the context menu', async () => {
      expect(knop(0).getAttribute('aria-label')).toBe('Acties voor a');
      expect(knop(0).getAttribute('aria-haspopup')).toBe('menu');

      await klik(0);

      expect(labels()).toEqual(['Open', 'Maak los', 'Verwijder']);
      expect(knop(0).getAttribute('aria-expanded')).toBe('true');
      expect(knop(0).classList).toContain('overflow-menu-open');
    });

    it('emits the selected action together with its context', async () => {
      await klik(1);
      menuItems()[0].click();
      await fixture.whenStable();

      expect(fixture.componentInstance.selected).toEqual([
        { action: fixture.componentInstance.actions[0], context: { naam: 'b', vast: false } },
      ]);
      expect(document.querySelector('[role="menu"]')).toBeNull();
      expect(knop(1).classList).not.toContain('overflow-menu-open');
    });

    it('closes on a second click', async () => {
      await klik(0);
      await klik(0);

      expect(document.querySelector('[role="menu"]')).toBeNull();
      expect(knop(0).getAttribute('aria-expanded')).toBe('false');
    });

    it('is disabled when no action is visible for the context', async () => {
      fixture.componentInstance.alleenVerborgen.set(true);
      await fixture.whenStable();

      expect(knop(0).disabled).toBe(true);
    });

    it('closes the menu when the button is scrolled out of view', async () => {
      await klik(0);

      vi.spyOn(knop(0), 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: -100,
        right: 32,
        bottom: -68,
      } as DOMRect);
      document.body.dispatchEvent(new Event('scroll'));
      await fixture.whenStable();
      vi.restoreAllMocks();

      expect(document.querySelector('[role="menu"]')).toBeNull();
    });
  });
});

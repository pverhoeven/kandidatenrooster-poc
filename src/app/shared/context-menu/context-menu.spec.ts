import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContextMenu, ContextMenuAction, ContextMenuSelection } from './context-menu';
import { ContextMenuTrigger } from './context-menu-trigger';

interface Item {
  naam: string;
  vast: boolean;
}

@Component({
  imports: [ContextMenu, ContextMenuTrigger],
  template: `
    <app-context-menu #menu [actions]="actions" (actionSelected)="selected.push($event)" />
    @for (item of items(); track item.naam) {
      <div class="item" [appContextMenu]="menu" [appContextMenuContext]="item">{{ item.naam }}</div>
    }
  `,
})
class Host {
  readonly actions: ContextMenuAction<Item>[] = [
    { id: 'open', label: 'Open' },
    { id: 'maak-los', label: 'Maak los', hidden: (item) => !item.vast },
    { id: 'verwijder', label: 'Verwijder', disabled: (item) => item.vast },
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
});

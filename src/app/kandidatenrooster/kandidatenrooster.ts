import { Component, computed, ElementRef, signal, viewChild } from '@angular/core';
import {
  ContextMenu,
  ContextMenuAction,
  ContextMenuSelection,
} from '../shared/context-menu/context-menu';
import { ContextMenuTrigger } from '../shared/context-menu/context-menu-trigger';
import { Afname, AFNAMES, KOLOMMEN } from './afname';

const ROOSTER_START = '09:00';
const ROOSTER_EIND = '15:30';
const SLOT_MINUTEN = 5;
const PAUZE = { start: '12:30', eind: '13:30', kolommen: ['2-AK', '3-AK'] };

const minuten = (tijd: string) => {
  const [uur, minuut] = tijd.split(':').map(Number);
  return uur * 60 + minuut;
};

/** CSS grid rows for a time range; row 1 is the column header. */
const rijen = (start: string, eind: string) => {
  const van = (minuten(start) - minuten(ROOSTER_START)) / SLOT_MINUTEN + 2;
  return `${van} / ${van + (minuten(eind) - minuten(start)) / SLOT_MINUTEN}`;
};

// All afname actions. The drawer shows all of them; the context menu a subset for quick access.
const VERPLAATS: ContextMenuAction<Afname> = { id: 'verplaats', label: 'Verplaats afname' };
const MAAK_LOS: ContextMenuAction<Afname> = {
  id: 'maak-los',
  label: 'Maak afname los',
  hidden: (afname) => !afname.vastgezet,
};
const ZET_VAST: ContextMenuAction<Afname> = {
  id: 'zet-vast',
  label: 'Zet afname vast',
  hidden: (afname) => afname.vastgezet,
  disabled: (afname) => !!afname.conflict,
};
const NAAR_WERKVOORRAAD: ContextMenuAction<Afname> = {
  id: 'naar-werkvoorraad',
  label: 'Naar werkvoorraad',
};
const OVERIGE: ContextMenuAction<Afname> = { id: 'overige', label: 'Overige acties' };
const WIJZIG_LOKAAL: ContextMenuAction<Afname> = { id: 'wijzig-lokaal', label: 'Wijzig lokaal' };
const BEKIJK_HISTORIE: ContextMenuAction<Afname> = {
  id: 'bekijk-historie',
  label: 'Bekijk historie',
};

@Component({
  selector: 'app-kandidatenrooster',
  imports: [ContextMenu, ContextMenuTrigger],
  templateUrl: './kandidatenrooster.html',
  styleUrl: './kandidatenrooster.css',
})
export class Kandidatenrooster {
  protected readonly kolommen = KOLOMMEN;
  protected readonly afnames = signal(AFNAMES);
  protected readonly werkvoorraad = signal<Afname[]>([]);
  protected readonly melding = signal('');

  protected readonly contextMenuActies = [
    VERPLAATS,
    MAAK_LOS,
    ZET_VAST,
    NAAR_WERKVOORRAAD,
    OVERIGE,
  ];
  protected readonly drawerActies = [
    VERPLAATS,
    MAAK_LOS,
    ZET_VAST,
    NAAR_WERKVOORRAAD,
    WIJZIG_LOKAAL,
    BEKIJK_HISTORIE,
  ];

  private readonly drawerAfnameId = signal<string | null>(null);
  protected readonly drawerAfname = computed(() =>
    this.afnames().find((afname) => afname.id === this.drawerAfnameId()),
  );
  private readonly drawerTitel = viewChild<ElementRef<HTMLElement>>('drawerTitel');

  protected readonly pauzes = PAUZE.kolommen.map((kolom) => ({ kolom, ...PAUZE }));
  protected readonly uren = Array.from(
    { length: Math.ceil((minuten(ROOSTER_EIND) - minuten(ROOSTER_START)) / 60) },
    (_, i) => {
      const uur = minuten(ROOSTER_START) / 60 + i;
      const label = `${String(uur).padStart(2, '0')}:00`;
      const eind = Math.min((uur + 1) * 60, minuten(ROOSTER_EIND));
      return { label, rijen: rijen(label, `${Math.floor(eind / 60)}:${eind % 60}`) };
    },
  );
  protected readonly rijen = rijen;
  protected readonly aantalSlots = (minuten(ROOSTER_EIND) - minuten(ROOSTER_START)) / SLOT_MINUTEN;

  protected kolomVan(kolom: string): number {
    return this.kolommen.indexOf(kolom) + 2;
  }

  protected onContextMenuActie({ action, context }: ContextMenuSelection<Afname>): void {
    this.voerUit(action, context);
  }

  protected voerUit(actie: ContextMenuAction<Afname>, afname: Afname): void {
    const omschrijving = `${afname.kolom} ${afname.start}–${afname.eind} (${afname.kandidaat})`;
    switch (actie.id) {
      case MAAK_LOS.id:
      case ZET_VAST.id:
        this.wijzig(afname.id, { vastgezet: actie.id === ZET_VAST.id });
        this.melding.set(
          `Afname ${omschrijving} is ${actie.id === ZET_VAST.id ? 'vastgezet' : 'losgemaakt'}.`,
        );
        break;
      case NAAR_WERKVOORRAAD.id:
        this.afnames.update((afnames) => afnames.filter((a) => a.id !== afname.id));
        this.werkvoorraad.update((werkvoorraad) => [...werkvoorraad, afname]);
        this.melding.set(`Afname ${omschrijving} is naar de werkvoorraad verplaatst.`);
        break;
      case OVERIGE.id:
        this.openDrawer(afname);
        break;
      default:
        this.melding.set(`${actie.label} voor ${omschrijving}: niet uitgewerkt in deze POC.`);
    }
  }

  protected openDrawer(afname: Afname): void {
    this.drawerAfnameId.set(afname.id);
    // Wait for the drawer to render before moving focus into it.
    setTimeout(() => this.drawerTitel()?.nativeElement.focus());
  }

  protected sluitDrawer(): void {
    this.drawerAfnameId.set(null);
  }

  private wijzig(id: string, wijziging: Partial<Afname>): void {
    this.afnames.update((afnames) =>
      afnames.map((a) => (a.id === id ? { ...a, ...wijziging } : a)),
    );
  }
}

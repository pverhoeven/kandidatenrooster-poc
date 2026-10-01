export interface Afname {
  id: string;
  /** Rooster column, e.g. the exam part "2-AK". */
  kolom: string;
  leerweg: string;
  vak: string;
  start: string;
  eind: string;
  kandidaatnummer: string;
  kandidaat: string;
  vastgezet: boolean;
  conflict?: boolean;
}

const afname = (
  id: string,
  kolom: string,
  start: string,
  eind: string,
  extra: Partial<Afname> = {},
): Afname => ({
  id,
  kolom,
  start,
  eind,
  leerweg: 'VMBO-TL',
  vak: 'AK',
  kandidaatnummer: '100001',
  kandidaat: 'J. Jansen',
  vastgezet: true,
  ...extra,
});

export const KOLOMMEN = ['1-TE', '2-AK', '3-AK'];

export const AFNAMES: Afname[] = [
  afname('a1', '1-TE', '09:00', '15:30', {
    leerweg: 'HAVO',
    vak: 'TE',
    kandidaatnummer: '100002',
    kandidaat: 'A. de Vries',
  }),
  afname('a2', '2-AK', '10:00', '10:25'),
  afname('a3', '2-AK', '10:40', '11:05'),
  afname('a4', '2-AK', '11:20', '11:45', { vastgezet: false }),
  afname('a5', '2-AK', '12:00', '12:25'),
  afname('a6', '3-AK', '10:00', '10:25'),
  afname('a7', '3-AK', '10:40', '11:05', { conflict: true }),
  afname('a8', '3-AK', '11:20', '11:45', { vastgezet: false, conflict: true }),
  afname('a9', '3-AK', '12:00', '12:25'),
];

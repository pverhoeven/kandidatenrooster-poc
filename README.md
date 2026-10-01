# Kandidatenrooster POC

POC van een generiek context menu in Angular, in de stijl van het
[Uno-designsysteem](https://uno.duo.nl), gebouwd op `@angular/cdk/menu`.

[Open in StackBlitz](https://stackblitz.com/github/pverhoeven/kandidatenrooster-poc)

- `src/app/shared/context-menu/`: het generieke context menu (`app-context-menu`) en de
  directive `appContextMenu`.
- `src/app/kandidatenrooster/`: een vereenvoudigd kandidatenrooster dat het menu gebruikt.
  Rechtsklik (of Shift+F10 op Windows) op een afname toont snelle acties; een klik opent de
  drawer met alle acties.

## Starten

```bash
npm install
npm start
```

Open daarna `http://localhost:4200/`.

## Testen

```bash
npm test
```

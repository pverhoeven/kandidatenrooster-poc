# Kandidatenrooster POC

POC van een generiek context menu in Angular, in de stijl van het
[Uno-designsysteem](https://uno.duo.nl), gebouwd op `@angular/cdk/menu`.

[Open in StackBlitz](https://stackblitz.com/github/pverhoeven/kandidatenrooster-poc)

- `src/app/shared/context-menu/`: het generieke menu (`app-context-menu`) met twee manieren om
  het te openen: als context menu met de rechtermuisknop (`appContextMenu`) en als overflow menu
  met een knop (`appOverflowMenu`, of de ⋮-knop `app-overflow-menu-knop`). Beide tonen dezelfde
  acties.
- `src/app/kandidatenrooster/`: een vereenvoudigd kandidatenrooster dat het menu gebruikt. De
  ⋮-knop op een afname of een rechtsklik (of Shift+F10 op Windows)
  toont snelle acties; een klik op de afname opent de drawer met alle acties.

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

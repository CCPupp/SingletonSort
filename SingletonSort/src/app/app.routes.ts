import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/deck-viewer/deck-viewer').then(m => m.DeckViewer)
  }
];

import { Routes } from '@angular/router';
import { authGuard, clubGuard, guestGuard, setupGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Entrar · Trinity',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    title: 'Criar conta · Trinity',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'setup',
        title: 'Seu clube · Trinity',
        canActivate: [setupGuard],
        loadComponent: () =>
          import('./pages/clube-setup/clube-setup').then((m) => m.ClubeSetupComponent),
      },
      {
        path: '',
        canActivate: [clubGuard],
        children: [
          {
            path: 'dashboard',
            title: 'Início · Trinity',
            loadComponent: () =>
              import('./pages/clube-dashboard/clube-dashboard').then(
                (m) => m.ClubeDashboardComponent,
              ),
          },
          {
            path: 'filmes',
            title: 'Catálogo · Trinity',
            loadComponent: () =>
              import('./components/catalogo-filmes/catalogo-filmes').then(
                (m) => m.CatalogoFilmesComponent,
              ),
          },
          {
            path: 'historico',
            title: 'Ciclos · Trinity',
            loadComponent: () =>
              import('./pages/historico/historico').then((m) => m.HistoricoCiclosComponent),
          },
          { path: 'adicionar-filme', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'perfil',
            title: 'Meu perfil · Trinity',
            loadComponent: () =>
              import('./components/user-profile/user-profile').then((m) => m.UserProfileComponent),
          },
          {
            path: 'perfil/:id',
            title: 'Perfil · Trinity',
            loadComponent: () =>
              import('./components/user-profile/user-profile').then((m) => m.UserProfileComponent),
          },
          {
            path: 'clube/:id/estatisticas',
            title: 'Estatísticas · Trinity',
            loadComponent: () =>
              import('./pages/estatisticas/estatisticas').then((m) => m.EstatisticasComponent),
          },
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
        ],
      },
    ],
  },
  {
    path: '**',
    title: 'Página não encontrada · Trinity',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];

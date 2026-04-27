import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { ClubeSetupComponent } from './pages/clube-setup/clube-setup';
import { ClubeDashboardComponent } from './pages/clube-dashboard/clube-dashboard';
import { AdicionarFilmeComponent } from './pages/adicionar-filme/adicionar-filme';
import { HistoricoCiclosComponent } from './pages/historico/historico';
import { CatalogoFilmesComponent } from './components/catalogo-filmes/catalogo-filmes';
import { UserProfileComponent } from './components/user-profile/user-profile';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'setup',
    component: ClubeSetupComponent
  },
  {
    path: 'dashboard',
    component: ClubeDashboardComponent
  },
  {
    path: 'adicionar-filme',
    component: AdicionarFilmeComponent
  },
  {
    path: 'historico',
    component: HistoricoCiclosComponent
  },
  // --- ADICIONE ESTE BLOCO ---
  {
    path: 'perfil',
    component: UserProfileComponent
  },
  {
    path: 'perfil/:id',
    component: UserProfileComponent
  },
  { path: 'filmes', component: CatalogoFilmesComponent },
  // ---------------------------
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
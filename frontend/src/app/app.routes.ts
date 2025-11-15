import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { authGuard } from './core/auth/auth.guard';

import { MinhasTurmasComponent } from './painel/minhas-turmas/minhas-turmas.component';
import { RecursosTurmaComponent } from './painel/recursos-turma/recursos-turma.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: 'painel',
    component: MinhasTurmasComponent,
    canActivate: [authGuard]
  },
  {
    path: 'painel/turma/:id',
    component: RecursosTurmaComponent,
    canActivate: [authGuard]
  },

  { path: '', redirectTo: '/painel', pathMatch: 'full' },

  { path: '**', redirectTo: '/painel' }

];
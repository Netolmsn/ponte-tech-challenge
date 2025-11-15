import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { authGuard } from './core/auth/auth.guard';
import { TarefasPageComponent } from './tarefas/tarefas-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'tarefas',
    component: TarefasPageComponent,
    canActivate: [authGuard],
  },
  { path: '', redirectTo: '/tarefas', pathMatch: 'full' },
  { path: '**', redirectTo: '/tarefas' },
];

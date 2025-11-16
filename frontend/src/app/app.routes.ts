import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { authGuard } from './core/auth/auth.guard';
import { TarefasPageComponent } from './tarefas/tarefas-page.component';
import { TaskDetailComponent } from './tarefas/task-detail.component';
import { RegisterComponent } from './register/register.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'tarefas/:id',
    component: TaskDetailComponent,
    canActivate: [authGuard],
  },
  {
    path: 'tasks/:id',
    component: TaskDetailComponent,
    canActivate: [authGuard],
  },
  {
    path: 'tarefas',
    component: TarefasPageComponent,
    canActivate: [authGuard],
  },
  { path: '', redirectTo: '/tarefas', pathMatch: 'full' },
];

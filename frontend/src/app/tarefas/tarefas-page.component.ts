import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface Tarefa {
  id: number;
  titulo: string;
  descricao: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | string;
  criado_em: string;
  atualizado_em: string;
}

interface DashboardResponse {
  total: number;
  por_status: Record<string, number>;
}

@Component({
  selector: 'app-tarefas-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatListModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './tarefas-page.component.html',
})
export class TarefasPageComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  apiUrl = environment.apiUrl;

  tarefas: Tarefa[] = [];
  dashboard: DashboardResponse | null = null;

  filtroStatus: string | null = null;
  filtroPrioridade: string | null = null;

  editingId: number | null = null;

  tarefaForm = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    descricao: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    status: ['PENDENTE', Validators.required],
    prioridade: ['MEDIA', Validators.required],
  });

  ngOnInit(): void {
    this.carregarTarefas();
    this.carregarDashboard();
  }

  carregarTarefas(): void {
    const params: any = {};
    if (this.filtroStatus) {
      params.status = this.filtroStatus;
    }
    if (this.filtroPrioridade) {
      params.prioridade = this.filtroPrioridade;
    }

    this.http
      .get<Tarefa[]>(`${this.apiUrl}/tarefas/`, { params })
      .subscribe({
        next: (tarefas) => (this.tarefas = tarefas),
        error: (err) => {
          console.error('Erro ao carregar tarefas', err);
          this.snackBar.open('Erro ao carregar tarefas', 'Fechar', {
            duration: 3000,
          });
        },
      });
  }

  carregarDashboard(): void {
    this.http
      .get<DashboardResponse>(`${this.apiUrl}/dashboard/`)
      .subscribe({
        next: (data) => (this.dashboard = data),
        error: (err) => {
          console.error('Erro ao carregar dashboard', err);
        },
      });
  }

  aplicarFiltros(): void {
    this.carregarTarefas();
    this.carregarDashboard();
  }

  limparFiltros(): void {
    this.filtroStatus = null;
    this.filtroPrioridade = null;
    this.aplicarFiltros();
  }

  editar(tarefa: Tarefa): void {
    this.editingId = tarefa.id;
    this.tarefaForm.setValue({
      titulo: tarefa.titulo,
      descricao: tarefa.descricao,
      status: tarefa.status,
      prioridade: tarefa.prioridade,
    });
  }

  cancelarEdicao(): void {
    this.editingId = null;
    this.tarefaForm.reset({
      titulo: '',
      descricao: '',
      status: 'PENDENTE',
      prioridade: 'MEDIA',
    });
  }

  salvar(): void {
    if (this.tarefaForm.invalid) {
      this.tarefaForm.markAllAsTouched();
      return;
    }

    const payload = this.tarefaForm.getRawValue();

    if (this.editingId) {
      this.http
        .put<Tarefa>(`${this.apiUrl}/tarefas/${this.editingId}/`, payload)
        .subscribe({
          next: () => {
            this.snackBar.open('Tarefa atualizada com sucesso', 'Fechar', {
              duration: 3000,
            });
            this.cancelarEdicao();
            this.carregarTarefas();
            this.carregarDashboard();
          },
          error: (err) => {
            console.error('Erro ao atualizar tarefa', err);
            this.snackBar.open('Erro ao atualizar tarefa', 'Fechar', {
              duration: 3000,
            });
          },
        });
    } else {
      this.http
        .post<Tarefa>(`${this.apiUrl}/tarefas/`, payload)
        .subscribe({
          next: () => {
            this.snackBar.open('Tarefa criada com sucesso', 'Fechar', {
              duration: 3000,
            });
            this.cancelarEdicao();
            this.carregarTarefas();
            this.carregarDashboard();
          },
          error: (err) => {
            console.error('Erro ao criar tarefa', err);
            this.snackBar.open('Erro ao criar tarefa', 'Fechar', {
              duration: 3000,
            });
          },
        });
    }
  }

  excluir(tarefa: Tarefa): void {
    if (!confirm('Deseja realmente excluir esta tarefa?')) {
      return;
    }

    this.http
      .delete(`${this.apiUrl}/tarefas/${tarefa.id}/`)
      .subscribe({
        next: () => {
          this.snackBar.open('Tarefa excluída', 'Fechar', {
            duration: 3000,
          });
          this.carregarTarefas();
          this.carregarDashboard();
        },
        error: (err) => {
          console.error('Erro ao excluir tarefa', err);
          this.snackBar.open('Erro ao excluir tarefa', 'Fechar', {
            duration: 3000,
          });
        },
      });
  }
}

import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';

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

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSnackBarModule],
  templateUrl: './task-detail.component.html',
})
export class TaskDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  apiUrl = environment.apiUrl;

  tarefa: Tarefa | null = null;
  loading = true;
  error: string | null = null;
  updating = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID de tarefa inválido.';
      this.loading = false;
      return;
    }
    this.carregarTarefa(id);
  }

  carregarTarefa(id: string): void {
    this.loading = true;
    this.error = null;

    this.http
      .get<Tarefa>(`${this.apiUrl}/tarefas/${id}/`)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (tarefa) => {
          this.tarefa = tarefa;
        },
        error: (err) => {
          console.error('Erro ao carregar tarefa', err);
          this.error = 'Não foi possível carregar a tarefa.';
        },
      });
  }

  voltar(): void {
    this.router.navigate(['/tarefas']);
  }

  atualizarStatus(novoStatus: Tarefa['status']): void {
    if (!this.tarefa || this.updating) {
      return;
    }

    this.updating = true;

    this.http
      .patch<Tarefa>(`${this.apiUrl}/tarefas/${this.tarefa.id}/`, {
        status: novoStatus,
      })
      .pipe(finalize(() => (this.updating = false)))
      .subscribe({
        next: (tarefaAtualizada) => {
          this.tarefa = tarefaAtualizada;
          this.snackBar.open('Status atualizado com sucesso.', 'Fechar', {
            duration: 3000,
          });
        },
        error: (err) => {
          console.error('Erro ao atualizar status', err);
          this.snackBar.open(
            'Não foi possível atualizar o status (verifique o fluxo permitido).',
            'Fechar',
            { duration: 4000 },
          );
        },
      });
  }

  excluir(): void {
    if (!this.tarefa) {
      return;
    }
    if (!confirm('Deseja realmente excluir esta tarefa?')) {
      return;
    }

    this.http.delete(`${this.apiUrl}/tarefas/${this.tarefa.id}/`).subscribe({
      next: () => {
        this.snackBar.open('Tarefa excluída.', 'Fechar', { duration: 3000 });
        this.router.navigate(['/tarefas']);
      },
      error: (err) => {
        console.error('Erro ao excluir tarefa', err);
        this.snackBar.open('Erro ao excluir tarefa.', 'Fechar', {
          duration: 3000,
        });
      },
    });
  }
}


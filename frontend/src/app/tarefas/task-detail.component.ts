import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

interface Comentario {
  id: number;
  usuario: number;
  texto: string;
  criado_em: string;
}

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatSnackBarModule, FormsModule],
  templateUrl: './task-detail.component.html',
})
export class TaskDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  apiUrl = environment.apiUrl;

  tarefa: Tarefa | null = null;
  loading = true;
  error: string | null = null;
  updating = false;
  saving = false;

  comentarios: Comentario[] = [];
  loadingComentarios = false;
  addingComentario = false;
  comentarioTexto = '';

  private readonly FAVORITES_STORAGE_KEY = 'tarefas_favoritas';
  isFavorite = false;

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
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (tarefa) => {
          this.tarefa = tarefa;
          this.carregarFavorito(tarefa.id);
          this.carregarComentarios(tarefa.id);
        },
        error: (err) => {
          console.error('Erro ao carregar tarefa', err);
          this.error = 'Nao foi possivel carregar a tarefa.';
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
      .pipe(
        finalize(() => {
          this.updating = false;
          this.cdr.detectChanges();
        }),
      )
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

  carregarComentarios(tarefaId: number | string): void {
    this.loadingComentarios = true;
    this.http
      .get<Comentario[]>(`${this.apiUrl}/tarefas/${tarefaId}/comentarios/`)
      .pipe(
        finalize(() => {
          this.loadingComentarios = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (comentarios) => {
          this.comentarios = comentarios;
        },
        error: (err) => {
          console.error('Erro ao carregar comentarios', err);
        },
      });
  }

  adicionarComentario(): void {
    if (!this.tarefa || this.addingComentario) {
      return;
    }

    const texto = this.comentarioTexto?.trim();
    if (!texto) {
      return;
    }

    this.addingComentario = true;

    this.http
      .post<Comentario>(
        `${this.apiUrl}/tarefas/${this.tarefa.id}/comentarios/`,
        { texto },
      )
      .pipe(
        finalize(() => {
          this.addingComentario = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (comentario) => {
          this.comentarioTexto = '';
          this.comentarios = [comentario, ...this.comentarios];
        },
        error: (err) => {
          console.error('Erro ao adicionar comentário', err);
          this.snackBar.open('Erro ao adicionar comentário.', 'Fechar', {
            duration: 3000,
          });
        },
      });
  }

  salvarTarefa(): void {
    if (!this.tarefa || this.saving) {
      return;
    }

    const payload = {
      titulo: this.tarefa.titulo,
      descricao: this.tarefa.descricao,
      status: this.tarefa.status,
      prioridade: this.tarefa.prioridade,
    };

    this.saving = true;

    this.http
      .put<Tarefa>(`${this.apiUrl}/tarefas/${this.tarefa.id}/`, payload)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (tarefaAtualizada) => {
          this.tarefa = tarefaAtualizada;
          this.snackBar.open('Tarefa atualizada com sucesso.', 'Fechar', {
            duration: 3000,
          });
        },
        error: (err) => {
          console.error('Erro ao atualizar tarefa', err);
          this.snackBar.open('Erro ao atualizar tarefa.', 'Fechar', {
            duration: 3000,
          });
        },
      });
  }

  atribuirTarefa(): void {
    if (!this.tarefa) {
      return;
    }

    const email = prompt(
      'Digite o e-mail do usuário para atribuir esta tarefa:',
    );

    const trimmed = email?.trim();
    if (!trimmed) {
      return;
    }

    this.http
      .post<Tarefa>(`${this.apiUrl}/tarefas/${this.tarefa.id}/atribuir/`, {
        email: trimmed,
      })
      .pipe(
        finalize(() => {
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (tarefaAtualizada) => {
          this.tarefa = tarefaAtualizada;
          this.snackBar.open('Tarefa atribuída com sucesso.', 'Fechar', {
            duration: 3000,
          });
        },
        error: (err) => {
          console.error('Erro ao atribuir tarefa', err);
          const backendMessage =
            (err?.error && (err.error.email || err.error.detail)) ?? null;
          this.snackBar.open(
            backendMessage || 'Erro ao atribuir tarefa.',
            'Fechar',
            { duration: 3000 },
          );
        },
      });
  }

  private carregarFavorito(tarefaId: number | string): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const raw = window.localStorage.getItem(this.FAVORITES_STORAGE_KEY);
      const ids: number[] = raw ? JSON.parse(raw) : [];
      const numericId = Number(tarefaId);
      this.isFavorite = ids.includes(numericId);
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Erro ao carregar favoritos', err);
    }
  }

  toggleFavorito(): void {
    if (!this.tarefa) {
      return;
    }
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const raw = window.localStorage.getItem(this.FAVORITES_STORAGE_KEY);
      let ids: number[] = raw ? JSON.parse(raw) : [];
      const id = this.tarefa.id;

      if (this.isFavorite) {
        ids = ids.filter((storedId) => storedId !== id);
      } else {
        if (!ids.includes(id)) {
          ids.push(id);
        }
      }

      window.localStorage.setItem(
        this.FAVORITES_STORAGE_KEY,
        JSON.stringify(ids),
      );

      this.isFavorite = !this.isFavorite;
      this.cdr.detectChanges();

      this.snackBar.open(
        this.isFavorite
          ? 'Tarefa adicionada aos favoritos.'
          : 'Tarefa removida dos favoritos.',
        'Fechar',
        { duration: 3000 },
      );
    } catch (err) {
      console.error('Erro ao atualizar favoritos', err);
      this.snackBar.open(
        'Não foi possível atualizar favoritos.',
        'Fechar',
        { duration: 3000 },
      );
    }
  }
}

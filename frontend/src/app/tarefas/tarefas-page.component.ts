import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { finalize } from 'rxjs/operators';

interface Tarefa {
  id: number;
  titulo: string;
  descricao: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | string;
  criado_em: string;
  atualizado_em: string;
}

interface TarefaListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Tarefa[];
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
    MatSnackBarModule,
    NgChartsModule,
  ],
  templateUrl: './tarefas-page.component.html',
})
export class TarefasPageComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  apiUrl = environment.apiUrl;

  tarefas: Tarefa[] = [];
  dashboard: DashboardResponse | null = null;
  saving = false;
  loadingTarefas = false;
  loadingDashboard = false;

  totalTarefas = 0;
  page = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 50];

  filtroStatus: string | null = null;
  filtroPrioridade: string | null = null;

  editingId: number | null = null;
  private originalStatusMap = new Map<number, Tarefa['status']>();

  ordenacaoAsc = false;

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

    params.page = this.page;
    params.page_size = this.pageSize;

    this.loadingTarefas = true;

    this.http
      .get<TarefaListResponse>(`${this.apiUrl}/tarefas/`, { params })
      .pipe(
        finalize(() => {
          this.loadingTarefas = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.tarefas = response.results;
          this.totalTarefas = response.count;
          this.originalStatusMap.clear();
          for (const t of this.tarefas) {
            this.originalStatusMap.set(t.id, t.status);
          }
          this.ordenarTarefas();
        },
        error: (err) => {
          console.error('Erro ao carregar tarefas', err);
          this.snackBar.open('Erro ao carregar tarefas', 'Fechar', {
            duration: 3000,
          });
        },
      });
  }

  carregarDashboard(): void {
    this.loadingDashboard = true;
    this.http
      .get<DashboardResponse>(`${this.apiUrl}/dashboard/`)
      .pipe(
        finalize(() => {
          this.loadingDashboard = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (data) => {
          this.dashboard = data;
          this.updateChartFromDashboard();
        },
        error: (err) => {
          console.error('Erro ao carregar dashboard', err);
        },
      });
  }

  aplicarFiltros(): void {
    this.page = 1;
    this.carregarTarefas();
    this.carregarDashboard();
  }

  limparFiltros(): void {
    this.filtroStatus = null;
    this.filtroPrioridade = null;
    this.page = 1;
    this.aplicarFiltros();
  }

  toggleOrdenacao(): void {
    this.ordenacaoAsc = !this.ordenacaoAsc;
    this.ordenarTarefas();
  }

  private ordenarTarefas(): void {
    this.tarefas = [...this.tarefas].sort((a, b) => {
      const da = new Date(a.criado_em).getTime();
      const db = new Date(b.criado_em).getTime();
      return this.ordenacaoAsc ? da - db : db - da;
    });
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

  private isValidStatusTransition(
    oldStatus: Tarefa['status'],
    newStatus: Tarefa['status'],
  ): boolean {
    if (oldStatus === newStatus) {
      return true;
    }

    switch (oldStatus) {
      case 'PENDENTE':
        return newStatus === 'EM_ANDAMENTO' || newStatus === 'CONCLUIDA';
      case 'EM_ANDAMENTO':
        return newStatus === 'CONCLUIDA';
      case 'CONCLUIDA':
        return newStatus === 'CONCLUIDA';
      default:
        return false;
    }
  }

  salvar(): void {
    if (this.tarefaForm.invalid) {
      this.tarefaForm.markAllAsTouched();
      return;
    }

    const payload = this.tarefaForm.getRawValue();
    this.saving = true;

    if (this.editingId) {
      const originalStatus =
        this.originalStatusMap.get(this.editingId) ?? 'PENDENTE';
      if (
        !this.isValidStatusTransition(
          originalStatus,
          payload.status as Tarefa['status'],
        )
      ) {
        this.snackBar.open(
          'Fluxo de status inválido para esta tarefa.',
          'Fechar',
          { duration: 3000 },
        );
        return;
      }

      this.http
        .put<Tarefa>(`${this.apiUrl}/tarefas/${this.editingId}/`, payload)
        .pipe(
          finalize(() => {
            this.saving = false;
            this.cdr.detectChanges();
          }),
        )
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
        .pipe(
          finalize(() => {
            this.saving = false;
            this.cdr.detectChanges();
          }),
        )
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

  get pendingCount(): number {
    return this.dashboard?.por_status?.['PENDENTE'] ?? 0;
  }

  get inProgressCount(): number {
    return this.dashboard?.por_status?.['EM_ANDAMENTO'] ?? 0;
  }

  get completedCount(): number {
    return this.dashboard?.por_status?.['CONCLUIDA'] ?? 0;
  }

  setStatusFilter(status: string | null): void {
    this.filtroStatus = status;
    this.aplicarFiltros();
  }

  setPriorityFilter(prioridade: string | null): void {
    this.filtroPrioridade = prioridade;
    this.aplicarFiltros();
  }

  setPrioridade(prioridade: 'BAIXA' | 'MEDIA' | 'ALTA'): void {
    this.tarefaForm.get('prioridade')?.setValue(prioridade);
  }

  onPageSizeChange(raw: string | number): void {
    const size = Number(raw) || 10;
    this.pageSize = size;
    this.page = 1;
    this.carregarTarefas();
  }

  nextPage(): void {
    if (this.page * this.pageSize >= this.totalTarefas) {
      return;
    }
    this.page += 1;
    this.carregarTarefas();
  }

  prevPage(): void {
    if (this.page <= 1) {
      return;
    }
    this.page -= 1;
    this.carregarTarefas();
  }

  get totalPages(): number {
    return this.totalTarefas
      ? Math.max(1, Math.ceil(this.totalTarefas / this.pageSize))
      : 1;
  }

  verDetalhes(tarefa: Tarefa): void {
    this.router.navigate(['/tarefas', tarefa.id]);
  }

  novaTarefa(): void {
    if (this.editingId) {
      this.cancelarEdicao();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  statusClass(tarefa: Tarefa): string {
    switch (tarefa.status) {
      case 'PENDENTE':
        return 'task-border-pending';
      case 'EM_ANDAMENTO':
        return 'task-border-progress';
      case 'CONCLUIDA':
        return 'task-border-completed';
      default:
        return 'task-border-default';
    }
  }

  // Chart.js (ng2-charts) configs para gráfico de status
  public statusChartType: ChartType = 'doughnut';

  public statusChartData: ChartConfiguration['data'] = {
    labels: ['Pendente', 'Em progresso', 'Concluída'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#FACC15', '#3B82F6', '#22C55E'],
        borderWidth: 0,
      },
    ],
  };

  public statusChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#333333',
          font: {
            size: 13,
          },
        },
      },
    },
  };

  private updateChartFromDashboard(): void {
    const pend = this.pendingCount;
    const prog = this.inProgressCount;
    const conc = this.completedCount;

    this.statusChartData = {
      ...this.statusChartData,
      datasets: [
        {
          ...this.statusChartData.datasets[0],
          data: [pend, prog, conc],
        },
      ],
    };
  }
}

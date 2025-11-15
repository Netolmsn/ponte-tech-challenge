import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

import { PainelService } from '../painel.service';
import { PainelRecurso, PainelTurma } from '../painel.models';
import { ErrorDialogComponent } from '../../shared/components/error-dialog/error-dialog';

@Component({
  selector: 'app-recursos-turma',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './recursos-turma.component.html',
  styleUrl: './recursos-turma.component.scss'
})
export class RecursosTurmaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private painelService = inject(PainelService);
  private dialog = inject(MatDialog);

  recursos$: Observable<PainelRecurso[]> | null = null;
  turma$: Observable<PainelTurma> | null = null;

  ngOnInit(): void {
    const turmaId$ = this.route.params.pipe(map(params => params['id']));

    this.turma$ = turmaId$.pipe(
      switchMap(id => this.painelService.getTurmaById(id)),
      catchError(error => {
        console.error('Erro ao carregar dados da turma:', error);
        return of(null as unknown as PainelTurma);
      })
    );

    this.recursos$ = turmaId$.pipe(
      switchMap(id => this.painelService.getRecursosPorTurma(id)),
      catchError(error => {
        console.error('Erro ao carregar recursos:', error);
        this.openErrorDialog('Não foi possível carregar os recursos desta turma.');
        return of([]);
      })
    );
  }

  getVideoUrl(recurso: PainelRecurso): string {

    return recurso.link;
  }

  downloadRecurso(recurso: PainelRecurso): void {
    window.open(recurso.link, '_blank');
  }

  openErrorDialog(errorMessage: string): void {
    this.dialog.open(ErrorDialogComponent, {
      data: {
        title: 'Ocorreu um Erro',
        content: errorMessage,
      },
    });
  }
}
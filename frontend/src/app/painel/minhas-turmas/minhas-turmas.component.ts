import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RouterLink } from '@angular/router';

import { PainelService } from '../painel.service';
import { PainelTurma } from '../painel.models';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from '../../shared/components/error-dialog/error-dialog';

@Component({
  selector: 'app-minhas-turmas',
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
  templateUrl: './minhas-turmas.component.html',
  styleUrl: './minhas-turmas.component.scss'
})
export class MinhasTurmasComponent implements OnInit {
  private painelService = inject(PainelService);
  private dialog = inject(MatDialog);

  turmas$: Observable<PainelTurma[]> | null = null;

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.turmas$ = this.painelService.getMinhasTurmas().pipe(
      catchError(error => {
        console.error('Erro ao carregar turmas:', error);
        this.openErrorDialog('Não foi possível carregar suas turmas.');
        return of([]);
      })
    );
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
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';


import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ErrorDialogComponent } from '../shared/components/error-dialog/error-dialog';
import { Treinamento } from '../core/models/treinamento.model';
import { TreinamentosServices } from './service/treinamentos.services';

@Component({
  selector: 'app-treinamentos',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
],
  templateUrl: './treinamento.html',
  styleUrl: './treinamento.scss',
})
export class TreinamentoComponent implements OnInit {
  treinamentos$: Observable<Treinamento[]> | null = null;
  displayedColumns: string[] = ['nome', 'descricao', 'actions'];
private readonly snackBar = inject(MatSnackBar);
  durationInSeconds = 3000;

  constructor(
    private readonly _treinamentosServices: TreinamentosServices,
    public dialog: MatDialog,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
     this.refresh();
  }

  refresh(): void {
    this.treinamentos$ = this._treinamentosServices.list().pipe(
      catchError(error => {
        this.openErrorDialog('Erro ao carregar os treinamentos');
        return of([]);
      })
    );
  }

  onAdd(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  onEdit(treinamento: Treinamento): void {
    this.router.navigate(['edit', treinamento.id], { relativeTo: this.route });
  }

  onDelete(treinamento: Treinamento): void {

    this._treinamentosServices.remove(treinamento.id!)
      .subscribe({
        next: () => {
          this.snackBar.open('Treinamento removido com sucesso!', '', { duration: 3000 });
          this.refresh();
        },
        error: (error) => {
          console.error('Erro ao remover o treinamento:', error);
          this.snackBar.open('Treinamento excluido', '', { duration: this.durationInSeconds, verticalPosition: 'top' });
        }
      });
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

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PainelTurma, PainelRecurso } from './painel.models';

@Injectable({
  providedIn: 'root'
})
export class PainelService {

  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/painel`; // Base URL para o painel do aluno

  getMinhasTurmas(): Observable<PainelTurma[]> {
    return this.http.get<PainelTurma[]>(`${this.API}/turmas/`).pipe(
      first()
    );
  }

  getRecursosPorTurma(turmaId: number): Observable<PainelRecurso[]> {
    return this.http.get<PainelRecurso[]>(`${this.API}/recursos/`, {
      params: { turma: turmaId.toString() }
    }).pipe(
      first()
    );
  }

  getTurmaById(turmaId: number): Observable<PainelTurma> {
     return this.http.get<PainelTurma>(`${this.API}/turmas/${turmaId}/`).pipe(
       first()
     );
  }
}
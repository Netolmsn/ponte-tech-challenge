import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { TreinamentosServices } from '../service/treinamentos.services';
import { Treinamento } from '../../core/models/treinamento.model';
import { Observable, of } from 'rxjs';

export const TreinamentoResolver: ResolveFn<Treinamento> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<Treinamento> => {

  const treinamento = inject(TreinamentosServices);
  const id = route.params['id'];


  if (id) {
    return treinamento.findById(id);
  }

  return of({ id: 0, nome: '', descricao: '' });
};

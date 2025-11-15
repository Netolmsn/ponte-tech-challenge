import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { first, Observable, tap } from 'rxjs';
import { Treinamento } from '../../core/models/treinamento.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TreinamentosServices {

  private readonly API = `${environment.apiUrl}/treinamentos`;

  constructor(private readonly _httpClient: HttpClient){ }

  list() {
    return this._httpClient.get<Treinamento[]>(this.API)
    .pipe(
      first(),
      tap(treinamentos => console.log(treinamentos))
    );
  }

  save(record: Partial<Treinamento>){
    if(record.id){
      return this.update(record);
    }
    return this.create(record);

  }

  findById(id: number): Observable<Treinamento> {
    return this._httpClient.get<Treinamento>(`${this.API}/${id}`).pipe(first());
  }

  private create(record: Partial<Treinamento>){
    return this._httpClient.post<Treinamento>(this.API, record)
   .pipe(
    first()
  )}

  private update(record: Partial<Treinamento>){
    return this._httpClient.put<Treinamento>(`${this.API}/${record.id}`, record)
   .pipe(first());
  }

  remove(id: number){
    return this._httpClient.delete(`${this.API}/${id}`)
   .pipe(first());
  }

}

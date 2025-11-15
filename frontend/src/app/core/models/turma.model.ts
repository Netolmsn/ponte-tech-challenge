import { Recurso } from './recurso.model';
import { Treinamento } from './treinamento.model';

export interface Turma {
  id: number;
  treinamento?: Treinamento;
  treinamento_id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  recursos?: Recurso[];
}
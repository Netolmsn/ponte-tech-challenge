import { Turma } from './turma.model';

export interface Recurso {
  id: number;
  turma?: Turma;
  turma_id: number;
  tipo: string;
  nome: string;
  descricao: string;
  acesso_previo: boolean;
  draft: boolean;
}
import { Aluno } from './aluno.model';
import { Turma } from './turma.model';

export interface Matricula {
  id: number;
  aluno?: Aluno;
  aluno_id: number;
  turma?: Turma;
  turma_id: number;
}
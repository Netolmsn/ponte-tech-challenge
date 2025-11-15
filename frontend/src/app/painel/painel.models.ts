import { Treinamento } from '../core/models/treinamento.model';
import { Recurso } from '../core/models/recurso.model';
import { Turma } from '../core/models/turma.model';

export type PainelTurma = Turma;

export interface PainelRecurso extends Recurso {
  link: string;
}
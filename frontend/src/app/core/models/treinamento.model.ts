import { Turma } from "./turma.model";

export interface Treinamento {
  id: number;
  nome: string;
  descricao: string;
  turmas?: Turma[];
}
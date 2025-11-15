from django.db import models
from usuarios.models import Aluno

# Create your models here.
class Treinamento(models.Model):
    nome = models.CharField(max_length=100)
    descricao = models.TextField()
    def __str__(self):
        return self.nome

class Turma(models.Model):
    treinamento = models.ForeignKey(Treinamento, on_delete=models.CASCADE)
    data_inicio = models.DateField()
    data_fim = models.DateField()
    nome = models.CharField(max_length=100)
    def __str__(self):
        return self.nome

class Recurso(models.Model):
    turma = models.ForeignKey(Turma, on_delete=models.CASCADE)
    tipo = models.CharField(max_length=100)
    acesso_previo = models.BooleanField()
    nome = models.CharField(max_length=100)
    descricao = models.TextField()
    draft = models.BooleanField()

class Matricula(models.Model):
    turma = models.ForeignKey(Turma, on_delete=models.CASCADE)
    aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE)
    
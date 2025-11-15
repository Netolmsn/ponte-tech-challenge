from django.shortcuts import render
from rest_framework import viewsets
from .models import Treinamento, Turma, Recurso, Matricula
from .serializers import (
    TreinamentoSerializer, TurmaSerializer, 
    RecursoSerializer, MatriculaSerializer
)
from rest_framework.permissions import IsAdminUser
from rest_framework.viewsets import ReadOnlyModelViewSet
from django.utils import timezone
from django.db.models import Q
from usuarios.permissions import IsAluno
from .serializers import PainelTurmaSerializer, RecursoSerializer 
from usuarios.models import Aluno

# Create your views here.
class TreinamentoViewSet(viewsets.ModelViewSet):
    queryset = Treinamento.objects.all()
    serializer_class = TreinamentoSerializer
    permission_classes = [IsAdminUser]
class TurmaViewSet(viewsets.ModelViewSet):
    queryset = Turma.objects.all()
    serializer_class = TurmaSerializer
    permission_classes = [IsAdminUser]
class RecursoViewSet(viewsets.ModelViewSet):
    queryset = Recurso.objects.all()
    serializer_class = RecursoSerializer
    permission_classes = [IsAdminUser]
class MatriculaViewSet(viewsets.ModelViewSet):
    queryset = Matricula.objects.all()
    serializer_class = MatriculaSerializer
    permission_classes = [IsAdminUser]
class MinhasTurmasViewSet(ReadOnlyModelViewSet):
    serializer_class = PainelTurmaSerializer
    permission_classes = [IsAluno]

    def get_queryset(self):
        aluno = Aluno.objects.get(user=self.request.user)
        
        turmas_ids = Matricula.objects.filter(aluno=aluno).values_list('turma_id', flat=True)
        return Turma.objects.filter(id__in=turmas_ids)


class MeusRecursosViewSet(ReadOnlyModelViewSet):
    serializer_class = RecursoSerializer
    permission_classes = [IsAluno]
    filterset_fields = ['turma'] 

    def get_queryset(self):
        hoje = timezone.now().date()
        aluno = Aluno.objects.get(user=self.request.user)
        
        turmas_ids = Matricula.objects.filter(aluno=aluno).values_list('turma_id', flat=True)

        base_query = Q(turma_id__in=turmas_ids) & Q(draft=False)
        antes_inicio = Q(turma__data_inicio__gt=hoje) & Q(acesso_previo=True)
        apos_inicio = Q(turma__data_inicio__lte=hoje)

        return Recurso.objects.filter(base_query & (antes_inicio | apos_inicio))
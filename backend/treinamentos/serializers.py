from rest_framework import serializers
from .models import Treinamento, Turma, Recurso, Matricula
from usuarios.models import Aluno
from usuarios.serializers import AlunoSerializer

class TreinamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Treinamento
        fields = ['id', 'nome', 'descricao']

class TurmaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Turma
        fields = [
            'id', 
            'treinamento', 
            'data_inicio', 
            'data_fim', 
            'nome'
        ]

class RecursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recurso
        fields = [
            'id', 
            'turma', 
            'tipo', 
            'acesso_previo', 
            'nome', 
            'descricao', 
            'draft'
        ]

class MatriculaSerializer(serializers.ModelSerializer):
    aluno = AlunoSerializer(read_only=True)
    
    aluno_id = serializers.PrimaryKeyRelatedField(
        queryset=Aluno.objects.all(), source='aluno', write_only=True
    )

    class Meta:
        model = Matricula
        fields = ['id', 'turma', 'aluno', 'aluno_id']

class PainelTreinamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Treinamento
        fields = ['id', 'nome', 'descricao']

class PainelTurmaSerializer(serializers.ModelSerializer):
    treinamento = PainelTreinamentoSerializer(read_only=True)
    
    class Meta:
        model = Turma
        fields = [
            'id', 
            'nome', 
            'data_inicio', 
            'data_fim',
            'link_acesso',
            'treinamento',
        ]
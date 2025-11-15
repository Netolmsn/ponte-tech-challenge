from django.contrib import admin
from treinamentos.models import Matricula, Recurso, Turma, Treinamento
from usuarios.models import Aluno

# Register your models here.
@admin.register(Treinamento)
class TreinamentoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'descricao')

@admin.register(Turma)
class TurmaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'data_inicio', 'data_fim')

@admin.register(Recurso)
class RecursoAdmin(admin.ModelAdmin):
    list_display = ('tipo', 'acesso_previo', 'nome', 'descricao', 'draft')

@admin.register(Matricula)
class MatriculaAdmin(admin.ModelAdmin):
    list_display = ('turma', 'aluno')
    

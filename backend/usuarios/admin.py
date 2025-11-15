from django.contrib import admin
from usuarios.models import Aluno

# Register your models here.

@admin.register(Aluno)
class AlunoAdmin(admin.ModelAdmin):
    list_display = ('user', 'telefone')
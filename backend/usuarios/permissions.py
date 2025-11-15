from rest_framework import permissions
from .models import Aluno

class IsAluno(permissions.BasePermission):
    message = "Acesso permitido apenas para alunos."

    def has_permission(self, request, view):
        return request.user and \
               request.user.is_authenticated and \
               Aluno.objects.filter(user=request.user).exists()
from django.contrib.auth.models import User
from django.db import models


class UsuarioPerfil(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="perfil",
    )
    nome = models.CharField(max_length=150)

    class Meta:
        db_table = "usuario"

    def __str__(self):
        return self.nome or self.user.get_username()


class Tarefa(models.Model):
    class Status(models.TextChoices):
        PENDENTE = "PENDENTE", "Pendente"
        EM_ANDAMENTO = "EM_ANDAMENTO", "Em andamento"
        CONCLUIDA = "CONCLUIDA", "Concluída"
        CANCELADA = "CANCELADA", "Cancelada"

    class Prioridade(models.TextChoices):
        BAIXA = "BAIXA", "Baixa"
        MEDIA = "MEDIA", "Média"
        ALTA = "ALTA", "Alta"

    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="tarefas",
    )
    titulo = models.CharField(max_length=255)
    descricao = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDENTE,
    )
    prioridade = models.CharField(
        max_length=10,
        choices=Prioridade.choices,
        default=Prioridade.MEDIA,
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tarefa"
        ordering = ["-criado_em"]

    def __str__(self):
        return f"{self.titulo} ({self.get_status_display()})"


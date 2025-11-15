from django.contrib import admin

from .models import Tarefa, UsuarioPerfil


@admin.register(UsuarioPerfil)
class UsuarioPerfilAdmin(admin.ModelAdmin):
    list_display = ("id", "nome", "user", "user_email")
    search_fields = ("nome", "user__username", "user__email")
    list_select_related = ("user",)

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = "E-mail"


@admin.register(Tarefa)
class TarefaAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "titulo",
        "usuario",
        "status",
        "prioridade",
        "criado_em",
        "atualizado_em",
    )
    list_filter = ("status", "prioridade", "criado_em")
    search_fields = ("titulo", "descricao", "usuario__username", "usuario__email")
    autocomplete_fields = ("usuario",)
    readonly_fields = ("criado_em", "atualizado_em")
    date_hierarchy = "criado_em"
    ordering = ("-criado_em",)


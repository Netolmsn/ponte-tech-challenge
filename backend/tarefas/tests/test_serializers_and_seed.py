from django.contrib.auth.models import User
from django.core import management
from django.test import TestCase

from tarefas.models import Tarefa, UsuarioPerfil
from tarefas.serializers import TarefaSerializer, UsuarioRegisterSerializer


class UsuarioRegisterSerializerTests(TestCase):
    def test_nome_curto_e_invalido(self) -> None:
        data = {"nome": "Jo", "email": "a@test.com", "password": "Teste@123"}
        serializer = UsuarioRegisterSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("nome", serializer.errors)

    def test_email_duplicado_rejeitado(self) -> None:
        User.objects.create_user(
            username="user@test.com",
            email="user@test.com",
            password="Teste@123",
        )

        data = {
            "nome": "Usuário",
            "email": "user@test.com",
            "password": "Teste@123",
        }
        serializer = UsuarioRegisterSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_senha_sem_letra_ou_numero_rejeitada(self) -> None:
        data = {
            "nome": "Usuário",
            "email": "novo@test.com",
            "password": "12345678",
        }
        serializer = UsuarioRegisterSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)


class TarefaSerializerTests(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="owner@test.com",
            email="owner@test.com",
            password="Teste@123",
        )
        UsuarioPerfil.objects.create(user=self.user, nome="Dono")

        self.tarefa = Tarefa.objects.create(
            usuario=self.user,
            titulo="Titulo válido",
            descricao="Descrição válida com mais de dez caracteres.",
            status=Tarefa.Status.PENDENTE,
            prioridade=Tarefa.Prioridade.MEDIA,
        )

    def test_titulo_curto_e_invalido(self) -> None:
        serializer = TarefaSerializer(
            instance=self.tarefa,
            data={
                "titulo": "No",
                "descricao": self.tarefa.descricao,
                "status": self.tarefa.status,
                "prioridade": self.tarefa.prioridade,
            },
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("titulo", serializer.errors)

    def test_descricao_curta_e_invalida(self) -> None:
        serializer = TarefaSerializer(
            instance=self.tarefa,
            data={
                "titulo": self.tarefa.titulo,
                "descricao": "Curta",
                "status": self.tarefa.status,
                "prioridade": self.tarefa.prioridade,
            },
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("descricao", serializer.errors)

    def test_transicao_status_invalida(self) -> None:
        self.tarefa.status = Tarefa.Status.CONCLUIDA
        self.tarefa.save(update_fields=["status"])

        serializer = TarefaSerializer(
            instance=self.tarefa,
            data={
                "titulo": self.tarefa.titulo,
                "descricao": self.tarefa.descricao,
                "status": Tarefa.Status.EM_ANDAMENTO,
                "prioridade": self.tarefa.prioridade,
            },
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("status", serializer.errors)


class SeedCommandTests(TestCase):
    def test_seed_data_command_runs_without_errors(self) -> None:
        # Apenas verifica se o comando roda e cria pelo menos um usuário e uma tarefa.
        management.call_command("seed_data", verbosity=0)

        self.assertGreaterEqual(UsuarioPerfil.objects.count(), 1)
        self.assertGreaterEqual(Tarefa.objects.count(), 1)


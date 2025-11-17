from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from tarefas.models import Tarefa, UsuarioPerfil


class AuthTests(APITestCase):
    def setUp(self) -> None:
        self.password = "Teste@123"
        self.user = User.objects.create_user(
            username="user@test.com",
            email="user@test.com",
            password=self.password,
        )
        UsuarioPerfil.objects.create(user=self.user, nome="Usuário Seed")

    def test_register_creates_user_and_perfil(self) -> None:
        url = "/api/auth/register/"
        payload = {
            "nome": "Novo Usuario",
            "email": "novo@test.com",
            "password": "Teste@123",
        }

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="novo@test.com").exists())
        novo = User.objects.get(email="novo@test.com")
        self.assertTrue(hasattr(novo, "perfil"))

    def test_register_rejects_duplicate_email(self) -> None:
        url = "/api/auth/register/"
        payload = {
            "nome": "Duplicado",
            "email": "user@test.com",
            "password": "Teste@123",
        }

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_login_success_returns_tokens(self) -> None:
        url = "/api/auth/login/"
        payload = {
            "email": "user@test.com",
            "password": self.password,
        }

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_invalid_credentials(self) -> None:
        url = "/api/auth/login/"
        payload = {
            "email": "user@test.com",
            "password": "SenhaErrada",
        }

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)


class TarefaTests(APITestCase):
    def setUp(self) -> None:
        self.password = "Teste@123"
        self.user = User.objects.create_user(
            username="owner@test.com",
            email="owner@test.com",
            password=self.password,
        )
        UsuarioPerfil.objects.create(user=self.user, nome="Dono")

        self.other = User.objects.create_user(
            username="other@test.com",
            email="other@test.com",
            password=self.password,
        )
        UsuarioPerfil.objects.create(user=self.other, nome="Outro")

        self.client.force_authenticate(self.user)

        self.tarefa = Tarefa.objects.create(
            usuario=self.user,
            titulo="Tarefa pendente",
            descricao="Descrição inicial da tarefa pendente.",
            status=Tarefa.Status.PENDENTE,
            prioridade=Tarefa.Prioridade.MEDIA,
        )

    def test_usuario_so_enxerga_suas_proprias_tarefas(self) -> None:
        Tarefa.objects.create(
            usuario=self.other,
            titulo="Tarefa de outro usuário",
            descricao="Não deve aparecer na listagem do dono.",
            status=Tarefa.Status.PENDENTE,
            prioridade=Tarefa.Prioridade.ALTA,
        )

        response = self.client.get("/api/tarefas/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['titulo'], 'Tarefa pendente')

    def test_fluxo_status_valido_pendente_para_em_andamento(self) -> None:
        url = f"/api/tarefas/{self.tarefa.id}/"
        payload = {
            "titulo": self.tarefa.titulo,
            "descricao": self.tarefa.descricao,
            "status": Tarefa.Status.EM_ANDAMENTO,
            "prioridade": self.tarefa.prioridade,
        }

        response = self.client.put(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tarefa.refresh_from_db()
        self.assertEqual(self.tarefa.status, Tarefa.Status.EM_ANDAMENTO)

    def test_fluxo_status_invalido_nao_retrocede_concluida(self) -> None:
        self.tarefa.status = Tarefa.Status.CONCLUIDA
        self.tarefa.save(update_fields=["status"])

        url = f"/api/tarefas/{self.tarefa.id}/"
        payload = {
            "titulo": self.tarefa.titulo,
            "descricao": self.tarefa.descricao,
            "status": Tarefa.Status.EM_ANDAMENTO,
            "prioridade": self.tarefa.prioridade,
        }

        response = self.client.put(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)

    def test_dashboard_conta_tarefas_por_status(self) -> None:
        # Pendente já criada no setUp; cria mais duas tarefas com outros status
        Tarefa.objects.create(
            usuario=self.user,
            titulo="Em andamento",
            descricao="Tarefa em andamento.",
            status=Tarefa.Status.EM_ANDAMENTO,
            prioridade=Tarefa.Prioridade.BAIXA,
        )
        Tarefa.objects.create(
            usuario=self.user,
            titulo="Concluída",
            descricao="Tarefa concluída.",
            status=Tarefa.Status.CONCLUIDA,
            prioridade=Tarefa.Prioridade.ALTA,
        )

        response = self.client.get("/api/dashboard/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data["total"], 3)
        self.assertEqual(data["por_status"].get(Tarefa.Status.PENDENTE, 0), 1)
        self.assertEqual(data["por_status"].get(Tarefa.Status.EM_ANDAMENTO, 0), 1)
        self.assertEqual(data["por_status"].get(Tarefa.Status.CONCLUIDA, 0), 1)


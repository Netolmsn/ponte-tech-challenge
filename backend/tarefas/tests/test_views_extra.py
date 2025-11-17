from django.contrib.auth.models import User
from django.core.management import call_command
from rest_framework import status
from rest_framework.test import APITestCase

from tarefas.models import Comentario, Tarefa, UsuarioPerfil


class MeViewTests(APITestCase):
    def setUp(self) -> None:
        self.password = "Teste@123"
        self.user = User.objects.create_user(
            username="me@test.com",
            email="me@test.com",
            password=self.password,
        )
        UsuarioPerfil.objects.create(user=self.user, nome="Meu Usuário")

    def test_me_returns_user_and_perfil(self) -> None:
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("user", response.data)
        self.assertIn("perfil", response.data)
        self.assertEqual(response.data["user"]["email"], "me@test.com")
        self.assertIsNotNone(response.data["perfil"])

    def test_me_requires_authentication(self) -> None:
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AtribuirTarefaTests(APITestCase):
    def setUp(self) -> None:
        call_command("seed_data", verbosity=0)

        self.owner = User.objects.create_user(
            username="owner@test.com",
            email="owner@test.com",
            password="Teste@123",
        )
        UsuarioPerfil.objects.create(user=self.owner, nome="Dono")

        self.target = User.objects.create_user(
            username="destino@test.com",
            email="destino@test.com",
            password="Teste@123",
        )
        UsuarioPerfil.objects.create(user=self.target, nome="Destino")

        self.other = User.objects.create_user(
            username="third@test.com",
            email="third@test.com",
            password="Teste@123",
        )
        UsuarioPerfil.objects.create(user=self.other, nome="Terceiro")

        self.tarefa = Tarefa.objects.create(
            usuario=self.owner,
            titulo="Tarefa atribuível",
            descricao="Descrição da tarefa atribuível.",
            status=Tarefa.Status.PENDENTE,
            prioridade=Tarefa.Prioridade.MEDIA,
        )

    def test_atribuir_tarefa_para_outro_usuario(self) -> None:
        self.client.force_authenticate(self.owner)

        url = f"/api/tarefas/{self.tarefa.id}/atribuir/"
        payload = {"email": self.target.email}

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tarefa.refresh_from_db()
        self.assertEqual(self.tarefa.usuario_id, self.target.id)
        self.assertEqual(response.data["usuario"], self.target.id)

    def test_atribuir_sem_email_retorna_erro(self) -> None:
        self.client.force_authenticate(self.owner)

        url = f"/api/tarefas/{self.tarefa.id}/atribuir/"
        response = self.client.post(url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_atribuir_com_email_inexistente_retorna_erro(self) -> None:
        self.client.force_authenticate(self.owner)

        url = f"/api/tarefas/{self.tarefa.id}/atribuir/"
        payload = {"email": "naoexiste@test.com"}

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_nao_permite_atribuir_tarefa_de_outro_usuario(self) -> None:
        self.client.force_authenticate(self.other)

        url = f"/api/tarefas/{self.tarefa.id}/atribuir/"
        payload = {"email": self.target.email}

        response = self.client.post(url, payload, format="json")

        # get_object() respeita get_queryset, logo retorna 404 para quem não é dono
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ComentarioViewTests(APITestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="comentador@test.com",
            email="comentador@test.com",
            password="Teste@123",
        )
        UsuarioPerfil.objects.create(user=self.user, nome="Comentador")

        self.other = User.objects.create_user(
            username="outro@test.com",
            email="outro@test.com",
            password="Teste@123",
        )
        UsuarioPerfil.objects.create(user=self.other, nome="Outro Usuário")

        self.tarefa_user = Tarefa.objects.create(
            usuario=self.user,
            titulo="Tarefa do usuário",
            descricao="Descrição da tarefa do usuário.",
            status=Tarefa.Status.PENDENTE,
            prioridade=Tarefa.Prioridade.BAIXA,
        )
        self.tarefa_other = Tarefa.objects.create(
            usuario=self.other,
            titulo="Tarefa de outro usuário",
            descricao="Descrição que não deve aparecer.",
            status=Tarefa.Status.PENDENTE,
            prioridade=Tarefa.Prioridade.ALTA,
        )

        # Comentários para a tarefa do usuário autenticado
        self.comentario1 = Comentario.objects.create(
            tarefa=self.tarefa_user,
            usuario=self.user,
            texto="Primeiro comentário",
        )
        self.comentario2 = Comentario.objects.create(
            tarefa=self.tarefa_user,
            usuario=self.user,
            texto="Segundo comentário",
        )

        # Comentário em tarefa de outro usuário
        Comentario.objects.create(
            tarefa=self.tarefa_other,
            usuario=self.other,
            texto="Comentário em tarefa alheia",
        )

        self.client.force_authenticate(self.user)

    def test_lista_comentarios_somente_da_tarefa_do_usuario(self) -> None:
        url = f"/api/tarefas/{self.tarefa_user.id}/comentarios/"

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # deve retornar apenas os comentários ligados à tarefa do usuário logado
        self.assertEqual(len(response.data), 2)
        ids = {c["id"] for c in response.data}
        self.assertIn(self.comentario1.id, ids)
        self.assertIn(self.comentario2.id, ids)

    def test_lista_comentarios_para_tarefa_de_outro_usuario_vazia(self) -> None:
        url = f"/api/tarefas/{self.tarefa_other.id}/comentarios/"

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # filtro em get_queryset garante que tarefa__usuario seja o usuário logado
        self.assertEqual(len(response.data), 0)

    def test_cria_comentario_para_tarefa_do_usuario(self) -> None:
        url = f"/api/tarefas/{self.tarefa_user.id}/comentarios/"
        payload = {"texto": "Novo comentário"}

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comentario.objects.filter(tarefa=self.tarefa_user).count(), 3)
        novo = Comentario.objects.filter(tarefa=self.tarefa_user).first()
        self.assertEqual(novo.usuario_id, self.user.id)

    def test_nao_cria_comentario_em_tarefa_de_outro_usuario(self) -> None:
        url = f"/api/tarefas/{self.tarefa_other.id}/comentarios/"
        payload = {"texto": "Tentativa de comentar tarefa alheia"}

        response = self.client.post(url, payload, format="json")

        # perform_create usa get_object_or_404 com usuario=self.request.user
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_texto_vazio_e_rejeitado(self) -> None:
        url = f"/api/tarefas/{self.tarefa_user.id}/comentarios/"
        payload = {"texto": "   "}

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("texto", response.data)


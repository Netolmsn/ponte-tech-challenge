from itertools import product
from random import choice

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from tarefas.models import Tarefa, UsuarioPerfil


class Command(BaseCommand):
    help = "Popula o banco com usuarios e tarefas de exemplo."

    def handle(self, *args, **options):
        self.stdout.write("Iniciando seed de dados...")

        usuarios = self._criar_usuarios(min_qtd=20)
        # Garante que o primeiro usuario da lista seja o admin criado
        admin = usuarios[0]

        # 1) Cria 80 tarefas para o admin cobrindo todas combinacoes de status/prioridade
        self._criar_tarefas_admin(admin, total_desejado=80)

        # 2) Cria tarefas adicionais distribuidas entre outros usuarios (volume minimo)
        self._criar_tarefas_outros(usuarios, min_qtd=20)

        self.stdout.write(self.style.SUCCESS("Seed de dados concluido."))

    def _criar_admin(self) -> User:
        """
        Garante a existencia de um usuario administrador para acesso ao Django admin.
        Login (username) sem caracteres especiais ou espacos.

        Credenciais:
          - username: admin
          - senha: Admin@123
        """
        admin_username = "admin"
        admin_email = "admin@teste.com"

        admin, created = User.objects.get_or_create(
            username=admin_username,
            defaults={
                "email": admin_email,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            admin.set_password("Admin@123")
            admin.first_name = "Admin"
            admin.last_name = "PonteTech"
            admin.save()

        UsuarioPerfil.objects.get_or_create(
            user=admin,
            defaults={"nome": "Admin PonteTech"},
        )

        return admin

    def _criar_usuarios(self, min_qtd: int) -> list[User]:
        usuarios: list[User] = []

        # Garante admin como primeiro usuario
        admin = self._criar_admin()
        usuarios.append(admin)

        existentes = UsuarioPerfil.objects.exclude(user=admin).count()
        faltantes = max(0, min_qtd - existentes)

        # Adiciona demais perfis ja existentes (alem do admin)
        for perfil in (
            UsuarioPerfil.objects.select_related("user").exclude(user=admin)
        ):
            usuarios.append(perfil.user)

        if faltantes == 0:
            self.stdout.write(
                self.style.NOTICE(
                    f"Ja existem {existentes + 1} perfis de usuario (incluindo admin). Nenhum novo usuario criado."
                )
            )
            return usuarios

        self.stdout.write(
            f"Criando {faltantes} usuarios/perfis adicionais para atingir {min_qtd} registros (alem do admin)..."
        )

        inicio = existentes + 1
        fim = existentes + faltantes + 1

        for i in range(inicio, fim):
            username = f"user{i}"  # login simples, sem espacos ou caracteres especiais
            email = f"{username}@teste.com"

            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": email,
                },
            )

            if created:
                user.set_password("Teste@123")
                user.first_name = f"User{i}"
                user.last_name = "Seed"
                user.save()

            UsuarioPerfil.objects.get_or_create(
                user=user,
                defaults={"nome": f"Usuario {i}"},
            )

            usuarios.append(user)

        return usuarios

    def _criar_tarefas_admin(self, admin: User, total_desejado: int) -> None:
        """
        Cria tarefas especificas para o usuario admin, garantindo um volume
        configuravel e cobrindo todas as combinacoes de status/prioridade.
        """
        existentes = Tarefa.objects.filter(usuario=admin).count()
        faltantes = max(0, total_desejado - existentes)

        if faltantes == 0:
            self.stdout.write(
                self.style.NOTICE(
                    f"Admin ja possui {existentes} tarefas. Nenhuma tarefa extra criada para admin."
                )
            )
            return

        self.stdout.write(
            f"Criando {faltantes} tarefas para o admin (alvo total = {total_desejado})..."
        )

        status_choices = [
            Tarefa.Status.PENDENTE,
            Tarefa.Status.EM_ANDAMENTO,
            Tarefa.Status.CONCLUIDA,
            Tarefa.Status.CANCELADA,
        ]
        prioridade_choices = [
            Tarefa.Prioridade.BAIXA,
            Tarefa.Prioridade.MEDIA,
            Tarefa.Prioridade.ALTA,
        ]

        combinacoes = list(product(status_choices, prioridade_choices))
        inicio = existentes + 1

        for i in range(faltantes):
            status, prioridade = combinacoes[i % len(combinacoes)]
            indice = inicio + i

            titulo = f"Tarefa admin {indice}"
            descricao = (
                f"Tarefa de exemplo {indice} para o usuario admin, "
                f"com status {status} e prioridade {prioridade}."
            )

            Tarefa.objects.create(
                usuario=admin,
                titulo=titulo[:100],
                descricao=descricao[:500],
                status=status,
                prioridade=prioridade,
            )

    def _criar_tarefas_outros(self, usuarios: list[User], min_qtd: int) -> None:
        """
        Cria tarefas adicionais distribuidas entre os demais usuarios (exceto admin)
        para garantir um volume minimo global.
        """
        if not usuarios:
            self.stdout.write(
                self.style.WARNING(
                    "Nenhum usuario disponivel para associar tarefas; seed de tarefas ignorado."
                )
            )
            return

        # Ignora o primeiro usuario, que sabemos ser o admin
        outros_usuarios = [u for u in usuarios if u != usuarios[0]]
        if not outros_usuarios:
            self.stdout.write(
                self.style.NOTICE(
                    "Nao ha outros usuarios alem do admin; nenhuma tarefa adicional criada."
                )
            )
            return

        existentes = Tarefa.objects.count()
        faltantes = max(0, min_qtd - existentes)

        if faltantes == 0:
            self.stdout.write(
                self.style.NOTICE(
                    f"Ja existem {existentes} tarefas no sistema. Nenhuma tarefa extra criada para outros usuarios."
                )
            )
            return

        self.stdout.write(
            f"Criando {faltantes} tarefas adicionais distribuidas entre outros usuarios..."
        )

        status_choices = [
            Tarefa.Status.PENDENTE,
            Tarefa.Status.EM_ANDAMENTO,
            Tarefa.Status.CONCLUIDA,
        ]
        prioridade_choices = [
            Tarefa.Prioridade.BAIXA,
            Tarefa.Prioridade.MEDIA,
            Tarefa.Prioridade.ALTA,
        ]

        inicio = existentes + 1
        fim = existentes + faltantes + 1

        for i in range(inicio, fim):
            usuario = choice(outros_usuarios)
            status = choice(status_choices)
            prioridade = choice(prioridade_choices)

            titulo = f"Tarefa de exemplo {i}"
            descricao = (
                f"Descricao de exemplo para a tarefa {i}, atribuida ao usuario {usuario.username}."
            )

            Tarefa.objects.create(
                usuario=usuario,
                titulo=titulo[:100],
                descricao=descricao[:500],
                status=status,
                prioridade=prioridade,
            )

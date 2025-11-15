from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Tarefa, UsuarioPerfil


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]


class UsuarioPerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsuarioPerfil
        fields = ["id", "nome"]


class UsuarioRegisterSerializer(serializers.Serializer):
    nome = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_nome(self, value: str) -> str:
        if len(value.strip()) < 3:
            raise serializers.ValidationError(
                "Nome deve ter pelo menos 3 caracteres."
            )
        return value

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("E-mail já cadastrado.")
        return value

    def validate_password(self, value: str) -> str:
        # regras básicas: mínimo 8 caracteres (campo já força) e pelo menos 1 letra e 1 número
        if not any(c.isalpha() for c in value) or not any(c.isdigit() for c in value):
            raise serializers.ValidationError(
                "A senha deve conter ao menos 1 letra e 1 número."
            )
        validate_password(value)
        return value

    def create(self, validated_data):
        nome = validated_data["nome"]
        email = validated_data["email"]
        password = validated_data["password"]

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
        )
        UsuarioPerfil.objects.create(user=user, nome=nome)
        return user


class TarefaSerializer(serializers.ModelSerializer):
    usuario = serializers.ReadOnlyField(source="usuario.id")

    class Meta:
        model = Tarefa
        fields = [
            "id",
            "usuario",
            "titulo",
            "descricao",
            "status",
            "prioridade",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = ["id", "usuario", "criado_em", "atualizado_em"]

    def validate(self, attrs):
        instance = self.instance

        # validações de campos de texto conforme escopo
        titulo = attrs.get("titulo")
        descricao = attrs.get("descricao")

        # em criação, DRF já vai exigir esses campos; aqui garantimos tamanho
        if titulo is not None:
            titulo_limpo = titulo.strip()
            if not (3 <= len(titulo_limpo) <= 100):
                raise serializers.ValidationError(
                    {"titulo": "Título deve ter entre 3 e 100 caracteres."}
                )

        if descricao is not None:
            descricao_limpa = descricao.strip()
            if not (10 <= len(descricao_limpa) <= 500):
                raise serializers.ValidationError(
                    {"descricao": "Descrição deve ter entre 10 e 500 caracteres."}
                )

        # validação de fluxo de status
        new_status = attrs.get("status")

        if instance and new_status and new_status != instance.status:
            old_status = instance.status
            allowed_transitions = {
                Tarefa.Status.PENDENTE: {
                    Tarefa.Status.PENDENTE,
                    Tarefa.Status.EM_ANDAMENTO,
                    Tarefa.Status.CONCLUIDA,
                },
                Tarefa.Status.EM_ANDAMENTO: {
                    Tarefa.Status.EM_ANDAMENTO,
                    Tarefa.Status.CONCLUIDA,
                },
                Tarefa.Status.CONCLUIDA: {
                    Tarefa.Status.CONCLUIDA,
                },
                # CANCELADA não faz parte do fluxo obrigatório, mas se usada é final
                Tarefa.Status.CANCELADA: {
                    Tarefa.Status.CANCELADA,
                },
            }

            if new_status not in allowed_transitions.get(old_status, {old_status}):
                raise serializers.ValidationError(
                    {"status": "Transição de status inválida."}
                )

        return attrs


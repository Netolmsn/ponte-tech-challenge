from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Tarefa, UsuarioPerfil


class UsuarioPerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsuarioPerfil
        fields = ["id", "nome"]


class UsuarioRegisterSerializer(serializers.Serializer):
    nome = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("E-mail já cadastrado.")
        return value

    def validate_password(self, value):
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
        new_status = attrs.get("status")

        if instance and new_status and new_status != instance.status:
            old_status = instance.status
            allowed_transitions = {
                Tarefa.Status.PENDENTE: {
                    Tarefa.Status.PENDENTE,
                    Tarefa.Status.EM_ANDAMENTO,
                    Tarefa.Status.CANCELADA,
                },
                Tarefa.Status.EM_ANDAMENTO: {
                    Tarefa.Status.EM_ANDAMENTO,
                    Tarefa.Status.CONCLUIDA,
                    Tarefa.Status.CANCELADA,
                },
                Tarefa.Status.CONCLUIDA: {
                    Tarefa.Status.CONCLUIDA,
                },
                Tarefa.Status.CANCELADA: {
                    Tarefa.Status.CANCELADA,
                },
            }

            if new_status not in allowed_transitions.get(old_status, {old_status}):
                raise serializers.ValidationError(
                    {"status": "Transição de status inválida."}
                )

        return attrs


from django.contrib.auth.models import User
from django.db.models import Count, Q
from rest_framework import serializers, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Tarefa
from .serializers import (
    TarefaSerializer,
    UserSerializer,
    UsuarioPerfilSerializer,
    UsuarioRegisterSerializer,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UsuarioRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "id": user.id,
                "nome": user.perfil.nome if hasattr(user, "perfil") else "",
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "Credenciais inválidas."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(password):
            return Response(
                {"detail": "Credenciais inválidas."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_active:
            return Response(
                {"detail": "Usuário inativo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refresh = RefreshToken.for_user(user)
        # Garantir que o token contenha id e e-mail conforme escopo
        refresh["id"] = user.id
        refresh["email"] = user.email

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        perfil = getattr(user, "perfil", None)
        return Response(
            {
                "user": UserSerializer(user).data,
                "perfil": (
                    UsuarioPerfilSerializer(perfil).data if perfil else None
                ),
            }
        )


class TarefaViewSet(viewsets.ModelViewSet):
    serializer_class = TarefaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Tarefa.objects.filter(usuario=self.request.user)

        status_param = self.request.query_params.get("status")
        prioridade_param = self.request.query_params.get("prioridade")
        ordering = self.request.query_params.get("ordering")
        search = self.request.query_params.get("search")

        if status_param:
            queryset = queryset.filter(status=status_param)

        if prioridade_param:
            queryset = queryset.filter(prioridade=prioridade_param)

        if search:
            queryset = queryset.filter(
                Q(titulo__icontains=search) | Q(descricao__icontains=search)
            )

        if ordering in ("criado_em", "-criado_em"):
            queryset = queryset.order_by(ordering)

        return queryset

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Tarefa.objects.filter(usuario=request.user)

        total = queryset.count()
        por_status = (
            queryset.values("status")
            .annotate(total=Count("id"))
            .order_by("status")
        )

        return Response(
            {
                "total": total,
                "por_status": {item["status"]: item["total"] for item in por_status},
            }
        )

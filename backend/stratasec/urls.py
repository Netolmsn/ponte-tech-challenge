from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from usuarios.views import AlunoViewSet
from usuarios.views_me import MeView
from treinamentos.views import (
    TreinamentoViewSet,
    TurmaViewSet,
    RecursoViewSet,
    MatriculaViewSet,
    MinhasTurmasViewSet,
    MeusRecursosViewSet,
)
from tarefas.views import DashboardView, LoginView, RegisterView, TarefaViewSet

router = DefaultRouter()

# Rotas de Admin
router.register(r'usuarios', AlunoViewSet, basename='usuario')
router.register(r'treinamentos', TreinamentoViewSet, basename='treinamento')
router.register(r'turmas', TurmaViewSet, basename='turma')
router.register(r'recursos', RecursoViewSet, basename='recurso')
router.register(r'matriculas', MatriculaViewSet, basename='matricula')
router.register(r'tarefas', TarefaViewSet, basename='tarefa')

# Rotas do Painel do Aluno
router.register(r'painel/turmas', MinhasTurmasViewSet, basename='painel-turmas')
router.register(r'painel/recursos', MeusRecursosViewSet, basename='painel-recursos')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    # Auth (JWT)
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', MeView.as_view(), name='auth_me'),
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/login/', LoginView.as_view(), name='auth_login'),
    path('api/dashboard/', DashboardView.as_view(), name='dashboard'),
]

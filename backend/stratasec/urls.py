from django.contrib import admin
from django.shortcuts import redirect
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from tarefas.views import (
    ComentarioListCreateView,
    DashboardView,
    LoginView,
    MeView,
    RegisterView,
    TarefaViewSet,
)


def root_redirect(_request):
  """
  Redireciona a raiz da API para a tela de login do frontend.
  Em ambiente local, o frontend roda em http://localhost:4000/login.
  """
  return redirect("http://localhost:4000/login")


router = DefaultRouter()
router.register(r"tarefas", TarefaViewSet, basename="tarefa")

urlpatterns = [
    path("", root_redirect, name="root_redirect"),
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
    # Auth (JWT)
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path(
        "api/auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path("api/auth/me/", MeView.as_view(), name="auth_me"),
    path("api/auth/register/", RegisterView.as_view(), name="auth_register"),
    path("api/auth/login/", LoginView.as_view(), name="auth_login"),
    path("api/dashboard/", DashboardView.as_view(), name="dashboard"),
    path(
        "api/tarefas/<int:tarefa_pk>/comentarios/",
        ComentarioListCreateView.as_view(),
        name="tarefa_comentarios",
    ),
]

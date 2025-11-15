from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from tarefas.views import DashboardView, LoginView, MeView, RegisterView, TarefaViewSet

router = DefaultRouter()
router.register(r"tarefas", TarefaViewSet, basename="tarefa")

urlpatterns = [
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
]

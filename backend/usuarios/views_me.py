from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from django.contrib.auth.models import User

from .models import Aluno
from .serializers import AlunoSerializer, UserSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            'user': UserSerializer(user).data,
            'aluno': None,
        }
        try:
            aluno = Aluno.objects.get(user=user)
            data['aluno'] = AlunoSerializer(aluno).data
        except Aluno.DoesNotExist:
            pass
        return Response(data)


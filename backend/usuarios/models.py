from django.db import models
from django.contrib.auth.models import User


# Create your models here.
class Aluno (models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    telefone = models.CharField(max_length=20)
    def __str__(self):
        return f"{self.user.username} - {self.user.email}" 
    

    
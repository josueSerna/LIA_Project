from django.db import models
from django.conf import settings

# Conversation es un modelo que representa una conversación entre el usuario y el sistema
class Conversation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    summary = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.summary or "Sin título"

# Message es un modelo que representa un mensaje dentro de una conversación
class Message(models.Model):
    USER = 'user'
    BOT = 'bot'

    ROLE_CHOICES = [
        (USER, 'Usuario'),
        (BOT, 'LIA'),
    ]

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    text = models.TextField()
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=USER)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.role}] {self.text[:30]}"
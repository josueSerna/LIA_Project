from django.contrib import admin
from .models import Conversation

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('summary', 'user', 'created_at', 'updated_at')
    # Puedes comentar esta línea si quieres editar fechas desde el admin
    

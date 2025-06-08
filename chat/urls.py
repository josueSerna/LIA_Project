from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('new/', views.new_chat, name='new_chat'),
    path('rename/<int:conversation_id>/', views.rename_conversation, name='rename_conversation'),
    path('delete/<int:conversation_id>/', views.delete_conversation, name='delete_conversation'),
    path('save_user_message/', views.save_user_message, name='save_user_message'), # Guardar mensaje del usuario
    path('stream_bot_response/', views.stream_bot_response, name='stream_bot_response'), # Respuesta de LIA
]
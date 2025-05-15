from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('rename/<int:conversation_id>/', views.rename_conversation, name='rename_conversation'),
    path('delete/<int:conversation_id>/', views.delete_conversation, name='delete_conversation'),
]
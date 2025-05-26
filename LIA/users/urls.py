from django.urls import path
from .views import login_view, register_view, home, profile, terms_and_conditions

urlpatterns = [
    path('login/', login_view, name='login'),
    path('register/', register_view, name='register'),
    path("home/", home, name="home"),
    path("profile/", profile, name="profile"),
    path('terms/', terms_and_conditions, name='terms'),
]

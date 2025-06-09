from django.urls import path
from .views import login_view, register_view, home, profile, terms_and_conditions
from django.contrib.auth import views as auth_views
from .forms import CustomPasswordResetForm

urlpatterns = [
    path('login/', login_view, name='login'),
    path('register/', register_view, name='register'),
    path("home/", home, name="home"), 
    path("profile/", profile, name="profile"),
    path('terms/', terms_and_conditions, name='terms'),
    
    path('password_reset/', 
         auth_views.PasswordResetView.as_view(
             template_name='password_reset.html',
             form_class=CustomPasswordResetForm
         ),
         name='password_reset'),

    path('password_reset_done/', auth_views.PasswordResetDoneView.as_view(
        template_name='password_reset_done.html'
    ), name='password_reset_done'),

    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(
        template_name='password_reset_confirm.html'
    ), name='password_reset_confirm'),

    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(
        template_name='password_reset_complete.html'
    ), name='password_reset_complete'),
]

from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from .models import User
from django.contrib.auth.decorators import login_required
from .forms import LoginForm, RegisterForm, ProfilePictureForm, ProfileUpdateForm

def login_view(request):
    logout(request)
    request.session.flush()
    
    if request.method == "POST":
        form = LoginForm(data=request.POST)
        if form.is_valid():
            email = form.cleaned_data.get("username") 
            password = form.cleaned_data.get("password")

            # Buscar usuario por email
            user = User.objects.filter(email=email).first()
            if user and user.check_password(password):
                login(request, user)
                return redirect("home")  

    else:
        form = LoginForm()

    return render(request, "login.html", {"form": form})


def register_view(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            return redirect('login') 
    else:
        form = RegisterForm()

    return render(request, 'register.html', {'form': form})


@login_required(login_url='/login/')
def home(request):
    return render(request, 'home.html')

@login_required(login_url='/login/')
def profile(request):
    if request.method == 'POST':
        user_form = ProfileUpdateForm(request.POST, instance=request.user)
        pic_form = ProfilePictureForm(request.POST, request.FILES, instance=request.user)
        
        if user_form.is_valid() and pic_form.is_valid():
            user_form.save()
            pic_form.save()
            return redirect('profile')  

    else:
        user_form = ProfileUpdateForm(instance=request.user)
        pic_form = ProfilePictureForm(instance=request.user)

    return render(request, 'profile.html', {'user_form': user_form, 'pic_form': pic_form})


def terms_and_conditions(request):
    return render(request, 'termsAndConditions.html')
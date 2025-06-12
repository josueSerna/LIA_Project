from django import forms
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm, PasswordResetForm
from django.contrib.auth import get_user_model
User = get_user_model()

class LoginForm(AuthenticationForm):
    username = forms.EmailField(widget=forms.EmailInput(attrs={'placeholder': 'Correo electrónico'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': 'Contraseña'}))

class RegisterForm(UserCreationForm):
    username = forms.CharField(widget=forms.TextInput(attrs={'placeholder': 'Nombre de usuario'}))
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={'placeholder': 'Correo electrónico'}),
        required=True
    )
    password1 = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': 'Contraseña'}))
    password2 = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': 'Confirmación de contraseña'}))
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']
    
class CustomPasswordResetForm(PasswordResetForm):
    email = forms.EmailField(
    label="",
    widget=forms.EmailInput(attrs={
        "placeholder": "Digita tu correo electrónico",
        "class": "input-field"
    })
    )
class Meta:
    model = User
    fields = ['username', 'email', 'password1', 'password2']
        
def clean_email(self):
    email = self.cleaned_data["email"]
    if User.objects.filter(email=email).exists():
        raise forms.ValidationError("Este correo ya está registrado.")
    return email

def clean_username(self):
    return self.cleaned_data["username"]
    
class ProfilePictureForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ("profile_picture",)
        
        
class ProfileUpdateForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ["username"]
        widgets = {
            "username": forms.TextInput(attrs={"placeholder": "Nuevo nombre de usuario"})
        }
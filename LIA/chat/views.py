from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import Conversation, Message
from collections import defaultdict
from django.utils import timezone 
import json
import re # Importa el módulo re para expresiones regulares


# Utilidad para extraer resumen del primer mensaje
def extract_summary(text):
    """
    Extrae la primera oración como resumen del mensaje.
    Si no hay puntuación, corta los primeros 30 caracteres.
    """
    match = re.search(r'(.+?[.?!])\s', text)
    if match:
        return match.group(1).strip()
    return text[:30].strip()

@login_required
def home(request):
    # Obtiene todas las conversaciones del usuario, ordenadas por fecha (más reciente primero)
    conversations = Conversation.objects.filter(user=request.user).order_by('-updated_at')
    selected_conversation = None # Para almacenar la conversación activa si hay
    messages = [] # Lista de mensajes de la conversación activa (si existe)

    # Agrupar conversaciones por rango de fechas
    now = timezone.localdate()
    grouped_conversations = defaultdict(list)  # Usar defaultdict para agrupar por fecha

    for convo in conversations:
        delta_days = (now - convo.updated_at.date()).days

        if delta_days == 0:
            group = "Hoy"
        elif delta_days == 1:
            group = "Ayer"
        elif 2 <= delta_days <= 7:
            group = "Últimos 7 días"
        elif 8 <= delta_days <= 30:
            group = "Últimos 30 días"
        else:
            group = "Más antiguas"

        grouped_conversations[group].append(convo)



    # Cuando se envía un mensaje nuevo desde el formulario
    if request.method == 'POST':
        user_input = request.POST.get('message')
        conversation_id = request.POST.get('conversation_id')

        # Si el usuario envía un mensaje
        if user_input:
            if conversation_id:
                # Continuar una conversación existente (ya tiene ID)
                selected_conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
            else:
                # Crear una nueva conversación con resumen del primer mensaje
                summary = extract_summary(user_input)
                selected_conversation = Conversation.objects.create(user=request.user, summary=summary)
    
            # Guardar el mensaje en la conversación
            Message.objects.create(conversation=selected_conversation, text=user_input)
            selected_conversation.save()

            messages = selected_conversation.messages.order_by('created_at')

            # Redirigir al home con esa conversación activa
            return redirect(f'/chat/?conversation_id={selected_conversation.id}')

    elif 'conversation_id' in request.GET:
        # Cargar una conversación existente
        conversation_id = request.GET.get('conversation_id')
        selected_conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
        messages = selected_conversation.messages.order_by('created_at')

    # Si no hay conversación seleccionada, se muestra la lista de conversaciones
    return render(request, 'home.html', {
        'grouped_conversations': dict(grouped_conversations),
        'selected_conversation': selected_conversation,
        'messages': messages,
    })

# Utilidad para obtener el resumen de una conversación
@login_required
def rename_conversation(request, conversation_id):
    # Renombra una conversación vía fetch/AJAX
    if request.method == 'POST':
        conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
        data = json.loads(request.body)
        conversation.summary = data.get("summary", "")
        conversation.save()
        return JsonResponse({"status": "ok"})

# Utilidad para eliminar una conversación
@login_required
def delete_conversation(request, conversation_id):
    # Elimina una conversación vía fetch/AJAX
    if request.method == 'POST':
        conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
        conversation.delete()
        return JsonResponse({"status": "ok"})

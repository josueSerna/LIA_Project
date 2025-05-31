from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import StreamingHttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Conversation, Message
from .ollama_client import ask_ollama, ask_ollama_stream
from django.utils import timezone 
from collections import defaultdict
from django.template.loader import render_to_string
from bs4 import BeautifulSoup
import json, re


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
    user = request.user # Obtiene el usuario autenticado
    conversations = Conversation.objects.filter(user=user).order_by('-updated_at')
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
        user_input = request.POST.get('message', '').strip()
        conversation_id = request.POST.get('conversation_id')

        # Si el usuario envía un mensaje
        if user_input:
            if conversation_id:
                # Continuar una conversación existente (ya tiene ID)
                selected_conversation = get_object_or_404(Conversation, id=conversation_id, user=user)
            else:
                # Crear una nueva conversación con resumen del primer mensaje
                summary = extract_summary(user_input)
                selected_conversation = Conversation.objects.create(user=user, summary=summary)
    
            # Guardar el mensaje del usuario
            Message.objects.create(conversation=selected_conversation, text=user_input, role='user')

            # Obtener respuesta de LIA
            try:
                response = ask_ollama(user_input)
            except Exception:
                response = "Hubo un error al contactar con LIA."

            # Guardar respuesta del modelo
            Message.objects.create(conversation=selected_conversation, text=response, role='bot')
            # Actualizar fecha de modificación
            selected_conversation.save()

            messages = selected_conversation.messages.order_by('created_at')

            # Redirigir al home con esa conversación activa
            return redirect(f'/chat/?conversation_id={selected_conversation.id}')

    # Si se selecciona una conversación existente desde el menú
    if 'conversation_id' in request.GET:
        # Cargar una conversación existente
        conversation_id = request.GET.get('conversation_id')
        selected_conversation = get_object_or_404(Conversation, id=conversation_id, user=user)
        messages = selected_conversation.messages.order_by('created_at')

    # Si no hay conversación seleccionada, se muestra la lista de conversaciones
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        # Renderiza solo el sidebar usando el mismo template
        html = render_to_string('home.html', {
            'grouped_conversations': dict(grouped_conversations),
            'selected_conversation': selected_conversation,
            'messages': messages, 
            'request': request, 
        }, request=request)
        # Extrae solo el sidebar usando BeautifulSoup
        soup = BeautifulSoup(html, 'html.parser')
        sidebar_html = str(soup.find(id="sidebar"))
        return JsonResponse({'html': sidebar_html})

    # Render normal para peticiones normales
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

@login_required
def new_chat(request):
    return redirect('/chat/')
    

@csrf_exempt
@login_required
def save_user_message(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        user_input = data.get("message", "").strip()
        convo_id = data.get("conversation_id")
    except Exception:
        return JsonResponse({"error": "Solicitud inválida"}, status=400)
    if not user_input:
        return JsonResponse({"error": "Mensaje vacío"}, status=400)
    # Cargar o crear la conversación
    if convo_id:
        conversation = Conversation.objects.get(id=convo_id)
    else:
        summary = user_input[:40] + "..." if len(user_input) > 40 else user_input
        conversation = Conversation.objects.create(user=request.user, summary=summary)
    # Guardar el mensaje del usuario
    message = Message.objects.create(conversation=conversation, text=user_input, role='user')
    conversation.save()
    return JsonResponse({
        "status": "ok",
        "message": {
            "id": message.id,
            "text": message.text,
            "role": message.role,
            "conversation_id": conversation.id
        }
    })

@csrf_exempt
@login_required
def stream_bot_response(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        convo_id = data.get("conversation_id")
        user_input = data.get("message", "").strip()
    except Exception:
        return JsonResponse({"error": "Solicitud inválida"}, status=400)
    if not convo_id or not user_input:
        return JsonResponse({"error": "Datos incompletos"}, status=400)
    conversation = Conversation.objects.get(id=convo_id)
    def stream():
        bot_message = ''
        for chunk in ask_ollama_stream(user_input):
            bot_message += chunk
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        Message.objects.create(conversation=conversation, text=bot_message.strip(), role='bot')
    return StreamingHttpResponse(stream(), content_type='text/event-stream')


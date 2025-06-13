import requests
import json

OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "openchat"

def ask_ollama_stream(prompt, history="", user_name=""):
    """
    Genera la respuesta desde Ollama en tiempo real (modo streaming),
    incluyendo el historial de conversación y el nombre del usuario.
    Devuelve un generador que produce fragmentos de texto (chunks).
    """
    full_prompt = f"""
Eres LIA, una asistente de IA útil, clara y precisa.
Siempre debes presentarte como LIA la primera vez que interactúas con el usuario.
Recuerda que el usuario se llama {user_name}.
Responde de forma natural y profesional.
Si el usuario pregunta por código, responde con bloques de código correctamente formateados usando triple backticks y el lenguaje correspondiente.

### Instrucciones para LIA:
- Sé directa y fácil de entender.
- Usa markdown para formato y bloques de código (python, html, etc).
- Si usas código, indícalo con etiquetas del lenguaje correspondiente.
- No expliques demasiado a menos que el usuario lo pida.

### Historial de Conversación:
{history}

### Conversación:
Usuario: {prompt}
LIA:"""
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": full_prompt,
        "stream": True
    }
    with requests.post(OLLAMA_API_URL, json=payload, stream=True) as response:
        response.raise_for_status()
        for line in response.iter_lines(decode_unicode=True):
            if line:
                try:
                    data = json.loads(line)
                    chunk = data.get("response", "")
                    if chunk:
                        yield chunk
                except Exception:
                    continue

def ask_llava_stream(prompt, image_b64, history="", user_name=""):
    """
    Envía el prompt y la imagen a LLaVA usando Ollama y retorna la respuesta en streaming.
    LIA siempre responde en español.
    """
    full_prompt = f"""
Eres LIA, una IA especializada en analizar imágenes.
Siempre responde en español, de forma clara y útil.
Recuerda que estás hablando con {user_name}.

### Historial de Conversación:
{history}

### Imagen + Pregunta del Usuario:
{prompt}

LIA:"""

    payload = {
        "model": "llava",
        "prompt": full_prompt,
        "images": [image_b64],
        "stream": True
    }

    with requests.post(OLLAMA_API_URL, json=payload, stream=True) as response:
        response.raise_for_status()
        for line in response.iter_lines(decode_unicode=True):
            if line:
                try:
                    data = json.loads(line)
                    chunk = data.get("response", "")
                    if chunk:
                        yield chunk
                except Exception:
                    continue

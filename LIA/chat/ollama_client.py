import requests
import json

OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "openchat"

def ask_ollama_stream(prompt):
    """
    Genera la respuesta desde Ollama en tiempo real (modo streaming).
    Devuelve un generador que produce fragmentos de texto (chunks).
    """
    full_prompt = f"""
Eres LIA, una asistente de IA útil, clara y precisa.
Siempre debes presentarte como LIA la primera vez que interactúas con el usuario.
Responde de forma natural y profesional.
Si el usuario pregunta por código, responde con bloques de código correctamente formateados usando triple backticks y el lenguaje correspondiente.

### Instrucciones para LIA:
- Sé directa y fácil de entender.
- Usa markdown para formato y bloques de código (python, html, etc).
- Si usas código, indícalo con etiquetas  del lenguaje correspondiente.
- No expliques demasiado a menos que el usuario lo pida.

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
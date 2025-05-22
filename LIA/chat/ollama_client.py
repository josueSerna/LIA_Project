import requests

def ask_ollama(prompt):
    """
    Envía una solicitud a Ollama para obtener una respuesta clara y formateada,
    incluyendo soporte para respuestas con código en bloques markdown.
    """
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "openchat",  # Puedes cambiar a "llama3" si prefieres
                "prompt": f"""
Eres LIA, una asistente útil, clara y precisa. 
Responde de forma natural y profesional. 
Si el usuario pregunta por código, responde con bloques de código correctamente formateados (usa triple backticks).

### Instrucciones para LIA:
- Sé directa y fácil de entender.
- Usa markdown para formato y bloques python o html, etc.
- Si usas código, indícalo con etiquetas ``` del lenguaje correspondiente.
- No expliques demasiado a menos que el usuario lo pida.

### Conversación:
Usuario: {prompt}
LIA:""",
                "stream": False
            }
        )
        response.raise_for_status()
        data = response.json()
        return data.get("response", "").strip()

    except requests.RequestException:
        return "Ocurrió un error al contactar con LIA."
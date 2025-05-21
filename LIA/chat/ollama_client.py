import requests

def ask_ollama(prompt):
    """
    Envía una solicitud a Ollama para obtener una respuesta del modelo.
    """
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3",
                "prompt": f"""Eres LIA, una asistente útil y amigable. Responde de forma breve, clara y con lenguaje natural.

Usuario: {prompt}
LIA:""",
                "stream": False
            },
            
        )
        response.raise_for_status()
        data = response.json()
        return data.get("response", "").strip()
    except requests.RequestException as e:
        return "Ocurrió un error al contactar con LIA."
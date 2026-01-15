from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
print("API Key loaded:", bool(api_key))

client = genai.Client(api_key=api_key)

models = client.models.list()
print("\nAvailable Gemini Models:\n")
for m in models:
    print(m.name)

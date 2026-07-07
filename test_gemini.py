import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    print("❌ GOOGLE_API_KEY not found in .env")
    exit(1)

url = f"https://generativelanguage.googleapis.com/v1/models?key={API_KEY}"
response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    print("✅ Available models (supporting generateContent):")
    for model in data.get("models", []):
        if "generateContent" in model.get("supportedGenerationMethods", []):
            print(f"  - {model['name']}")
else:
    print(f"❌ Error {response.status_code}: {response.text}")
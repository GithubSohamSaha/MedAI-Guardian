import os
import json
import httpx
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")
FIREBASE_PRIVATE_KEY = os.getenv("FIREBASE_PRIVATE_KEY")
FIREBASE_CLIENT_EMAIL = os.getenv("FIREBASE_CLIENT_EMAIL")

async def send_push_notification(
    title: str,
    body: str,
    data: Dict[str, str] = None,
    token: str = None
):
    """Send push notification via Firebase Cloud Messaging."""
    if not token:
        return
    
    # Get access token
    import google.auth.transport.requests
    from google.oauth2 import service_account
    
    credentials = service_account.Credentials.from_service_account_info(
        {
            "private_key": FIREBASE_PRIVATE_KEY,
            "client_email": FIREBASE_CLIENT_EMAIL,
        }
    )
    from google.oauth2 import service_account
    import google.auth.transport.requests

    try:
        creds = service_account.Credentials.from_service_account_info(
            {
                "private_key": FIREBASE_PRIVATE_KEY.replace("\\n", "\n"),
                "client_email": FIREBASE_CLIENT_EMAIL,
                "project_id": FIREBASE_PROJECT_ID
            },
            scopes=["https://www.googleapis.com/auth/firebase.messaging"]
        )
        
        auth_req = google.auth.transport.requests.Request()
        creds.refresh(auth_req)
        
        access_token = creds.token
        
        # Send FCM message
        url = f"https://fcm.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/messages:send"
        
        message = {
            "message": {
                "token": token,
                "notification": {
                    "title": title,
                    "body": body
                },
                "data": data or {}
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=message,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200:
                return {"success": True, "message": response.json()}
            else:
                return {"success": False, "error": response.text}
                
    except Exception as e:
        return {"success": False, "error": str(e)}
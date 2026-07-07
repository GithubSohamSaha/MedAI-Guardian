# MedAI Guardian Hackathon Demo

MedAI Guardian is a district-level command center for Primary Health Centres. The demo is designed to prove three things quickly: operational visibility, AI-assisted response, and practical last-mile workflows.

## Winning Demo Flow

1. Sign in with `demo@medai.com` / `demo123`.
2. Open **Overview** to show the district readiness score, critical stock count, bed availability, and patient forecast.
3. Open **Stock Intelligence** to show reorder risk and predicted days remaining. Add a medicine or post a stock transaction.
4. Open **Bed Capacity** to update bed census and show saturation tracking.
5. Open **Patient Flow** to record an OPD visit and show seven-day footfall intelligence.
6. Open **Risk Alerts** to resolve an operational alert.
7. Open **AI Assistant** and ask: `Which issue should the district team handle first today?`
8. Open **System Status** to show feature readiness and deployment posture.

## Industry-Ready Features

- Authenticated FastAPI backend with JWT access tokens.
- SQLite local demo database with realistic seeded PHC data.
- Modular APIs for medicines, stock forecast, beds, doctors, patients, alerts, and AI assistance.
- Professional React operations console with sidebar feature navigation.
- Real action workflows for adding medicines, updating stock, updating beds, adding doctors, recording visits, and resolving alerts.
- Offline-safe AI assistant fallback when hosted Gemini credentials are not configured.
- Local disease-trend fallback when BigQuery is not configured.
- Environment examples for backend and dashboard configuration.
- One-command Windows demo launcher: `.\start-demo.ps1`.

## Local Run

```powershell
python -m pip install -e .
cd dashboard
npm install
cd ..
python seed_db.py
.\start-demo.ps1
```

Dashboard: `http://localhost:3000`  
API docs: `http://localhost:8000/docs`

## Judge Talking Points

- The product is not just predictive analytics; it closes the loop with operational actions.
- It works in a low-resource local setup while remaining cloud-ready for Gemini, BigQuery, Vision AI, and deployment services.
- The PHC health score creates a single decision signal for district administrators.
- The workflow maps to real PHC pain points: medicine stock-outs, patient crowding, bed shortages, staff availability, and outbreak signals.

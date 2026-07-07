# MedAI Guardian 🏥

**AI‑Powered Smart Health Monitoring & Supply Chain Platform for Primary Health Centres (PHCs)**

[![Hackathon](https://img.shields.io/badge/Google%20Build%20with%20AI-Code%20for%20Communities-blue)](https://buildwithai.hack2skill.com/)
[![Status](https://img.shields.io/badge/status-pending-brightgreen)]()
[![License](https://img.shields.io/badge/license-Apache%202.0-lightgrey)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## Authors
- **Soham Saha**
- **Chayan Maity**
- **Arpayitri Bhattacharyya**
- **Akash Roy**

## 🚀 Overview

Primary Health Centres in India face critical gaps – medicine stock‑outs, unmanaged patient crowds, unpredictable doctor absenteeism, and no real‑time visibility for district officials. **MedAI Guardian** closes this gap with an AI‑driven, multilingual, offline‑first platform that combines:

- 🔮 **Stock‑out prediction** (XGBoost)
- 📈 **Patient footfall forecasting** (LSTM)
- 🏨 **Bed availability & doctor attendance intelligence** (Random Forest)
- 🦠 **Disease outbreak detection** (ARIMA/BigQuery ML)
- 🗣️ **Voice‑first input** in 10 Indian languages (Dialogflow + Chirp)
- 🧠 **Gemini‑powered conversational analytics** for district admins
- 👁️ **OCR digitization** of paper OPD registers (Vision AI)
- 📊 **Unified command dashboard** with Google Maps heatmap & AI Health Risk Score

**Result:** One glance dashboard for district magistrates, proactive alerts, and a measurable reduction in stock‑outs and patient waiting times.

> Built during **Google Build with AI: Code for Communities** hackathon (June–July 2026).

---

## 🎯 Key Features

- **Voice‑Based Stock Entry** – Speak “200 Paracetamol bache” → AI updates inventory and forecasts stock‑out.
- **Predictive AI Engine** – Six specialised models forecasting stock, patients, beds, doctor attendance, and disease trends.
- **Smart Redistribution** – Auto‑suggests medicine transfers from surplus PHCs to deficit ones.
- **AI Health Risk Score** – Every PHC gets a single score (0‑100) combining all operational metrics.
- **Multilingual Assistant** – Gemini answers natural language queries like “Which centres will run out of insulin?” in Hindi/Tamil/etc.
- **Offline‑First Mobile App** – Flutter app works with Firestore offline persistence – syncs when internet returns.
- **Admin Web Dashboard** – React app with Google Maps, alerts panel, and one‑click resource redistribution.
- **OCR Digitization** – Upload a photo of a paper OPD register, Vision AI extracts structured data.
- **Edge AI on Raspberry Pi** – Runs Lite models for offline decision‑making.
- **Zero‑Cost Cloud Stack** – Entirely built on Google Cloud free tier & hackathon credits.

---

## 🧱 Tech Stack

| Layer           | Technology |
|----------------|------------|
| Frontend (Mobile) | Flutter, Firebase Auth, Dialogflow CX |
| Frontend (Web)    | React, Ant Design, Google Maps API |
| Backend           | FastAPI, Cloud Run (Python), Cloud Functions (Node.js) |
| AI & ML           | XGBoost, LSTM (TensorFlow), Random Forest, ARIMA (BigQuery ML), Gemini API, Vision AI, Speech‑to‑Text, Translation API |
| Database          | Firestore, BigQuery, Redis (Memorystore), Cloud SQL |
| Messaging         | Cloud Pub/Sub, FCM |
| Edge / IoT        | Raspberry Pi 4, MQTT, TFLite, DHT22/PIR sensors (optional for demo) |
| DevOps            | Docker, GitHub Actions, Terraform, Cloud Build |
| Monitoring        | Cloud Logging, Cloud Monitoring, Cloud Error Reporting |

---

## 📁 Project Structure

```
medai-guardian/
├── backend/         # FastAPI + Cloud Functions
├── ml/              # Vertex AI pipelines & training scripts
├── mobile/          # Flutter health‑worker app
├── dashboard/       # React admin web portal
├── edge/            # Raspberry Pi edge services
├── infrastructure/  # Terraform IaC & Kubernetes configs
├── data/            # Synthetic data generators & schemas
├── docs/            # Full architecture & API docs (SRS, TDD)
└── .github/         # CI/CD workflows
```

For a deep dive, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) – the complete 19‑section Software Requirement Specification, Technical Design Document, and System Architecture.

---

## 🔑 Keywords (for search & discovery)

`AI in Healthcare`, `Smart PHC`, `Medicine Stock‑out Prediction`, `Patient Surge Forecasting`, `Doctor Attendance Intelligence`, `Voice‑First Health Reporting`, `Gemini API`, `Google Cloud Run`, `Flutter`, `Vertex AI`, `BigQuery ML`, `Multilingual Health Assistant`, `OCR Medical Records`, `Edge AI`, `IoT Healthcare`, `District Health Dashboard`, `India Digital Health`, `DPDP Act`, `ABDM`, `Open Source Public Health`

---

## 🚦 Getting Started (Local Development)

### Prerequisites
- Google Cloud project with billing enabled (free credits provided by hackathon)
- Firebase project linked to GCP
- Python 3.10+, Node.js 18+, Flutter 3.10+, Docker
- Git

### Quick Setup
1. Clone the repo:
   ```bash
   git clone https://github.com/GithubSohamSaha/MedAI-Guardian.git
   cd MedAI-Guardian
   ```
2. Install backend dependencies:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r api/requirements.txt
   ```
3. Run Firebase emulators for local development:
   ```bash
   firebase emulators:start
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn api.main:app --reload
   ```
5. For the dashboard, install Node packages and start:
   ```bash
   cd ../dashboard
   npm install
   npm start
   ```
6. For the mobile app, open `mobile/` in Android Studio/VS Code and run via Flutter.

Detailed setup instructions are in [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md).

---

## 🏆 Hackathon Submission

- **Challenge:** Smart Health (Track 3)
- **Problem Statement:** AI‑Driven Health Center & Supply Chain Management for PHCs/CHCs
- **Live Demo Video:** [Link to YouTube/Loom]
- **Presentation Deck:** [Link to PDF]
- **All‑in‑one Architecture Doc:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 🤝 Acknowledgements

- Google Cloud & Hack2Skill for organising *Build with AI: Code for Communities*
- Hon’ble MPs for real‑world problem statements
- Open‑source libraries and Google Developer Experts

---

## 📜 License

This project is licensed under the **Apache License 2.0** – see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for rural India’s frontline healthcare.**

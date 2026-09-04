# 🛡️ AI Risk Manager

AI-powered risk assessment and management platform that analyzes AI systems across privacy, security, fairness, reliability, compliance, and operational risks.

## 🏗️ System Architecture

![AI Risk Manager Architecture](./ai-risk-architecture.svg)

AI Risk Manager uses a React + Vite frontend, Node.js + Express backend, and Google Gemini AI to analyze AI system risks and generate structured risk assessments.

## ✨ Key Features

- 📊 Risk assessment dashboard
- 📝 New AI system assessment
- 🤖 Gemini-powered risk analysis
- 🔐 Data Privacy and Security assessment
- ⚖️ Bias & Fairness analysis
- ⚙️ Reliability and Operational risk analysis
- 📋 Compliance risk assessment
- 📈 Risk score visualization
- 🕒 Assessment history
- 📄 Report generation
- 💾 Browser localStorage for assessment history
- ❤️ System health monitoring

## 🔄 How It Works

1. User enters AI system information.
2. React frontend sends the assessment to the backend.
3. Node.js + Express validates the request.
4. Backend sends a structured prompt to Gemini AI.
5. Gemini analyzes six major risk categories.
6. Structured JSON results are returned.
7. Frontend displays risk scores, levels, explanations, and recommended actions.
8. Assessment results are stored locally for history and reporting.

## 🧠 Risk Categories

- Data Privacy
- Security
- Bias & Fairness
- Reliability
- Compliance
- Operational Risk

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- Recharts
- CSS
- Browser localStorage

### Backend
- Node.js
- Express
- CORS
- dotenv
- Google GenAI SDK

### AI
- Google Gemini

## 📁 Project Structure

```text
ai-risk-manager/
├── src/
├── public/
├── server/
├── ai-risk-architecture.svg
├── README.md
├── package.json
└── vite.config.js
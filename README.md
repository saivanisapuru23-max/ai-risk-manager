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
```

## 🚀 Installation

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd server
npm install
node server.js
```

The frontend communicates with the Express backend through the risk analysis API.

## 🔌 API Endpoints

### Health Check

```text
GET /api/health
```

### Risk Analysis

```text
POST /api/analyze-risk
```

The risk analysis endpoint receives AI system information and returns a structured assessment generated with Gemini AI.

## 🤖 AI Analysis

Gemini evaluates the submitted AI system across:

- Data Privacy
- Security
- Bias & Fairness
- Reliability
- Compliance
- Operational Risk

The system generates:

- Overall risk score
- Overall risk level
- Risk summary
- Category-wise scores
- Risk descriptions
- Impact
- Likelihood
- Recommended actions

## 🛡️ Responsible AI

AI Risk Manager is designed as a decision-support system. AI-generated recommendations should be reviewed and validated by appropriate human stakeholders before making important risk, compliance, or governance decisions.

## 🔮 Future Enhancements

- Automated compliance frameworks
- Enterprise authentication
- Cloud database integration
- Advanced risk forecasting
- Exportable PDF reports
- Continuous AI system monitoring
- Organization-level risk dashboards

## 📌 Project Highlights

AI Risk Manager combines AI risk assessment, structured analysis, visualization, and responsible AI practices into a single platform.
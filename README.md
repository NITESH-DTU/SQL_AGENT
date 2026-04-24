# 🚀 SQL Agent v2.0: Autonomous Data Engineering Platform

A powerful, production-grade Business Intelligence (BI) platform that combines autonomous AI data engineering with a high-performance analytics dashboard. Query, analyze, and visualize your data using natural language or professional SQL tools.

![Aesthetic Dashboard Preview](https://img.shields.io/badge/Aesthetics-Premium-blueviolet?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20React%20%7C%20Framer%20Motion-blue?style=for-the-badge)

## ✨ Core Features

### 🤖 Autonomous SQL Agent
*   **Natural Language to SQL**: Ask questions like *"Show me the distribution of users by age"* and watch the agent generate, execute, and analyze the SQL for you.
*   **Auto-Visualization**: Automatically generates high-quality charts (Bar, Line, Pie, Area, Scatter) based on query results.
*   **Self-Correction**: If a query fails, the agent automatically debugs the error and retries with a corrected statement.

### 📊 Professional BI Dashboard
*   **Interactive Widgets**: Pin charts, metrics, and tables from chat or console directly to your workspace.
*   **Advanced Controls**: Search through widgets, toggle between Grid/List views, and maximize charts for deep inspection.
*   **Persistence**: Your dashboard layout and data persist across sessions using a robust Meta-DB layer.
*   **🚀 Seed Demo**: Instantly populate your dashboard with beautiful, live-verified charts to see the platform's full potential in one click.

### 🛠️ Data Engineering Tools
*   **SQL Console**: IDE-grade manual query editor with history tracking and "Pin to Dashboard" support.
*   **Table Builder**: Visual schema designer to create new tables with automatic AI seeding.
*   **File Importer**: Seamlessly import data from **CSV, Excel, PDF, and DOCX** into your database.
*   **Data Explorer**: High-performance browser for inspecting raw table data.

## 🚀 Getting Started

### 1. Prerequisites
*   Python 3.9+
*   Node.js 18+
*   OpenAI / Groq API Key

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Create .env and add your OPENAI_API_KEY or GROQ_API_KEY
python main.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🏗️ Detailed Technology Stack

### 🧠 Agentic & AI Layer
*   **Agentic Framework**: Custom Autonomous Agent Loop with multi-step reasoning and self-correction.
*   **LLM Provider**: **OpenAI SDK** / **Groq Cloud** (Llama 3.3 70B & DeepSeek R1 compatible).
*   **LLM Tools**: Structured tool-calling for SQL generation, schema discovery, and diagnostic execution.

### 🐍 Backend (Python)
*   **FastAPI**: High-performance asynchronous API framework.
*   **Pandas**: Robust data manipulation and analysis for query result processing.
*   **SQLAlchemy**: Database abstraction and multi-dialect support (SQLite & PostgreSQL).
*   **SSE (Server-Sent Events)**: Real-time streaming of agent thought processes and tool calls.
*   **Guardrails**: Implementation of safety layers for SQL injection prevention and destructive query blocking.

### ⚛️ Frontend (React & JS)
*   **React 18**: Modern UI library with functional components and custom hooks.
*   **JavaScript (ES6+)**: Core logic for state management and API orchestration.
*   **Framer Motion**: Advanced physics-based animations for a premium, interactive feel.
*   **Recharts**: Composable charting library for dynamic data visualization.
*   **Lucide Icons**: Consistent, high-quality iconography.
*   **Tailwind CSS**: Utility-first CSS framework for custom design tokens and dark mode support.
*   **Axios**: Promise-based HTTP client for seamless backend communication.

### 🗄️ Storage & Persistence
*   **Meta-DB**: SQLite-based persistence layer for dashboards, widgets, and user history.
*   **Database Connectors**: Native support for **SQLite** (.db files) and **PostgreSQL**.

## 🛡️ Data Safety & Guardrails
The platform includes built-in SQL guardrails to prevent destructive operations and ensures all AI-generated queries are safe to execute before they touch your database.

---
*Built with ❤️ by Nitesh Kaushik (DTU'27).*

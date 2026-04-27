# 🚀 SQL Agent: Enterprise AI Business Intelligence Platform

A sophisticated, production-ready Business Intelligence (BI) and Data Engineering platform powered by autonomous AI. It bridges the gap between natural language and complex database operations, featuring AI-driven SQL generation, automated data governance, and an interactive, full-stack analytics dashboard.

![Aesthetic Dashboard Preview](https://img.shields.io/badge/Aesthetics-Premium-blueviolet?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20React%20%7C%20Framer%20Motion-blue?style=for-the-badge)

## ✨ Enterprise Capabilities & Core Features

### 🤖 Autonomous AI SQL Agent
*   **Natural Language to SQL**: Converts natural language questions (e.g., *"Show me the distribution of users by age"*) into highly optimized SQL, executing and analyzing it autonomously.
*   **Self-Healing & Error Correction**: Built-in autonomous loop automatically debugs execution failures and retries corrected statements.
*   **Auto-Visualization**: Intelligently determines the best chart type (Bar, Line, Pie, Area, Scatter) and generates high-quality visualizations from query results.

### 🏛️ Enterprise Semantic Layer & Governance
*   **Business Glossary Manager**: Centralized semantic layer to define business logic, terms, and custom metrics (e.g., defining "Active User"), ensuring the AI generates perfectly aligned queries.
*   **Automated PII Masking**: Advanced data governance layer that dynamically identifies and masks Personally Identifiable Information before it hits the frontend.
*   **Strict SQL Guardrails**: Enforces query safety, preventing destructive operations (DROP, DELETE, TRUNCATE) and mitigating SQL injection risks.

### 📊 Professional BI Dashboard
*   **Interactive Analytics**: Pin charts, metrics, and tables from the chat or SQL console directly to a persistent, interactive dashboard.
*   **Automated Scheduled Reporting**: Set up scheduled generation and delivery of dashboards and key metrics.
*   **Robust Persistence**: Dashboard layouts, widgets, and user history are reliably stored across sessions via a dedicated Meta-DB layer.

### 🛠️ Advanced Data Engineering Tools
*   **Database ERD Visualizer**: Automatically inspects database schemas and visualizes relationships in an interactive Entity-Relationship Diagram.
*   **SQL Console**: IDE-grade manual query editor with history tracking, execution capabilities, and direct "Pin to Dashboard" support.
*   **Smart Table Builder**: Visual schema designer that can create new tables and automatically populate them with AI-generated seed data.
*   **Universal File Importer**: Seamlessly ingest and process data from **CSV, Excel, PDF, and DOCX** directly into your database tables.
*   **Data Explorer & Profiler**: High-performance browser for inspecting raw table data and generating statistical data profiles.

## 🚀 Getting Started

### 1. Prerequisites
*   Python 3.9+
*   Node.js 18+
*   OpenAI API Key or Groq API Key

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

### 🧠 Agentic AI Architecture
*   **Agentic Framework**: Custom autonomous loop with multi-step reasoning, tool usage, and auto-correction.
*   **LLM Integration**: Compatible with **OpenAI SDK** and **Groq Cloud** (Llama 3.3 70B, DeepSeek R1).
*   **Structured Tools**: Advanced tool-calling for SQL generation, schema discovery, data profiling, and diagnostic execution.

### 🐍 Backend (Python)
*   **FastAPI**: Asynchronous, high-performance API framework powering the application backend.
*   **SQLAlchemy**: Robust ORM abstraction layer supporting multi-dialect database connections (SQLite & PostgreSQL).
*   **Pandas**: Powering advanced data manipulation, file parsing, and analytical result processing.
*   **SSE (Server-Sent Events)**: Real-time, bi-directional streaming of agent thought processes, tool calls, and execution steps.
*   **Security & Governance Layers**: Built-in AST-based guardrails and regex-driven PII masking modules.

### ⚛️ Frontend (React & JavaScript)
*   **React 18 & Vite**: Modern UI architecture using functional components, context providers, and custom hooks.
*   **Framer Motion**: Complex, physics-based micro-animations ensuring a premium, responsive user experience.
*   **Recharts**: Highly customizable and dynamic data visualization engine.
*   **Tailwind CSS**: Utility-first CSS framework enforcing custom design tokens, responsive layouts, and native dark mode.
*   **React Flow**: Driving the interactive Database ERD Visualizer.

### 🗄️ Storage & Infrastructure
*   **Meta-DB**: Dedicated SQLite-based state manager for caching dashboards, configuration, and agent history.
*   **Data Sources**: Native, dynamic connection pooling for **SQLite** (.db files) and **PostgreSQL** databases.

---
*Built with ❤️ by Nitesh Kaushik (DTU'27).*

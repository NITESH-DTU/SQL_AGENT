# SQL Agent — Database Manager

A production-grade Python application where an autonomous LLM (Llama 3.3 70B via Groq) manages SQLite and PostgreSQL databases via a set of 21 highly powerful tools.

It controls database reading, writing, filtering, aggregating, schema exploration, statistics generation, and table comparison while strictly adhering to user-selected permissions.

## Features

- **Multi-Database Support**: Connects flawlessly to both SQLite (`.db` files) and PostgreSQL servers via `psycopg2`.
- **Interactive Table Builder**: Provides a step-by-step UI to create new schemas and tables.
- **LLM Data Seeder**: Built-in flow to automatically generate realistic dummy data using the LLM for any created table schema.
- **Agentic Loop without Langchain**: Pure Python loop communicating directly with Groq to route, invoke, pass tool results, and summarize.
- **Strict Guardrails**: Prevents destructive actions (DROP, DELETE, ALTER), limits outputs, checks WHERE clauses, and strictly scopes querying to active tables.
- **21 Distinct Agent Tools**: Covers actions from `join_tables`, `rank_by_column`, `detect_nulls` to `bulk_insert`.

## Prerequisites & Installation

1. Clone or clone the directory.
2. Ensure you have Python 3.9+ installed.
3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
4. Set your Groq API Key in the `.env` file:
   `GROQ_API_KEY="gsk_..."`

## Usage

Start the agent UI:
```bash
python main.py
```

### Flow

1. Choose a database to connect to (SQLite or PostgreSQL). You can also create a new one.
2. Select which tables should be "Active" to authorize the LLM to read/write them.
3. The **Agent Menu** appears. From here you can:
   - Ask the Agent a question (e.g. "Who are the top 5 highest earners in the sales table?")
   - Create new tables and seed them.
   - Switch active tables.
   - Export CSV manually.
   
The Agent uses advanced thinking capabilities. You will see its `[THINKING]`, `[TOOL CALL]`, and `[TOOL RESULT]` steps natively printed in your terminal. All safety violations are exported to `agent_violations.log`.

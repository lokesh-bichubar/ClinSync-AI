<div align="center">

# 🏆 Agentic AI- IIT Bhuwneshwar

## 💜 Team Vibranium

<img alt="Hackathon project" src="https://img.shields.io/badge/HACKATHON-PROJECT-7C3AED?style=for-the-badge" />
<img alt="Team Vibranium" src="https://img.shields.io/badge/TEAM-VIBRANIUM-DB2777?style=for-the-badge" />
<img alt="Agentic AI" src="https://img.shields.io/badge/AGENTIC-AI-0891B2?style=for-the-badge" />

**🧑‍💻 Leader: Lokesh · Quantum University**  
**🤝 Co-leader: Jatin Saini · NGF College of Engineering & Technology**

</div>

| Role | Name | Institution |
| --- | --- | --- |
| 🟣 **Leader** | **Lokesh** | **Quantum University** |
| 🔵 **Co-leader** | **Jatin Saini** | **NGF College of Engineering & Technology** |

---

<div align="center">

# 🩺 ClinSync AI
### From fragmented clinical information to source-linked documentation.

<img alt="Python 3.11 or newer" src="https://img.shields.io/badge/Python-3.11%2B-3776AB?style=flat-square&amp;logo=python&amp;logoColor=white" />
<img alt="FastAPI backend" src="https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&amp;logo=fastapi&amp;logoColor=white" />
<img alt="OpenAI integration" src="https://img.shields.io/badge/AI-OpenAI-10A37F?style=flat-square" />
<img alt="JavaScript frontend" src="https://img.shields.io/badge/Frontend-JavaScript-F7DF1E?style=flat-square&amp;logo=javascript&amp;logoColor=black" />

<img alt="22 backend tests passed" src="https://img.shields.io/badge/Backend_tests-22_passed-16A34A?style=flat-square" />
<img alt="Hackathon prototype" src="https://img.shields.io/badge/Status-Prototype-F59E0B?style=flat-square" />
<img alt="Human review required" src="https://img.shields.io/badge/Human_review-Required-E11D48?style=flat-square" />

</div>

**A hackathon project by Team Vibranium**, exploring how an agentic documentation workflow can organize consultation notes, surface inconsistencies, and keep humans in control of the final record.

> [!WARNING]
> **🟠 Hackathon prototype — not production clinical software.** Use synthetic or properly de-identified test data only. Every generated record remains a draft requiring human review.

## 🔴 The Problem

Clinical information often exists across consultation transcripts, previous notes, medication lists, allergy records, and laboratory reports. These sources may contain conflicting details, missing context, or information recorded at different times.

Reviewing them manually can make documentation slow and difficult to trace.

## 💡 Our Approach

ClinSync AI brings multiple text sources into one workspace and uses an OpenAI-backed workflow to prepare structured, source-linked draft findings.

The core idea is simple:

| 🔵 Organize | 🟠 Flag | 🟢 Trace | 🟣 Review |
| :---: | :---: | :---: | :---: |
| Bring source records together | Preserve conflicts and uncertainty | Show supporting source quotes | Keep humans in control |

Instead of presenting AI output as a finalized medical record, the application exposes supporting quotes, flags potential issues, and lets a reviewer inspect the draft before exporting it.

## ✨ Key Features

- **📥 Multi-source input:** Paste consultation text and supporting records, or import UTF-8 `.txt` files.
- **🧠 Structured AI drafts:** Generate findings covering the visit, medications, allergies, laboratory information, history, and open questions.
- **🚩 Conflict and uncertainty flags:** Ask the model to surface contradictory, missing, or ambiguous information without silently resolving it.
- **🔗 Source traceability:** Display source names and quoted excerpts alongside draft findings.
- **🔎 Server-side quote checks:** Check whether each returned quote appears exactly in the referenced source.
- **🧑‍⚕️ Human review:** Inspect individual findings, track reviewed items, and add reviewer notes.
- **📤 Draft exports:** Download results as `.txt` or `.json`, retaining draft status and review information.
- **🔐 Protected AI processing:** Keep API credentials server-side, with password-gated processing, session cookies, CSRF checks, and basic request limits.
- **📱 Responsive interface:** Desktop and mobile layouts with accessible navigation and reduced-motion support.
- **🎮 No-key preview:** Explore a clearly labeled illustrative sample without calling OpenAI.

> [!IMPORTANT]
> **🔎 Traceability is not clinical verification.** A matching quote establishes literal source traceability—not clinical truth or correct interpretation. The model can still make mistakes or omit important information.

## 🔄 Implemented Workflow

```text
Consultation + Supporting Text Records
                  │
                  ▼
         Input Validation
                  │
                  ▼
     OpenAI Structured Draft Generation
       • Organize supplied information
       • Surface potential conflicts
       • Preserve source references
                  │
                  ▼
       Server-side Output Checks
       • Validate response structure
       • Match quotes to source text
                  │
                  ▼
            Human Review
       • Inspect source evidence
       • Record unresolved concerns
                  │
                  ▼
          Export Draft TXT / JSON
```

### 🧠 Agentic Design Direction

The broader hackathon vision follows seven stages: **ingest → reconcile → detect → retrieve → document → validate → revise or escalate**.

The current implementation is a bounded, single-request AI workflow with deterministic output checks and human review. It is **not** a fully autonomous multi-agent system. External retrieval, EHR connectivity, pharmacy lookup, laboratory integrations, and guideline RAG remain future work; the landing page illustrates that broader vision.

## 🛠️ Technology Stack

| Layer | Technology |
| --- | --- |
| 🟡 Frontend | HTML, CSS, JavaScript |
| 🟢 Backend | Python, FastAPI, Uvicorn |
| 🟣 AI integration | OpenAI Chat Completions with strict JSON-schema output |
| 🔵 HTTP client | HTTPX |
| 🟠 Validation | Pydantic and server-side quote matching |
| 🔐 Session handling | Signed HttpOnly cookies via Starlette |
| ✅ Testing | Pytest and Playwright |

## 🚀 Getting Started

### 📋 Prerequisites

- Python **3.11 or newer**
- A modern web browser
- An OpenAI API key with access to a model supporting Chat Completions and strict structured output

An API key is only required for AI generation. The illustrative sample works without one.

### 1️⃣ Clone the repository

```bash
git clone <your-repository-url>
cd <your-repository-folder>
```

Run the following commands from the directory containing `app.py` and `requirements.txt`.

### 2️⃣ Create a virtual environment

```bash
python -m venv .venv
```

**macOS / Linux**

```bash
source .venv/bin/activate
```

**Windows PowerShell**

```powershell
.venv\Scripts\Activate.ps1
```

### 3️⃣ Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 4️⃣ Configure the server

Copy `.env.example` to `.env` and update the values locally:

```dotenv
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4.1-mini
APP_ACCESS_PASSWORD=choose-a-long-unique-password
SESSION_SECRET=replace-with-a-random-secret
COOKIE_SECURE=false
```

Generate a random session secret:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

**Important:**

- Never commit `.env`, API keys, passwords, or patient records to GitHub.
- Keep `.env` excluded through `.gitignore`.
- Use `COOKIE_SECURE=false` only for local HTTP testing. Use `true` when serving over HTTPS.
- Restart the server after changing configuration.
- The default model is configurable; confirm model availability in your OpenAI project.

### 5️⃣ Start the application

```bash
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --no-access-log
```

Open **http://127.0.0.1:8000** in your browser.

For a hosted development preview, use `--host 0.0.0.0` instead. Run a single worker because prototype rate limits and concurrency controls are held in memory.

> [!TIP]
> **🚀 Run through the Python server**, not by double-clicking the HTML file. If an embedded preview blocks session cookies, open it in a separate browser tab.

## 🎬 Hackathon Demo Flow

1. Select **Try the Workspace**.
2. Enter the configured workspace password to unlock AI processing.
3. Select **Load synthetic example**, or add your own synthetic/de-identified test sources.
4. Confirm the test-data declaration and select **Generate draft**.
5. Inspect each finding and expand its source evidence.
6. Add reviewer notes and mark inspected findings.
7. Export the draft as TXT or JSON.

> [!TIP]
> **🎮 No API key?** Select **Preview an illustrative sample**. This sample is predefined and clearly labeled; it is not generated by OpenAI.

### 📏 Input Limits

- **1–6** text sources
- Up to **50,000 characters** per source
- Up to **100,000 characters** across all sources
- UTF-8 `.txt` imports up to **200 KB**, subject to the character limit

## 🗂️ Project Structure

```text
.
├── app.py                    # API, OpenAI integration, validation, request controls
├── static/
│   ├── index.html            # Landing page and documentation workspace
│   ├── workspace.css         # Workspace styles and layout fixes
│   ├── navigation.js         # Mobile navigation and scroll behavior
│   └── workspace.js          # Inputs, draft rendering, review, and exports
├── tests/
│   ├── test_app.py           # Backend tests with mocked OpenAI responses
│   └── browser_smoke.py      # Browser workflow checks
├── .env.example              # Server configuration template
├── .gitignore
├── requirements.txt
├── requirements-dev.txt
├── SECURITY.md               # Real-data deployment considerations
└── README.md
```

## 🧪 Testing

Install the test dependencies and run the backend tests:

```bash
python -m pip install -r requirements-dev.txt
python -m pytest -q
```

For browser checks, start a separate **unconfigured** server on port `8000`, then run:

```bash
python -m playwright install chromium
python tests/browser_smoke.py
```

On Linux, browser system dependencies may also be required:

```bash
python -m playwright install-deps chromium
```

### ✅ Current Validation Status

- 🟢 **22 backend tests passed.**
- 🟢 **Chromium smoke tests passed**, covering sample rendering, review, export, TXT import, source-change invalidation, mocked AI submission, safe text rendering, mobile navigation, and no-JavaScript visibility.
- 🟠 OpenAI responses were **mocked during testing**. A live OpenAI request was not tested in the supplied build because no API key was configured.
- 🔴 These tests validate application behavior—not medical accuracy, regulatory compliance, or clinical safety.

## 🛡️ Safety, Privacy & Limitations

ClinSync AI is an educational hackathon prototype, **not a medical device or a replacement for clinical judgment**.

- No autonomous diagnosis, prescribing, or treatment changes are implemented.
- All generated outputs require human review and remain drafts, even after review checkboxes are completed.
- Review checkboxes are not authenticated clinical sign-off.
- The prototype accepts only synthetic or properly de-identified test data. It does not automatically detect or remove identifiers.
- Submitted source names and text are sent to OpenAI when AI generation is requested.
- The application does not persist source records or drafts in a database or browser local storage. Processing occurs in working memory; exports are saved by the user.
- The API request sets `store: false`, but this does **not** guarantee zero provider retention. Account-specific terms and controls must be reviewed separately.
- Clearing the workspace does not delete downloads or data already transmitted to a provider.
- No EHR, pharmacy, laboratory, or external medical-evidence service is connected.
- Real-patient-data deployment requires approved hosting, individual access controls, appropriate data-processing arrangements, retention policies, clinical validation, and security review. See [`SECURITY.md`](SECURITY.md).

## 🔮 Future Scope

- Approved, traceable retrieval from external evidence sources
- More rigorous temporal and semantic consistency checks
- PDF and DOCX ingestion
- Authenticated clinician review and versioned audit trails
- Organization-managed SSO and role-based access
- Carefully governed EHR and laboratory integrations
- Evaluation against representative, approved documentation datasets

---

<div align="center">

### 💜 Built by Team Vibranium

**🏆 Agentic AI- IIT Bhuwneshwar**

**Lokesh — Leader, Quantum University**  
**Jatin Saini — Co-leader, NGF College of Engineering & Technology**

*🧠 AI-assisted documentation. 🔗 Traceable sources. 🧑‍⚕️ Human judgment.*

</div>

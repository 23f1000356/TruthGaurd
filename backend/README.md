# TruthGuard Backend

A comprehensive FastAPI backend for fact-checking and misinformation detection using local LLMs, web search, and RAG (Retrieval-Augmented Generation).

## 🏗️ Architecture

```
backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── routes/                 # API endpoints
│   │   ├── verify.py           # Main verification endpoint
│   │   ├── kb.py               # Knowledge base management
│   │   ├── history.py          # Verification history
│   │   ├── projects.py         # Project management
│   │   ├── model_settings.py   # LLM configuration
│   │   ├── report.py           # Report generation
│   │   ├── admin.py            # Team management
│   │   ├── source_analyzer.py  # Source credibility analysis
│   │   └── graph.py            # Citation graph builder
│   ├── services/               # Core business logic
│   │   ├── claim_extractor.py  # Extract claims from text
│   │   ├── search_engine.py    # DuckDuckGo web search
│   │   ├── rag_retriever.py    # ChromaDB RAG retrieval
│   │   ├── llm.py              # LLM service (LocalAI/llama.cpp)
│   │   ├── autogen_service.py  # AutoGen debate (optional)
│   │   ├── credibility_analyzer.py  # Source credibility
│   │   └── exporter.py         # PDF/HTML/Markdown export
│   └── utils/                  # Utility functions
│       ├── parsers.py          # Text/PDF parsing
│       ├── scoring.py          # Confidence scoring
│       ├── json_mode.py         # JSON extraction
│       └── logging.py           # Logging utilities
├── config.py                   # Configuration settings
├── requirements.txt            # Python dependencies
├── .env.example               # Environment variables template
└── database/                  # Data storage
    ├── chroma/                # ChromaDB vector store
    ├── history_store.json     # Verification history
    ├── projects_store.json    # Projects data
    └── audit_log.json         # Audit logs
```

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Local LLM endpoint (LocalAI, llama.cpp, or TextGen WebUI)
- spaCy English model

### Installation

#### Windows Users
**If you encounter compilation errors**, see [INSTALL_WINDOWS.md](INSTALL_WINDOWS.md) for detailed solutions.

**Quick Windows Install:**
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
.\install.ps1  # Or follow manual steps below
```

#### Manual Installation

1. **Clone and navigate to backend:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Upgrade pip and install dependencies:**
```bash
python -m pip install --upgrade pip setuptools wheel
pip install --prefer-binary -r requirements.txt
```

**Note**: On Windows, if some packages fail to install, try:
```powershell
# Install core packages first
pip install fastapi uvicorn pydantic python-multipart python-dotenv httpx
pip install duckduckgo-search pypdf2 pdfplumber reportlab jinja2 markdown

# Then try optional packages
pip install numpy --prefer-binary
pip install sentence-transformers --prefer-binary
pip install chromadb --only-binary :all:
pip install spacy --prefer-binary
```

4. **Install spaCy model:**
```bash
python -m spacy download en_core_web_sm
```

5. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your settings
```

6. **Run the server:**
```bash
python run.py
# Or with uvicorn directly:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## ⚙️ Configuration

Edit `.env` file or set environment variables:

```env
# LLM Configuration
LLM_ENDPOINT=http://localhost:8080/v1/completions
LLM_MODEL=llama-3
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2048
LLM_STRICT_JSON=true

# Search Configuration
SEARCH_TOP_K=5
SEARCH_REGION=us-en

# RAG Configuration
CHROMA_DB_PATH=./database/chroma
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
RAG_TOP_K=5

# AutoGen (Optional)
AUTOGEN_ENABLED=false
AUTOGEN_ENDPOINT=http://localhost:8001
AUTOGEN_AGENT_COUNT=3

# Database Paths
HISTORY_STORE_PATH=./database/history_store.json
PROJECTS_STORE_PATH=./database/projects_store.json
AUDIT_LOG_PATH=./database/audit_log.json

# Security
API_KEY=your-secret-api-key-here
RATE_LIMIT_PER_MINUTE=60
MAX_FILE_SIZE_MB=10
```

## 📡 API Endpoints

### Verification

**POST `/verify/`**
- Main claim verification endpoint
- Extracts claims, searches web, queries KB, evaluates with LLM
- Request body:
```json
{
  "text": "Your text to verify",
  "mode": "single",  // or "debate"
  "top_k_search": 5,
  "use_llm_extraction": false
}
```

### Knowledge Base

**POST `/kb/upload-pdf`**
- Upload PDF to knowledge base
- Form data: `file`, `title` (optional), `tags` (optional)

**POST `/kb/add-web-source`**
- Add web source to KB
- Request body:
```json
{
  "url": "https://example.com",
  "title": "Optional title",
  "tags": ["tag1", "tag2"]
}
```

**GET `/kb/documents`**
- List all documents in KB

**DELETE `/kb/documents/{doc_id}`**
- Delete a document

**GET `/kb/search?query=...&top_k=5`**
- Search knowledge base

### History

**GET `/history/`**
- Get verification history (paginated)
- Query params: `limit`, `offset`

**GET `/history/{entry_id}`**
- Get specific history entry

**POST `/history/`**
- Add history entry

**DELETE `/history/{entry_id}`**
- Delete history entry

### Projects

**POST `/projects/`**
- Create new project
- Request body:
```json
{
  "name": "Project Name",
  "description": "Optional description"
}
```

**GET `/projects/`**
- List all projects

**GET `/projects/{project_id}`**
- Get project details

**POST `/projects/{project_id}/claims`**
- Add claim to project

**POST `/projects/{project_id}/export?format=pdf`
- Export project report (pdf, html, markdown)

**DELETE `/projects/{project_id}`**
- Delete project

### Model Settings

**GET `/model-settings/`**
- Get current LLM settings

**PUT `/model-settings/`**
- Update LLM settings

**POST `/model-settings/reset`**
- Reset to defaults

### Reports

**POST `/report/build`**
- Build and download report
- Request body:
```json
{
  "claims": [...],
  "format": "pdf",  // or "html", "markdown"
  "logo_path": "optional/path/to/logo.png",
  "footer_text": "Optional footer",
  "title": "Report Title"
}
```

### Source Analyzer

**POST `/analyze-source/`**
- Analyze source credibility
- Request body:
```json
{
  "url": "https://example.com"
}
```

**POST `/analyze-source/batch`**
- Analyze multiple sources
- Request body: `["url1", "url2", ...]`

### Citation Graph

**POST `/citation-graph/build`**
- Build citation graph
- Request body:
```json
{
  "claims": [...]
}
```

### Admin

**POST `/admin/invite`**
- Invite team member
- Request body:
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "role": "viewer"  // or "analyst", "admin"
}
```

**GET `/admin/team`**
- List team members

**PUT `/admin/team/{user_id}/role`**
- Update user role

**DELETE `/admin/team/{user_id}`**
- Remove team member

**GET `/admin/audit-logs`**
- Get audit logs (paginated)

## 🔄 Verification Pipeline

1. **Claim Extraction**: Uses spaCy or LLM to extract factual claims
2. **Web Search**: Searches DuckDuckGo for evidence
3. **KB Retrieval**: Queries ChromaDB for relevant documents
4. **Source Analysis**: Analyzes credibility of sources
5. **LLM Evaluation**: Uses local LLM to verify claims
6. **Result Aggregation**: Combines evidence and returns verdicts

## 🧪 Testing

Test the API with curl or any HTTP client:

```bash
# Health check
curl http://localhost:8000/health

# Verify text
curl -X POST http://localhost:8000/verify/ \
  -H "Content-Type: application/json" \
  -d '{"text": "Climate change is caused by human activities"}'

# List KB documents
curl http://localhost:8000/kb/documents
```

## 🐳 Docker Deployment

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - LLM_ENDPOINT=http://localai:8080/v1/completions
    volumes:
      - ./database:/app/database
    depends_on:
      - localai
      - chroma

  localai:
    image: localai/localai:latest
    ports:
      - "8080:8080"
    volumes:
      - ./models:/models

  chroma:
    image: chromadb/chroma:latest
    ports:
      - "8001:8000"
```

## 📝 Notes

- **Local LLM**: Ensure your LLM endpoint is running and accessible
- **ChromaDB**: Automatically creates database on first run
- **File Storage**: PDFs are processed in-memory, not stored
- **Rate Limiting**: Configure in settings (not yet implemented in code)
- **Security**: Add authentication middleware for production

## 🔧 Troubleshooting

**Issue**: spaCy model not found
- Solution: Run `python -m spacy download en_core_web_sm`

**Issue**: ChromaDB connection error
- Solution: Check `CHROMA_DB_PATH` exists and is writable

**Issue**: LLM endpoint unreachable
- Solution: Verify `LLM_ENDPOINT` is correct and LLM service is running

**Issue**: Import errors
- Solution: Ensure you're running from the backend directory or PYTHONPATH includes it

## 📚 Dependencies

- **FastAPI**: Web framework
- **LangChain**: LLM orchestration
- **ChromaDB**: Vector database
- **DuckDuckGo Search**: Web search
- **Sentence Transformers**: Embeddings
- **spaCy**: NLP for claim extraction
- **ReportLab**: PDF generation
- **Jinja2**: HTML templating

## 🤝 Contributing

1. Follow PEP 8 style guide
2. Add docstrings to all functions
3. Update README for new features
4. Test all endpoints before committing

## 📄 License

[Your License Here]


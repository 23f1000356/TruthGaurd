# TruthGuard

**An Agentic AI System for Automated Fact-Checking and Misinformation Detection**

TruthGuard is a comprehensive fact-checking platform that continuously scans content streams, autonomously verifies claims by cross-referencing credible sources, and generates accessible, contextual explanations tailored for diverse audiences. Built with FastAPI backend and React frontend, it leverages local LLMs, web search, and RAG (Retrieval-Augmented Generation) for accurate claim verification.

---

## 🎯 Problem Statement

In an era of information overload, distinguishing fact from fiction has become increasingly challenging. During global or local crises, misinformation spreads rapidly, making it difficult for individuals and organizations to verify claims manually. TruthGuard addresses this by providing:

- **Automated claim verification** using AI-powered analysis
- **Real-time fact-checking** during breaking news and crises
- **Source credibility assessment** to identify trustworthy information
- **Category-based organization** for efficient claim management
- **Comprehensive analytics** to track verification patterns

---

## ✨ Key Features

### 🔍 **Automatic Claim Verification**
- Extracts factual claims from text using NLP (spaCy) and LLM
- Verifies claims against web sources and knowledge base
- Provides verdicts: True, False, Misleading, or Unverified
- Confidence scoring for each verification

### 📚 **Knowledge Base Management**
- Upload PDF documents to build a curated knowledge base
- Add web sources for reference
- Document analysis with true/false content breakdown
- Automatic document summarization and accuracy assessment

### 📊 **Category-Based Project Organization**
- **Automatic category detection** (Politics, Games, Bollywood, News, Farmers, Animals, Sports, Technology, Health, Education, Business, Entertainment, Science, Environment)
- Claims automatically organized into category-based projects
- Dynamic project creation based on claim content

### ✅ **Review Queue System**
- Claims pending review with approve/reject workflow
- Approved claims section
- Rejected claims section
- Human-in-the-loop verification for critical claims

### 📈 **Analytics Dashboard**
- Real-time statistics on claims processed
- Accuracy rate tracking
- Verdict distribution visualization
- Trending topics analysis
- Source usage frequency
- Accuracy trends over time

### 🎨 **Modern User Interface**
- Clean, intuitive React-based frontend
- Real-time updates and dynamic data
- Responsive design for all devices
- Beautiful visualizations and charts

---

## 🏗️ Architecture

### **Frontend (React + TypeScript)**
```
src/
├── pages/              # Main application screens
│   ├── HomeScreen.tsx           # Claim input and verification
│   ├── ResultsScreen.tsx        # Verification results display
│   ├── ProjectsScreen.tsx       # Project/category management
│   ├── ProjectDetailsScreen.tsx # Project details with review queue
│   ├── KBManagerScreen.tsx      # Knowledge base management
│   ├── AnalyticsDashboard.tsx   # Analytics and statistics
│   └── HistoryScreen.tsx        # Verification history
├── components/         # Reusable UI components
│   ├── Navbar.tsx
│   ├── DocumentAnalysisModal.tsx
│   ├── EvidenceModal.tsx
│   └── ClaimDetailsModal.tsx
└── utils/             # API client and utilities
    └── api.ts
```

### **Backend (FastAPI + Python)**
```
backend/
├── app/
│   ├── main.py                    # FastAPI application
│   ├── routes/                    # API endpoints
│   │   ├── verify.py              # Claim verification
│   │   ├── kb.py                  # Knowledge base operations
│   │   ├── projects.py            # Project management
│   │   ├── analytics.py           # Analytics data
│   │   └── ...
│   ├── services/                  # Core business logic
│   │   ├── claim_extractor.py     # Extract claims from text
│   │   ├── search_engine.py       # DuckDuckGo web search
│   │   ├── rag_retriever.py       # ChromaDB vector search
│   │   ├── llm.py                 # LLM integration
│   │   ├── category_detector.py   # Automatic category detection
│   │   └── credibility_analyzer.py # Source credibility analysis
│   └── utils/                     # Helper functions
└── database/                      # Data storage
    ├── chroma/                    # Vector database
    ├── history_store.json         # Verification history
    └── projects_store.json        # Projects data
```

---

## 🚀 Quick Start

### **Prerequisites**
- **Node.js** 18+ and npm
- **Python** 3.9+
- **Local LLM** endpoint (LocalAI, llama.cpp, or compatible API)
- **spaCy** English model (`en_core_web_sm`)

### **Installation**

#### **1. Clone the Repository**
```bash
git clone https://github.com/23f1000356/TruthGaurd.git
cd TruthGaurd
```

#### **2. Backend Setup**
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
python -m pip install --upgrade pip
python -m pip install --prefer-binary -r requirements.txt

# Install spaCy model
python -m spacy download en_core_web_sm

# Configure environment
cp .env.example .env
# Edit .env with your LLM endpoint settings
```

#### **3. Frontend Setup**
```bash
# From project root
npm install
```

#### **4. Run the Application**

**Start Backend:**
```bash
cd backend
python run.py
# Server runs on http://localhost:8000
```

**Start Frontend:**
```bash
# From project root
npm run dev
# App runs on http://localhost:5173
```

---

## ⚙️ Configuration

### **Backend Configuration (.env)**
```env
# LLM Configuration
LLM_ENDPOINT=http://localhost:8080/v1/completions
LLM_MODEL=llama-3
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2048

# Search Configuration
SEARCH_TOP_K=5
SEARCH_REGION=us-en

# RAG Configuration
CHROMA_DB_PATH=./database/chroma
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
RAG_TOP_K=5

# Database Paths
HISTORY_STORE_PATH=./database/history_store.json
PROJECTS_STORE_PATH=./database/projects_store.json
```

### **Frontend Configuration**
Create `.env` file in root directory:
```env
VITE_API_URL=http://localhost:8000
```

---

## 📖 Usage Guide

### **1. Verify Claims**
1. Navigate to **Home** screen
2. Enter text containing claims to verify
3. Click **Verify Claims**
4. View results with verdicts, confidence scores, and evidence

### **2. Upload Documents to Knowledge Base**
1. Go to **KB Manager**
2. Drag & drop PDF files or click **Upload PDF**
3. Documents are automatically indexed and stored
4. Click **View Analysis** to see document analysis:
   - Document summary
   - Overall accuracy assessment
   - True/False/Misleading breakdown
   - Detailed claim-by-claim results

### **3. Manage Projects/Categories**
1. Go to **Projects** screen
2. Projects are automatically created based on claim categories
3. Click on a project to view:
   - Overview with statistics
   - All claims in the project
   - Review queue (pending claims)
   - Approved/Rejected sections

### **4. Review Claims**
1. Open a project
2. Go to **Review Queue** tab
3. Review pending claims
4. **Approve** or **Reject** claims
5. Approved claims move to approved section
6. Rejected claims move to rejected section

### **5. View Analytics**
1. Navigate to **Analytics** dashboard
2. View real-time statistics:
   - Claims processed
   - Accuracy rate
   - Verdict distribution
   - Trending topics
   - Top sources
   - Accuracy trends

---

## 🔌 API Endpoints

### **Verification**
- `POST /verify/` - Verify claims in text
  ```json
  {
    "text": "Your text here",
    "mode": "single",
    "top_k_search": 5,
    "use_llm_extraction": false
  }
  ```

### **Knowledge Base**
- `POST /kb/upload-pdf` - Upload PDF document
- `POST /kb/add-web-source` - Add web source
- `GET /kb/documents` - List all documents
- `GET /kb/documents/{doc_id}/analyze` - Analyze document
- `DELETE /kb/documents/{doc_id}` - Delete document

### **Projects**
- `GET /projects/` - List all projects
- `GET /projects/{project_id}` - Get project details
- `PUT /projects/{project_id}/claims/{claim_id}/approve` - Approve claim
- `PUT /projects/{project_id}/claims/{claim_id}/reject` - Reject claim

### **Analytics**
- `GET /analytics/` - Get analytics data

### **History**
- `GET /history/` - Get verification history
- `POST /history/` - Add history entry

For complete API documentation, see [backend/README.md](backend/README.md)

---

## 🎯 Key Workflows

### **Automatic Category Detection & Project Creation**
1. User submits a claim for verification
2. System verifies the claim
3. **Category is automatically detected** (e.g., "politics", "bollywood")
4. **Project is created/found** with category name
5. Claim is added to that project with `review_status: "pending"`

### **Document Analysis Workflow**
1. Upload PDF to Knowledge Base
2. Document is processed and stored in ChromaDB
3. Click **View Analysis**
4. System:
   - Extracts all claims from document
   - Verifies each claim
   - Generates document summary
   - Calculates overall accuracy
   - Shows detailed breakdown

### **Review Queue Workflow**
1. Claims are added to projects with `review_status: "pending"`
2. User reviews claims in **Review Queue** tab
3. **Approve** → Claim moves to "Approved" section
4. **Reject** → Claim moves to "Rejected" section
5. Overview statistics update dynamically

---

## 🛠️ Technology Stack

### **Frontend**
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Lucide React** - Icons

### **Backend**
- **FastAPI** - Web framework
- **Python 3.9+** - Programming language
- **ChromaDB** - Vector database for RAG
- **spaCy** - NLP for claim extraction
- **Sentence Transformers** - Embeddings
- **DuckDuckGo Search** - Web search
- **Local LLM** - Claim verification (Llama, LocalAI, etc.)

---

## 📊 Features in Detail

### **1. Multi-Method Claim Extraction**
- **spaCy NLP**: Dependency parsing for accurate extraction
- **LLM-based**: Better recall for implicit claims
- **Pattern-based**: Fallback for reliability
- All methods run in parallel and results are combined

### **2. Evidence Gathering**
- **Web Search**: Real-time sources via DuckDuckGo
- **Knowledge Base**: Curated documents via RAG
- **Source Credibility**: Trust scoring for each source

### **3. Verification Methods**
- **Single Mode**: Standard LLM verification
- **Debate Mode**: Multi-agent consensus (AutoGen)
- **Confidence Scoring**: Uncertainty quantification

### **4. Document Analysis**
- Automatic claim extraction from documents
- Verification of all claims
- Summary generation
- Overall accuracy assessment
- True/False/Misleading breakdown

---

## 🔒 Privacy & Security

- **Local LLM Option**: Process data on-premise
- **No External API Keys Required**: Works with local models
- **Data Storage**: All data stored locally
- **Privacy-Focused Search**: Uses DuckDuckGo (no tracking)

---

## 📝 Project Structure

```
TruthGuard/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   ├── database/           # Data storage
│   ├── requirements.txt
│   └── README.md
├── src/                    # React frontend
│   ├── pages/             # Application screens
│   ├── components/        # UI components
│   └── utils/            # API client
├── package.json
├── vite.config.ts
└── README.md             # This file
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

[Your License Here]

---

## 🙏 Acknowledgments

- Built for Mumbai Hacks 2025
- Uses open-source technologies: FastAPI, React, ChromaDB, spaCy
- Privacy-focused design with local LLM support

---

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

**Repository**: https://github.com/23f1000356/TruthGaurd

---

## 🚀 Future Enhancements

- [ ] Real-time content stream monitoring
- [ ] Crisis detection algorithms
- [ ] Multi-language support
- [ ] Browser extension
- [ ] Mobile applications
- [ ] Advanced visualization features
- [ ] Team collaboration features
- [ ] API marketplace

---

**TruthGuard** - Guarding the truth, one claim at a time. 🛡️



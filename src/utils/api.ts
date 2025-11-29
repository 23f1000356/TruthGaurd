/**
 * API Client for TruthGuard Backend
 * Handles all communication with the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return { data };
      } else {
        return { data: null as T };
      }
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Verification API
  async verifyClaims(text: string, mode: 'single' | 'debate' = 'single', topK: number = 5, useLLMExtraction: boolean = false) {
    return this.request<{
      claims: Array<{
        id: number;
        text: string;
        verdict: 'true' | 'false' | 'misleading' | 'unverified';
        confidence: number;
        explanation: string;
        citations: string[];
        evidence_count: number;
        source_credibility: number;
        evidence: Array<{
          title: string;
          url?: string;
          snippet?: string;
          text?: string;
          source: string;
          type: 'web' | 'kb';
        }>;
      }>;
      processing_time: number;
      llm_results?: Array<{
        id: number;
        text: string;
        verdict: 'true' | 'false' | 'misleading' | 'unverified';
        confidence: number;
        explanation: string;
        citations: string[];
        evidence_count: number;
        source_credibility: number;
        evidence: Array<{
          title: string;
          url?: string;
          snippet?: string;
          text?: string;
          source: string;
          type: 'web' | 'kb';
        }>;
        method: string;
      }>;
      ddg_results?: Array<{
        id: number;
        text: string;
        verdict: 'true' | 'false' | 'misleading' | 'unverified';
        confidence: number;
        explanation: string;
        citations: string[];
        evidence_count: number;
        source_credibility: number;
        evidence: Array<{
          title: string;
          url?: string;
          snippet?: string;
          text?: string;
          source: string;
          type: 'web' | 'kb';
        }>;
        method: string;
      }>;
    }>('/verify/', {
      method: 'POST',
      body: JSON.stringify({
        text,
        mode,
        top_k_search: topK,
        use_llm_extraction: useLLMExtraction,
      }),
    });
  }

  // Knowledge Base API
  async uploadPDF(file: File, title?: string, tags?: string[]) {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return {
        error: 'Only PDF files are supported',
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (tags && tags.length > 0) formData.append('tags', tags.join(','));

    try {
      const response = await fetch(`${this.baseUrl}/kb/upload-pdf`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary for FormData
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        const errorMessage = error.detail || error.message || `HTTP error! status: ${response.status}`;
        console.error('PDF upload error:', errorMessage);
        return {
          error: errorMessage,
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('PDF upload exception:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to upload PDF',
      };
    }
  }

  async addWebSource(url: string, title?: string, tags?: string[]) {
    return this.request<{
      success: boolean;
      doc_id: string;
      title: string;
      url: string;
      text_length: number;
    }>('/kb/add-web-source', {
      method: 'POST',
      body: JSON.stringify({
        url,
        title,
        tags: tags || [],
      }),
    });
  }

  async listDocuments() {
    return this.request<Array<{
      id: string;
      title: string;
      source: string;
      tags: string[];
      added_at: string;
      chunk_count: number;
    }>>('/kb/documents');
  }

  async deleteDocument(docId: string) {
    return this.request<{ success: boolean; doc_id: string }>(`/kb/documents/${docId}`, {
      method: 'DELETE',
    });
  }

  async searchKB(query: string, topK: number = 5) {
    return this.request<{
      query: string;
      results: Array<{
        text: string;
        metadata: Record<string, any>;
        distance?: number;
        id: string;
      }>;
    }>(`/kb/search?query=${encodeURIComponent(query)}&top_k=${topK}`);
  }

  async analyzeDocument(docId: string) {
    return this.request<{
      doc_id: string;
      total_claims: number;
      statistics: {
        true: number;
        false: number;
        misleading: number;
        unverified: number;
      };
      percentages: {
        true: number;
        false: number;
        misleading: number;
        unverified: number;
      };
      claims: Array<{
        id: number;
        text: string;
        verdict: 'true' | 'false' | 'misleading' | 'unverified';
        confidence: number;
        explanation: string;
        evidence_count: number;
        source_credibility: number;
      }>;
      summary?: string;
      overall_accuracy?: string;
      accuracy_assessment?: string;
    }>(`/kb/documents/${docId}/analyze`);
  }

  // History API
  async getHistory(limit: number = 50, offset: number = 0) {
    return this.request<{
      entries: Array<{
        id: string;
        timestamp: string;
        text: string;
        claims: Array<any>;
        processing_time: number;
      }>;
      total: number;
    }>(`/history/?limit=${limit}&offset=${offset}`);
  }

  async addHistoryEntry(entry: {
    id: string;
    timestamp: string;
    text: string;
    claims: Array<any>;
    processing_time: number;
  }) {
    return this.request<{ success: boolean; id: string }>('/history/', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async deleteHistoryEntry(entryId: string) {
    return this.request<{ success: boolean; id: string }>(`/history/${entryId}`, {
      method: 'DELETE',
    });
  }

  // Projects API
  async createProject(name: string, description?: string) {
    return this.request<{
      id: string;
      name: string;
      description?: string;
      created_at: string;
      updated_at: string;
      claims: Array<any>;
      status: string;
    }>('/projects/', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async listProjects() {
    return this.request<Array<{
      id: string;
      name: string;
      description?: string;
      created_at: string;
      updated_at: string;
      claims: Array<any>;
      status: string;
    }>>('/projects/');
  }

  async getProject(projectId: string) {
    return this.request<{
      id: string;
      name: string;
      description?: string;
      created_at: string;
      updated_at: string;
      claims: Array<any>;
      status: string;
    }>(`/projects/${projectId}`);
  }

  async addClaimToProject(projectId: string, claim: any) {
    return this.request<{ success: boolean; claim_count: number }>(`/projects/${projectId}/claims`, {
      method: 'POST',
      body: JSON.stringify({ claim }),
    });
  }

  async approveClaim(projectId: string, claimId: string) {
    return this.request<{ success: boolean; review_status: string }>(`/projects/${projectId}/claims/${claimId}/approve`, {
      method: 'PUT',
    });
  }

  async rejectClaim(projectId: string, claimId: string) {
    return this.request<{ success: boolean; review_status: string }>(`/projects/${projectId}/claims/${claimId}/reject`, {
      method: 'PUT',
    });
  }

  // Analytics API
  async getAnalytics() {
    return this.request<{
      stats: {
        claims_processed: number;
        claims_change: number;
        accuracy_rate: number;
        accuracy_change: number;
        manual_corrections: number;
        corrections_change: number;
        active_users: number;
        users_change: number;
      };
      verdict_distribution: Array<{
        verdict: string;
        count: number;
        percentage: number;
      }>;
      trending_topics: Array<{
        topic: string;
        searches: number;
        trend: string;
      }>;
      top_sources: Array<{
        domain: string;
        count: number;
      }>;
      accuracy_over_time: Array<{
        week: string;
        accuracy: number;
      }>;
    }>('/analytics/');
  }

  async exportProject(projectId: string, format: 'pdf' | 'html' | 'markdown', logoPath?: string, footerText?: string) {
    const params = new URLSearchParams({ format });
    const url = `${this.baseUrl}/projects/${projectId}/export?${params}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logo_path: logoPath, footer_text: footerText }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${projectId}_report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      return { data: { success: true } };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  // Source Analyzer API
  async analyzeSource(url: string) {
    return this.request<{
      domain: string;
      url: string;
      trust_score: number;
      domain_age?: string;
      is_fact_checker: boolean;
      is_academic: boolean;
      is_unreliable: boolean;
      bias: string;
      popularity: string;
      metrics: Record<string, any>;
    }>('/analyze-source/', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  // Report Builder API
  async buildReport(claims: Array<any>, format: 'pdf' | 'html' | 'markdown', logoPath?: string, footerText?: string, title?: string) {
    const url = `${this.baseUrl}/report/build`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claims,
          format,
          logo_path: logoPath,
          footer_text: footerText,
          title: title || 'Fact-Check Report',
        }),
      });

      if (!response.ok) {
        throw new Error(`Report generation failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `report_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      return { data: { success: true } };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Report generation failed',
      };
    }
  }

  // Model Settings API
  async getModelSettings() {
    return this.request<{
      llm_endpoint: string;
      llm_model: string;
      temperature: number;
      max_tokens: number;
      strict_json: boolean;
      autogen_enabled: boolean;
      autogen_endpoint?: string;
      autogen_agent_count: number;
    }>('/model-settings/');
  }

  async updateModelSettings(settings: Partial<{
    llm_endpoint: string;
    llm_model: string;
    temperature: number;
    max_tokens: number;
    strict_json: boolean;
    autogen_enabled: boolean;
    autogen_endpoint: string;
    autogen_agent_count: number;
  }>) {
    return this.request('/model-settings/', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Citation Graph API
  async buildCitationGraph(claims: Array<any>) {
    return this.request<{
      nodes: Array<{
        id: string;
        label: string;
        type: 'claim' | 'evidence' | 'source';
        data: Record<string, any>;
      }>;
      edges: Array<{
        source: string;
        target: string;
        label?: string;
        weight?: number;
      }>;
    }>('/citation-graph/build', {
      method: 'POST',
      body: JSON.stringify({ claims }),
    });
  }

  // Health Check
  async healthCheck() {
    return this.request<{ status: string; version: string }>('/health');
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;


"""
Web Search Service using DuckDuckGo
"""
from typing import List, Dict, Optional
import httpx
from bs4 import BeautifulSoup

# Try new package name first, fallback to old one
try:
    from ddgs import DDGS
except ImportError:
    try:
        from duckduckgo_search import DDGS
        import warnings
        warnings.warn(
            "duckduckgo_search is deprecated. Please install 'ddgs' instead: pip install ddgs",
            DeprecationWarning,
            stacklevel=2
        )
    except ImportError:
        raise ImportError(
            "Neither 'ddgs' nor 'duckduckgo_search' is installed. "
            "Install with: pip install ddgs"
        )


class SearchEngine:
    def __init__(self, top_k: int = 5, region: str = "us-en"):
        """
        Initialize search engine
        
        Args:
            top_k: Number of search results to return
            region: Search region (e.g., "us-en", "uk-en")
        """
        self.top_k = top_k
        self.region = region
    
    def search(self, query: str, max_results: Optional[int] = None) -> List[Dict[str, str]]:
        """
        Search for information about a claim
        
        Args:
            query: Search query
            max_results: Maximum number of results (defaults to top_k)
            
        Returns:
            List of search results with title, url, and snippet
        """
        if not query or len(query.strip()) < 3:
            return []
        
        max_results = max_results or self.top_k
        results = []
        
        try:
            with DDGS() as ddgs:
                search_results = list(ddgs.text(
                    query,
                    max_results=max_results,
                    region=self.region
                ))
                
                for result in search_results:
                    results.append({
                        "title": result.get("title", ""),
                        "url": result.get("href", ""),
                        "snippet": result.get("body", ""),
                        "source": self._extract_domain(result.get("href", ""))
                    })
        except Exception as e:
            print(f"Search error: {e}")
            # Return empty results on error
            return []
        
        return results
    
    def _extract_domain(self, url: str) -> str:
        """Extract domain from URL"""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            domain = parsed.netloc.replace("www.", "")
            return domain
        except:
            return url
    
    def fetch_page_content(self, url: str) -> Optional[str]:
        """
        Fetch and extract text content from a webpage
        
        Args:
            url: URL to fetch
            
        Returns:
            Extracted text content or None if failed
        """
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            
            with httpx.Client(timeout=10.0, headers=headers) as client:
                response = client.get(url)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, "html.parser")
                
                # Remove script and style elements
                for script in soup(["script", "style"]):
                    script.decompose()
                
                # Get text
                text = soup.get_text()
                
                # Clean up whitespace
                lines = (line.strip() for line in text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                text = " ".join(chunk for chunk in chunks if chunk)
                
                return text[:5000]  # Limit to 5000 characters
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return None
    
    def search_with_content(self, query: str) -> List[Dict[str, any]]:
        """
        Search and fetch full content for top results
        
        Args:
            query: Search query
            
        Returns:
            List of results with fetched content
        """
        results = self.search(query, max_results=3)  # Fetch content for top 3
        
        for result in results:
            content = self.fetch_page_content(result["url"])
            result["content"] = content
        
        return results


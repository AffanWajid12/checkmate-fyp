from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, UnstructuredPDFLoader
try:
    from rank_bm25 import BM25Okapi
except Exception:  # pragma: no cover
    BM25Okapi = None

import os
import re
from typing import Any, Dict, List, Optional
from dataclasses import dataclass


@dataclass
class RAGResult:
    """Container for RAG search results"""
    content: str
    score: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


class RAGService:
    """Service for handling PDF document processing and RAG functionality"""
    
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 100):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            is_separator_regex=False
        )
        self._bm25: Optional[BM25Okapi] = None
        self._tokenized_docs: List[List[str]] = []
        self.documents: List[Any] = []

    def _tokenize(self, text: str) -> List[str]:
        # Simple, dependency-free tokenizer suitable for BM25.
        # Keeps alphanumerics; lowercases.
        return re.findall(r"[a-zA-Z0-9]+", (text or "").lower())

    def _load_texts_via_langchain(self, pdf_paths: List[str]) -> List[str]:
        """Load and process PDF files into text chunks"""
        out: List[str] = []
        for p in pdf_paths:
            if not os.path.exists(p):
                print(f"File not found: {p}")
                continue

            print(f"\nProcessing {p}...")
            docs = []
            
            # Try PyPDFLoader first
            try:
                print("Attempting PyPDFLoader...")
                loader = PyPDFLoader(p)
                docs = loader.load()
                print(f"Successfully loaded {len(docs)} pages with PyPDFLoader")
            except Exception as e:
                print(f"PyPDFLoader error: {str(e)}")
                docs = []

            # Fallback to UnstructuredPDFLoader
            if not docs:
                try:
                    print("Attempting UnstructuredPDFLoader...")
                    loader = UnstructuredPDFLoader(p)
                    docs = loader.load()
                    print(f"Successfully loaded {len(docs)} pages with UnstructuredPDFLoader")
                except Exception as e:
                    print(f"UnstructuredPDFLoader error: {str(e)}")
                    docs = []

            if docs:
                print(f"Processing {len(docs)} pages of content...")
                for i, d in enumerate(docs):
                    header = f"Source: {os.path.basename(p)} -- Page {i+1}/{len(docs)}\n"
                    content = d.page_content.strip() if d.page_content else ""
                    if content:  # Only add non-empty pages
                        out.append(header + content)
                        print(f"Added page {i+1} ({len(content)} chars)")
            else:
                msg = f"Could not load {p} via any PDF loader"
                print(msg)
                out.append(msg)

        return out


    def load_pdfs(self, pdf_paths: List[str]) -> None:
        """Load PDFs and prepare them for RAG"""
        # Load texts from PDFs
        texts = self._load_texts_via_langchain(pdf_paths)
        
        # Split into documents
        print("\nSplitting texts into chunks...")
        self.documents = self.text_splitter.create_documents(texts)
        print(f"Created {len(self.documents)} chunks")

        # Build BM25 index (optional dependency)
        self._tokenized_docs = [self._tokenize(d.page_content) for d in self.documents]
        if BM25Okapi is None:
            self._bm25 = None
            print("BM25 unavailable (rank-bm25 not installed); RAG search disabled")
        else:
            self._bm25 = BM25Okapi(self._tokenized_docs)
            print("BM25 index created successfully")

    def add_texts(self, texts: List[str]) -> None:
        """Add additional texts to the RAG knowledge base"""
        new_documents = self.text_splitter.create_documents(texts)
        self.documents.extend(new_documents)

        # Rebuild BM25 index (simple and fine for expected scale)
        self._tokenized_docs = [self._tokenize(d.page_content) for d in self.documents]
        if BM25Okapi is None:
            self._bm25 = None
        else:
            self._bm25 = BM25Okapi(self._tokenized_docs)

    def search(self, query: str, k: int = 3) -> List[RAGResult]:
        """
        Search the vector store for relevant content.
        Returns list of RAGResult objects containing content and similarity scores.
        """
        if not self._bm25:
            raise ValueError("No documents have been loaded yet.")

        tokens = self._tokenize(query)
        scores = self._bm25.get_scores(tokens)
        ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)[:k]
        out: List[RAGResult] = []
        for idx, score in ranked:
            doc = self.documents[idx]
            out.append(
                RAGResult(
                    content=doc.page_content,
                    score=float(score),
                    metadata=doc.metadata if hasattr(doc, "metadata") else None,
                )
            )
        return out

    def get_document_count(self) -> int:
        """Return the number of document chunks in the knowledge base"""
        return len(self.documents)
        
    def clear(self) -> None:
        """Clear all documents from the knowledge base"""
        self.documents = []
        self._tokenized_docs = []
        self._bm25 = None


# Example usage
if __name__ == "__main__":
    import tempfile
    import argparse
    import shutil
    from pathlib import Path

    # Set up argument parser
    parser = argparse.ArgumentParser(description="Process PDF file for RAG")
    parser.add_argument("--pdf", type=str, required=True, help="Path to the PDF file to process")
    parser.add_argument("--query", type=str, help="Query to test search (optional)")
    args = parser.parse_args()

    # Create a temporary directory for processing
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Copy PDF to temp directory
            pdf_path = Path(args.pdf)
            if not pdf_path.exists():
                print(f"Error: PDF file {pdf_path} not found")
                exit(1)

            temp_pdf = Path(temp_dir) / pdf_path.name
            shutil.copy2(pdf_path, temp_pdf)
            print(f"PDF copied to temporary location: {temp_pdf}")

            # Initialize and use the RAG service
            rag_service = RAGService()
            rag_service.load_pdfs([str(temp_pdf)])
            print(f"\nProcessed {rag_service.get_document_count()} chunks from the PDF")

            # Test search if query provided
            if args.query:
                print(f"\nTesting search with query: {args.query}")
                results = rag_service.search(args.query, k=3)
                
                print("\nSearch Results:")
                for i, result in enumerate(results, 1):
                    print(f"\nResult {i}:")
                    print(f"Content: {result.content}")
                    if result.score is not None:
                        print(f"Score: {result.score}")
                    if result.metadata:
                        print(f"Metadata: {result.metadata}")

        except Exception as e:
            print(f"Error processing PDF: {str(e)}")
        
        finally:
            # Cleanup
            print("\nCleaning up temporary files...")
            # The tempfile.TemporaryDirectory context manager will automatically
            # delete the temporary directory and its contents
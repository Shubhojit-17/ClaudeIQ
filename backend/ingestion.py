"""
ClauseIQ — Document Ingestion Pipeline (Text Extraction & Semantic Clause Chunking)
===================================================================================
Handles:
  1. PDF text extraction via PyPDF2 / PyMuPDF
  2. DOCX text extraction via python-docx
  3. Text cleaning & normalization
  4. Semantic clause splitting based on legal document patterns (Sections, Articles, Numbers)
"""

import io
import re
from typing import List, Tuple


class DocumentExtractor:
    """Extracts raw text from uploaded contract documents (.pdf, .docx, .txt)."""

    @staticmethod
    def extract_from_pdf(file_bytes: bytes) -> str:
        """Extracts text from PDF file bytes."""
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            return "\n\n".join(text_parts)
        except Exception as exc:
            raise ValueError(f"Failed to parse PDF document: {exc}")

    @staticmethod
    def extract_from_docx(file_bytes: bytes) -> str:
        """Extracts text from DOCX file bytes."""
        try:
            import docx
            doc = docx.Document(io.BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n\n".join(paragraphs)
        except Exception as exc:
            raise ValueError(f"Failed to parse DOCX document: {exc}")

    @classmethod
    def extract_text(cls, file_name: str, file_bytes: bytes) -> str:
        lower_name = file_name.lower()
        if lower_name.endswith(".pdf"):
            return cls.extract_from_pdf(file_bytes)
        elif lower_name.endswith(".docx"):
            return cls.extract_from_docx(file_bytes)
        elif lower_name.endswith(".txt"):
            return file_bytes.decode("utf-8", errors="replace")
        else:
            # Fallback text decoder
            return file_bytes.decode("utf-8", errors="replace")


class ClauseChunker:
    """
    Splits extracted contract text into distinct semantic clauses.
    Uses regex patterns to identify Section headings, Articles, and numbered clauses.
    """

    HEADING_PATTERN = re.compile(
        r"(?=(?:^|\n)(?:\s*(?:Section|Article|Clause)\s+[\d\.]+|[\d]+\.[\d]+\b|[A-Z\s]{4,}:))",
        re.MULTILINE | re.IGNORECASE,
    )

    @classmethod
    def chunk_contract_text(cls, raw_text: str, min_chars: int = 50) -> List[str]:
        """
        Splits text into logical clauses.
        Filters out short fragments, headers, or empty lines.
        """
        if not raw_text or not raw_text.strip():
            return []

        # Split using heading pattern
        raw_chunks = cls.HEADING_PATTERN.split(raw_text)

        cleaned_clauses: List[str] = []
        for chunk in raw_chunks:
            chunk_clean = " ".join(chunk.split()).strip()
            if len(chunk_clean) >= min_chars:
                cleaned_clauses.append(chunk_clean)

        # Fallback if text didn't contain explicit Section/Article headers:
        if not cleaned_clauses:
            paragraphs = [p.strip() for p in raw_text.split("\n\n") if len(p.strip()) >= min_chars]
            cleaned_clauses = [" ".join(p.split()) for p in paragraphs]

        # Final fallback: if document is one solid block
        if not cleaned_clauses and raw_text.strip():
            cleaned_clauses = [" ".join(raw_text.split()).strip()]

        return cleaned_clauses


def process_document(file_name: str, file_bytes: bytes) -> Tuple[str, List[str]]:
    """
    Full ingestion pipeline:
    Accepts raw file bytes -> Extracts full text -> Chunks into semantic clauses.
    """
    raw_text = DocumentExtractor.extract_text(file_name, file_bytes)
    clauses = ClauseChunker.chunk_contract_text(raw_text)
    return raw_text, clauses

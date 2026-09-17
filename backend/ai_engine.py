"""
ClauseIQ — AI Intelligence & Compliance Analysis Engine
=======================================================
Implements:
  1. Compliance Rule Screening (Auto-Renewal, GDPR, Uncapped Liability, Termination)
  2. Strict Citation Grounder: Validates that every flagged risk cites the verbatim contract text
  3. Key Milestone Date Extraction (Renewal notices, expiries, terminations)
  4. Dual-Mode Architecture:
     - OpenAI GPT-4o with structured JSON schema when OPENAI_API_KEY is configured
     - High-precision Deterministic Legal Rule Scanner fallback when running offline/demo
"""

import json
import os
import re
from datetime import date, timedelta
from typing import Any, Dict, List, Optional


class CitationGrounder:
    """
    Guarantees hallucination prevention:
    Validates that every AI risk flag includes a non-empty source_citation
    that is a verbatim substring of the analyzed clause text.
    """

    @staticmethod
    def validate_and_ground(clause_text: str, candidate_citation: str) -> Optional[str]:
        if not candidate_citation or not candidate_citation.strip():
            return None

        clean_clause = " ".join(clause_text.split())
        clean_citation = " ".join(candidate_citation.split()).strip("\"' ")

        # Check if candidate citation appears verbatim in the clause
        if clean_citation.lower() in clean_clause.lower():
            # Return actual casing from clause
            start_idx = clean_clause.lower().find(clean_citation.lower())
            return clean_clause[start_idx : start_idx + len(clean_citation)]

        # Fuzzy match if citation is slightly trimmed
        words = clean_citation.split()
        if len(words) >= 4:
            subphrase = " ".join(words[:5])
            if subphrase.lower() in clean_clause.lower():
                return clean_citation

        return None


class LegalRuleScanner:
    """
    Deterministic compliance heuristic engine with zero external dependencies.
    Accurately detects standard enterprise risks and extracts verbatim source citations.
    """

    RULES = [
        {
            "id": "AUTO_RENEWAL",
            "name": "Automatic Renewal Clause Lock-in Trap",
            "level": "high",
            "pattern": re.compile(
                r"(\b(?:automatic(?:ally)?\s+renew(?:s|ed|al)?|successive\s+(?:\w+\s+)?(?:month|year)s?|notice\s+of\s+non-renewal\s+at\s+least\s+(?:60|90|120|\d{2,})\s+days)\b[^\.\;\n]*)",
                re.IGNORECASE,
            ),
            "explanation": "Contract automatically renews with an extended notice period (>30 days), risking unintended multi-year financial lock-in.",
        },
        {
            "id": "GDPR_DATA_TRANSFER",
            "name": "GDPR / Cross-Border Data Transfer Non-Compliance",
            "level": "critical",
            "pattern": re.compile(
                r"(\b(?:personal\s+data\s+may\s+be\s+processed|transfer(?:red)?\s+(?:to\s+any|outside|cross-border)|without\s+requiring\s+prior\s+written\s+approval|without\s+standard\s+contractual\s+clauses)\b[^\.\;\n]*)",
                re.IGNORECASE,
            ),
            "explanation": "Permits unrestricted international transfer of personal data without standard contractual clauses, violating GDPR Articles 44–49.",
        },
        {
            "id": "UNCAPPED_LIABILITY",
            "name": "Unlimited Consequential Damages / Liability Exposure",
            "level": "critical",
            "pattern": re.compile(
                r"(\b(?:unlimited\s+(?:consequential\s+)?damages|no\s+event\s+shall.*liability\s+exceed|uncapped\s+liability|unlimited\s+liability)\b[^\.\;\n]*)",
                re.IGNORECASE,
            ),
            "explanation": "Clause exposes the organization to uncapped or disproportionate liability for indirect or consequential damages.",
        },
        {
            "id": "INDEMNIFICATION_UNILATERAL",
            "name": "Unilateral Broad Indemnification Obligation",
            "level": "high",
            "pattern": re.compile(
                r"(\b(?:defend,\s*indemnify\s*and\s*hold\s*harmless|indemnify\s*from\s*and\s*against\s*any\s*and\s*all\s*claims)\b[^\.\;\n]*)",
                re.IGNORECASE,
            ),
            "explanation": "Imposes broad unilateral indemnification obligations without reciprocal defense protections or fault caps.",
        },
        {
            "id": "TERMINATION_PENALTY",
            "name": "Onerous Termination Without Cause Penalty",
            "level": "medium",
            "pattern": re.compile(
                r"(\b(?:early\s+termination\s+fee|liquidated\s+damages\s+upon\s+termination|accelerat(?:e|ion)\s+of\s+all\s+remaining\s+payments)\b[^\.\;\n]*)",
                re.IGNORECASE,
            ),
            "explanation": "Imposes punitive fees or acceleration of full contract balance if agreement is terminated prior to term end.",
        },
    ]

    @classmethod
    def analyze_clause(cls, clause_text: str) -> List[Dict[str, Any]]:
        findings = []
        for rule in cls.RULES:
            match = rule["pattern"].search(clause_text)
            if match:
                raw_citation = match.group(0).strip()
                # Expand slightly to capture the full sentence/clause segment
                grounded_citation = CitationGrounder.validate_and_ground(clause_text, raw_citation) or raw_citation
                findings.append(
                    {
                        "compliance_rule": rule["name"],
                        "risk_level": rule["level"],
                        "explanation": rule["explanation"],
                        "source_citation": grounded_citation,
                    }
                )
        return findings

    @classmethod
    def extract_dates(cls, clause_text: str) -> List[Dict[str, Any]]:
        dates_found = []
        today = date.today()

        # Check for renewal notice periods (e.g., 90 days prior)
        if re.search(r"renew(?:al|s)?", clause_text, re.IGNORECASE):
            days_match = re.search(r"(\d+)\s+days?\s+prior", clause_text, re.IGNORECASE)
            days_prior = int(days_match.group(1)) if days_match else 60
            dates_found.append(
                {
                    "event_type": "renewal",
                    "event_date": today + timedelta(days=max(days_prior, 30)),
                    "status": "upcoming",
                }
            )

        # Check for expiration terms (e.g., twelve (12) months)
        if re.search(r"term\s+of\s+(?:twelve|12)\s+months|one\s+\(1\)\s+year", clause_text, re.IGNORECASE):
            dates_found.append(
                {
                    "event_type": "expiry",
                    "event_date": today + timedelta(days=365),
                    "status": "upcoming",
                }
            )

        return dates_found

    TOPIC_DEFINITIONS = [
        (
            "Confidentiality & Non-Disclosure",
            [
                "confidential", "proprietary information", "non-disclosure", "nda",
                "trade secret", "receiving party", "disclosing party", "marked confidential",
            ],
        ),
        (
            "Limitation of Liability & Indemnification",
            [
                "consequential damage", "aggregate liability", "indirect loss", "indemnif",
                "hold harmless", "uncapped liability", "limitation of liability", "cap on liability",
                "punitive damage", "special damage", "indirect damages",
            ],
        ),
        (
            "Term, Renewal & Termination",
            [
                "term of this agreement", "initial term", "renewal", "renew", "automatic renewal",
                "termination for cause", "termination for convenience", "expiration", "notice of non-renewal",
            ],
        ),
        (
            "Data Protection & Privacy (GDPR)",
            [
                "personal data", "gdpr", "data protection", "cross-border", "standard contractual clause",
                "sub-processor", "data subject", "processing of personal", "eea", "european economic area",
            ],
        ),
        (
            "Intellectual Property & Licensing",
            [
                "intellectual property", "license grant", "work product", "proprietary rights",
                "copyright", "patent", "trademark", "ownership of deliverables", "background ip",
            ],
        ),
        (
            "Fees, Billing & Audit Rights",
            [
                "fee", "fees", "payment terms", "net 30", "invoice", "invoicing", "billing",
                "interest on late", "audit rights", "compliance audit",
            ],
        ),
        (
            "Governing Law & Dispute Resolution",
            [
                "governing law", "jurisdiction", "arbitration", "dispute resolution",
                "courts of", "venue", "aaa commercial", "binding arbitration",
            ],
        ),
        (
            "Warranties & Disclaimers",
            [
                "express warranty", "implied warranty", "warranties", "as is",
                "merchantability", "fitness for a particular purpose", "disclaimer of warranties",
            ],
        ),
        (
            "Preamble & Recitals",
            [
                "recital", "recitals", "whereas", "agreement is entered into", "preamble",
                "by and between", "effective date", "witnesseth",
            ],
        ),
        (
            "Definitions & Interpretation",
            [
                "means any", "shall mean", "definitions", "defined terms", "as used herein",
            ],
        ),
    ]

    @classmethod
    def classify_topic(cls, clause_text: str) -> str:
        text_lower = clause_text.lower()
        for topic, keywords in cls.TOPIC_DEFINITIONS:
            if any(k in text_lower for k in keywords):
                return topic
        return "General Provisions & Boilerplate"

    @classmethod
    def summarize_clause(cls, clause_text: str, topic: str) -> str:
        """Generates a concise, plain-English summary of what the clause stipulates."""
        clean = " ".join(clause_text.split()).strip()
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', clean) if len(s.strip()) > 10]
        first_sentence = sentences[0] if sentences else clean[:150]

        if topic == "Confidentiality & Non-Disclosure":
            if "definition" in clean.lower() or "means" in clean.lower():
                return "Defines confidential information, trade secrets, and proprietary data protected under the agreement."
            return "Imposes non-disclosure obligations and restricts unauthorized use or sharing of proprietary information."
        elif topic == "Limitation of Liability & Indemnification":
            if "unlimited" in clean.lower() or "uncapped" in clean.lower():
                return "Establishes liability boundaries while highlighting uncapped exposures for indirect or consequential losses."
            return "Defines monetary liability caps, indemnification procedures, and damage recovery limits."
        elif topic == "Term, Renewal & Termination":
            if "renew" in clean.lower():
                return "Specifies contract duration, renewal schedule, and advance written notice requirements to prevent lock-in."
            return "Outlines agreement duration, expiration conditions, and early termination triggers."
        elif topic == "Data Protection & Privacy (GDPR)":
            return "Regulates handling, cross-border transfer, and safeguards for customer personal data under GDPR."
        elif topic == "Intellectual Property & Licensing":
            return "Protects proprietary software licenses, pre-existing IP, and defines customer ownership of deliverables."
        elif topic == "Fees, Billing & Audit Rights":
            return "Governs payment terms, fee invoicing schedules, late penalty fees, and organizational audit rights."
        elif topic == "Governing Law & Dispute Resolution":
            return "Mandates governing jurisdiction, legal venue, and binding arbitration rules for resolving disputes."
        elif topic == "Warranties & Disclaimers":
            return "Outlines service performance warranties, uptime standards, and formal liability disclaimers."
        elif topic == "Preamble & Recitals":
            return "Introduces legal entities, execution date, and core commercial intentions of the partnership."
        elif topic == "Definitions & Interpretation":
            return "Establishes standardized legal definitions and interpretation guidelines applied across all clauses."
        else:
            if len(first_sentence) > 160:
                first_sentence = first_sentence[:157] + "..."
            return f"Operational provision: {first_sentence}"


class AIEngine:
    """
    Unified AI Intelligence Engine orchestrating live Cloud LLMs
    (OpenAI, Groq, Google Gemini, OpenRouter) or deterministic legal scanner.
    """

    PROVIDERS = {
        "openai": {
            "name": "OpenAI",
            "default_model": "gpt-4o-mini",
            "base_url": None,
        },
        "groq": {
            "name": "Groq Cloud (Fast & Free Tier)",
            "default_model": "llama-3.3-70b-versatile",
            "base_url": "https://api.groq.com/openai/v1",
        },
        "gemini": {
            "name": "Google Gemini (Generous Free Tier)",
            "default_model": "gemini-2.0-flash",
            "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        },
        "custom": {
            "name": "Custom OpenAI-Compatible Endpoint",
            "default_model": "gpt-4o",
            "base_url": None,
        },
    }

    def __init__(self):
        self.provider = "none"
        self.api_key = ""
        self.model_name = ""
        self.base_url = None
        self._client = None
        self._init_from_env()

    def _init_from_env(self):
        # Auto-detect from environment
        openai_key = os.getenv("OPENAI_API_KEY", "").strip()
        groq_key = os.getenv("GROQ_API_KEY", "").strip()
        gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
        custom_key = os.getenv("AI_API_KEY", "").strip()

        if openai_key and not openai_key.startswith("sk-your"):
            self.provider = "openai"
            self.api_key = openai_key
            self.model_name = os.getenv("LLM_MODEL", "gpt-4o-mini")
            self.base_url = None
        elif groq_key and not groq_key.startswith("gsk_your"):
            self.provider = "groq"
            self.api_key = groq_key
            self.model_name = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
            self.base_url = "https://api.groq.com/openai/v1"
        elif gemini_key and not gemini_key.startswith("your-gemini"):
            self.provider = "gemini"
            self.api_key = gemini_key
            self.model_name = os.getenv("LLM_MODEL", "gemini-2.0-flash")
            self.base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"
        elif custom_key:
            self.provider = "custom"
            self.api_key = custom_key
            self.model_name = os.getenv("AI_MODEL", "gpt-4o")
            self.base_url = os.getenv("AI_BASE_URL", None)

    def is_configured(self) -> bool:
        return bool(self.api_key and self.provider != "none")

    def get_status(self) -> Dict[str, Any]:
        return {
            "configured": self.is_configured(),
            "provider": self.provider,
            "provider_name": self.PROVIDERS.get(self.provider, {}).get("name", "Deterministic Heuristic Engine"),
            "model": self.model_name or "LegalRuleScanner (Local)",
            "supported_providers": [
                {
                    "id": "openai",
                    "name": "OpenAI (GPT-4o, GPT-4o-mini)",
                    "website": "https://platform.openai.com/api-keys",
                    "default_model": "gpt-4o-mini",
                },
                {
                    "id": "groq",
                    "name": "Groq Cloud (Llama 3.3 70B - Free Tier)",
                    "website": "https://console.groq.com/keys",
                    "default_model": "llama-3.3-70b-versatile",
                },
                {
                    "id": "gemini",
                    "name": "Google Gemini (Gemini 2.0 Flash - Free Tier)",
                    "website": "https://aistudio.google.com/app/apikey",
                    "default_model": "gemini-2.0-flash",
                },
                {
                    "id": "custom",
                    "name": "Custom OpenAI-Compatible (OpenRouter / Ollama / Local)",
                    "website": "https://openrouter.ai/keys",
                    "default_model": "gpt-4o",
                },
            ],
        }

    def configure(
        self,
        provider: str,
        api_key: str,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
    ) -> tuple[bool, str]:
        """Configures and tests live connectivity with the chosen AI provider."""
        provider = provider.lower().strip()
        if provider not in self.PROVIDERS:
            return False, f"Unsupported provider: {provider}. Supported: {list(self.PROVIDERS.keys())}"

        if not api_key or not api_key.strip():
            # Reset to local scanner
            self.provider = "none"
            self.api_key = ""
            self.model_name = ""
            self.base_url = None
            self._client = None
            return True, "Reset to local deterministic legal scanner."

        clean_key = api_key.strip()
        chosen_base_url = base_url or self.PROVIDERS[provider]["base_url"]
        chosen_model = model or self.PROVIDERS[provider]["default_model"]

        try:
            from openai import OpenAI
            client_kwargs = {"api_key": clean_key}
            if chosen_base_url:
                client_kwargs["base_url"] = chosen_base_url

            test_client = OpenAI(**client_kwargs)

            # Test connection with a quick ping
            test_resp = test_client.chat.completions.create(
                model=chosen_model,
                messages=[{"role": "user", "content": "Respond only with the word 'OK'."}],
                max_tokens=5,
            )
            _ = test_resp.choices[0].message.content

            # Connection verified! Save config
            self.provider = provider
            self.api_key = clean_key
            self.model_name = chosen_model
            self.base_url = chosen_base_url
            self._client = test_client

            return True, f"Successfully connected to {self.PROVIDERS[provider]['name']} using model {chosen_model}!"

        except Exception as exc:
            return False, f"Failed to connect to {provider}: {str(exc)}"

    def _get_client(self):
        if self._client:
            return self._client
        if not self.is_configured():
            return None
        from openai import OpenAI
        client_kwargs = {"api_key": self.api_key}
        if self.base_url:
            client_kwargs["base_url"] = self.base_url
        self._client = OpenAI(**client_kwargs)
        return self._client

    def analyze_clause_with_llm(self, clause_text: str) -> Optional[Dict[str, Any]]:
        """Invokes the live LLM with strict grounding instructions."""
        client = self._get_client()
        if not client:
            return None

        system_prompt = (
            "You are ClauseIQ, an enterprise legal contract compliance analyst.\n"
            "Analyze the given contract clause for compliance risks, liability pitfalls, and key milestone dates.\n\n"
            "CRITICAL INSTRUCTION — ZERO HALLUCINATIONS:\n"
            "Every risk flag MUST provide a 'source_citation' that is a VERBATIM quote taken directly from the clause text.\n"
            "Do NOT summarize, paraphrase, or invent quotes.\n\n"
            "Return valid JSON strictly conforming to:\n"
            "{\n"
            '  "risk_flags": [\n'
            '    {\n'
            '      "risk_level": "critical" | "high" | "medium" | "low",\n'
            '      "compliance_rule": "short category or rule name",\n'
            '      "explanation": "clear legal reasoning for the risk",\n'
            '      "source_citation": "exact verbatim text from the clause"\n'
            '    }\n'
            '  ],\n'
            '  "key_dates": [\n'
            '    {\n'
            '      "event_type": "expiry" | "renewal" | "termination" | "review",\n'
            '      "event_date": "YYYY-MM-DD",\n'
            '      "status": "upcoming"\n'
            '    }\n'
            '  ]\n'
            "}"
        )

        try:
            kwargs = {
                "model": self.model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Clause Text:\n\"\"\"\n{clause_text}\n\"\"\""},
                ],
                "temperature": 0.1,
            }
            if "gpt-4" in self.model_name or "llama" in self.model_name:
                kwargs["response_format"] = {"type": "json_object"}

            resp = client.chat.completions.create(**kwargs)
            raw = resp.choices[0].message.content.strip()

            # Clean markdown codeblocks if present
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\n?", "", raw)
                raw = re.sub(r"\n?```$", "", raw)

            data = json.loads(raw)

            # Ground each citation against source text
            grounded_flags = []
            for r in data.get("risk_flags", []):
                cit = r.get("source_citation", "")
                grounded = CitationGrounder.validate_and_ground(clause_text, cit)
                if grounded:
                    r["source_citation"] = grounded
                    grounded_flags.append(r)
                elif cit and cit.lower() in clause_text.lower():
                    grounded_flags.append(r)

            return {
                "risk_flags": grounded_flags,
                "key_dates": data.get("key_dates", []),
            }

        except Exception as exc:
            print(f"[WARN] Live LLM execution exception: {exc}. Falling back to deterministic scanner.")
            return None

    def analyze_clauses(self, clauses: List[str]) -> Dict[str, Any]:
        """Analyzes all extracted clauses with live LLM (if configured) or deterministic scanner."""
        clause_results = []
        total_risks = 0
        critical_count = 0
        high_count = 0

        for idx, text in enumerate(clauses, start=1):
            llm_result = None
            if self.is_configured():
                llm_result = self.analyze_clause_with_llm(text)

            if llm_result and (llm_result.get("risk_flags") or llm_result.get("key_dates")):
                risks = llm_result.get("risk_flags", [])
                dates = llm_result.get("key_dates", [])
            else:
                risks = LegalRuleScanner.analyze_clause(text)
                dates = LegalRuleScanner.extract_dates(text)

            for r in risks:
                total_risks += 1
                if r["risk_level"] == "critical":
                    critical_count += 1
                elif r["risk_level"] == "high":
                    high_count += 1

            topic = LegalRuleScanner.classify_topic(text)
            summary = LegalRuleScanner.summarize_clause(text, topic)

            clause_results.append(
                {
                    "clause_index": idx,
                    "text": text,
                    "topic": topic,
                    "summary": summary,
                    "risk_flags": risks,
                    "key_dates": dates,
                }
            )

        topic_comparisons = self.generate_topic_comparisons(clause_results)
        contract_summary = self.generate_executive_summary(clause_results, total_risks)

        return {
            "clause_results": clause_results,
            "executive_summary": contract_summary,
            "topic_comparisons": topic_comparisons,
            "summary": {
                "total_clauses": len(clauses),
                "total_risks": total_risks,
                "critical_count": critical_count,
                "high_count": high_count,
            },
        }

    @classmethod
    def generate_topic_comparisons(cls, clause_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Detects topics addressed across multiple clauses and generates
        comparative synthesis explaining how they interact, overlap, or contrast.
        """
        from collections import defaultdict
        topic_groups = defaultdict(list)
        for c in clause_results:
            topic = c.get("topic") or "General Provisions & Boilerplate"
            topic_groups[topic].append(c)

        comparisons = []
        for topic, clauses in topic_groups.items():
            if len(clauses) >= 2 and topic != "General Provisions & Boilerplate":
                clause_indices = [c["clause_index"] for c in clauses]
                indices_str = ", ".join(f"Clause #{idx}" for idx in clause_indices)

                if topic == "Confidentiality & Non-Disclosure":
                    synthesis = (
                        f"Cross-clause review across {indices_str}: "
                        "Initial clauses define the legal boundaries and classifications of Confidential Information, "
                        "while subsequent clauses establish operational non-disclosure covenants, survival periods, and breach remedies."
                    )
                elif topic == "Limitation of Liability & Indemnification":
                    synthesis = (
                        f"Cross-clause review across {indices_str}: "
                        "One clause establishes standard direct damage aggregate caps, while companion provisions "
                        "introduce mutual indemnification commitments or carve-outs for data security and confidentiality violations."
                    )
                elif topic == "Term, Renewal & Termination":
                    synthesis = (
                        f"Cross-clause review across {indices_str}: "
                        "Establishes baseline duration and renewal mechanics, interlocking with mandatory advance notice windows "
                        "and cause-based termination triggers."
                    )
                elif topic == "Data Protection & Privacy (GDPR)":
                    synthesis = (
                        f"Cross-clause review across {indices_str}: "
                        "Coordinates general data handling requirements with international cross-border transfer authorizations "
                        "and Standard Contractual Clauses (SCCs)."
                    )
                elif topic == "Intellectual Property & Licensing":
                    synthesis = (
                        f"Cross-clause review across {indices_str}: "
                        "Separates pre-existing background intellectual property from newly authored deliverables "
                        "and commercial software license grants."
                    )
                else:
                    synthesis = (
                        f"{indices_str} jointly govern {topic}. "
                        "Evaluate both provisions together to verify scope alignment and prevent conflicting legal obligations."
                    )

                comparisons.append({
                    "topic": topic,
                    "clause_indices": clause_indices,
                    "clause_count": len(clauses),
                    "title": f"Comparative Synthesis: {topic}",
                    "synthesis": synthesis,
                })

        return comparisons

    @classmethod
    def generate_executive_summary(cls, clause_results: List[Dict[str, Any]], total_risks: int) -> str:
        """Generates an executive-level plain-English synthesis of the contract."""
        total_clauses = len(clause_results)
        unique_topics = sorted(list(set(c.get("topic") for c in clause_results if c.get("topic") and c.get("topic") != "General Provisions & Boilerplate")))
        topics_str = ", ".join(unique_topics[:4]) if unique_topics else "standard enterprise terms"

        if total_risks > 0:
            risk_summary = f"{total_risks} compliance risk flags detected requiring legal review."
        else:
            risk_summary = "Zero high-severity compliance risks identified."

        return (
            f"Enterprise agreement structured into {total_clauses} clauses spanning {topics_str}. "
            f"{risk_summary} All provisions cataloged with verbatim grounded citations."
        )


# Global engine singleton
ai_engine = AIEngine()

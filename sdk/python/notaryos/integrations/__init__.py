"""
NotaryOS SDK - Framework Integrations

Available integrations for automatic receipt issuance:

    langchain        - LangChain callback handler for LLM/tool/chain events
    crewai           - CrewAI task and step-level receipting
    openai_agents    - OpenAI Agents SDK guardrails and tool wrappers
    pydantic_ai      - PydanticAI result validation and tool receipting
    anthropic_claude - Anthropic Claude tool_use block receipting
    google_adk       - Google Agent Development Kit callback
    llamaindex       - LlamaIndex callback handler
    aws_bedrock      - AWS Bedrock Agents response receipting
    smolagents       - HuggingFace SmolAgents callback

Each integration uses lazy imports so the underlying framework
is only required at runtime, not at install time.

Usage:
    from notaryos import NotaryClient
    from notaryos.integrations.langchain import NotaryCallbackHandler

    notary = NotaryClient(api_key="notary_live_xxx")
    handler = NotaryCallbackHandler(notary)
"""

AVAILABLE_INTEGRATIONS = [
    "langchain",
    "crewai",
    "openai_agents",
    "pydantic_ai",
    "anthropic_claude",
    "google_adk",
    "llamaindex",
    "aws_bedrock",
    "smolagents",
]

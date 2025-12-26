"""
AIML API Provider - Unified API voor alle LLM models
Ondersteunt Claude, GPT, Llama, Mistral, en meer via één endpoint
"""

import logging
from typing import Dict, List, Optional, Any
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)


class AIMLProvider:
    """
    AIML API provider - OpenAI-compatible API voor meerdere LLM providers.

    Ondersteunt:
    - Claude (Opus, Sonnet, Haiku)
    - OpenAI (GPT-4, GPT-4-Turbo)
    - Open source (Llama 3.1, Mistral, Qwen)
    - En meer!

    Docs: https://docs.aimlapi.com/
    """

    def __init__(self, api_key: str, default_model: str = "claude-3-5-sonnet-20241022"):
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.aimlapi.com/v1"  # AIML API endpoint
        )
        self.default_model = default_model

        # AIML API model namen (OpenAI-compatible format)
        self.available_models = {
            # Claude models
            "claude-opus": "claude-3-opus-20240229",
            "claude-sonnet": "claude-3-5-sonnet-20241022",
            "claude-haiku": "claude-3-5-haiku-20241022",

            # OpenAI models
            "gpt-4": "gpt-4-turbo-2024-04-09",
            "gpt-4-turbo": "gpt-4-turbo-2024-04-09",
            "gpt-3.5": "gpt-3.5-turbo",

            # Open source models
            "llama-70b": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
            "llama-8b": "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
            "mistral": "mistralai/Mistral-7B-Instruct-v0.3",
            "qwen": "Qwen/Qwen2.5-72B-Instruct-Turbo",

            # Coding specialized
            "deepseek-coder": "deepseek-ai/DeepSeek-Coder-V2-Instruct",
        }

    async def complete(
        self,
        messages: List[Dict],
        tools: Optional[List[Dict]] = None,
        model: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate completion using AIML API.

        Args:
            messages: Chat messages
            tools: Optional tool definitions
            model: Model name (uses default if not specified)
            **kwargs: Additional parameters (temperature, max_tokens, etc.)

        Returns:
            Dict with content and tool_calls
        """
        model = model or self.default_model

        # Map friendly name to AIML model ID if needed
        if model in self.available_models:
            model = self.available_models[model]

        logger.info(f"AIML API request with model: {model}")

        try:
            completion_kwargs = {
                "model": model,
                "messages": messages,
                "temperature": kwargs.get("temperature", 0.7),
                "max_tokens": kwargs.get("max_tokens", 4096)
            }

            # Add tools if provided
            if tools:
                completion_kwargs["tools"] = tools
                completion_kwargs["tool_choice"] = "auto"

            response = await self.client.chat.completions.create(**completion_kwargs)

            message = response.choices[0].message

            result = {
                "content": message.content or "",
                "tool_calls": []
            }

            # Parse tool calls
            if message.tool_calls:
                for tool_call in message.tool_calls:
                    result["tool_calls"].append({
                        "id": tool_call.id,
                        "function": {
                            "name": tool_call.function.name,
                            "arguments": eval(tool_call.function.arguments)  # JSON string to dict
                        }
                    })

            logger.info(f"AIML response: {result['content'][:100]}...")
            if result["tool_calls"]:
                logger.info(f"Tool calls: {[tc['function']['name'] for tc in result['tool_calls']]}")

            return result

        except Exception as e:
            logger.error(f"AIML API error: {e}")
            raise


class AIMLModelRouter:
    """
    Multi-model routing voor AIML API.
    Selecteert optimaal model op basis van task type en complexity.
    """

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}

        # Model configuratie (AIML API model IDs)
        self.models = {
            # Claude models (via AIML)
            "complex": self.config.get("MODEL_COMPLEX", "claude-3-opus-20240229"),
            "balanced": self.config.get("MODEL_BALANCED", "claude-3-5-sonnet-20241022"),
            "fast": self.config.get("MODEL_FAST", "claude-3-5-haiku-20241022"),

            # OpenAI models
            "gpt4": self.config.get("MODEL_GPT4", "gpt-4-turbo-2024-04-09"),

            # Open source models
            "coding": self.config.get("MODEL_CODING", "deepseek-ai/DeepSeek-Coder-V2-Instruct"),
            "llama": self.config.get("MODEL_LLAMA", "meta-llama/Llama-3.3-70B-Instruct-Turbo"),

            # Default
            "default": self.config.get("DEFAULT_MODEL", "claude-3-5-sonnet-20241022")
        }

    def select_model(self, task_type: str, complexity: float) -> str:
        """
        Select optimal model based on task type and complexity.

        Args:
            task_type: Type of task (code, analysis, research, simple, etc.)
            complexity: Complexity score from 0.0 to 1.0

        Returns:
            AIML API model identifier string
        """
        # Zeer hoge complexity → Claude Opus
        if complexity > 0.8:
            logger.info(f"Very high complexity ({complexity}), using Claude Opus")
            return self.models["complex"]

        # Coding tasks → DeepSeek Coder (specialized)
        if task_type in ["code", "coding", "programming", "debug"]:
            logger.info(f"Coding task, using DeepSeek Coder")
            return self.models["coding"]

        # High complexity analysis/research → Claude Opus
        if complexity > 0.6 and task_type in ["analysis", "research", "planning"]:
            logger.info(f"Complex {task_type} task, using Claude Opus")
            return self.models["complex"]

        # Medium complexity → Claude Sonnet (balanced)
        if 0.3 <= complexity <= 0.6:
            logger.info(f"Medium complexity ({complexity}), using Claude Sonnet")
            return self.models["balanced"]

        # Low complexity, quick tasks → Claude Haiku (fastest)
        if complexity < 0.3 and task_type in ["simple", "file_operation", "read"]:
            logger.info(f"Simple task ({complexity}), using Claude Haiku")
            return self.models["fast"]

        # Default: Claude Sonnet (best balance)
        logger.info(f"Default routing, using Claude Sonnet")
        return self.models["default"]

    def get_model_info(self, model: str) -> Dict[str, str]:
        """Get information about a model."""
        model_info = {
            "claude-3-opus-20240229": {
                "name": "Claude 3 Opus",
                "provider": "Anthropic",
                "context": "200K tokens",
                "best_for": "Complex reasoning, long context"
            },
            "claude-3-5-sonnet-20241022": {
                "name": "Claude 3.5 Sonnet",
                "provider": "Anthropic",
                "context": "200K tokens",
                "best_for": "Balanced performance, general tasks"
            },
            "claude-3-5-haiku-20241022": {
                "name": "Claude 3.5 Haiku",
                "provider": "Anthropic",
                "context": "200K tokens",
                "best_for": "Speed, simple tasks"
            },
            "gpt-4-turbo-2024-04-09": {
                "name": "GPT-4 Turbo",
                "provider": "OpenAI",
                "context": "128K tokens",
                "best_for": "General intelligence, creativity"
            },
            "deepseek-ai/DeepSeek-Coder-V2-Instruct": {
                "name": "DeepSeek Coder V2",
                "provider": "DeepSeek",
                "context": "128K tokens",
                "best_for": "Code generation, debugging"
            },
            "meta-llama/Llama-3.3-70B-Instruct-Turbo": {
                "name": "Llama 3.3 70B",
                "provider": "Meta",
                "context": "128K tokens",
                "best_for": "Open source, cost-effective"
            }
        }

        return model_info.get(model, {
            "name": model,
            "provider": "Unknown",
            "context": "Unknown",
            "best_for": "General tasks"
        })


def create_aiml_setup(config: Dict) -> tuple[AIMLProvider, AIMLModelRouter]:
    """
    Factory function to create AIML provider and router.

    Args:
        config: Configuration dict with AIML_API_KEY and model settings

    Returns:
        Tuple of (aiml_provider, model_router)
    """
    api_key = config.get("AIML_API_KEY")

    if not api_key:
        raise ValueError("AIML_API_KEY is required. Get one at https://aimlapi.com")

    # Create provider
    provider = AIMLProvider(
        api_key=api_key,
        default_model=config.get("DEFAULT_MODEL", "claude-3-5-sonnet-20241022")
    )

    # Create router
    router = AIMLModelRouter(config)

    logger.info("AIML API setup complete")
    logger.info(f"Default model: {provider.default_model}")
    logger.info(f"Available models: {len(provider.available_models)}")

    return provider, router

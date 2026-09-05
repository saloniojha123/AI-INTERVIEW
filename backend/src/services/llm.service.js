import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

/**
 * llm.service.js
 * Thin, provider-agnostic wrapper around whatever LLM backend you choose
 * (Amazon Bedrock, OpenAI-compatible endpoint, etc). Personas only ever
 * call `generate()` — swap the provider here without touching persona code.
 *
 * LLM_PROVIDER=mock works out of the box with no API key so the app is
 * runnable end-to-end before you wire up real credentials.
 */
class LLMService {
  constructor() {
    this.provider = config.llm.provider;
  }

  async generate({ systemPrompt, prompt }) {
    switch (this.provider) {
      case "bedrock":
        return this._generateBedrock({ systemPrompt, prompt });
      case "openai-compatible":
        return this._generateOpenAICompatible({ systemPrompt, prompt });
      case "mock":
      default:
        return this._generateMock({ systemPrompt, prompt });
    }
  }

  async _generateMock({ prompt }) {
    // Deterministic-ish placeholder so the UI/flow can be demoed without any keys.
    const fillers = [
      "That's interesting — can you walk me through your specific reasoning there?",
      "What trade-offs did you consider before landing on that approach?",
      "Can you give a concrete example from your experience that illustrates this?",
      "How would that change if the constraints were different, say under a tight deadline?",
      "What would you do differently if you tackled that again today?",
    ];
    const pick = fillers[Math.floor(Math.random() * fillers.length)];
    return pick;
  }

  async _generateBedrock({ systemPrompt, prompt }) {
    // TODO: integrate @aws-sdk/client-bedrock-runtime here.
    logger.warn("Bedrock provider not yet implemented — falling back to mock.");
    return this._generateMock({ systemPrompt, prompt });
  }
  async _generateOpenAICompatible({ systemPrompt, prompt }) {
  if (!config.llm.apiKey) {
    logger.warn("LLM_API_KEY not set — falling back to mock.");
    return this._generateMock({ systemPrompt, prompt });
  }

  const makeRequest = async () => {
    const res = await fetch(`${config.llm.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.llm.apiKey}`,
      },
      body: JSON.stringify({
        model: config.llm.model,

        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],

        temperature: 0.7,

        // Groq recommends max_completion_tokens
        max_completion_tokens: 1000,

        // GPT-OSS is a reasoning model.
        // Low reasoning is enough for short interview questions.
        reasoning_effort: "low",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`LLM API error ${res.status}: ${errText}`);
    }

    const data = await res.json();

    logger.info(
      `LLM response received: model=${config.llm.model}, ` +
      `finish_reason=${data?.choices?.[0]?.finish_reason}`
    );

    const message = data?.choices?.[0]?.message;

    // Normal final answer
    const text = message?.content?.trim();

    if (text) {
      return text;
    }

    throw new Error("LLM API returned no content");
  };

  // First attempt
  try {
    return await makeRequest();
  } catch (firstError) {
    logger.warn(
      `First LLM attempt failed: ${firstError.message}. Retrying once...`
    );
  }

  // Retry once
  try {
    await new Promise((resolve) => setTimeout(resolve, 700));

    return await makeRequest();
  } catch (secondError) {
    logger.error(
      `LLM call failed after retry, falling back to mock: ${secondError.message}`
    );

    return this._generateMock({ systemPrompt, prompt });
  }
}
  
}

export const llmService = new LLMService();

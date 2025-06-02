// Local LLM API client implementation

export class LocalLLMClient {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string, endpoint = 'http://localhost:8080') {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }

  /**
   * Creates a chat completion request to a local LLM server
   */
  async createChatCompletion(
    model: string, 
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[], 
    options: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    try {
      const temperature = options?.temperature ?? 0.7;
      const maxTokens = options?.maxTokens ?? 1000;
      
      // Setup headers
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      if (this.apiKey) {
        headers.append('Authorization', `Bearer ${this.apiKey}`);
      }

      // Different local LLM servers may have different API formats
      let payload;
      
      // Check if URL includes specific keywords to determine format
      if (this.endpoint.includes('ollama')) {
        // Ollama format
        payload = {
          model: model,
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens,
        };
      } else {
        // Default format (OpenAI-compatible)
        payload = {
          model: model,
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens,
        };
      }

      // Send the request
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Local LLM API error: ${error}`);
      }

      // Parse the response
      const data = await response.json();
      
      // Extract the completion text based on response format
      let completionText = '';
      
      // Try different response formats
      if (data.choices && data.choices.length > 0) {
        // OpenAI-like format
        completionText = data.choices[0].message?.content || data.choices[0].text;
      } else if (data.message && data.message.content) {
        // Another OpenAI-like format
        completionText = data.message.content;
      } else if (data.response) {
        // Ollama format
        completionText = data.response;
      } else if (data.output) {
        // Some custom format
        completionText = data.output;
      } else if (data.text) {
        // Simple format
        completionText = data.text;
      } else {
        // Fallback to stringifying the entire response
        completionText = JSON.stringify(data);
      }

      return completionText;
    } catch (error) {
      console.error('Local LLM completion error:', error);
      throw error;
    }
  }
}

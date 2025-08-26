const API_BASE_URL = 'http://localhost:5000/api';

export interface InstagramCredentials {
  username: string;
  password: string;
}

export interface CommentRule {
  id?: number;
  trigger_text: string;
  response_text: string;
  is_active: boolean;
  match_count?: number;
}

export interface DMCampaign {
  id?: number;
  name: string;
  message_template: string;
  status: string;
  sent_count?: number;
  opened_count?: number;
  responded_count?: number;
}

export interface BotStatus {
  connected: boolean;
  status: string;
  lastCheck: string;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Instagram Bot Methods
  async connectInstagram(credentials: InstagramCredentials): Promise<{ message: string; connected: boolean }> {
    return this.request('/instagram/connect', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async disconnectInstagram(): Promise<{ message: string; connected: boolean }> {
    return this.request('/instagram/disconnect', {
      method: 'POST',
    });
  }

  async getBotStatus(): Promise<BotStatus> {
    return this.request('/instagram/status');
  }

  // Comment Rules Methods
  async getCommentRules(): Promise<CommentRule[]> {
    return this.request('/instagram/comment-rules');
  }

  async createCommentRule(rule: CommentRule): Promise<CommentRule> {
    return this.request('/instagram/comment-rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  async updateCommentRule(id: number, rule: CommentRule): Promise<CommentRule> {
    return this.request(`/instagram/comment-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rule),
    });
  }

  async deleteCommentRule(id: number): Promise<{ message: string }> {
    return this.request(`/instagram/comment-rules/${id}`, {
      method: 'DELETE',
    });
  }

  // DM Campaigns Methods
  async getDMCampaigns(): Promise<DMCampaign[]> {
    return this.request('/instagram/dm-campaigns');
  }

  async createDMCampaign(campaign: DMCampaign): Promise<DMCampaign> {
    return this.request('/instagram/dm-campaigns', {
      method: 'POST',
      body: JSON.stringify(campaign),
    });
  }

  async updateDMCampaign(id: number, campaign: DMCampaign): Promise<DMCampaign> {
    return this.request(`/instagram/dm-campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(campaign),
    });
  }

  async deleteDMCampaign(id: number): Promise<{ message: string }> {
    return this.request(`/instagram/dm-campaigns/${id}`, {
      method: 'DELETE',
    });
  }

  // Test Methods
  async testCommentResponse(commentText: string): Promise<{
    matched: boolean;
    trigger?: string;
    response?: string;
    rule_id?: number;
    message?: string;
  }> {
    return this.request('/instagram/test-response', {
      method: 'POST',
      body: JSON.stringify({ comment_text: commentText }),
    });
  }

  // Process post comments
  async processPost(postUrl: string): Promise<{
    message: string;
    result: { processed: number; responded: number };
  }> {
    return this.request('/instagram/process-post', {
      method: 'POST',
      body: JSON.stringify({ post_url: postUrl }),
    });
  }

  // Send direct message
  async sendDirectMessage(username: string, message: string): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request('/instagram/send-dm', {
      method: 'POST',
      body: JSON.stringify({ username, message }),
    });
  }

  // Start monitoring a post
  async startMonitoring(postUrl: string): Promise<{
    message: string;
    success: boolean;
    post_url: string;
  }> {
    return this.request('/instagram/start-monitoring', {
      method: 'POST',
      body: JSON.stringify({ post_url: postUrl }),
    });
  }

  // Stop monitoring
  async stopMonitoring(): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request('/instagram/stop-monitoring', {
      method: 'POST',
    });
  }

  // Get monitoring status
  async getMonitoringStatus(): Promise<{
    isMonitoring: boolean;
    monitoredPosts: string[];
    postCount: number;
  }> {
    return this.request('/instagram/monitoring-status');
  }

  // Debug post structure
  async debugPost(postUrl: string): Promise<{
    message: string;
    debugInfo: any;
    screenshot: string;
  }> {
    return this.request('/instagram/debug-post', {
      method: 'POST',
      body: JSON.stringify({ post_url: postUrl }),
    });
  }

  // WhatsApp Bot Methods
  async getWhatsAppStatus(): Promise<{
    isConnected: boolean;
    isReady: boolean;
    messageRulesCount: number;
    autoResponsesCount: number;
  }> {
    return this.request('/whatsapp/status');
  }

  async initializeWhatsApp(): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request('/whatsapp/initialize', {
      method: 'POST',
    });
  }

  async disconnectWhatsApp(): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request('/whatsapp/disconnect', {
      method: 'POST',
    });
  }

  // WhatsApp Rules Methods
  async getWhatsAppRules(): Promise<{
    id: number;
    trigger_text: string;
    response_text: string;
    is_active: boolean;
    match_count: number;
    created_at: string;
  }[]> {
    return this.request('/whatsapp/rules');
  }

  async createWhatsAppRule(rule: {
    trigger_text: string;
    response_text: string;
    is_active?: boolean;
  }): Promise<{
    id: number;
    trigger_text: string;
    response_text: string;
    is_active: boolean;
    message: string;
  }> {
    return this.request('/whatsapp/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  async updateWhatsAppRule(id: number, rule: {
    trigger_text: string;
    response_text: string;
    is_active?: boolean;
  }): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request(`/whatsapp/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rule),
    });
  }

  async deleteWhatsAppRule(id: number): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request(`/whatsapp/rules/${id}`, {
      method: 'DELETE',
    });
  }

  // WhatsApp Message Methods
  async sendWhatsAppMessage(to: string, message: string): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request('/whatsapp/send-message', {
      method: 'POST',
      body: JSON.stringify({ to, message }),
    });
  }

  async sendWhatsAppToContact(contactName: string, message: string): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request('/whatsapp/send-to-contact', {
      method: 'POST',
      body: JSON.stringify({ contactName, message }),
    });
  }

  async broadcastWhatsAppMessage(message: string, contacts?: string[]): Promise<{
    message: string;
    success: boolean;
    result: {
      successCount: number;
      totalCount: number;
    };
  }> {
    return this.request('/whatsapp/broadcast', {
      method: 'POST',
      body: JSON.stringify({ message, contacts }),
    });
  }

  async sendWhatsAppInteractiveMessage(
    to: string, 
    message: string, 
    options: string[] | Array<{title: string, description: string}>, 
    type: 'buttons' | 'list'
  ): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request('/whatsapp/send-interactive', {
      method: 'POST',
      body: JSON.stringify({ to, message, options, type }),
    });
  }

  async saveWelcomeMessage(welcomeConfig: {
    message: string;
    type: 'buttons' | 'list';
    options: string[] | Array<{title: string, description: string}>;
    enabled: boolean;
  }): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request('/whatsapp/welcome-message', {
      method: 'POST',
      body: JSON.stringify(welcomeConfig),
    });
  }

  async getWelcomeMessage(): Promise<{
    message: string;
    type: 'buttons' | 'list';
    options: string[] | Array<{title: string, description: string}>;
    enabled: boolean;
  }> {
    return this.request('/whatsapp/welcome-message');
  }

  async testWelcomeMessage(phoneNumber: string): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request('/whatsapp/test-welcome', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  async clearWelcomeHistory(): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request('/whatsapp/clear-welcome-history', {
      method: 'POST',
    });
  }

  // ===== CONDITIONAL RESPONSES API =====

  async getConditionalResponses(): Promise<Array<{
    option_name: string;
    response_text: string;
    is_active: boolean;
    use_count: number;
  }>> {
    return this.request('/whatsapp/conditional-responses');
  }

  async saveConditionalResponse(optionName: string, responseText: string): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request('/whatsapp/conditional-responses', {
      method: 'POST',
      body: JSON.stringify({ optionName, responseText }),
    });
  }

  async deleteConditionalResponse(optionName: string): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request(`/whatsapp/conditional-responses/${encodeURIComponent(optionName)}`, {
      method: 'DELETE',
    });
  }

  // ===== AI CONFIGURATION API =====

  async getAIConfig(): Promise<{
    ai_enabled: string;
    ai_provider: string;
    ai_model: string;
    ai_temperature: string;
    ai_max_tokens: string;
    ai_prompt_template: string;
  }> {
    return this.request('/whatsapp/ai-config');
  }

  async updateAIConfig(key: string, value: string): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request('/whatsapp/ai-config', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });
  }

  async testAI(message: string, context?: string): Promise<{
    message: string;
    response: string;
    success: boolean;
  }> {
    return this.request('/whatsapp/test-ai', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }

  // ===== CONVERSATION FLOWS API =====

  async getFlows(): Promise<Array<{
    id: number;
    flow_name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>> {
    return this.request('/whatsapp/flows');
  }

  async getFlow(flowId: number): Promise<{
    id: number;
    flow_name: string;
    is_active: boolean;
    steps: Array<{
      id: number;
      step_number: number;
      parent_step_id: number | null;
      question_text: string;
      options: Array<{
        id: number;
        option_number: number;
        option_text: string;
        response_text: string;
        next_step_id: number | null;
        is_back_option: boolean;
        is_active: boolean;
        use_count: number;
      }>;
    }>;
  }> {
    return this.request(`/whatsapp/flows/${flowId}`);
  }

  async createFlow(flowName: string): Promise<{
    message: string;
    flow: { id: number; flow_name: string };
    success: boolean;
  }> {
    return this.request('/whatsapp/flows', {
      method: 'POST',
      body: JSON.stringify({ flowName }),
    });
  }

  async deleteFlow(flowId: number): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request(`/whatsapp/flows/${flowId}`, {
      method: 'DELETE',
    });
  }

  async createStep(flowId: number, stepNumber: number, parentStepId: number | null, questionText: string): Promise<{
    message: string;
    step: { id: number; step_number: number; question_text: string };
    success: boolean;
  }> {
    return this.request(`/whatsapp/flows/${flowId}/steps`, {
      method: 'POST',
      body: JSON.stringify({ stepNumber, parentStepId, questionText }),
    });
  }

  async createOption(stepId: number, optionNumber: number, optionText: string, responseText: string, nextStepId: number | null, isBackOption: boolean = false, isFinalResponse: boolean = false): Promise<{
    message: string;
    option: { id: number; option_number: number; option_text: string };
    success: boolean;
  }> {
    return this.request(`/whatsapp/steps/${stepId}/options`, {
      method: 'POST',
      body: JSON.stringify({ optionNumber, optionText, responseText, nextStepId, isBackOption, isFinalResponse }),
    });
  }

  async updateStep(stepId: number, questionText: string): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request(`/whatsapp/steps/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify({ questionText }),
    });
  }

  async updateOption(optionId: number, optionText: string, responseText: string, nextStepId: number | null, isBackOption: boolean = false, isFinalResponse: boolean = false): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request(`/whatsapp/options/${optionId}`, {
      method: 'PUT',
      body: JSON.stringify({ optionText, responseText, nextStepId, isBackOption, isFinalResponse }),
    });
  }

  async deleteStep(stepId: number): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request(`/whatsapp/steps/${stepId}`, {
      method: 'DELETE',
    });
  }

  async deleteOption(optionId: number): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request(`/whatsapp/options/${optionId}`, {
      method: 'DELETE',
    });
  }

  async startConversationFlow(flowId: number, phoneNumber: string): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request(`/whatsapp/flows/${flowId}/start`, {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  // WhatsApp Analytics
  async getWhatsAppAnalytics(): Promise<{
    id: number;
    sender: string;
    message: string;
    rule_id: number | null;
    trigger_text: string | null;
    timestamp: string;
  }[]> {
    return this.request('/whatsapp/analytics');
  }

  // Real-time status stream
  connectToStatusStream(callback: (status: any) => void): () => void {
    const eventSource = new EventSource(`${API_BASE_URL}/whatsapp/status-stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const status = JSON.parse(event.data);
        callback(status);
      } catch (error) {
        console.error('Error parsing status update:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Status stream error:', error);
    };

    // Return cleanup function
    return () => {
      eventSource.close();
    };
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; message: string; timestamp: string }> {
    return this.request('/health');
  }

  // Flow Configuration
  async getFlowConfig(): Promise<{
    endMessage: string;
    backMessage: string;
    errorMessage: string;
  }> {
    return this.request('/whatsapp/flow-config');
  }

  async saveFlowConfig(config: {
    endMessage: string;
    backMessage: string;
    errorMessage: string;
  }): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request('/whatsapp/flow-config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  // Nested responses API
  async getNestedResponses(optionId: number): Promise<Array<{
    id: number;
    option_id: number;
    trigger_text: string;
    response_text: string;
    is_active: boolean;
    use_count: number;
  }>> {
    return this.request(`/whatsapp/flow-options/${optionId}/nested-responses`);
  }

  async addNestedResponse(optionId: number, triggerText: string, responseText: string): Promise<{
    message: string;
    success: boolean;
    id: number;
  }> {
    return this.request(`/whatsapp/flow-options/${optionId}/nested-responses`, {
      method: 'POST',
      body: JSON.stringify({ triggerText, responseText }),
    });
  }

  async updateNestedResponse(responseId: number, triggerText: string, responseText: string): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request(`/whatsapp/flow-nested-responses/${responseId}`, {
      method: 'PUT',
      body: JSON.stringify({ triggerText, responseText }),
    });
  }

  async deleteNestedResponse(responseId: number): Promise<{
    message: string;
    success: boolean;
  }> {
    return this.request(`/whatsapp/flow-nested-responses/${responseId}`, {
      method: 'DELETE',
    });
  }

  // Flow linking API
  async getFlowOptions(flowId: number): Promise<Array<{
    option_id: number;
    option_number: number;
    option_text: string;
    response_text: string;
    next_step_id: number | null;
    is_back_option: boolean;
    is_final_response: boolean;
    step_id: number;
    step_number: number;
    question_text: string;
    parent_step_id: number | null;
  }>> {
    return this.request(`/whatsapp/flows/${flowId}/options`);
  }

  async getOptionContext(optionId: number): Promise<{
    option_id: number;
    option_number: number;
    option_text: string;
    response_text: string;
    next_step_id: number | null;
    is_back_option: boolean;
    is_final_response: boolean;
    step_id: number;
    step_number: number;
    question_text: string;
    parent_step_id: number | null;
    flow_name: string;
  }> {
    return this.request(`/whatsapp/flow-options/${optionId}/context`);
  }

  async fixBackOptions(flowId: number): Promise<{
    message: string;
    success: boolean;
    fixedCount: number;
  }> {
    return this.request(`/whatsapp/flows/${flowId}/fix-back-options`, {
      method: 'POST',
    });
  }

  // Bot Configuration API
  async getBotConfig(): Promise<{
    processOldMessages: boolean;
    botStartTime: string | null;
    isConnected: boolean;
    isReady: boolean;
  }> {
    return this.request('/whatsapp/config');
  }

  async updateBotConfig(config: { processOldMessages: boolean }): Promise<{
    message: string;
    success: boolean;
    config: {
      processOldMessages: boolean;
      botStartTime: string | null;
    };
  }> {
    return this.request('/whatsapp/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }
}

export const apiService = new ApiService();

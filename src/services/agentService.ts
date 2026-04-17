import axios from 'axios';

export const agentService = {
  async runLangGraphAgent(action: string, data: any) {
    try {
      const response = await axios.post('/api/agent', {
        action,
        ...data,
      });
      return response.data;
    } catch (error) {
      console.error(`Error running LangGraph agent via API route for ${action}:`, error);
      throw error;
    }
  }
};


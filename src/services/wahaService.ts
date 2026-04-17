import axios from 'axios';

export const wahaService = {
  async sendNotification(phone: string, message: string) {
    try {
      // Call internal Next.js API route instead of direct VPS URL
      // This avoids CORS issues and keeps the VPS URL secure
      const response = await axios.post('/api/notify', {
        phone,
        message,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending WAHA notification via API route:', error);
      throw error;
    }
  }
};

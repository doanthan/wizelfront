// Utility functions for communicating with the scrape server

class ScrapeClient {
  constructor() {
    this.baseURL = process.env.SCRAPE_SERVER_URL || "http://localhost:8000";
    this.apiKey = process.env.SCRAPE_SERVER_KEY;
  }

  // Get authorization headers
  getHeaders() {
    if (!this.apiKey) {
      throw new Error("SCRAPE_SERVER_KEY is not configured in environment variables");
    }

    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  // Scrape a domain
  async scrapeDomain({ domain, brand_setting_id, name }) {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/scrape`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          domain,
          brand_setting_id: brand_setting_id || "default",
          name: name || domain,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Scrape failed: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error scraping domain:", error);
      throw error;
    }
  }

  // Get scrape status
  async getScrapeStatus(jobId) {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/scrape/status/${jobId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting scrape status:", error);
      throw error;
    }
  }

  // Get scraped data
  async getScrapedData(brand_setting_id) {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/scrape/data/${brand_setting_id}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get data: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting scraped data:", error);
      throw error;
    }
  }

  // Health check
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
      });

      return {
        healthy: response.ok,
        status: response.status,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }

  // Batch scrape multiple domains
  async batchScrape(domains) {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/scrape/batch`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ domains }),
      });

      if (!response.ok) {
        throw new Error(`Batch scrape failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in batch scrape:", error);
      throw error;
    }
  }
}

// Export singleton instance
const scrapeClient = new ScrapeClient();
export default scrapeClient;

// Also export the class for testing or multiple instances
export { ScrapeClient };
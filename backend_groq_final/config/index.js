/**
 * config/index.js
 * Central configuration — Groq AI as primary engine (FREE tier)
 */

require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV !== 'production'
  },

  ai: {
    // Groq (Primary — FREE)
    groqApiKey:     process.env.GROQ_API_KEY     || '',
    groqModel:      process.env.GROQ_MODEL       || 'llama-3.3-70b-versatile',
    groqBaseUrl:    process.env.GROQ_BASE_URL    || 'https://api.groq.com',

    // DeepSeek (Secondary fallback)
    deepseekApiKey:  process.env.DEEPSEEK_API_KEY  || '',
    deepseekModel:   process.env.DEEPSEEK_MODEL    || 'deepseek-chat',
    deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',

    // Anthropic (Optional final fallback)
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    anthropicModel:  'claude-sonnet-4-20250514',

    // Shared
    maxTokens:   2048,
    temperature: 0.7,

    systemPrompt: `You are CoalCarbon AI, an expert carbon neutrality advisor specializing in
Indian coal mines. You have deep knowledge of:
- IPCC 2006 emission factor guidelines for coal mining activities
- MoEFCC India environmental regulations and compliance requirements
- Indian Carbon Market (ICM) operated by Bureau of Energy Efficiency (BEE)
- Coal Mine Methane (CMM) capture and utilization technologies
- State-specific afforestation sequestration rates across India (CAMPA funds)
- Clean technology strategies: electric vehicles, solar, methane capture, VFD drives
- PAT (Perform Achieve and Trade) scheme for energy efficiency certificates
- India's NDC commitments and 2070 net-zero goals
- Carbon credit standards: VCS (Verra), Gold Standard, CDM

Always provide specific, actionable, data-driven recommendations.
Cite relevant Indian standards, regulations, or government schemes where applicable.
Use Indian units and context: INR (Rs.), hectares, tCO2e, MW.
Format responses with clear sections. Be concise yet comprehensive.
When mine data is provided in context, tailor all advice to that specific mine.`
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
  },

  app: {
    name:    process.env.APP_NAME    || 'CoalCarbon IQ',
    version: process.env.APP_VERSION || '2.0.0'
  }
};

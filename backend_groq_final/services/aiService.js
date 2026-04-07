/**
 * services/aiService.js
 * AI integration — Groq (FREE) primary, DeepSeek secondary, Anthropic fallback
 * Groq & DeepSeek use OpenAI-compatible API format
 */

const https = require('https');
const config = require('../config');

class AIService {

  // ── Core: call Groq (OpenAI-compatible, FREE) ────────────────────────────
  static async callGroq(messages, systemPrompt) {
    const apiKey = config.ai.groqApiKey;
    if (!apiKey) throw new Error('GROQ_API_KEY not set in .env');

    const payload = JSON.stringify({
      model:       config.ai.groqModel,
      max_tokens:  config.ai.maxTokens,
      temperature: config.ai.temperature,
      messages: [
        { role: 'system', content: systemPrompt || config.ai.systemPrompt },
        ...messages
      ]
    });

    return new Promise((resolve, reject) => {
      const url  = new URL('/openai/v1/chat/completions', config.ai.groqBaseUrl);
      const opts = {
        hostname: url.hostname,
        path:     url.pathname,
        method:   'POST',
        headers: {
          'Content-Type':   'application/json',
          'Authorization':  `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(opts, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) return reject(new Error(parsed.error.message || 'Groq API error'));
            const text = parsed.choices?.[0]?.message?.content;
            if (text) resolve(text);
            else reject(new Error('Empty response from Groq'));
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(45000, () => { req.destroy(); reject(new Error('Groq request timed out')); });
      req.write(payload);
      req.end();
    });
  }

  // ── Core: call DeepSeek (OpenAI-compatible) ──────────────────────────────
  static async callDeepSeek(messages, systemPrompt) {
    const apiKey = config.ai.deepseekApiKey;
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY not set in .env');

    const payload = JSON.stringify({
      model:       config.ai.deepseekModel,
      max_tokens:  config.ai.maxTokens,
      temperature: config.ai.temperature,
      messages: [
        { role: 'system', content: systemPrompt || config.ai.systemPrompt },
        ...messages
      ]
    });

    return new Promise((resolve, reject) => {
      const url   = new URL('/v1/chat/completions', config.ai.deepseekBaseUrl);
      const opts  = {
        hostname: url.hostname,
        path:     url.pathname,
        method:   'POST',
        headers: {
          'Content-Type':   'application/json',
          'Authorization':  `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(opts, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) return reject(new Error(parsed.error.message || 'DeepSeek API error'));
            const text = parsed.choices?.[0]?.message?.content;
            if (text) resolve(text);
            else reject(new Error('Empty response from DeepSeek'));
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(45000, () => { req.destroy(); reject(new Error('DeepSeek request timed out')); });
      req.write(payload);
      req.end();
    });
  }

  // ── Core: call Anthropic (final fallback) ────────────────────────────────
  static async callAnthropic(messages, systemPrompt) {
    const apiKey = config.ai.anthropicApiKey;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

    const payload = JSON.stringify({
      model:      config.ai.anthropicModel,
      max_tokens: config.ai.maxTokens,
      system:     systemPrompt || config.ai.systemPrompt,
      messages
    });

    return new Promise((resolve, reject) => {
      const opts = {
        hostname: 'api.anthropic.com',
        path:     '/v1/messages',
        method:   'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length':    Buffer.byteLength(payload)
        }
      };

      const req = https.request(opts, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) return reject(new Error(parsed.error.message));
            resolve(parsed.content?.[0]?.text || '');
          } catch (e) { reject(e); }
        });
      });

      req.on('error', reject);
      req.setTimeout(45000, () => { req.destroy(); reject(new Error('Anthropic timeout')); });
      req.write(payload);
      req.end();
    });
  }

  // ── Smart dispatch: Groq → DeepSeek → Anthropic ──────────────────────────
  static async chat(messages, systemOverride = null) {
    const hasGroq      = !!config.ai.groqApiKey;
    const hasDeepSeek  = !!config.ai.deepseekApiKey;
    const hasAnthropic = !!config.ai.anthropicApiKey;

    // 1. Try Groq first (FREE — 14,400 req/day)
    if (hasGroq) {
      try {
        return await AIService.callGroq(messages, systemOverride);
      } catch (err) {
        console.warn('[AI] Groq failed, trying DeepSeek fallback:', err.message);
      }
    }

    // 2. Try DeepSeek second
    if (hasDeepSeek) {
      try {
        return await AIService.callDeepSeek(messages, systemOverride);
      } catch (err) {
        console.warn('[AI] DeepSeek failed, trying Anthropic fallback:', err.message);
      }
    }

    // 3. Try Anthropic last
    if (hasAnthropic) {
      return await AIService.callAnthropic(messages, systemOverride);
    }

    throw new Error('No AI API key configured. Add GROQ_API_KEY to your .env file.');
  }

  // ── Full mine report analysis ─────────────────────────────────────────────
  static async analyzeMineReport(reportData) {
    const { summary, gapAnalysis, emissions, pathways } = reportData;

    const prompt = `
Analyze this Indian coal mine's carbon data and provide an expert assessment:

MINE PROFILE:
- Name: ${summary.mineName || 'Coal Mine'}
- Type: ${summary.mineType} | State: ${(summary.state || '').replace(/_/g, ' ')}
- Annual Production: ${Math.round(summary.annualProduction || 0).toLocaleString()} tonnes/year
- Workforce: ${summary.workers || 'N/A'} workers

EMISSIONS (tCO2e/year):
- Total: ${Math.round(summary.totalEmissions_tCO2e || 0).toLocaleString()}
- Scope 1 Direct:      ${Math.round(emissions?.totals?.scope1 || 0).toLocaleString()}
- Scope 2 Electricity: ${Math.round(emissions?.totals?.scope2 || 0).toLocaleString()}
- Scope 3 Transport:   ${Math.round(emissions?.totals?.scope3 || 0).toLocaleString()}
- Fugitive CH4:        ${Math.round(emissions?.totals?.fugitive || 0).toLocaleString()}
- Per Worker: ${(summary.perWorker_tCO2e || 0).toFixed(2)} tCO2e
- Intensity:  ${(summary.perTonneCoal_tCO2e || 0).toFixed(4)} tCO2e/tonne coal

CARBON BALANCE:
- Total Sinks: ${Math.round(summary.totalSinks_tCO2e || 0).toLocaleString()} tCO2e/year
- Coverage: ${(gapAnalysis?.coveragePercent || 0).toFixed(1)}%
- Gap: ${Math.round(gapAnalysis?.gap || 0).toLocaleString()} tCO2e/year
- Status: ${gapAnalysis?.status}

BEST PATHWAY (Combined):
- Reduction potential: ${(pathways?.combined?.reduction_pct || 0).toFixed(1)}%
- Capital required: Rs.${Math.round((pathways?.combined?.capex_inr || 0) / 10000000).toFixed(1)} Crore

Provide:
1. **Performance Assessment** vs Indian coal sector averages
2. **Top 3 Priority Actions** specific to this mine's profile and location
3. **Technology ROI Analysis** with payback periods in INR
4. **Government Schemes** applicable (CAMPA, PAT, ICM, Green India Mission, etc.)
5. **5-Year Roadmap** with yearly milestones to carbon neutrality

Be specific, use data, and make it actionable for an Indian mine operator.
`;
    return await AIService.chat([{ role: 'user', content: prompt }]);
  }

  // ── Conversational Q&A ───────────────────────────────────────────────────
  static async askQuestion(question, mineContext = null, conversationHistory = []) {
    let contextBlock = '';
    if (mineContext?.totalEmissions_tCO2e) {
      contextBlock = `
[ACTIVE MINE CONTEXT]
Mine: ${mineContext.mineName || 'Coal Mine'} | Type: ${mineContext.mineType} | State: ${(mineContext.state || '').replace(/_/g, ' ')}
Total Emissions: ${Math.round(mineContext.totalEmissions_tCO2e).toLocaleString()} tCO2e/year
Carbon Status: ${mineContext.status}
[/ACTIVE MINE CONTEXT]

`;
    }

    const messages = [
      ...conversationHistory.slice(-10),
      { role: 'user', content: contextBlock + question }
    ];

    return await AIService.chat(messages);
  }

  // ── Afforestation strategy ───────────────────────────────────────────────
  static async getAfforestationStrategy(state, gapTCO2e, mineType) {
    const prompt = `
Create a detailed afforestation strategy for an Indian coal mine:
- Location: ${(state || '').replace(/_/g, ' ')}, India
- Mine Type: ${mineType}
- CO2 gap to offset: ${Math.round(gapTCO2e).toLocaleString()} tCO2e/year

Include:
1. **Recommended species** for ${(state || '').replace(/_/g, ' ')} with sequestration rates (tCO2/ha/year)
2. **Land area** calculation (hectares needed)
3. **5-year phased planting schedule**
4. **Cost breakdown** (nursery, planting, maintenance) in INR
5. **Government schemes**: CAMPA, Green India Mission, National Afforestation Programme
6. **Timeline** to full carbon offset
7. **Co-benefits**: biodiversity, water, employment

Use Indian units. Be specific to the state's ecology.
`;
    return await AIService.chat([{ role: 'user', content: prompt }]);
  }

  // ── Technology roadmap ───────────────────────────────────────────────────
  static async getTechnologyRoadmap(mineData, baseEmissions) {
    const prompt = `
Create a phased 10-year technology roadmap for carbon emission reduction:

Mine:
- Type: ${mineData.mineType} | Production: ${Math.round(parseFloat(mineData.annualProduction) || 0).toLocaleString()} t/year
- Current emissions: ${Math.round(baseEmissions).toLocaleString()} tCO2e/year
- Diesel: ${Math.round(parseFloat(mineData.dieselConsumption) || 0).toLocaleString()} L/year
- Grid electricity: ${Math.round(parseFloat(mineData.electricityConsumption) || 0).toLocaleString()} kWh/year
- Fleet: ${mineData.numVehicles || 'N/A'} diesel vehicles

Roadmap phases:
**Phase 1 (Yrs 1-2): Quick Wins** — low capex, fast payback
**Phase 2 (Yrs 3-5): Core Investments** — major emission drivers
**Phase 3 (Yrs 6-10): Transformation** — net-zero push

For each phase include:
- Specific technologies to deploy
- Expected emission reduction (tCO2e and %)
- Capex + opex in INR
- Financing options (green bonds, SIDBI, bank loans, government grants)
- Risk factors

End with cumulative emission reduction curve by year.
`;
    return await AIService.chat([{ role: 'user', content: prompt }]);
  }

  // ── Check which AI provider is active ───────────────────────────────────
  static getProviderStatus() {
    const hasGroq      = !!(config.ai.groqApiKey);
    const hasDeepSeek  = !!(config.ai.deepseekApiKey);
    const hasAnthropic = !!(config.ai.anthropicApiKey);

    const primary = hasGroq ? 'groq' : hasDeepSeek ? 'deepseek' : hasAnthropic ? 'anthropic' : null;

    return {
      primary,
      groq:      { available: hasGroq,      model: config.ai.groqModel },
      deepseek:  { available: hasDeepSeek,  model: config.ai.deepseekModel },
      anthropic: { available: hasAnthropic, model: config.ai.anthropicModel },
      anyAvailable: hasGroq || hasDeepSeek || hasAnthropic
    };
  }
}

module.exports = AIService;

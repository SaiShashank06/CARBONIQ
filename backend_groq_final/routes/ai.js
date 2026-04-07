/**
 * routes/ai.js
 * AI-powered endpoints — Groq primary, DeepSeek secondary, Anthropic fallback
 */

const express   = require('express');
const router    = express.Router();
const AIService = require('../services/aiService');
const { asyncHandler } = require('../middleware/errorHandler');
const { apiResponse, apiError } = require('../utils/helpers');

// GET /api/ai/status
router.get('/status', (req, res) => {
  const status = AIService.getProviderStatus();
  const modelName = status.primary === 'groq'      ? status.groq.model
                  : status.primary === 'deepseek'  ? status.deepseek.model
                  : status.anthropic.model;

  return apiResponse(res, {
    available: status.anyAvailable,
    primary:   status.primary,
    providers: { groq: status.groq, deepseek: status.deepseek, anthropic: status.anthropic },
    message:   status.anyAvailable
      ? `AI ready — using ${status.primary} (${modelName})`
      : 'No AI provider configured. Add GROQ_API_KEY to .env'
  });
});

// POST /api/ai/analyze
router.post('/analyze', asyncHandler(async (req, res) => {
  const { reportData } = req.body;
  if (!reportData?.summary) return apiError(res, 'reportData.summary is required', 400);
  const analysis = await AIService.analyzeMineReport(reportData);
  return apiResponse(res, { analysis, provider: AIService.getProviderStatus().primary });
}));

// POST /api/ai/chat
router.post('/chat', asyncHandler(async (req, res) => {
  const { question, mineContext, conversationHistory } = req.body;
  if (!question?.trim()) return apiError(res, 'question is required', 400);
  if (question.length > 3000) return apiError(res, 'Question too long (max 3000 chars)', 400);

  const response = await AIService.askQuestion(
    question.trim(),
    mineContext || null,
    Array.isArray(conversationHistory) ? conversationHistory.slice(-10) : []
  );

  return apiResponse(res, {
    response,
    question: question.trim(),
    provider: AIService.getProviderStatus().primary
  });
}));

// POST /api/ai/afforestation
router.post('/afforestation', asyncHandler(async (req, res) => {
  const { state, gapTCO2e, mineType } = req.body;
  if (!state || gapTCO2e == null) return apiError(res, 'state and gapTCO2e required', 400);
  const strategy = await AIService.getAfforestationStrategy(state, parseFloat(gapTCO2e), mineType || 'opencast');
  return apiResponse(res, { strategy, provider: AIService.getProviderStatus().primary });
}));

// POST /api/ai/technology-roadmap
router.post('/technology-roadmap', asyncHandler(async (req, res) => {
  const { mineData, baseEmissions } = req.body;
  if (!mineData || !baseEmissions) return apiError(res, 'mineData and baseEmissions required', 400);
  const roadmap = await AIService.getTechnologyRoadmap(mineData, parseFloat(baseEmissions));
  return apiResponse(res, { roadmap, provider: AIService.getProviderStatus().primary });
}));

module.exports = router;

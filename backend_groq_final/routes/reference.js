/**
 * routes/reference.js
 * Reference data: emission factors, states, credit rates, tech options
 */

const express = require('express');
const router = express.Router();
const {
  EMISSION_FACTORS,
  AFFORESTATION_RATES,
  CARBON_CREDIT_RATES,
  CLEAN_TECH_FACTORS,
  MINE_TYPE_FACTORS
} = require('../constants/emissionFactors');

// GET /api/reference/emission-factors
router.get('/emission-factors', (req, res) => {
  res.json({ success: true, data: EMISSION_FACTORS });
});

// GET /api/reference/states
router.get('/states', (req, res) => {
  const states = Object.entries(AFFORESTATION_RATES).map(([key, val]) => ({
    id: key,
    name: key === 'default'
      ? 'Other States (Default)'
      : key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    sequestration_rate_per_ha: val.rate,
    recommended_species: val.species,
    cost_per_ha_inr: val.cost_per_ha
  }));
  res.json({ success: true, data: states });
});

// GET /api/reference/carbon-credit-rates
router.get('/carbon-credit-rates', (req, res) => {
  res.json({
    success: true,
    data: CARBON_CREDIT_RATES,
    meta: { currency: 'USD', usd_to_inr: 83, last_updated: '2024-01' }
  });
});

// GET /api/reference/clean-tech
router.get('/clean-tech', (req, res) => {
  res.json({ success: true, data: CLEAN_TECH_FACTORS });
});

// GET /api/reference/mine-type-factors
router.get('/mine-type-factors', (req, res) => {
  res.json({ success: true, data: MINE_TYPE_FACTORS });
});

// GET /api/reference/all
router.get('/all', (req, res) => {
  res.json({
    success: true,
    data: {
      emissionFactors: EMISSION_FACTORS,
      afforestationRates: AFFORESTATION_RATES,
      carbonCreditRates: CARBON_CREDIT_RATES,
      cleanTechFactors: CLEAN_TECH_FACTORS,
      mineTypeFactors: MINE_TYPE_FACTORS
    }
  });
});

module.exports = router;

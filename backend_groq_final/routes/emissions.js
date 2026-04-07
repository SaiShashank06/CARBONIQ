const express = require('express');
const router = express.Router();
const EmissionCalculator = require('../services/emissionCalculator');
const { AFFORESTATION_RATES, CARBON_CREDIT_RATES, CLEAN_TECH_FACTORS } = require('../constants/emissionFactors');

// POST /api/emissions/calculate
// Calculate emissions from all mine activities
router.post('/calculate', (req, res) => {
  try {
    const data = req.body;

    if (!data.mineType || !data.annualProduction) {
      return res.status(400).json({
        success: false,
        error: 'mineType and annualProduction are required fields'
      });
    }

    const emissionData = EmissionCalculator.calculateEmissions(data);

    res.json({
      success: true,
      data: emissionData,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/emissions/carbon-sinks
// Calculate carbon sinks
router.post('/carbon-sinks', (req, res) => {
  try {
    const data = req.body;
    const sinkData = EmissionCalculator.calculateCarbonSinks(data);

    res.json({
      success: true,
      data: sinkData,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/emissions/gap-analysis
// Perform gap analysis and get recommendations
router.post('/gap-analysis', (req, res) => {
  try {
    const { totalEmissions, totalSinks, mineInfo } = req.body;

    if (totalEmissions === undefined) {
      return res.status(400).json({ success: false, error: 'totalEmissions is required' });
    }

    const gapData = EmissionCalculator.performGapAnalysis(
      parseFloat(totalEmissions),
      parseFloat(totalSinks) || 0,
      mineInfo || {}
    );

    res.json({
      success: true,
      data: gapData,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/emissions/pathways
// Simulate carbon neutrality pathways
router.post('/pathways', (req, res) => {
  try {
    const { mineData, baseEmissions } = req.body;

    if (!baseEmissions) {
      return res.status(400).json({ success: false, error: 'baseEmissions is required' });
    }

    const pathways = EmissionCalculator.simulatePathways(mineData || {}, parseFloat(baseEmissions));

    res.json({
      success: true,
      data: pathways,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/emissions/carbon-credits
// Calculate carbon credit potential
router.post('/carbon-credits', (req, res) => {
  try {
    const { baseEmissions, reducedEmissions, mineData } = req.body;

    const credits = EmissionCalculator.calculateCarbonCredits(
      parseFloat(baseEmissions) || 0,
      parseFloat(reducedEmissions) || 0,
      mineData || {}
    );

    res.json({
      success: true,
      data: credits,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/emissions/full-report
// Complete analysis in one call
router.post('/full-report', (req, res) => {
  try {
    const data = req.body;

    if (!data.mineType || !data.annualProduction) {
      return res.status(400).json({ success: false, error: 'mineType and annualProduction are required' });
    }

    // Step 1: Calculate emissions
    const emissionData = EmissionCalculator.calculateEmissions(data);
    const totalEmissions = emissionData.totals.total;

    // Step 2: Calculate sinks
    const sinkData = EmissionCalculator.calculateCarbonSinks(data);
    const totalSinks = sinkData.totalSink;

    // Step 3: Gap analysis
    const gapData = EmissionCalculator.performGapAnalysis(totalEmissions, totalSinks, emissionData.mineInfo);

    // Step 4: Pathways
    const pathways = EmissionCalculator.simulatePathways(data, totalEmissions);

    // Step 5: Carbon credits (based on combined strategy)
    const combinedReduction = totalEmissions * (pathways.combined.reduction_pct / 100);
    const credits = EmissionCalculator.calculateCarbonCredits(
      totalEmissions,
      totalEmissions - combinedReduction,
      data
    );

    res.json({
      success: true,
      data: {
        emissions: emissionData,
        carbonSinks: sinkData,
        gapAnalysis: gapData,
        pathways,
        carbonCredits: credits,
        summary: {
          mineName: data.mineName || 'Unknown Mine',
          mineType: data.mineType,
          state: data.state,
          totalEmissions_tCO2e: totalEmissions,
          totalSinks_tCO2e: totalSinks,
          gap_tCO2e: gapData.gap,
          coveragePercent: gapData.coveragePercent,
          status: gapData.status,
          perWorker_tCO2e: emissionData.perCapita.perWorker,
          perTonneCoal_tCO2e: emissionData.perCapita.perTonneCoal
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/emissions/states
// Get available states and their afforestation rates
router.get('/states', (req, res) => {
  const states = Object.entries(AFFORESTATION_RATES).map(([key, val]) => ({
    id: key,
    name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    sequestration_rate: val.rate,
    species: val.species,
    cost_per_ha: val.cost_per_ha
  }));

  res.json({ success: true, data: states });
});

// GET /api/emissions/carbon-credit-rates
// Get current carbon credit market rates
router.get('/carbon-credit-rates', (req, res) => {
  res.json({ success: true, data: CARBON_CREDIT_RATES });
});

// GET /api/emissions/clean-tech-options
// Get available clean technology options
router.get('/clean-tech-options', (req, res) => {
  res.json({ success: true, data: CLEAN_TECH_FACTORS });
});

module.exports = router;

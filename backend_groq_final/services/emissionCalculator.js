const {
  EMISSION_FACTORS,
  MINE_TYPE_FACTORS,
  AFFORESTATION_RATES,
  CARBON_CREDIT_RATES,
  CLEAN_TECH_FACTORS
} = require('../constants/emissionFactors');

class EmissionCalculator {

  /**
   * Calculate total carbon emissions from all mine activities
   * @param {Object} data - Mine activity data
   * @returns {Object} Detailed emission breakdown
   */
  static calculateEmissions(data) {
    const mineType = data.mineType || 'opencast';
    const typeFactor = MINE_TYPE_FACTORS[mineType];
    const annualProduction = parseFloat(data.annualProduction) || 0; // tonnes/year
    const workers = parseInt(data.numberOfWorkers) || 1;

    const results = {
      scope1: {},
      scope2: {},
      scope3: {},
      fugitive: {},
      totals: {},
      perCapita: {}
    };

    // ---- SCOPE 1: Direct Emissions ----
    // Diesel Combustion
    const dieselLiters = parseFloat(data.dieselConsumption) || 0;
    results.scope1.diesel = {
      quantity: dieselLiters,
      unit: 'liters/year',
      emission: dieselLiters * EMISSION_FACTORS.energy.diesel * typeFactor.diesel_intensity,
      label: 'Diesel Combustion'
    };

    // Explosives
    const explosivesKg = parseFloat(data.explosivesUsed) || 0;
    results.scope1.explosives = {
      quantity: explosivesKg,
      unit: 'kg/year',
      emission: explosivesKg * EMISSION_FACTORS.mining.explosives_ANFO,
      label: 'Explosives (ANFO)'
    };

    // Coal combustion on-site (if any)
    const coalBurnedTonnes = parseFloat(data.coalBurnedOnsite) || 0;
    results.scope1.coalCombustion = {
      quantity: coalBurnedTonnes,
      unit: 'tonnes/year',
      emission: coalBurnedTonnes * 1000 * EMISSION_FACTORS.energy.coal_combustion,
      label: 'On-site Coal Combustion'
    };

    // Overburden Removal
    const overburdenM3 = parseFloat(data.overburdenRemoved) || 0;
    results.scope1.overburden = {
      quantity: overburdenM3,
      unit: 'm³/year',
      emission: overburdenM3 * EMISSION_FACTORS.mining.overburden_removal * typeFactor.overburden_factor,
      label: 'Overburden Removal'
    };

    // ---- SCOPE 2: Indirect Emissions (Electricity) ----
    const electricityKwh = parseFloat(data.electricityConsumption) || 0;
    results.scope2.gridElectricity = {
      quantity: electricityKwh,
      unit: 'kWh/year',
      emission: electricityKwh * EMISSION_FACTORS.energy.gridElectricity * typeFactor.electricity_intensity,
      label: 'Grid Electricity'
    };

    // Equipment electricity (ventilation, pumps, etc.)
    const ventilationHours = parseFloat(data.ventilationHours) || 0;
    const ventilationKw = parseFloat(data.ventilationKw) || 0;
    const ventilationKwh = ventilationHours * ventilationKw;
    results.scope2.ventilation = {
      quantity: ventilationKwh,
      unit: 'kWh/year',
      emission: ventilationKwh * EMISSION_FACTORS.energy.gridElectricity,
      label: 'Ventilation Systems'
    };

    // Coal Washing
    const coalWashedTonnes = parseFloat(data.coalWashed) || 0;
    results.scope2.coalWashing = {
      quantity: coalWashedTonnes,
      unit: 'tonnes/year',
      emission: coalWashedTonnes * EMISSION_FACTORS.transport.coalWashing_electricity,
      label: 'Coal Washing'
    };

    // ---- SCOPE 3: Value Chain Emissions ----
    // Internal Transportation
    const internalTransportTonneKm = parseFloat(data.internalTransportTonneKm) || 0;
    results.scope3.internalTransport = {
      quantity: internalTransportTonneKm,
      unit: 'tonne-km/year',
      emission: internalTransportTonneKm * EMISSION_FACTORS.transport.dumperTruck_diesel,
      label: 'Internal Transportation'
    };

    // External Transportation (coal dispatch)
    const externalTransportTonneKm = parseFloat(data.externalTransportTonneKm) || 0;
    results.scope3.externalTransport = {
      quantity: externalTransportTonneKm,
      unit: 'tonne-km/year',
      emission: externalTransportTonneKm * EMISSION_FACTORS.transport.heavyTruck_diesel,
      label: 'External Transportation'
    };

    // Railway transport
    const railTransportTonneKm = parseFloat(data.railTransportTonneKm) || 0;
    results.scope3.railTransport = {
      quantity: railTransportTonneKm,
      unit: 'tonne-km/year',
      emission: railTransportTonneKm * EMISSION_FACTORS.transport.railway_diesel,
      label: 'Rail Transportation'
    };

    // ---- FUGITIVE EMISSIONS: Methane ----
    const coalProductionTonnes = annualProduction;
    const methaneFactor = mineType === 'underground'
      ? EMISSION_FACTORS.fugitive.underground_methane
      : mineType === 'opencast'
        ? EMISSION_FACTORS.fugitive.openCast_methane
        : 5.0;

    const methaneM3 = coalProductionTonnes * methaneFactor;
    const methaneTonnes = methaneM3 * EMISSION_FACTORS.fugitive.CH4_density;
    const methaneEmission = methaneTonnes * EMISSION_FACTORS.fugitive.methane_GWP * 1000; // in kg

    results.fugitive.coalMethane = {
      quantity: methaneM3,
      unit: 'm³/year',
      methane_tonnes: methaneTonnes,
      emission: methaneEmission,
      label: 'Fugitive Methane (Coal Seam)'
    };

    // Additional user-specified methane (if drainage systems)
    const methaneVentedM3 = parseFloat(data.methaneVented) || 0;
    const methaneVentedEmission = methaneVentedM3 * EMISSION_FACTORS.fugitive.CH4_density
      * EMISSION_FACTORS.fugitive.methane_GWP * 1000;
    results.fugitive.ventedMethane = {
      quantity: methaneVentedM3,
      unit: 'm³/year',
      emission: methaneVentedEmission,
      label: 'Vented Methane (Drainage)'
    };

    // ---- TOTALS ----
    const scope1Total = Object.values(results.scope1).reduce((sum, v) => sum + (v.emission || 0), 0);
    const scope2Total = Object.values(results.scope2).reduce((sum, v) => sum + (v.emission || 0), 0);
    const scope3Total = Object.values(results.scope3).reduce((sum, v) => sum + (v.emission || 0), 0);
    const fugitiveTotal = Object.values(results.fugitive).reduce((sum, v) => sum + (v.emission || 0), 0);

    const totalKgCO2e = scope1Total + scope2Total + scope3Total + fugitiveTotal;
    const totalTCO2e = totalKgCO2e / 1000;

    results.totals = {
      scope1: scope1Total / 1000,   // tCO2e
      scope2: scope2Total / 1000,
      scope3: scope3Total / 1000,
      fugitive: fugitiveTotal / 1000,
      total: totalTCO2e,
      unit: 'tCO2e/year'
    };

    // Per Capita
    results.perCapita = {
      perWorker: totalTCO2e / workers,
      perTonneCoal: annualProduction > 0 ? totalTCO2e / annualProduction : 0,
      workers,
      annualProduction,
      unit: 'tCO2e'
    };

    results.mineInfo = {
      mineType,
      annualProduction,
      workers
    };

    return results;
  }

  /**
   * Calculate carbon sinks from afforestation and other sources
   */
  static calculateCarbonSinks(data) {
    const state = (data.state || 'default').toLowerCase().replace(/\s/g, '_');
    const stateRate = AFFORESTATION_RATES[state] || AFFORESTATION_RATES.default;

    const forestAreaHa = parseFloat(data.existingForestArea) || 0;
    const plantationAreaHa = parseFloat(data.plantationArea) || 0;
    const mineRestoration = parseFloat(data.mineRestorationArea) || 0;
    const greenBeltArea = parseFloat(data.greenBeltArea) || 0;

    // Existing forest (mature) sequesters at a lower rate
    const matureForestRate = stateRate.rate * 0.6; // mature forests sequester less

    const sinks = {
      existingForest: {
        area: forestAreaHa,
        sequestration_rate: matureForestRate,
        total_sink: forestAreaHa * matureForestRate,
        label: 'Existing Forest Area'
      },
      newPlantation: {
        area: plantationAreaHa,
        sequestration_rate: stateRate.rate,
        total_sink: plantationAreaHa * stateRate.rate,
        species: stateRate.species,
        label: 'New Plantation (Afforestation)'
      },
      mineRestoration: {
        area: mineRestoration,
        sequestration_rate: stateRate.rate * 0.7, // mine reclaimed land
        total_sink: mineRestoration * stateRate.rate * 0.7,
        label: 'Mine Area Restoration'
      },
      greenBelt: {
        area: greenBeltArea,
        sequestration_rate: stateRate.rate * 0.8,
        total_sink: greenBeltArea * stateRate.rate * 0.8,
        label: 'Green Belt Plantation'
      },
      solarOffsets: {
        capacity_kw: parseFloat(data.solarCapacityKw) || 0,
        generation_kwh: (parseFloat(data.solarCapacityKw) || 0) * 8760 * 0.22,
        emission_avoided: (parseFloat(data.solarCapacityKw) || 0) * 8760 * 0.22 * (EMISSION_FACTORS.energy.gridElectricity - 0.045) / 1000,
        label: 'Solar Energy (Avoided Emissions)'
      }
    };

    const totalSinkTCO2e = Object.values(sinks).reduce((sum, s) => sum + (s.total_sink || s.emission_avoided || 0), 0);

    return {
      sinks,
      stateInfo: stateRate,
      totalSink: totalSinkTCO2e,
      unit: 'tCO2e/year',
      state
    };
  }

  /**
   * Perform gap analysis between emissions and sinks
   */
  static performGapAnalysis(totalEmissions, totalSinks, mineInfo) {
    const gap = totalEmissions - totalSinks;
    const coveragePercent = totalEmissions > 0 ? (totalSinks / totalEmissions) * 100 : 0;

    let status, urgency;
    if (coveragePercent >= 100) {
      status = 'Carbon Neutral or Negative';
      urgency = 'low';
    } else if (coveragePercent >= 75) {
      status = 'Near Carbon Neutral';
      urgency = 'medium';
    } else if (coveragePercent >= 50) {
      status = 'Significant Gap';
      urgency = 'high';
    } else {
      status = 'Critical Gap';
      urgency = 'critical';
    }

    // Calculate afforestation needed to bridge gap
    const stateRate = 7.5; // default tCO2e/ha/year
    const afforestationNeededHa = gap > 0 ? gap / stateRate : 0;
    const estimatedAfforestationCost = afforestationNeededHa * 45000; // INR

    return {
      totalEmissions,
      totalSinks,
      gap: Math.max(0, gap),
      surplus: Math.max(0, -gap),
      coveragePercent: Math.min(100, coveragePercent),
      status,
      urgency,
      afforestationNeededHa,
      estimatedAfforestationCost,
      recommendations: this.generateRecommendations(gap, coveragePercent, mineInfo)
    };
  }

  /**
   * Generate targeted recommendations
   */
  static generateRecommendations(gap, coveragePercent, mineInfo) {
    const recs = [];

    if (mineInfo.mineType === 'underground') {
      recs.push({
        priority: 'HIGH',
        category: 'Fugitive Emissions',
        action: 'Implement Coal Mine Methane (CMM) capture system',
        potential_reduction_pct: 18,
        estimated_cost_inr: 50000000,
        payback_years: 4
      });
    }

    if (coveragePercent < 60) {
      recs.push({
        priority: 'HIGH',
        category: 'Transportation',
        action: 'Phase out diesel dumpers; introduce electric haul trucks',
        potential_reduction_pct: 15,
        estimated_cost_inr: 150000000,
        payback_years: 6
      });
    }

    recs.push({
      priority: 'HIGH',
      category: 'Renewable Energy',
      action: `Install ${Math.round(gap / 1000)} MW solar plant to offset grid electricity`,
      potential_reduction_pct: 20,
      estimated_cost_inr: Math.round(gap / 1000) * 45000000,
      payback_years: 7
    });

    recs.push({
      priority: 'MEDIUM',
      category: 'Energy Efficiency',
      action: 'Deploy VFD drives on conveyor belts, ventilation fans and pumps',
      potential_reduction_pct: 8,
      estimated_cost_inr: 15000000,
      payback_years: 3
    });

    recs.push({
      priority: 'MEDIUM',
      category: 'Afforestation',
      action: `Plant ${Math.round(gap / 7.5).toLocaleString()} hectares with state-specific species`,
      potential_reduction_pct: null,
      offset_tco2e: gap,
      estimated_cost_inr: Math.round(gap / 7.5) * 45000,
      payback_years: null
    });

    recs.push({
      priority: 'MEDIUM',
      category: 'Carbon Credits',
      action: 'Register under Indian Carbon Market (ICM) for carbon credits',
      potential_revenue_inr_per_year: Math.round(gap * CARBON_CREDIT_RATES.voluntary_market.indian_carbon_market * 83),
      payback_years: null
    });

    recs.push({
      priority: 'LOW',
      category: 'Process Optimization',
      action: 'Switch to LED lighting across mine infrastructure',
      potential_reduction_pct: 3,
      estimated_cost_inr: 8000000,
      payback_years: 2
    });

    return recs;
  }

  /**
   * Simulate clean technology scenarios
   */
  static simulatePathways(data, baseEmissions) {
    const pathways = {};

    // Scenario 1: Electric Vehicles
    const evReduction = baseEmissions * CLEAN_TECH_FACTORS.electric_vehicles.reduction_pct * 0.3; // ~30% transport share
    pathways.electricVehicles = {
      name: 'Electric Vehicle Fleet',
      emissions_after: baseEmissions - evReduction,
      reduction: evReduction,
      reduction_pct: (evReduction / baseEmissions) * 100,
      capex_inr: data.numVehicles * CLEAN_TECH_FACTORS.electric_vehicles.capex_per_unit || 50000000,
      annual_saving_inr: evReduction * 83 * 8, // carbon + fuel savings approx
      payback_years: CLEAN_TECH_FACTORS.electric_vehicles.implementation_years + 2,
      timeline: '3–5 years'
    };

    // Scenario 2: Methane Capture
    const methaneFugitive = parseFloat(data.fugitiveMethane) || baseEmissions * 0.15;
    const methaneCapture = methaneFugitive * CLEAN_TECH_FACTORS.methane_capture.capture_efficiency;
    const methaneEnergy = parseFloat(data.methaneM3 || 0) * CLEAN_TECH_FACTORS.methane_capture.energy_value;
    pathways.methaneCapture = {
      name: 'Methane Capture & Utilization',
      emissions_after: baseEmissions - methaneCapture,
      reduction: methaneCapture,
      reduction_pct: (methaneCapture / baseEmissions) * 100,
      capex_inr: CLEAN_TECH_FACTORS.methane_capture.capex,
      energy_generated_kwh: methaneEnergy,
      payback_years: 5,
      timeline: '2–3 years'
    };

    // Scenario 3: Solar Energy
    const solarCapacityKw = (parseFloat(data.electricityConsumption) || 10000) / (8760 * 0.22) * 1000;
    const solarGeneration = solarCapacityKw * 8760 * 0.22 / 1000; // MWh
    const solarEmissionSaving = solarGeneration * (EMISSION_FACTORS.energy.gridElectricity - CLEAN_TECH_FACTORS.solar_energy.emission_factor);
    pathways.solarEnergy = {
      name: 'Solar Power Installation',
      emissions_after: baseEmissions - solarEmissionSaving,
      reduction: solarEmissionSaving,
      reduction_pct: (solarEmissionSaving / baseEmissions) * 100,
      capacity_mw: solarCapacityKw / 1000,
      capex_inr: (solarCapacityKw / 1000) * CLEAN_TECH_FACTORS.solar_energy.capex_per_MW,
      annual_saving_inr: solarEmissionSaving * 83 * 8,
      payback_years: 7,
      timeline: '1–2 years'
    };

    // Scenario 4: Combined (Best Case)
    const combinedReduction = evReduction + methaneCapture * 0.5 + solarEmissionSaving * 0.5;
    pathways.combined = {
      name: 'Combined Strategy (Optimal)',
      emissions_after: Math.max(0, baseEmissions - combinedReduction),
      reduction: combinedReduction,
      reduction_pct: Math.min(100, (combinedReduction / baseEmissions) * 100),
      capex_inr: pathways.electricVehicles.capex_inr + CLEAN_TECH_FACTORS.methane_capture.capex + pathways.solarEnergy.capex_inr,
      payback_years: 8,
      timeline: '5–8 years'
    };

    // Scenario 5: Afforestation Only
    const state = (data.state || 'default').toLowerCase().replace(/\s/g, '_');
    const stateRate = AFFORESTATION_RATES[state] || AFFORESTATION_RATES.default;
    const affoNeeded = baseEmissions / stateRate.rate;
    pathways.afforestation = {
      name: 'Afforestation / Carbon Offset',
      hectares_needed: affoNeeded,
      cost_per_ha: stateRate.cost_per_ha,
      total_cost_inr: affoNeeded * stateRate.cost_per_ha,
      species: stateRate.species,
      sequestration_per_ha: stateRate.rate,
      timeline: '10–20 years (maturity)',
      emissions_after: 0,
      reduction: baseEmissions,
      reduction_pct: 100
    };

    return pathways;
  }

  /**
   * Calculate carbon credit potential
   */
  static calculateCarbonCredits(baseEmissions, reducedEmissions, data) {
    const creditsEarnable = Math.max(0, baseEmissions - reducedEmissions);
    const usdToInr = 83;

    return {
      creditsEarnable,
      markets: {
        vcs: {
          name: 'Verified Carbon Standard (VCS)',
          rate_usd: CARBON_CREDIT_RATES.voluntary_market.VCS,
          revenue_usd: creditsEarnable * CARBON_CREDIT_RATES.voluntary_market.VCS,
          revenue_inr: creditsEarnable * CARBON_CREDIT_RATES.voluntary_market.VCS * usdToInr
        },
        gold_standard: {
          name: 'Gold Standard',
          rate_usd: CARBON_CREDIT_RATES.voluntary_market.Gold_Standard,
          revenue_usd: creditsEarnable * CARBON_CREDIT_RATES.voluntary_market.Gold_Standard,
          revenue_inr: creditsEarnable * CARBON_CREDIT_RATES.voluntary_market.Gold_Standard * usdToInr
        },
        indian_carbon_market: {
          name: 'Indian Carbon Market (ICM)',
          rate_usd: CARBON_CREDIT_RATES.voluntary_market.indian_carbon_market,
          revenue_usd: creditsEarnable * CARBON_CREDIT_RATES.voluntary_market.indian_carbon_market,
          revenue_inr: creditsEarnable * CARBON_CREDIT_RATES.voluntary_market.indian_carbon_market * usdToInr
        }
      },
      recommendation: creditsEarnable > 0
        ? `By reducing ${creditsEarnable.toFixed(0)} tCO2e, your mine can earn ₹${Math.round(creditsEarnable * CARBON_CREDIT_RATES.voluntary_market.VCS * usdToInr).toLocaleString()} - ₹${Math.round(creditsEarnable * CARBON_CREDIT_RATES.voluntary_market.Gold_Standard * usdToInr).toLocaleString()} annually from carbon markets.`
        : 'No additional emission reductions available for carbon credit generation.'
    };
  }
}

module.exports = EmissionCalculator;

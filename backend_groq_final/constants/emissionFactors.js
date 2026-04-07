/**
 * Emission Factors for Indian Coal Mines
 * Sources: IPCC 2006 Guidelines, MoEFCC India, BEE India
 */

const EMISSION_FACTORS = {
  // Energy Emission Factors
  energy: {
    gridElectricity: 0.82,        // kg CO2e/kWh (India CEA 2023)
    diesel: 2.688,                 // kg CO2e/liter
    coal_combustion: 2.42,         // kg CO2e/kg
    petrol: 2.315,                 // kg CO2e/liter
    naturalGas: 2.02,              // kg CO2e/m3
    hsdFuel: 2.688,                // kg CO2e/liter (HSD)
    furnaceOil: 3.17               // kg CO2e/liter
  },

  // Mining Activity Emission Factors
  mining: {
    explosives_ANFO: 0.2,          // kg CO2e/kg ANFO (approx)
    explosives_dynamite: 0.48,     // kg CO2e/kg
    blasting_gas_release: 0.15,    // kg CO2e/kg explosive
    overburden_removal: 0.0012,    // kg CO2e/m3 (blasting + diesel)
    coal_extraction_oc: 0.008,     // kg CO2e/tonne (open cast)
    coal_extraction_ug: 0.012,     // kg CO2e/tonne (underground)
    methane_drainage: 0.025        // kg CO2e/m3 CH4 (GWP 28)
  },

  // Transportation Emission Factors
  transport: {
    heavyTruck_diesel: 0.165,      // kg CO2e/tonne-km
    lightTruck_diesel: 0.205,      // kg CO2e/tonne-km
    conveyor_electric: 0.012,      // kg CO2e/tonne-km
    railway_diesel: 0.025,         // kg CO2e/tonne-km
    dumperTruck_diesel: 0.18,      // kg CO2e/tonne-km (mine internal)
    coalWashing_electricity: 4.5   // kg CO2e/tonne washed
  },

  // Equipment Emission Factors
  equipment: {
    excavator_diesel: 25,          // kg CO2e/hour
    dragline_electricity: 18,      // kg CO2e/hour
    shoveLoader_diesel: 20,        // kg CO2e/hour
    drillRig_diesel: 12,           // kg CO2e/hour
    compressor_diesel: 8,          // kg CO2e/hour
    pumpSet_diesel: 6,             // kg CO2e/hour
    generator_diesel: 2.68,        // kg CO2e/liter diesel
    ventilationFan_electricity: 0.82  // kg CO2e/kWh
  },

  // Fugitive Methane Emissions (coal seam)
  fugitive: {
    openCast_methane: 0.3,         // m3 CH4/tonne coal
    underground_methane: 15,       // m3 CH4/tonne coal (high gassy)
    methane_GWP: 28,               // GWP100
    CH4_density: 0.000717          // tonne/m3
  },

  // Coal Washery
  washery: {
    middlings_emission: 0.5,       // kg CO2e/tonne
    rejects_disposal: 0.3          // kg CO2e/tonne
  }
};

// State-specific Afforestation Carbon Sequestration Rates (tCO2/ha/year)
const AFFORESTATION_RATES = {
  jharkhand: { rate: 7.2, species: 'Sal, Teak, Bamboo', cost_per_ha: 45000 },
  chhattisgarh: { rate: 8.1, species: 'Teak, Bamboo, Eucalyptus', cost_per_ha: 42000 },
  odisha: { rate: 7.8, species: 'Sal, Teak, Bamboo', cost_per_ha: 43000 },
  madhya_pradesh: { rate: 6.9, species: 'Teak, Bamboo, Kadamba', cost_per_ha: 44000 },
  west_bengal: { rate: 8.4, species: 'Teak, Bamboo, Arjun', cost_per_ha: 48000 },
  telangana: { rate: 7.5, species: 'Teak, Bamboo, Neem', cost_per_ha: 40000 },
  andhra_pradesh: { rate: 7.3, species: 'Teak, Eucalyptus, Neem', cost_per_ha: 41000 },
  maharashtra: { rate: 6.8, species: 'Teak, Bamboo, Acacia', cost_per_ha: 50000 },
  rajasthan: { rate: 5.2, species: 'Prosopis, Acacia, Khejri', cost_per_ha: 38000 },
  uttar_pradesh: { rate: 6.5, species: 'Poplar, Eucalyptus, Bamboo', cost_per_ha: 46000 },
  assam: { rate: 9.1, species: 'Teak, Bamboo, Hollong', cost_per_ha: 52000 },
  meghalaya: { rate: 9.5, species: 'Bamboo, Oak, Pine', cost_per_ha: 54000 },
  default: { rate: 7.5, species: 'Mixed tropical species', cost_per_ha: 45000 }
};

// Carbon Credit Market Rates (USD/tCO2e)
const CARBON_CREDIT_RATES = {
  voluntary_market: {
    VCS: 12.5,           // Verified Carbon Standard
    Gold_Standard: 18.0, // Gold Standard
    CDM: 5.0,            // Clean Development Mechanism
    indian_carbon_market: 8.0  // Indian Carbon Market (ICM)
  },
  compliance_market: {
    EU_ETS: 65.0,        // EU ETS (reference)
    indian_PAT: 3.5      // PAT scheme (energy savings certificates)
  }
};

// Clean Technology Reduction Factors
const CLEAN_TECH_FACTORS = {
  electric_vehicles: {
    reduction_pct: 0.65,    // 65% reduction vs diesel
    capex_per_unit: 5000000, // INR per vehicle
    opex_saving_pct: 0.40,  // 40% operating cost saving
    implementation_years: 3
  },
  methane_capture: {
    capture_efficiency: 0.75, // 75% of fugitive methane captured
    energy_value: 5.5,        // kWh per m3 CH4
    capex: 50000000,          // INR for capture system
    implementation_years: 2
  },
  solar_energy: {
    emission_factor: 0.045,   // kg CO2e/kWh (vs 0.82 grid)
    capex_per_MW: 45000000,   // INR/MW
    capacity_factor: 0.22,    // 22% average India
    lifetime_years: 25
  },
  wind_energy: {
    emission_factor: 0.012,   // kg CO2e/kWh
    capex_per_MW: 60000000,
    capacity_factor: 0.30,
    lifetime_years: 25
  },
  conveyor_replacement: {
    reduction_vs_truck_pct: 0.60, // 60% transport emission reduction
    capex_per_km: 80000000,
    opex_saving_pct: 0.45
  },
  led_lighting: {
    reduction_pct: 0.55,
    payback_years: 2,
    capex_per_installation: 2000000
  },
  vfd_drives: {
    reduction_pct: 0.30,
    payback_years: 3,
    capex_per_unit: 500000
  }
};

// Mine Type Multipliers
const MINE_TYPE_FACTORS = {
  opencast: {
    methane_factor: 0.3,
    electricity_intensity: 0.7,
    diesel_intensity: 1.4,
    overburden_factor: 1.0
  },
  underground: {
    methane_factor: 1.8,
    electricity_intensity: 1.6,
    diesel_intensity: 0.6,
    overburden_factor: 0.2
  },
  mixed: {
    methane_factor: 1.0,
    electricity_intensity: 1.1,
    diesel_intensity: 1.0,
    overburden_factor: 0.6
  }
};

module.exports = {
  EMISSION_FACTORS,
  AFFORESTATION_RATES,
  CARBON_CREDIT_RATES,
  CLEAN_TECH_FACTORS,
  MINE_TYPE_FACTORS
};

export const oimlRuleset2006 = {
  version_name: "OIML R-76-1:2006 (E)",
  description: "Metrological tolerances and evaluation limits for Non-Automatic Weighing Instruments",
  mpe_table: {
    class_I: {
      e_intervals: [50000, 200000],
      mpe_e: [0.5, 1.0, 1.5]
    },
    class_II: {
      e_intervals: [5000, 20000],
      mpe_e: [0.5, 1.0, 1.5]
    },
    class_III: {
      e_intervals: [500, 2000],
      mpe_e: [0.5, 1.0, 1.5]
    },
    class_IIII: {
      e_intervals: [50, 200],
      mpe_e: [0.5, 1.0, 1.5]
    }
  },
  constants: {
    zero_setting_limit_e: 0.25,
    zero_return_limit_e: 0.5,
    eccentricity_load_fraction: 0.3333333333333333,
    tare_mpe_multiplier: 1.0,
    discrimination_load_multiplier: 1.4
  }
};

export default oimlRuleset2006;

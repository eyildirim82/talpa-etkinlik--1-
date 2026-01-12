/**
 * Architecture Drift Detection System
 * 
 * P3 Implementation - Observation & Enforcement Only
 * 
 * This system provides:
 * 1. Baseline snapshot generation
 * 2. Drift detection and measurement
 * 3. Metrics reporting in multiple formats
 * 4. CI/CD integration guards
 * 
 * Scripts:
 * - baseline.ts: Generate architecture snapshot
 * - drift-detector.ts: Compare current state vs baseline
 * - metrics-reporter.ts: Generate detailed reports
 * - ci-guard.ts: Block merges on critical drift
 * 
 * Usage:
 * ```bash
 * # Generate initial baseline
 * npm run arch:baseline
 * 
 * # Check for drift
 * npm run arch:drift
 * 
 * # Generate metrics report
 * npm run arch:metrics
 * 
 * # CI guard (blocks on failure)
 * npm run arch:guard
 * ```
 */

export const DRIFT_VECTORS = [
  'boundary_violation',
  'dependency_change',
  'module_size_increase',
  'admin_inflation',
  'type_duplication',
  'shared_contamination',
  'circular_dependency',
  'public_api_bypass'
] as const;

export const SEVERITY_LEVELS = ['critical', 'warning', 'info'] as const;

export const THRESHOLDS = {
  MAX_BOUNDARY_VIOLATIONS: 0,
  MAX_CIRCULAR_DEPENDENCIES: 0,
  MAX_ADMIN_INFLATION: 60,
  MAX_TYPE_DUPLICATION: 10,
  MAX_MODULE_SIZE_LINES: 3000,
  MODULE_SIZE_INCREASE_PERCENT: 20,
  MIN_MODULE_HEALTH: 50
};

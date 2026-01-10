/**
 * Architecture Drift Detector
 * 
 * Compares current architecture state against baseline and detects drift.
 * Generates detailed reports on:
 * - New boundary violations
 * - Dependency changes
 * - Module size changes
 * - Admin inflation
 * - Type duplication
 * - Shared layer contamination
 * 
 * Usage: npx tsx scripts/architecture/drift-detector.ts [--fail-on-drift] [--json]
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// TYPES
// ============================================================================

interface ModuleMetrics {
  name: string;
  fileCount: number;
  lineCount: number;
  exportCount: number;
  importCount: number;
  crossModuleImports: CrossModuleImport[];
  internalFiles: string[];
  publicApi: string[];
  typeDefinitions: number;
  testCoverage: number;
}

interface CrossModuleImport {
  from: string;
  to: string;
  importPath: string;
  isDirectInternal: boolean;
}

interface DependencyEdge {
  source: string;
  target: string;
  weight: number;
}

interface BoundaryViolation {
  file: string;
  violation: string;
  severity: 'error' | 'warning';
}

interface GlobalMetrics {
  totalModules: number;
  totalFiles: number;
  totalLines: number;
  avgModuleSize: number;
  maxModuleSize: number;
  minModuleSize: number;
  boundaryViolationCount: number;
  circularDependencyCount: number;
  sharedLayerContamination: number;
  adminInflationScore: number;
  typeDuplicationScore: number;
}

interface ArchitectureBaseline {
  version: string;
  timestamp: string;
  gitCommit: string;
  modules: ModuleMetrics[];
  dependencyGraph: DependencyEdge[];
  sharedLayerSize: number;
  circularDependencies: string[][];
  boundaryViolations: BoundaryViolation[];
  metrics: GlobalMetrics;
}

interface DriftReport {
  timestamp: string;
  baselineCommit: string;
  currentCommit: string;
  hasDrift: boolean;
  driftScore: number;
  driftVectors: DriftVector[];
  summary: DriftSummary;
}

interface DriftVector {
  type: DriftType;
  severity: 'critical' | 'warning' | 'info';
  metric: string;
  baseline: number | string;
  current: number | string;
  delta: number | string;
  details?: string;
}

type DriftType = 
  | 'boundary_violation'
  | 'dependency_change'
  | 'module_size_increase'
  | 'admin_inflation'
  | 'type_duplication'
  | 'shared_contamination'
  | 'circular_dependency'
  | 'public_api_bypass';

interface DriftSummary {
  newViolations: number;
  resolvedViolations: number;
  modulesWithGrowth: string[];
  newDependencies: string[];
  removedDependencies: string[];
  overallHealthScore: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const MODULES_PATH = path.join(PROJECT_ROOT, 'src/modules');
const SHARED_PATH = path.join(PROJECT_ROOT, 'src/shared');
const BASELINE_FILE = path.join(PROJECT_ROOT, '.architecture/baseline.json');
const DRIFT_REPORTS_DIR = path.join(PROJECT_ROOT, '.architecture/drift-reports');

// Thresholds for drift detection
const THRESHOLDS = {
  MODULE_SIZE_INCREASE_PERCENT: 20,
  ADMIN_INFLATION_MAX: 50,
  TYPE_DUPLICATION_MAX: 5,
  SHARED_CONTAMINATION_MAX: 100,
  BOUNDARY_VIOLATION_MAX: 0,
  CIRCULAR_DEP_MAX: 0
};

// ============================================================================
// FILE UTILITIES (Same as baseline.ts)
// ============================================================================

function getAllFiles(dir: string, extensions: string[] = ['.ts', '.tsx']): string[] {
  if (!fs.existsSync(dir)) return [];
  
  const files: string[] = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, extensions));
    } else if (extensions.some(ext => item.endsWith(ext))) {
      if (!item.includes('.test.')) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

function countLines(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

function getGitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

// ============================================================================
// CURRENT STATE ANALYSIS (Simplified from baseline.ts)
// ============================================================================

function getCurrentMetrics(): GlobalMetrics {
  const moduleNames = fs.readdirSync(MODULES_PATH).filter(m => {
    const stat = fs.statSync(path.join(MODULES_PATH, m));
    return stat.isDirectory();
  });
  
  let totalFiles = 0;
  let totalLines = 0;
  const moduleSizes: number[] = [];
  
  for (const name of moduleNames) {
    const modulePath = path.join(MODULES_PATH, name);
    const files = getAllFiles(modulePath);
    totalFiles += files.length;
    
    let moduleLines = 0;
    for (const file of files) {
      moduleLines += countLines(file);
    }
    totalLines += moduleLines;
    moduleSizes.push(moduleLines);
  }
  
  return {
    totalModules: moduleNames.length,
    totalFiles,
    totalLines,
    avgModuleSize: Math.round(totalLines / moduleNames.length),
    maxModuleSize: Math.max(...moduleSizes),
    minModuleSize: Math.min(...moduleSizes),
    boundaryViolationCount: detectBoundaryViolationCount(),
    circularDependencyCount: detectCircularDependencyCount(),
    sharedLayerContamination: analyzeSharedLayerSize(),
    adminInflationScore: calculateCurrentAdminInflation(),
    typeDuplicationScore: calculateCurrentTypeDuplication()
  };
}

function detectBoundaryViolationCount(): number {
  let count = 0;
  const moduleNames = fs.readdirSync(MODULES_PATH).filter(m => {
    const stat = fs.statSync(path.join(MODULES_PATH, m));
    return stat.isDirectory();
  });
  
  for (const module of moduleNames) {
    const modulePath = path.join(MODULES_PATH, module);
    const files = getAllFiles(modulePath);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Check for deprecated imports
      if (content.includes('@/shared/services')) count++;
      if (content.includes('@/shared/hooks')) count++;
      
      // Check for direct internal imports (simplified check)
      const internalPatterns = [
        /@\/modules\/[^/]+\/api\/[^'"]+/,
        /@\/modules\/[^/]+\/hooks\/[^'"]+/,
        /@\/modules\/[^/]+\/services\/[^'"]+/
      ];
      
      for (const pattern of internalPatterns) {
        if (pattern.test(content)) count++;
      }
    }
  }
  
  return count;
}

function detectCircularDependencyCount(): number {
  try {
    const result = execSync(
      'npx madge --circular --json --extensions ts,tsx src/modules',
      { encoding: 'utf-8', cwd: PROJECT_ROOT }
    );
    const cycles = JSON.parse(result) || [];
    return cycles.length;
  } catch (error) {
    try {
      const output = (error as { stdout?: string }).stdout || '';
      if (output.trim()) {
        return JSON.parse(output).length;
      }
    } catch {
      // ignore
    }
    return 0;
  }
}

function analyzeSharedLayerSize(): number {
  const files = getAllFiles(SHARED_PATH);
  let totalLines = 0;
  
  for (const file of files) {
    if (file.includes('/infrastructure/')) continue;
    if (file.includes('/test-utils/')) continue;
    if (file.includes('/utils/')) continue;
    if (file.includes('/components/ui/')) continue;
    
    totalLines += countLines(file);
  }
  
  return totalLines;
}

function calculateCurrentAdminInflation(): number {
  const adminPath = path.join(MODULES_PATH, 'admin');
  if (!fs.existsSync(adminPath)) return 0;
  
  const adminFiles = getAllFiles(adminPath);
  let adminLines = 0;
  for (const file of adminFiles) {
    adminLines += countLines(file);
  }
  
  // Compare to average domain module
  const domainModules = ['booking', 'event', 'profile', 'ticket'];
  let domainTotal = 0;
  let domainCount = 0;
  
  for (const mod of domainModules) {
    const modPath = path.join(MODULES_PATH, mod);
    if (fs.existsSync(modPath)) {
      const files = getAllFiles(modPath);
      for (const file of files) {
        domainTotal += countLines(file);
      }
      domainCount++;
    }
  }
  
  const avgDomainSize = domainCount > 0 ? domainTotal / domainCount : 1;
  const sizeRatio = adminLines / avgDomainSize;
  return Math.max(0, Math.round((sizeRatio - 1) * 50));
}

function calculateCurrentTypeDuplication(): number {
  const typeNames: Map<string, Set<string>> = new Map();
  
  const moduleNames = fs.readdirSync(MODULES_PATH).filter(m => {
    const stat = fs.statSync(path.join(MODULES_PATH, m));
    return stat.isDirectory();
  });
  
  for (const module of moduleNames) {
    const modulePath = path.join(MODULES_PATH, module);
    const files = getAllFiles(modulePath);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const typeMatches = content.match(/(?:export\s+)?(?:type|interface)\s+(\w+)/g);
      
      if (typeMatches) {
        for (const match of typeMatches) {
          const nameMatch = match.match(/(?:type|interface)\s+(\w+)/);
          if (nameMatch) {
            const typeName = nameMatch[1];
            if (!typeNames.has(typeName)) {
              typeNames.set(typeName, new Set());
            }
            typeNames.get(typeName)!.add(module);
          }
        }
      }
    }
  }
  
  let duplications = 0;
  for (const [, modules] of typeNames) {
    if (modules.size > 1) duplications++;
  }
  
  return duplications;
}

// ============================================================================
// DRIFT DETECTION
// ============================================================================

function loadBaseline(): ArchitectureBaseline | null {
  if (!fs.existsSync(BASELINE_FILE)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(BASELINE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function detectDrift(baseline: ArchitectureBaseline): DriftReport {
  const current = getCurrentMetrics();
  const driftVectors: DriftVector[] = [];
  
  // 1. Boundary Violation Drift
  const violationDelta = current.boundaryViolationCount - baseline.metrics.boundaryViolationCount;
  if (violationDelta !== 0) {
    driftVectors.push({
      type: 'boundary_violation',
      severity: violationDelta > 0 ? 'critical' : 'info',
      metric: 'boundaryViolationCount',
      baseline: baseline.metrics.boundaryViolationCount,
      current: current.boundaryViolationCount,
      delta: violationDelta > 0 ? `+${violationDelta}` : `${violationDelta}`,
      details: violationDelta > 0 
        ? `${violationDelta} new boundary violations detected!`
        : `${Math.abs(violationDelta)} boundary violations resolved`
    });
  }
  
  // 2. Circular Dependency Drift
  const circularDelta = current.circularDependencyCount - baseline.metrics.circularDependencyCount;
  if (circularDelta !== 0) {
    driftVectors.push({
      type: 'circular_dependency',
      severity: circularDelta > 0 ? 'critical' : 'info',
      metric: 'circularDependencyCount',
      baseline: baseline.metrics.circularDependencyCount,
      current: current.circularDependencyCount,
      delta: circularDelta > 0 ? `+${circularDelta}` : `${circularDelta}`,
      details: circularDelta > 0
        ? `${circularDelta} new circular dependencies detected!`
        : `${Math.abs(circularDelta)} circular dependencies resolved`
    });
  }
  
  // 3. Shared Layer Contamination
  const sharedDelta = current.sharedLayerContamination - baseline.metrics.sharedLayerContamination;
  if (sharedDelta > 50) { // Only report significant changes
    driftVectors.push({
      type: 'shared_contamination',
      severity: sharedDelta > 100 ? 'warning' : 'info',
      metric: 'sharedLayerContamination',
      baseline: baseline.metrics.sharedLayerContamination,
      current: current.sharedLayerContamination,
      delta: `+${sharedDelta} lines`,
      details: 'Shared layer has grown significantly'
    });
  }
  
  // 4. Admin Inflation
  const adminDelta = current.adminInflationScore - baseline.metrics.adminInflationScore;
  if (adminDelta > 10) {
    driftVectors.push({
      type: 'admin_inflation',
      severity: current.adminInflationScore > THRESHOLDS.ADMIN_INFLATION_MAX ? 'critical' : 'warning',
      metric: 'adminInflationScore',
      baseline: baseline.metrics.adminInflationScore,
      current: current.adminInflationScore,
      delta: `+${adminDelta}`,
      details: 'Admin module is growing disproportionately'
    });
  }
  
  // 5. Type Duplication
  const typeDelta = current.typeDuplicationScore - baseline.metrics.typeDuplicationScore;
  if (typeDelta > 0) {
    driftVectors.push({
      type: 'type_duplication',
      severity: current.typeDuplicationScore > THRESHOLDS.TYPE_DUPLICATION_MAX ? 'warning' : 'info',
      metric: 'typeDuplicationScore',
      baseline: baseline.metrics.typeDuplicationScore,
      current: current.typeDuplicationScore,
      delta: `+${typeDelta}`,
      details: `${typeDelta} new type duplications detected`
    });
  }
  
  // 6. Module Size Changes
  const modulesWithGrowth: string[] = [];
  for (const baselineModule of baseline.modules) {
    const moduleDir = path.join(MODULES_PATH, baselineModule.name);
    if (fs.existsSync(moduleDir)) {
      const files = getAllFiles(moduleDir);
      let currentLines = 0;
      for (const file of files) {
        currentLines += countLines(file);
      }
      
      const growthPercent = ((currentLines - baselineModule.lineCount) / baselineModule.lineCount) * 100;
      if (growthPercent > THRESHOLDS.MODULE_SIZE_INCREASE_PERCENT) {
        modulesWithGrowth.push(baselineModule.name);
        driftVectors.push({
          type: 'module_size_increase',
          severity: growthPercent > 50 ? 'warning' : 'info',
          metric: `${baselineModule.name}.lineCount`,
          baseline: baselineModule.lineCount,
          current: currentLines,
          delta: `+${Math.round(growthPercent)}%`,
          details: `Module ${baselineModule.name} grew by ${Math.round(growthPercent)}%`
        });
      }
    }
  }
  
  // Calculate overall drift score
  const driftScore = calculateDriftScore(driftVectors);
  
  // Generate summary
  const summary: DriftSummary = {
    newViolations: Math.max(0, violationDelta),
    resolvedViolations: Math.max(0, -violationDelta),
    modulesWithGrowth,
    newDependencies: [], // TODO: Implement dependency diff
    removedDependencies: [],
    overallHealthScore: Math.max(0, 100 - driftScore)
  };
  
  return {
    timestamp: new Date().toISOString(),
    baselineCommit: baseline.gitCommit,
    currentCommit: getGitCommit(),
    hasDrift: driftVectors.length > 0,
    driftScore,
    driftVectors,
    summary
  };
}

function calculateDriftScore(vectors: DriftVector[]): number {
  let score = 0;
  
  for (const vector of vectors) {
    switch (vector.severity) {
      case 'critical': score += 30; break;
      case 'warning': score += 15; break;
      case 'info': score += 5; break;
    }
  }
  
  return Math.min(100, score);
}

// ============================================================================
// OUTPUT
// ============================================================================

function printDriftReport(report: DriftReport): void {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 ARCHITECTURE DRIFT REPORT');
  console.log('='.repeat(70));
  
  console.log(`\n📅 Report Time: ${report.timestamp}`);
  console.log(`🔖 Baseline Commit: ${report.baselineCommit}`);
  console.log(`🔖 Current Commit: ${report.currentCommit}`);
  
  // Health indicator
  const healthIcon = report.summary.overallHealthScore >= 80 ? '🟢' :
                     report.summary.overallHealthScore >= 50 ? '🟡' : '🔴';
  console.log(`\n${healthIcon} Architecture Health Score: ${report.summary.overallHealthScore}/100`);
  console.log(`📊 Drift Score: ${report.driftScore}/100`);
  
  if (!report.hasDrift) {
    console.log('\n✅ No architecture drift detected!');
    console.log('   Your codebase is aligned with the baseline.');
  } else {
    console.log(`\n⚠️  ${report.driftVectors.length} drift vectors detected:`);
    
    // Group by severity
    const critical = report.driftVectors.filter(v => v.severity === 'critical');
    const warnings = report.driftVectors.filter(v => v.severity === 'warning');
    const info = report.driftVectors.filter(v => v.severity === 'info');
    
    if (critical.length > 0) {
      console.log('\n🚨 CRITICAL DRIFT:');
      for (const v of critical) {
        console.log(`   ❌ [${v.type}] ${v.metric}`);
        console.log(`      Baseline: ${v.baseline} → Current: ${v.current} (${v.delta})`);
        if (v.details) console.log(`      ${v.details}`);
      }
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      for (const v of warnings) {
        console.log(`   ⚠️  [${v.type}] ${v.metric}`);
        console.log(`      Baseline: ${v.baseline} → Current: ${v.current} (${v.delta})`);
        if (v.details) console.log(`      ${v.details}`);
      }
    }
    
    if (info.length > 0) {
      console.log('\nℹ️  INFORMATIONAL:');
      for (const v of info) {
        console.log(`   ℹ️  [${v.type}] ${v.metric}`);
        console.log(`      Baseline: ${v.baseline} → Current: ${v.current} (${v.delta})`);
        if (v.details) console.log(`      ${v.details}`);
      }
    }
  }
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`   New Violations: ${report.summary.newViolations}`);
  console.log(`   Resolved Violations: ${report.summary.resolvedViolations}`);
  if (report.summary.modulesWithGrowth.length > 0) {
    console.log(`   Modules with Significant Growth: ${report.summary.modulesWithGrowth.join(', ')}`);
  }
  
  console.log('\n' + '='.repeat(70));
}

function saveDriftReport(report: DriftReport): void {
  if (!fs.existsSync(DRIFT_REPORTS_DIR)) {
    fs.mkdirSync(DRIFT_REPORTS_DIR, { recursive: true });
  }
  
  const filename = `drift-${report.timestamp.replace(/[:.]/g, '-')}.json`;
  const filepath = path.join(DRIFT_REPORTS_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`\n📝 Drift report saved to ${filepath}`);
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const failOnDrift = args.includes('--fail-on-drift');
  const jsonOutput = args.includes('--json');
  
  // Load baseline
  const baseline = loadBaseline();
  
  if (!baseline) {
    console.error('❌ No baseline found!');
    console.error('   Run: npx tsx scripts/architecture/baseline.ts --save');
    console.error('   to create an initial baseline.');
    process.exit(1);
  }
  
  // Detect drift
  const report = detectDrift(baseline);
  
  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printDriftReport(report);
    saveDriftReport(report);
  }
  
  // Exit with error if drift detected and --fail-on-drift is set
  if (failOnDrift && report.hasDrift) {
    const criticalCount = report.driftVectors.filter(v => v.severity === 'critical').length;
    if (criticalCount > 0) {
      console.log(`\n❌ CI/CD FAILURE: ${criticalCount} critical drift vectors detected!`);
      process.exit(1);
    }
  }
  
  process.exit(0);
}

main();

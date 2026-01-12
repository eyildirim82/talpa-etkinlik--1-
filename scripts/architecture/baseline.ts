/**
 * Architecture Baseline Generator
 * 
 * Generates a snapshot of the current architecture state including:
 * - Dependency graph between modules
 * - Module boundary metrics
 * - Type definitions count per module
 * - Public API surface area
 * - Cross-module import patterns
 * 
 * Usage: npx tsx scripts/architecture/baseline.ts [--save]
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
  isDirectInternal: boolean; // true if bypasses index.ts
}

interface DependencyEdge {
  source: string;
  target: string;
  weight: number; // number of imports
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

// ============================================================================
// CONSTANTS
// ============================================================================

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const MODULES_PATH = path.join(PROJECT_ROOT, 'src/modules');
const SHARED_PATH = path.join(PROJECT_ROOT, 'src/shared');
const BASELINE_OUTPUT = path.join(PROJECT_ROOT, '.architecture/baseline.json');
const HISTORY_DIR = path.join(PROJECT_ROOT, '.architecture/history');

const DOMAIN_MODULES = [
  'booking', 'event', 'profile', 'ticket', 
  'notification', 'payment', 'file-processing', 'reporting'
];

const ADMIN_MODULE = 'admin';
const AUTH_MODULE = 'auth';

// ============================================================================
// FILE UTILITIES
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
      // Skip test files for metrics
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
// IMPORT ANALYSIS
// ============================================================================

function extractImports(filePath: string): { path: string; line: number }[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports: { path: string; line: number }[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Match various import patterns
    const patterns = [
      /import\s+.*\s+from\s+['"](.+)['"]/,
      /import\s+['"](.+)['"]/,
      /require\(['"](.+)['"]\)/
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        imports.push({ path: match[1], line: index + 1 });
        break;
      }
    }
  });
  
  return imports;
}

function categorizeImport(importPath: string): { isModule: boolean; moduleName: string | null; isInternal: boolean } {
  // Check if it's a module import
  const moduleMatch = importPath.match(/@\/modules\/([^/]+)/);
  if (moduleMatch) {
    const moduleName = moduleMatch[1];
    // Check if it bypasses index.ts
    const isInternal = importPath.includes('/api/') || 
                       importPath.includes('/hooks/') || 
                       importPath.includes('/services/') ||
                       importPath.includes('/components/') ||
                       importPath.includes('/utils/') ||
                       importPath.includes('/types/');
    return { isModule: true, moduleName, isInternal };
  }
  return { isModule: false, moduleName: null, isInternal: false };
}

// ============================================================================
// MODULE ANALYSIS
// ============================================================================

function analyzeModule(moduleName: string): ModuleMetrics {
  const modulePath = path.join(MODULES_PATH, moduleName);
  const files = getAllFiles(modulePath);
  
  let totalLines = 0;
  let exportCount = 0;
  let importCount = 0;
  let typeDefinitions = 0;
  const crossModuleImports: CrossModuleImport[] = [];
  const publicApi: string[] = [];
  
  // Analyze index.ts for public API
  const indexPath = path.join(modulePath, 'index.ts');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const exportMatches = indexContent.match(/export\s+(const|function|type|interface|class|\{|\*)/g);
    if (exportMatches) {
      exportCount = exportMatches.length;
    }
    
    // Extract named exports
    const namedExports = indexContent.match(/export\s+\{\s*([^}]+)\s*\}/g);
    if (namedExports) {
      namedExports.forEach(exp => {
        const names = exp.match(/export\s+\{\s*([^}]+)\s*\}/);
        if (names) {
          publicApi.push(...names[1].split(',').map(n => n.trim()));
        }
      });
    }
  }
  
  for (const file of files) {
    totalLines += countLines(file);
    
    // Count type definitions
    const content = fs.readFileSync(file, 'utf-8');
    const typeMatches = content.match(/(?:export\s+)?(?:type|interface)\s+\w+/g);
    if (typeMatches) {
      typeDefinitions += typeMatches.length;
    }
    
    // Analyze imports
    const imports = extractImports(file);
    importCount += imports.length;
    
    for (const imp of imports) {
      const category = categorizeImport(imp.path);
      if (category.isModule && category.moduleName !== moduleName) {
        crossModuleImports.push({
          from: moduleName,
          to: category.moduleName!,
          importPath: imp.path,
          isDirectInternal: category.isInternal
        });
      }
    }
  }
  
  return {
    name: moduleName,
    fileCount: files.length,
    lineCount: totalLines,
    exportCount,
    importCount,
    crossModuleImports,
    internalFiles: files.map(f => path.relative(modulePath, f)),
    publicApi,
    typeDefinitions,
    testCoverage: 0 // TODO: Integrate with vitest coverage
  };
}

// ============================================================================
// BOUNDARY VIOLATION DETECTION
// ============================================================================

function detectBoundaryViolations(): BoundaryViolation[] {
  const violations: BoundaryViolation[] = [];
  const allModules = fs.readdirSync(MODULES_PATH).filter(m => {
    const stat = fs.statSync(path.join(MODULES_PATH, m));
    return stat.isDirectory();
  });
  
  for (const module of allModules) {
    const modulePath = path.join(MODULES_PATH, module);
    const files = getAllFiles(modulePath);
    
    for (const file of files) {
      const imports = extractImports(file);
      const relativeFile = path.relative(PROJECT_ROOT, file);
      
      for (const imp of imports) {
        // Check for deprecated shared imports
        if (imp.path.includes('@/shared/services')) {
          violations.push({
            file: relativeFile,
            violation: `Deprecated @/shared/services import: ${imp.path}`,
            severity: 'error'
          });
        }
        
        if (imp.path.includes('@/shared/hooks')) {
          violations.push({
            file: relativeFile,
            violation: `Deprecated @/shared/hooks import: ${imp.path}`,
            severity: 'error'
          });
        }
        
        // Check for direct internal module imports
        const category = categorizeImport(imp.path);
        if (category.isModule && category.moduleName !== module && category.isInternal) {
          violations.push({
            file: relativeFile,
            violation: `Direct internal import bypassing index.ts: ${imp.path}`,
            severity: 'warning'
          });
        }
        
        // Check for domain modules importing from admin
        if (DOMAIN_MODULES.includes(module) && imp.path.includes('@/modules/admin')) {
          violations.push({
            file: relativeFile,
            violation: `Domain module importing from admin: ${imp.path}`,
            severity: 'error'
          });
        }
        
        // Check for deprecated global types
        if (imp.path.includes('@/types/domain')) {
          violations.push({
            file: relativeFile,
            violation: `Deprecated global domain types import: ${imp.path}`,
            severity: 'warning'
          });
        }
      }
    }
  }
  
  return violations;
}

// ============================================================================
// CIRCULAR DEPENDENCY DETECTION
// ============================================================================

function detectCircularDependencies(): string[][] {
  try {
    const result = execSync(
      'npx madge --circular --json --extensions ts,tsx src/modules',
      { encoding: 'utf-8', cwd: PROJECT_ROOT }
    );
    return JSON.parse(result) || [];
  } catch (error) {
    // madge returns exit code 1 when circular deps found, but still outputs JSON
    try {
      const output = (error as { stdout?: string }).stdout || '';
      if (output.trim()) {
        return JSON.parse(output);
      }
    } catch {
      // ignore parse errors
    }
    return [];
  }
}

// ============================================================================
// DEPENDENCY GRAPH GENERATION
// ============================================================================

function generateDependencyGraph(modules: ModuleMetrics[]): DependencyEdge[] {
  const edges: Map<string, DependencyEdge> = new Map();
  
  for (const module of modules) {
    for (const imp of module.crossModuleImports) {
      const key = `${imp.from}->${imp.to}`;
      const existing = edges.get(key);
      if (existing) {
        existing.weight++;
      } else {
        edges.set(key, {
          source: imp.from,
          target: imp.to,
          weight: 1
        });
      }
    }
  }
  
  return Array.from(edges.values());
}

// ============================================================================
// SHARED LAYER ANALYSIS
// ============================================================================

function analyzeSharedLayer(): number {
  const files = getAllFiles(SHARED_PATH);
  let totalLines = 0;
  
  for (const file of files) {
    // Skip infrastructure which is allowed
    if (file.includes('/infrastructure/')) continue;
    // Skip test-utils which is allowed
    if (file.includes('/test-utils/')) continue;
    // Skip utils which is allowed
    if (file.includes('/utils/')) continue;
    // Skip components/ui which is allowed
    if (file.includes('/components/ui/')) continue;
    
    totalLines += countLines(file);
  }
  
  return totalLines;
}

// ============================================================================
// ADMIN MODULE INFLATION SCORE
// ============================================================================

function calculateAdminInflationScore(adminMetrics: ModuleMetrics, allModules: ModuleMetrics[]): number {
  // Admin inflation is measured as:
  // 1. Lines of code in admin vs average domain module
  // 2. Number of direct supabase calls (should be minimal)
  // 3. Cross-module imports (admin should mostly import, not export to domains)
  
  const domainModules = allModules.filter(m => DOMAIN_MODULES.includes(m.name));
  const avgDomainSize = domainModules.reduce((sum, m) => sum + m.lineCount, 0) / domainModules.length;
  
  // If admin is 2x average domain size, inflation score is 100
  const sizeRatio = adminMetrics.lineCount / avgDomainSize;
  const inflationScore = Math.min(100, (sizeRatio - 1) * 50);
  
  return Math.max(0, Math.round(inflationScore));
}

// ============================================================================
// TYPE DUPLICATION DETECTION
// ============================================================================

function calculateTypeDuplicationScore(modules: ModuleMetrics[]): number {
  // Collect all type names from all modules
  const typeNames: Map<string, string[]> = new Map();
  
  for (const module of modules) {
    const modulePath = path.join(MODULES_PATH, module.name);
    const files = getAllFiles(modulePath);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const typeMatches = content.match(/(?:export\s+)?(?:type|interface)\s+(\w+)/g);
      
      if (typeMatches) {
        for (const match of typeMatches) {
          const nameMatch = match.match(/(?:type|interface)\s+(\w+)/);
          if (nameMatch) {
            const typeName = nameMatch[1];
            const existing = typeNames.get(typeName) || [];
            existing.push(module.name);
            typeNames.set(typeName, existing);
          }
        }
      }
    }
  }
  
  // Count duplicated type names (appearing in multiple modules)
  let duplications = 0;
  for (const [, moduleNames] of typeNames) {
    const uniqueModules = new Set(moduleNames);
    if (uniqueModules.size > 1) {
      duplications++;
    }
  }
  
  return duplications;
}

// ============================================================================
// MAIN BASELINE GENERATION
// ============================================================================

async function generateBaseline(): Promise<ArchitectureBaseline> {
  console.log('🔍 Analyzing architecture...\n');
  
  // Get all module names
  const moduleNames = fs.readdirSync(MODULES_PATH).filter(m => {
    const stat = fs.statSync(path.join(MODULES_PATH, m));
    return stat.isDirectory();
  });
  
  // Analyze each module
  console.log('📊 Analyzing modules...');
  const modules: ModuleMetrics[] = [];
  for (const name of moduleNames) {
    console.log(`   - ${name}`);
    modules.push(analyzeModule(name));
  }
  
  // Generate dependency graph
  console.log('\n🔗 Generating dependency graph...');
  const dependencyGraph = generateDependencyGraph(modules);
  
  // Detect circular dependencies
  console.log('🔄 Checking for circular dependencies...');
  const circularDependencies = detectCircularDependencies();
  
  // Detect boundary violations
  console.log('🚧 Checking boundary violations...');
  const boundaryViolations = detectBoundaryViolations();
  
  // Analyze shared layer
  console.log('📦 Analyzing shared layer...');
  const sharedLayerSize = analyzeSharedLayer();
  
  // Calculate global metrics
  const totalFiles = modules.reduce((sum, m) => sum + m.fileCount, 0);
  const totalLines = modules.reduce((sum, m) => sum + m.lineCount, 0);
  const moduleSizes = modules.map(m => m.lineCount);
  
  const adminMetrics = modules.find(m => m.name === ADMIN_MODULE);
  const adminInflationScore = adminMetrics 
    ? calculateAdminInflationScore(adminMetrics, modules)
    : 0;
  
  const typeDuplicationScore = calculateTypeDuplicationScore(modules);
  
  const metrics: GlobalMetrics = {
    totalModules: modules.length,
    totalFiles,
    totalLines,
    avgModuleSize: Math.round(totalLines / modules.length),
    maxModuleSize: Math.max(...moduleSizes),
    minModuleSize: Math.min(...moduleSizes),
    boundaryViolationCount: boundaryViolations.length,
    circularDependencyCount: circularDependencies.length,
    sharedLayerContamination: sharedLayerSize,
    adminInflationScore,
    typeDuplicationScore
  };
  
  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    gitCommit: getGitCommit(),
    modules,
    dependencyGraph,
    sharedLayerSize,
    circularDependencies,
    boundaryViolations,
    metrics
  };
}

// ============================================================================
// OUTPUT & PERSISTENCE
// ============================================================================

function saveBaseline(baseline: ArchitectureBaseline, save: boolean): void {
  // Ensure directories exist
  const archDir = path.dirname(BASELINE_OUTPUT);
  if (!fs.existsSync(archDir)) {
    fs.mkdirSync(archDir, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }
  
  if (save) {
    // Save as current baseline
    fs.writeFileSync(BASELINE_OUTPUT, JSON.stringify(baseline, null, 2));
    console.log(`\n✅ Baseline saved to ${BASELINE_OUTPUT}`);
    
    // Also save to history with timestamp
    const historyFile = path.join(HISTORY_DIR, `${baseline.timestamp.replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(historyFile, JSON.stringify(baseline, null, 2));
    console.log(`📜 History saved to ${historyFile}`);
  } else {
    // Just output to console
    console.log('\n' + JSON.stringify(baseline, null, 2));
  }
}

function printSummary(baseline: ArchitectureBaseline): void {
  const { metrics } = baseline;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 ARCHITECTURE BASELINE SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\n📅 Timestamp: ${baseline.timestamp}`);
  console.log(`🔖 Git Commit: ${baseline.gitCommit}`);
  
  console.log('\n📦 MODULE METRICS');
  console.log(`   Total Modules: ${metrics.totalModules}`);
  console.log(`   Total Files: ${metrics.totalFiles}`);
  console.log(`   Total Lines: ${metrics.totalLines}`);
  console.log(`   Average Module Size: ${metrics.avgModuleSize} lines`);
  console.log(`   Max Module Size: ${metrics.maxModuleSize} lines`);
  console.log(`   Min Module Size: ${metrics.minModuleSize} lines`);
  
  console.log('\n⚠️  DRIFT INDICATORS');
  console.log(`   Boundary Violations: ${metrics.boundaryViolationCount}`);
  console.log(`   Circular Dependencies: ${metrics.circularDependencyCount}`);
  console.log(`   Shared Layer Contamination: ${metrics.sharedLayerContamination} lines`);
  console.log(`   Admin Inflation Score: ${metrics.adminInflationScore}/100`);
  console.log(`   Type Duplication Score: ${metrics.typeDuplicationScore}`);
  
  if (baseline.boundaryViolations.length > 0) {
    console.log('\n🚨 BOUNDARY VIOLATIONS:');
    baseline.boundaryViolations.slice(0, 10).forEach(v => {
      const icon = v.severity === 'error' ? '❌' : '⚠️';
      console.log(`   ${icon} ${v.file}`);
      console.log(`      ${v.violation}`);
    });
    if (baseline.boundaryViolations.length > 10) {
      console.log(`   ... and ${baseline.boundaryViolations.length - 10} more`);
    }
  }
  
  if (baseline.circularDependencies.length > 0) {
    console.log('\n🔄 CIRCULAR DEPENDENCIES:');
    baseline.circularDependencies.forEach(cycle => {
      console.log(`   ${cycle.join(' → ')} → ${cycle[0]}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const shouldSave = args.includes('--save');
  
  try {
    const baseline = await generateBaseline();
    printSummary(baseline);
    saveBaseline(baseline, shouldSave);
    
    // Exit with error if there are critical violations
    if (baseline.metrics.boundaryViolationCount > 0) {
      const errorCount = baseline.boundaryViolations.filter(v => v.severity === 'error').length;
      if (errorCount > 0) {
        console.log(`\n❌ ${errorCount} critical boundary violations detected!`);
        process.exit(1);
      }
    }
    
  } catch (error) {
    console.error('❌ Error generating baseline:', error);
    process.exit(1);
  }
}

main();

/**
 * Architecture Metrics Reporter
 * 
 * Generates detailed reports in various formats:
 * - Console (human-readable)
 * - JSON (machine-readable)
 * - Markdown (for PRs/docs)
 * - GitHub Actions annotations
 * 
 * Usage: npx tsx scripts/architecture/metrics-reporter.ts [--format=console|json|markdown|github]
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// TYPES
// ============================================================================

interface ModuleMetrics {
  name: string;
  files: number;
  lines: number;
  exports: number;
  imports: number;
  dependencies: string[];
  dependents: string[];
  health: ModuleHealth;
}

interface ModuleHealth {
  score: number;
  issues: string[];
}

interface ArchitectureReport {
  timestamp: string;
  commit: string;
  modules: ModuleMetrics[];
  globalMetrics: {
    totalModules: number;
    totalFiles: number;
    totalLines: number;
    boundaryViolations: number;
    circularDependencies: number;
    sharedContamination: number;
    adminInflation: number;
    typeDuplication: number;
    healthScore: number;
  };
  trends: {
    lineGrowth: number;
    violationTrend: string;
    healthTrend: string;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const MODULES_PATH = path.join(PROJECT_ROOT, 'src/modules');
const BASELINE_FILE = path.join(PROJECT_ROOT, '.architecture/baseline.json');
const REPORTS_DIR = path.join(PROJECT_ROOT, '.architecture/reports');

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
// MODULE ANALYSIS
// ============================================================================

function analyzeModule(moduleName: string): ModuleMetrics {
  const modulePath = path.join(MODULES_PATH, moduleName);
  const files = getAllFiles(modulePath);
  
  let totalLines = 0;
  let exportCount = 0;
  let importCount = 0;
  const dependencies: Set<string> = new Set();
  const issues: string[] = [];
  
  // Analyze index.ts for exports
  const indexPath = path.join(modulePath, 'index.ts');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const exportMatches = indexContent.match(/export\s+/g);
    if (exportMatches) {
      exportCount = exportMatches.length;
    }
  } else {
    issues.push('Missing index.ts');
  }
  
  for (const file of files) {
    totalLines += countLines(file);
    
    const content = fs.readFileSync(file, 'utf-8');
    
    // Count imports
    const importMatches = content.match(/import\s+/g);
    if (importMatches) {
      importCount += importMatches.length;
    }
    
    // Find module dependencies
    const moduleImports = content.match(/@\/modules\/([^/'"\s]+)/g);
    if (moduleImports) {
      for (const imp of moduleImports) {
        const depName = imp.replace('@/modules/', '');
        if (depName !== moduleName) {
          dependencies.add(depName);
        }
      }
    }
    
    // Check for issues
    if (content.includes('@/shared/services')) {
      issues.push(`Deprecated @/shared/services import in ${path.basename(file)}`);
    }
    if (content.includes('@/shared/hooks')) {
      issues.push(`Deprecated @/shared/hooks import in ${path.basename(file)}`);
    }
  }
  
  // Calculate health score
  let healthScore = 100;
  healthScore -= issues.length * 10;
  healthScore -= dependencies.size > 5 ? 10 : 0; // Penalty for too many deps
  healthScore = Math.max(0, healthScore);
  
  return {
    name: moduleName,
    files: files.length,
    lines: totalLines,
    exports: exportCount,
    imports: importCount,
    dependencies: Array.from(dependencies),
    dependents: [], // Filled later
    health: {
      score: healthScore,
      issues
    }
  };
}

function findDependents(modules: ModuleMetrics[]): void {
  for (const module of modules) {
    for (const dep of module.dependencies) {
      const depModule = modules.find(m => m.name === dep);
      if (depModule) {
        depModule.dependents.push(module.name);
      }
    }
  }
}

// ============================================================================
// GLOBAL METRICS
// ============================================================================

function calculateGlobalMetrics(modules: ModuleMetrics[]): ArchitectureReport['globalMetrics'] {
  const totalFiles = modules.reduce((sum, m) => sum + m.files, 0);
  const totalLines = modules.reduce((sum, m) => sum + m.lines, 0);
  const totalIssues = modules.reduce((sum, m) => sum + m.health.issues.length, 0);
  const avgHealth = modules.reduce((sum, m) => sum + m.health.score, 0) / modules.length;
  
  // Circular dependencies check
  let circularCount = 0;
  try {
    const result = execSync(
      'npx madge --circular --json --extensions ts,tsx src/modules',
      { encoding: 'utf-8', cwd: PROJECT_ROOT }
    );
    circularCount = JSON.parse(result).length;
  } catch (error) {
    try {
      const output = (error as { stdout?: string }).stdout || '';
      if (output.trim()) {
        circularCount = JSON.parse(output).length;
      }
    } catch {
      // ignore
    }
  }
  
  // Admin inflation
  const adminModule = modules.find(m => m.name === 'admin');
  const domainModules = modules.filter(m => 
    ['booking', 'event', 'profile', 'ticket'].includes(m.name)
  );
  const avgDomainSize = domainModules.reduce((sum, m) => sum + m.lines, 0) / domainModules.length;
  const adminInflation = adminModule 
    ? Math.max(0, Math.round(((adminModule.lines / avgDomainSize) - 1) * 50))
    : 0;
  
  // Type duplication (simplified)
  const typeNames: Map<string, Set<string>> = new Map();
  for (const module of modules) {
    const modulePath = path.join(MODULES_PATH, module.name);
    const files = getAllFiles(modulePath);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const typeMatches = content.match(/(?:type|interface)\s+(\w+)/g);
      
      if (typeMatches) {
        for (const match of typeMatches) {
          const nameMatch = match.match(/(?:type|interface)\s+(\w+)/);
          if (nameMatch) {
            const typeName = nameMatch[1];
            if (!typeNames.has(typeName)) {
              typeNames.set(typeName, new Set());
            }
            typeNames.get(typeName)!.add(module.name);
          }
        }
      }
    }
  }
  
  let typeDuplication = 0;
  for (const [, moduleSet] of typeNames) {
    if (moduleSet.size > 1) typeDuplication++;
  }
  
  return {
    totalModules: modules.length,
    totalFiles,
    totalLines,
    boundaryViolations: totalIssues,
    circularDependencies: circularCount,
    sharedContamination: 0, // TODO: Calculate
    adminInflation,
    typeDuplication,
    healthScore: Math.round(avgHealth)
  };
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateReport(): ArchitectureReport {
  const moduleNames = fs.readdirSync(MODULES_PATH).filter(m => {
    const stat = fs.statSync(path.join(MODULES_PATH, m));
    return stat.isDirectory();
  });
  
  const modules = moduleNames.map(analyzeModule);
  findDependents(modules);
  
  const globalMetrics = calculateGlobalMetrics(modules);
  
  // Calculate trends (compare with baseline if exists)
  let trends = {
    lineGrowth: 0,
    violationTrend: 'stable' as string,
    healthTrend: 'stable' as string
  };
  
  if (fs.existsSync(BASELINE_FILE)) {
    const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf-8'));
    const baselineLines = baseline.metrics?.totalLines || globalMetrics.totalLines;
    const baselineViolations = baseline.metrics?.boundaryViolationCount || 0;
    const baselineHealth = 100 - (baselineViolations * 10);
    
    trends.lineGrowth = Math.round(
      ((globalMetrics.totalLines - baselineLines) / baselineLines) * 100
    );
    trends.violationTrend = globalMetrics.boundaryViolations > baselineViolations 
      ? 'increasing' 
      : globalMetrics.boundaryViolations < baselineViolations 
        ? 'decreasing' 
        : 'stable';
    trends.healthTrend = globalMetrics.healthScore > baselineHealth 
      ? 'improving' 
      : globalMetrics.healthScore < baselineHealth 
        ? 'declining' 
        : 'stable';
  }
  
  return {
    timestamp: new Date().toISOString(),
    commit: getGitCommit(),
    modules,
    globalMetrics,
    trends
  };
}

// ============================================================================
// OUTPUT FORMATTERS
// ============================================================================

function formatConsole(report: ArchitectureReport): void {
  const { globalMetrics, modules, trends } = report;
  
  console.log('\n' + '═'.repeat(70));
  console.log('📊 ARCHITECTURE METRICS REPORT');
  console.log('═'.repeat(70));
  
  console.log(`\n📅 ${report.timestamp}`);
  console.log(`🔖 Commit: ${report.commit}`);
  
  // Health gauge
  const healthIcon = globalMetrics.healthScore >= 80 ? '🟢' :
                     globalMetrics.healthScore >= 50 ? '🟡' : '🔴';
  console.log(`\n${healthIcon} Overall Health: ${globalMetrics.healthScore}/100`);
  
  // Global metrics
  console.log('\n📈 GLOBAL METRICS:');
  console.log(`   Modules: ${globalMetrics.totalModules}`);
  console.log(`   Files: ${globalMetrics.totalFiles}`);
  console.log(`   Lines: ${globalMetrics.totalLines.toLocaleString()}`);
  console.log(`   Boundary Violations: ${globalMetrics.boundaryViolations}`);
  console.log(`   Circular Dependencies: ${globalMetrics.circularDependencies}`);
  console.log(`   Admin Inflation: ${globalMetrics.adminInflation}/100`);
  console.log(`   Type Duplication: ${globalMetrics.typeDuplication}`);
  
  // Trends
  console.log('\n📉 TRENDS (vs baseline):');
  const growthIcon = trends.lineGrowth > 0 ? '📈' : trends.lineGrowth < 0 ? '📉' : '➡️';
  console.log(`   ${growthIcon} Line Growth: ${trends.lineGrowth > 0 ? '+' : ''}${trends.lineGrowth}%`);
  console.log(`   Violations: ${trends.violationTrend}`);
  console.log(`   Health: ${trends.healthTrend}`);
  
  // Module details
  console.log('\n📦 MODULE BREAKDOWN:');
  console.log('─'.repeat(70));
  console.log('Module'.padEnd(20) + 'Files'.padEnd(8) + 'Lines'.padEnd(10) + 
              'Deps'.padEnd(6) + 'Health'.padEnd(10) + 'Issues');
  console.log('─'.repeat(70));
  
  const sortedModules = [...modules].sort((a, b) => b.lines - a.lines);
  for (const m of sortedModules) {
    const healthIcon = m.health.score >= 80 ? '🟢' : m.health.score >= 50 ? '🟡' : '🔴';
    console.log(
      m.name.padEnd(20) +
      m.files.toString().padEnd(8) +
      m.lines.toString().padEnd(10) +
      m.dependencies.length.toString().padEnd(6) +
      `${healthIcon} ${m.health.score}`.padEnd(10) +
      m.health.issues.length.toString()
    );
  }
  
  console.log('─'.repeat(70));
  
  // Dependency matrix (simplified)
  console.log('\n🔗 DEPENDENCY FLOW:');
  for (const m of sortedModules) {
    if (m.dependencies.length > 0) {
      console.log(`   ${m.name} → ${m.dependencies.join(', ')}`);
    }
  }
  
  // Issues summary
  const allIssues = modules.flatMap(m => m.health.issues.map(i => ({ module: m.name, issue: i })));
  if (allIssues.length > 0) {
    console.log('\n⚠️  ISSUES:');
    for (const { module, issue } of allIssues.slice(0, 10)) {
      console.log(`   [${module}] ${issue}`);
    }
    if (allIssues.length > 10) {
      console.log(`   ... and ${allIssues.length - 10} more`);
    }
  }
  
  console.log('\n' + '═'.repeat(70));
}

function formatMarkdown(report: ArchitectureReport): string {
  const { globalMetrics, modules, trends } = report;
  
  let md = `# 📊 Architecture Metrics Report\n\n`;
  md += `**Generated:** ${report.timestamp}  \n`;
  md += `**Commit:** \`${report.commit}\`\n\n`;
  
  // Health badge
  const healthBadge = globalMetrics.healthScore >= 80 ? '🟢 Healthy' :
                      globalMetrics.healthScore >= 50 ? '🟡 Needs Attention' : '🔴 Critical';
  md += `## Health: ${healthBadge} (${globalMetrics.healthScore}/100)\n\n`;
  
  // Summary table
  md += `### Global Metrics\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Modules | ${globalMetrics.totalModules} |\n`;
  md += `| Files | ${globalMetrics.totalFiles} |\n`;
  md += `| Lines | ${globalMetrics.totalLines.toLocaleString()} |\n`;
  md += `| Boundary Violations | ${globalMetrics.boundaryViolations} |\n`;
  md += `| Circular Dependencies | ${globalMetrics.circularDependencies} |\n`;
  md += `| Admin Inflation | ${globalMetrics.adminInflation}/100 |\n`;
  md += `| Type Duplication | ${globalMetrics.typeDuplication} |\n\n`;
  
  // Trends
  md += `### Trends\n\n`;
  md += `- **Line Growth:** ${trends.lineGrowth > 0 ? '+' : ''}${trends.lineGrowth}%\n`;
  md += `- **Violations:** ${trends.violationTrend}\n`;
  md += `- **Health:** ${trends.healthTrend}\n\n`;
  
  // Module table
  md += `### Module Breakdown\n\n`;
  md += `| Module | Files | Lines | Dependencies | Health |\n`;
  md += `|--------|-------|-------|--------------|--------|\n`;
  
  const sortedModules = [...modules].sort((a, b) => b.lines - a.lines);
  for (const m of sortedModules) {
    const healthIcon = m.health.score >= 80 ? '🟢' : m.health.score >= 50 ? '🟡' : '🔴';
    md += `| ${m.name} | ${m.files} | ${m.lines} | ${m.dependencies.length} | ${healthIcon} ${m.health.score} |\n`;
  }
  
  // Issues
  const allIssues = modules.flatMap(m => m.health.issues.map(i => ({ module: m.name, issue: i })));
  if (allIssues.length > 0) {
    md += `\n### Issues\n\n`;
    for (const { module, issue } of allIssues) {
      md += `- **[${module}]** ${issue}\n`;
    }
  }
  
  return md;
}

function formatGitHubAnnotations(report: ArchitectureReport): void {
  const { globalMetrics, modules } = report;
  
  // Output GitHub Actions workflow commands
  if (globalMetrics.boundaryViolations > 0) {
    console.log(`::warning title=Architecture Drift::${globalMetrics.boundaryViolations} boundary violations detected`);
  }
  
  if (globalMetrics.circularDependencies > 0) {
    console.log(`::error title=Circular Dependencies::${globalMetrics.circularDependencies} circular dependencies found`);
  }
  
  if (globalMetrics.adminInflation > 50) {
    console.log(`::warning title=Admin Inflation::Admin module inflation score: ${globalMetrics.adminInflation}/100`);
  }
  
  // Per-module issues
  for (const m of modules) {
    for (const issue of m.health.issues) {
      console.log(`::warning file=src/modules/${m.name}::${issue}`);
    }
  }
  
  // Set output variables for GitHub Actions
  console.log(`::set-output name=health_score::${globalMetrics.healthScore}`);
  console.log(`::set-output name=violations::${globalMetrics.boundaryViolations}`);
  console.log(`::set-output name=has_drift::${globalMetrics.boundaryViolations > 0 || globalMetrics.circularDependencies > 0}`);
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const formatArg = args.find(a => a.startsWith('--format='));
  const format = formatArg ? formatArg.split('=')[1] : 'console';
  const save = args.includes('--save');
  
  const report = generateReport();
  
  switch (format) {
    case 'json':
      console.log(JSON.stringify(report, null, 2));
      break;
    case 'markdown':
      const md = formatMarkdown(report);
      console.log(md);
      if (save) {
        if (!fs.existsSync(REPORTS_DIR)) {
          fs.mkdirSync(REPORTS_DIR, { recursive: true });
        }
        const filepath = path.join(REPORTS_DIR, `report-${Date.now()}.md`);
        fs.writeFileSync(filepath, md);
        console.error(`\n📝 Saved to ${filepath}`);
      }
      break;
    case 'github':
      formatGitHubAnnotations(report);
      break;
    default:
      formatConsole(report);
  }
  
  // Exit with error if critical issues
  if (report.globalMetrics.circularDependencies > 0) {
    process.exit(1);
  }
}

main();

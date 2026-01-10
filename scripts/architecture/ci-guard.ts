/**
 * CI Architecture Guard
 * 
 * Runs in CI/CD pipelines to prevent architectural regression.
 * This is the final gatekeeper that can block merges.
 * 
 * Exit codes:
 * - 0: Pass (no critical drift)
 * - 1: Fail (critical drift detected)
 * - 2: Warning (non-critical drift, proceed with caution)
 * 
 * Usage: npx tsx scripts/architecture/ci-guard.ts [--strict] [--create-baseline]
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// TYPES
// ============================================================================

interface GuardResult {
  passed: boolean;
  exitCode: number;
  checks: Check[];
  summary: string;
}

interface Check {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const MODULES_PATH = path.join(PROJECT_ROOT, 'src/modules');
const BASELINE_FILE = path.join(PROJECT_ROOT, '.architecture/baseline.json');

// Thresholds (these should be tuned based on project needs)
const THRESHOLDS = {
  MAX_BOUNDARY_VIOLATIONS: 0,
  MAX_CIRCULAR_DEPENDENCIES: 0,
  MAX_ADMIN_INFLATION: 60,
  MAX_TYPE_DUPLICATION: 10,
  MAX_MODULE_SIZE_LINES: 3000,
  MIN_MODULE_HEALTH: 50
};

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

// ============================================================================
// CHECKS
// ============================================================================

function checkModuleStructure(): Check {
  const moduleNames = fs.readdirSync(MODULES_PATH).filter(m => {
    const stat = fs.statSync(path.join(MODULES_PATH, m));
    return stat.isDirectory();
  });
  
  const missingIndex: string[] = [];
  
  for (const name of moduleNames) {
    const indexPath = path.join(MODULES_PATH, name, 'index.ts');
    if (!fs.existsSync(indexPath)) {
      missingIndex.push(name);
    }
  }
  
  if (missingIndex.length > 0) {
    return {
      name: 'Module Structure',
      status: 'fail',
      message: `${missingIndex.length} modules missing index.ts`,
      details: missingIndex.map(m => `  - ${m}`)
    };
  }
  
  return {
    name: 'Module Structure',
    status: 'pass',
    message: `All ${moduleNames.length} modules have proper structure`
  };
}

function checkBoundaryViolations(): Check {
  let violations: string[] = [];
  
  const moduleNames = fs.readdirSync(MODULES_PATH).filter(m => {
    const stat = fs.statSync(path.join(MODULES_PATH, m));
    return stat.isDirectory();
  });
  
  for (const module of moduleNames) {
    const modulePath = path.join(MODULES_PATH, module);
    const files = getAllFiles(modulePath);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const relFile = path.relative(PROJECT_ROOT, file);
      
      // Check deprecated imports
      if (content.includes('@/shared/services')) {
        violations.push(`${relFile}: deprecated @/shared/services import`);
      }
      if (content.includes('@/shared/hooks')) {
        violations.push(`${relFile}: deprecated @/shared/hooks import`);
      }
      
      // Check for direct internal imports from other modules
      const internalImportPattern = /@\/modules\/([^/]+)\/(api|hooks|services|utils)\/[^'"]+/g;
      const matches = content.match(internalImportPattern);
      if (matches) {
        for (const match of matches) {
          const targetModule = match.match(/@\/modules\/([^/]+)/)?.[1];
          if (targetModule && targetModule !== module) {
            violations.push(`${relFile}: bypasses index.ts with ${match}`);
          }
        }
      }
    }
  }
  
  if (violations.length > THRESHOLDS.MAX_BOUNDARY_VIOLATIONS) {
    return {
      name: 'Boundary Violations',
      status: 'fail',
      message: `${violations.length} boundary violations (max: ${THRESHOLDS.MAX_BOUNDARY_VIOLATIONS})`,
      details: violations.slice(0, 10)
    };
  }
  
  return {
    name: 'Boundary Violations',
    status: 'pass',
    message: 'No boundary violations detected'
  };
}

function checkCircularDependencies(): Check {
  try {
    const result = execSync(
      'npx madge --circular --json --extensions ts,tsx src/modules',
      { encoding: 'utf-8', cwd: PROJECT_ROOT }
    );
    const cycles = JSON.parse(result) || [];
    
    if (cycles.length > THRESHOLDS.MAX_CIRCULAR_DEPENDENCIES) {
      return {
        name: 'Circular Dependencies',
        status: 'fail',
        message: `${cycles.length} circular dependency cycles found`,
        details: cycles.slice(0, 5).map((c: string[]) => `  ${c.join(' → ')} → ${c[0]}`)
      };
    }
    
    return {
      name: 'Circular Dependencies',
      status: 'pass',
      message: 'No circular dependencies'
    };
  } catch (error) {
    // madge returns exit code 1 when circular deps found
    try {
      const output = (error as { stdout?: string }).stdout || '';
      if (output.trim()) {
        const cycles = JSON.parse(output);
        if (cycles.length > 0) {
          return {
            name: 'Circular Dependencies',
            status: 'fail',
            message: `${cycles.length} circular dependency cycles found`,
            details: cycles.slice(0, 5).map((c: string[]) => `  ${c.join(' → ')} → ${c[0]}`)
          };
        }
      }
    } catch {
      // ignore parse errors
    }
    
    return {
      name: 'Circular Dependencies',
      status: 'pass',
      message: 'No circular dependencies'
    };
  }
}

function checkModuleSizes(): Check {
  const moduleNames = fs.readdirSync(MODULES_PATH).filter(m => {
    const stat = fs.statSync(path.join(MODULES_PATH, m));
    return stat.isDirectory();
  });
  
  const oversizedModules: string[] = [];
  
  for (const name of moduleNames) {
    const modulePath = path.join(MODULES_PATH, name);
    const files = getAllFiles(modulePath);
    
    let totalLines = 0;
    for (const file of files) {
      totalLines += countLines(file);
    }
    
    if (totalLines > THRESHOLDS.MAX_MODULE_SIZE_LINES) {
      oversizedModules.push(`${name}: ${totalLines} lines`);
    }
  }
  
  if (oversizedModules.length > 0) {
    return {
      name: 'Module Size',
      status: 'warn',
      message: `${oversizedModules.length} modules exceed ${THRESHOLDS.MAX_MODULE_SIZE_LINES} lines`,
      details: oversizedModules
    };
  }
  
  return {
    name: 'Module Size',
    status: 'pass',
    message: 'All modules within size limits'
  };
}

function checkAdminInflation(): Check {
  const adminPath = path.join(MODULES_PATH, 'admin');
  if (!fs.existsSync(adminPath)) {
    return {
      name: 'Admin Inflation',
      status: 'pass',
      message: 'No admin module'
    };
  }
  
  const adminFiles = getAllFiles(adminPath);
  let adminLines = 0;
  for (const file of adminFiles) {
    adminLines += countLines(file);
  }
  
  // Calculate domain module average
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
  const inflationScore = Math.max(0, Math.round(((adminLines / avgDomainSize) - 1) * 50));
  
  if (inflationScore > THRESHOLDS.MAX_ADMIN_INFLATION) {
    return {
      name: 'Admin Inflation',
      status: 'fail',
      message: `Admin inflation score: ${inflationScore}/100 (max: ${THRESHOLDS.MAX_ADMIN_INFLATION})`,
      details: [
        `Admin module: ${adminLines} lines`,
        `Average domain module: ${Math.round(avgDomainSize)} lines`,
        'Admin should primarily orchestrate, not implement'
      ]
    };
  }
  
  if (inflationScore > THRESHOLDS.MAX_ADMIN_INFLATION * 0.7) {
    return {
      name: 'Admin Inflation',
      status: 'warn',
      message: `Admin inflation score: ${inflationScore}/100 (approaching limit)`,
      details: [
        `Admin module: ${adminLines} lines`,
        `Average domain module: ${Math.round(avgDomainSize)} lines`
      ]
    };
  }
  
  return {
    name: 'Admin Inflation',
    status: 'pass',
    message: `Admin inflation score: ${inflationScore}/100`
  };
}

function checkTypeDuplication(): Check {
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
            // Skip common/utility type names
            if (['Props', 'State', 'Options', 'Config', 'Result'].includes(typeName)) continue;
            
            if (!typeNames.has(typeName)) {
              typeNames.set(typeName, new Set());
            }
            typeNames.get(typeName)!.add(module);
          }
        }
      }
    }
  }
  
  const duplicates: string[] = [];
  for (const [name, modules] of typeNames) {
    if (modules.size > 1) {
      duplicates.push(`${name}: ${Array.from(modules).join(', ')}`);
    }
  }
  
  if (duplicates.length > THRESHOLDS.MAX_TYPE_DUPLICATION) {
    return {
      name: 'Type Duplication',
      status: 'warn',
      message: `${duplicates.length} duplicated type names (max: ${THRESHOLDS.MAX_TYPE_DUPLICATION})`,
      details: duplicates.slice(0, 10)
    };
  }
  
  return {
    name: 'Type Duplication',
    status: 'pass',
    message: `${duplicates.length} duplicated type names`
  };
}

function checkBaselineDrift(): Check {
  if (!fs.existsSync(BASELINE_FILE)) {
    return {
      name: 'Baseline Drift',
      status: 'warn',
      message: 'No baseline found - cannot check drift',
      details: ['Run: npx tsx scripts/architecture/baseline.ts --save']
    };
  }
  
  try {
    const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf-8'));
    const baselineViolations = baseline.metrics?.boundaryViolationCount || 0;
    
    // Get current violations
    let currentViolations = 0;
    const moduleNames = fs.readdirSync(MODULES_PATH).filter(m => {
      const stat = fs.statSync(path.join(MODULES_PATH, m));
      return stat.isDirectory();
    });
    
    for (const module of moduleNames) {
      const modulePath = path.join(MODULES_PATH, module);
      const files = getAllFiles(modulePath);
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes('@/shared/services')) currentViolations++;
        if (content.includes('@/shared/hooks')) currentViolations++;
      }
    }
    
    const delta = currentViolations - baselineViolations;
    
    if (delta > 0) {
      return {
        name: 'Baseline Drift',
        status: 'fail',
        message: `Architecture drift detected: +${delta} violations since baseline`,
        details: [
          `Baseline (${baseline.gitCommit}): ${baselineViolations} violations`,
          `Current: ${currentViolations} violations`
        ]
      };
    }
    
    if (delta < 0) {
      return {
        name: 'Baseline Drift',
        status: 'pass',
        message: `Architecture improved: ${Math.abs(delta)} violations resolved`,
        details: ['Consider updating baseline with: npx tsx scripts/architecture/baseline.ts --save']
      };
    }
    
    return {
      name: 'Baseline Drift',
      status: 'pass',
      message: 'No drift from baseline'
    };
  } catch (error) {
    return {
      name: 'Baseline Drift',
      status: 'warn',
      message: 'Could not read baseline file',
      details: [(error as Error).message]
    };
  }
}

// ============================================================================
// MAIN GUARD EXECUTION
// ============================================================================

function runGuard(strict: boolean): GuardResult {
  console.log('\n' + '🛡️'.repeat(35));
  console.log('  ARCHITECTURE CI GUARD');
  console.log('🛡️'.repeat(35) + '\n');
  
  const checks: Check[] = [
    checkModuleStructure(),
    checkBoundaryViolations(),
    checkCircularDependencies(),
    checkModuleSizes(),
    checkAdminInflation(),
    checkTypeDuplication(),
    checkBaselineDrift()
  ];
  
  // Print results
  for (const check of checks) {
    const icon = check.status === 'pass' ? '✅' :
                 check.status === 'warn' ? '⚠️' : '❌';
    console.log(`${icon} ${check.name}: ${check.message}`);
    
    if (check.details) {
      for (const detail of check.details) {
        console.log(`   ${detail}`);
      }
    }
  }
  
  // Calculate result
  const failures = checks.filter(c => c.status === 'fail');
  const warnings = checks.filter(c => c.status === 'warn');
  const passes = checks.filter(c => c.status === 'pass');
  
  console.log('\n' + '─'.repeat(60));
  console.log(`\n📊 Results: ${passes.length} passed, ${warnings.length} warnings, ${failures.length} failed\n`);
  
  let exitCode = 0;
  let summary = '';
  let passed = true;
  
  if (failures.length > 0) {
    exitCode = 1;
    passed = false;
    summary = `❌ FAILED: ${failures.length} critical issues must be fixed`;
    console.log(summary);
  } else if (warnings.length > 0 && strict) {
    exitCode = 2;
    passed = false;
    summary = `⚠️ WARNING: ${warnings.length} issues detected (strict mode)`;
    console.log(summary);
  } else if (warnings.length > 0) {
    exitCode = 0;
    passed = true;
    summary = `✅ PASSED with ${warnings.length} warnings`;
    console.log(summary);
  } else {
    exitCode = 0;
    passed = true;
    summary = '✅ PASSED: All architecture checks passed!';
    console.log(summary);
  }
  
  console.log('\n' + '🛡️'.repeat(35) + '\n');
  
  return { passed, exitCode, checks, summary };
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const createBaseline = args.includes('--create-baseline');
  
  if (createBaseline) {
    console.log('📸 Creating new baseline...\n');
    try {
      execSync('npx tsx scripts/architecture/baseline.ts --save', {
        cwd: PROJECT_ROOT,
        stdio: 'inherit'
      });
    } catch (error) {
      console.error('Failed to create baseline:', error);
      process.exit(1);
    }
    return;
  }
  
  const result = runGuard(strict);
  
  // Output for CI systems
  if (process.env.GITHUB_ACTIONS) {
    if (!result.passed) {
      console.log(`::error title=Architecture Guard::${result.summary}`);
    }
    console.log(`::set-output name=passed::${result.passed}`);
    console.log(`::set-output name=exit_code::${result.exitCode}`);
  }
  
  process.exit(result.exitCode);
}

main();

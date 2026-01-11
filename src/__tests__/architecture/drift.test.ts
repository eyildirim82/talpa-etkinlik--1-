/**
 * Architecture Drift Detection Tests
 * 
 * These tests detect time-based erosion across architecture dimensions:
 * 1. Boundary Drift - module boundaries being bypassed
 * 2. Dependency Drift - new uncontrolled dependencies
 * 3. Admin Re-Inflation - admin module growing too large
 * 4. Type Duplication Drift - same types defined in multiple modules
 * 5. Shared Layer Re-Contamination - shared folder growing with business logic
 * 6. Public API Bypass - direct imports instead of using index.ts
 * 
 * Run with: npm run check:boundaries
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '../../..')
const MODULES_PATH = path.join(PROJECT_ROOT, 'src/modules')
const SHARED_PATH = path.join(PROJECT_ROOT, 'src/shared')

// Domain modules that should NOT depend on admin
const DOMAIN_MODULES = [
  'booking', 'event', 'profile', 'ticket', 
  'notification', 'payment', 'file-processing', 'reporting'
]

// Thresholds for drift detection
const THRESHOLDS = {
  MAX_ADMIN_SIZE_RATIO: 2.0, // Admin should not be > 2x average domain module
  MAX_TYPE_DUPLICATIONS: 10,
  MAX_SHARED_BUSINESS_LOGIC_LINES: 100,
  MAX_MODULE_SIZE_LINES: 3000
}

// Helper to get all TypeScript files
function getAllTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  
  const files: string[] = []
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      files.push(...getAllTsFiles(fullPath))
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      if (!item.includes('.test.')) {
        files.push(fullPath)
      }
    }
  }
  
  return files
}

function countLines(filePath: string): number {
  try {
    return fs.readFileSync(filePath, 'utf-8').split('\n').length
  } catch {
    return 0
  }
}

describe('Architecture Drift Detection', () => {
  
  describe('Boundary Drift', () => {
    
    it('should not have deprecated @/shared/services imports', () => {
      const violations: string[] = []
      const moduleNames = fs.readdirSync(MODULES_PATH).filter(m => 
        fs.statSync(path.join(MODULES_PATH, m)).isDirectory()
      )
      
      for (const module of moduleNames) {
        const files = getAllTsFiles(path.join(MODULES_PATH, module))
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf-8')
          if (content.includes('@/shared/services')) {
            violations.push(path.relative(PROJECT_ROOT, file))
          }
        }
      }
      
      expect(violations).toEqual([])
    })
    
    it('should not have deprecated @/shared/hooks imports', () => {
      const violations: string[] = []
      const moduleNames = fs.readdirSync(MODULES_PATH).filter(m => 
        fs.statSync(path.join(MODULES_PATH, m)).isDirectory()
      )
      
      for (const module of moduleNames) {
        const files = getAllTsFiles(path.join(MODULES_PATH, module))
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf-8')
          if (content.includes('@/shared/hooks')) {
            violations.push(path.relative(PROJECT_ROOT, file))
          }
        }
      }
      
      expect(violations).toEqual([])
    })
    
    it('should not have deprecated @/types/domain imports', () => {
      const violations: string[] = []
      const moduleNames = fs.readdirSync(MODULES_PATH).filter(m => 
        fs.statSync(path.join(MODULES_PATH, m)).isDirectory()
      )
      
      for (const module of moduleNames) {
        const files = getAllTsFiles(path.join(MODULES_PATH, module))
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf-8')
          if (content.includes("@/types/domain")) {
            violations.push(path.relative(PROJECT_ROOT, file))
          }
        }
      }
      
      expect(violations).toEqual([])
    })
  })
  
  describe('Public API Bypass', () => {
    
    it('should import from module index.ts instead of internal API files', () => {
      const violations: string[] = []
      const moduleNames = fs.readdirSync(MODULES_PATH).filter(m => 
        fs.statSync(path.join(MODULES_PATH, m)).isDirectory()
      )
      
      for (const module of moduleNames) {
        const files = getAllTsFiles(path.join(MODULES_PATH, module))
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf-8')
          
          // Check for direct internal imports from OTHER modules
          const internalPattern = /@\/modules\/([^/]+)\/(api|hooks|services|utils)\/[^'"]+/g
          const matches = content.match(internalPattern)
          
          if (matches) {
            for (const match of matches) {
              const targetModule = match.match(/@\/modules\/([^/]+)/)?.[1]
              if (targetModule && targetModule !== module) {
                violations.push(`${path.relative(PROJECT_ROOT, file)}: ${match}`)
              }
            }
          }
        }
      }
      
      expect(violations).toEqual([])
    })
  })
  
  describe('Dependency Drift', () => {
    
    it('domain modules should not import from admin module', () => {
      const violations: string[] = []
      
      for (const module of DOMAIN_MODULES) {
        const modulePath = path.join(MODULES_PATH, module)
        if (!fs.existsSync(modulePath)) continue
        
        const files = getAllTsFiles(modulePath)
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf-8')
          if (content.includes("@/modules/admin")) {
            violations.push(`${module}: ${path.basename(file)}`)
          }
        }
      }
      
      expect(violations).toEqual([])
    })
    
    it('auth module should not import from domain modules', () => {
      const violations: string[] = []
      const authPath = path.join(MODULES_PATH, 'auth')
      
      if (fs.existsSync(authPath)) {
        const files = getAllTsFiles(authPath)
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf-8')
          
          for (const domain of DOMAIN_MODULES) {
            if (content.includes(`@/modules/${domain}`)) {
              violations.push(`auth imports from ${domain}: ${path.basename(file)}`)
            }
          }
        }
      }
      
      expect(violations).toEqual([])
    })
  })
  
  describe('Admin Re-Inflation', () => {
    
    it('admin module should not be disproportionately large', () => {
      const adminPath = path.join(MODULES_PATH, 'admin')
      if (!fs.existsSync(adminPath)) return
      
      // Calculate admin size
      const adminFiles = getAllTsFiles(adminPath)
      let adminLines = 0
      for (const file of adminFiles) {
        adminLines += countLines(file)
      }
      
      // Calculate average domain module size
      let domainTotal = 0
      let domainCount = 0
      
      for (const domain of DOMAIN_MODULES) {
        const domainPath = path.join(MODULES_PATH, domain)
        if (fs.existsSync(domainPath)) {
          const files = getAllTsFiles(domainPath)
          for (const file of files) {
            domainTotal += countLines(file)
          }
          domainCount++
        }
      }
      
      const avgDomainSize = domainCount > 0 ? domainTotal / domainCount : 1
      const ratio = adminLines / avgDomainSize
      
      expect(ratio).toBeLessThanOrEqual(THRESHOLDS.MAX_ADMIN_SIZE_RATIO)
    })
    
    it('admin should not have direct Supabase calls (delegate to domain modules)', () => {
      const adminPath = path.join(MODULES_PATH, 'admin')
      if (!fs.existsSync(adminPath)) return
      
      const violations: string[] = []
      const files = getAllTsFiles(adminPath)
      
      for (const file of files) {
        // Skip API files that might legitimately orchestrate
        if (file.includes('/api/')) continue
        
        const content = fs.readFileSync(file, 'utf-8')
        
        // Check for direct Supabase usage in non-API files
        if (content.includes('createBrowserClient()')) {
          violations.push(path.relative(PROJECT_ROOT, file))
        }
      }
      
      expect(violations).toEqual([])
    })
  })
  
  describe('Type Duplication Drift', () => {
    
    it('should not have same type names in multiple modules', () => {
      const typeLocations: Map<string, string[]> = new Map()
      
      const moduleNames = fs.readdirSync(MODULES_PATH).filter(m => 
        fs.statSync(path.join(MODULES_PATH, m)).isDirectory()
      )
      
      for (const module of moduleNames) {
        const files = getAllTsFiles(path.join(MODULES_PATH, module))
        
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf-8')
          const typeMatches = content.match(/(?:export\s+)?(?:type|interface)\s+(\w+)/g)
          
          if (typeMatches) {
            for (const match of typeMatches) {
              const nameMatch = match.match(/(?:type|interface)\s+(\w+)/)
              if (nameMatch) {
                const typeName = nameMatch[1]
                // Skip common utility type names
                if (['Props', 'State', 'Options', 'Config', 'Result', 'Error'].includes(typeName)) continue
                
                if (!typeLocations.has(typeName)) {
                  typeLocations.set(typeName, [])
                }
                const existing = typeLocations.get(typeName)!
                if (!existing.includes(module)) {
                  existing.push(module)
                }
              }
            }
          }
        }
      }
      
      const duplicates: string[] = []
      for (const [name, modules] of typeLocations) {
        if (modules.length > 1) {
          duplicates.push(`${name}: ${modules.join(', ')}`)
        }
      }
      
      expect(duplicates.length).toBeLessThanOrEqual(THRESHOLDS.MAX_TYPE_DUPLICATIONS)
    })
  })
  
  describe('Shared Layer Re-Contamination', () => {
    
    it('shared layer should not contain business logic', () => {
      // Count lines in shared folder excluding allowed directories
      const allowedDirs = ['infrastructure', 'test-utils', 'utils', 'components']
      let businessLogicLines = 0
      
      if (fs.existsSync(SHARED_PATH)) {
        const topLevelDirs = fs.readdirSync(SHARED_PATH).filter(d => 
          fs.statSync(path.join(SHARED_PATH, d)).isDirectory()
        )
        
        for (const dir of topLevelDirs) {
          if (!allowedDirs.includes(dir)) {
            const files = getAllTsFiles(path.join(SHARED_PATH, dir))
            for (const file of files) {
              businessLogicLines += countLines(file)
            }
          }
        }
      }
      
      expect(businessLogicLines).toBeLessThanOrEqual(THRESHOLDS.MAX_SHARED_BUSINESS_LOGIC_LINES)
    })
    
    it('shared/services should be empty or deprecated', () => {
      const servicesPath = path.join(SHARED_PATH, 'services')
      if (!fs.existsSync(servicesPath)) return
      
      const files = getAllTsFiles(servicesPath)
      expect(files.length).toBe(0)
    })
    
    it('shared/hooks should be empty or deprecated', () => {
      const hooksPath = path.join(SHARED_PATH, 'hooks')
      if (!fs.existsSync(hooksPath)) return
      
      const files = getAllTsFiles(hooksPath)
      expect(files.length).toBe(0)
    })
  })
  
  describe('Module Size Limits', () => {
    
    it('no module should exceed size threshold', () => {
      const violations: string[] = []
      
      const moduleNames = fs.readdirSync(MODULES_PATH).filter(m => 
        fs.statSync(path.join(MODULES_PATH, m)).isDirectory()
      )
      
      for (const module of moduleNames) {
        const files = getAllTsFiles(path.join(MODULES_PATH, module))
        let totalLines = 0
        
        for (const file of files) {
          totalLines += countLines(file)
        }
        
        if (totalLines > THRESHOLDS.MAX_MODULE_SIZE_LINES) {
          violations.push(`${module}: ${totalLines} lines`)
        }
      }
      
      expect(violations).toEqual([])
    })
  })
  
  describe('Module Structure Compliance', () => {
    
    it('each module should have an index.ts file', () => {
      const violations: string[] = []
      
      const moduleNames = fs.readdirSync(MODULES_PATH).filter(m => 
        fs.statSync(path.join(MODULES_PATH, m)).isDirectory()
      )
      
      for (const module of moduleNames) {
        const indexPath = path.join(MODULES_PATH, module, 'index.ts')
        if (!fs.existsSync(indexPath)) {
          violations.push(module)
        }
      }
      
      expect(violations).toEqual([])
    })
    
    it('module index.ts should export types from types folder', () => {
      const coreModules = ['booking', 'event', 'profile', 'ticket']
      const violations: string[] = []
      
      for (const module of coreModules) {
        const indexPath = path.join(MODULES_PATH, module, 'index.ts')
        if (fs.existsSync(indexPath)) {
          const content = fs.readFileSync(indexPath, 'utf-8')
          if (!content.includes('./types/') && !content.includes("'./types")) {
            violations.push(module)
          }
        }
      }
      
      expect(violations).toEqual([])
    })
  })
})

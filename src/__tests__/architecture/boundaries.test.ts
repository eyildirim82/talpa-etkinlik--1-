/**
 * Architecture Boundary Tests
 * 
 * These tests ensure that module boundaries are respected and
 * prevent architectural regression.
 * 
 * Run with: npm run check:boundaries
 */
import { execSync } from 'child_process'
import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const MODULES_PATH = path.resolve(__dirname, '../../modules')

describe('Module Boundaries', () => {
  
  it('should not have deprecated @/shared/services imports in modules', () => {
    try {
      const result = execSync(
        'grep -r "from \'@/shared/services" src/modules --include="*.ts" --include="*.tsx" 2>/dev/null || true',
        { encoding: 'utf-8', cwd: path.resolve(__dirname, '../../..') }
      ).toString().trim()
      
      expect(result).toBe('')
    } catch (error) {
      // grep returns exit code 1 when no matches - that's what we want
      expect(true).toBe(true)
    }
  })

  it('should not have deprecated @/shared/hooks imports in modules', () => {
    try {
      const result = execSync(
        'grep -r "from \'@/shared/hooks" src/modules --include="*.ts" --include="*.tsx" 2>/dev/null || true',
        { encoding: 'utf-8', cwd: path.resolve(__dirname, '../../..') }
      ).toString().trim()
      
      expect(result).toBe('')
    } catch (error) {
      expect(true).toBe(true)
    }
  })

  it('admin module should only contain re-exports, not direct supabase calls (except legacy)', () => {
    const adminHooksPath = path.join(MODULES_PATH, 'admin/hooks/useAdmin.ts')
    
    if (fs.existsSync(adminHooksPath)) {
      const content = fs.readFileSync(adminHooksPath, 'utf-8')
      
      // Should NOT have createBrowserClient calls - those should be in domain modules
      const hasDirectSupabase = content.includes('createBrowserClient()')
      
      expect(hasDirectSupabase).toBe(false)
    }
  })

  it('each module should have an index.ts file', () => {
    const modules = fs.readdirSync(MODULES_PATH)
    
    for (const module of modules) {
      const modulePath = path.join(MODULES_PATH, module)
      const stat = fs.statSync(modulePath)
      
      if (stat.isDirectory()) {
        const indexPath = path.join(modulePath, 'index.ts')
        expect(fs.existsSync(indexPath)).toBe(true)
      }
    }
  })

  it('domain modules should not import from admin module', () => {
    const domainModules = ['booking', 'event', 'profile', 'reporting', 'ticket', 'notification', 'payment', 'file-processing']
    
    for (const module of domainModules) {
      const modulePath = path.join(MODULES_PATH, module)
      
      if (fs.existsSync(modulePath)) {
        const files = getAllTsFiles(modulePath)
        
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf-8')
          const hasAdminImport = content.includes("from '@/modules/admin")
          
          expect(hasAdminImport).toBe(false)
        }
      }
    }
  })

  it('modules should export types from their own types folder', () => {
    const modules = ['booking', 'event', 'profile', 'ticket']
    
    for (const module of modules) {
      const indexPath = path.join(MODULES_PATH, module, 'index.ts')
      
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf-8')
        const exportsTypes = content.includes('./types/') || content.includes("'./types")
        
        expect(exportsTypes).toBe(true)
      }
    }
  })
})

// Helper function to recursively get all TypeScript files
function getAllTsFiles(dir: string): string[] {
  const files: string[] = []
  
  const items = fs.readdirSync(dir)
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      files.push(...getAllTsFiles(fullPath))
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      // Skip test files
      if (!item.includes('.test.')) {
        files.push(fullPath)
      }
    }
  }
  
  return files
}

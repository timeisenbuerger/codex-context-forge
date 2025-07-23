import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { ApiConfig } from './apiKeyManager';
import { FrameworkDetector, FrameworkDetectionResult } from './frameworkDetector';

export interface BasicAnalysis extends Record<string, unknown> {
  projectType: string;
  techStack: string[];
  fileStats: {
    total: number;
    components: number;
    routes: number;
    tests: number;
    config: number;
  };
  summary: string;
  existingDocs: string[];
  packageManagers: string[];
  frameworks: string[];
}

export interface DetailedAnalysis {
  insights: string[];
  recommendations: string[];
  architecture: {
    patterns: string[];
    structure: string;
    complexity: 'low' | 'medium' | 'high';
  };
  codeQuality: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
}

export class ProjectAnalyzer {
  constructor(private projectPath: string) {}

  async analyzeBasic(): Promise<BasicAnalysis> {
    const files = await this.getAllFiles(this.projectPath);
    const packageJson = await this.readPackageJson();

    // Use FrameworkDetector for better framework detection
    const frameworkDetector = new FrameworkDetector(this.projectPath);
    const frameworkDetection = await frameworkDetector.detectFrameworks();

    const analysis: BasicAnalysis = {
      projectType: this.detectProjectType(files, packageJson, frameworkDetection),
      techStack: this.detectTechStack(files, packageJson, frameworkDetection),
      fileStats: this.calculateFileStats(files),
      summary: '',
      existingDocs: this.findExistingDocs(files),
      packageManagers: this.detectPackageManagers(),
      frameworks: this.detectFrameworks(files, packageJson, frameworkDetection),
    };

    analysis.summary = this.generateSummary(analysis);
    return analysis;
  }

  async shouldUseAI(): Promise<boolean> {
    const { useAI } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useAI',
        message: 'Enable AI-powered analysis for deeper insights?',
        default: true,
      },
    ]);

    if (!useAI) {
      console.log(chalk.gray('Using pattern-based analysis only.'));
    }

    return useAI;
  }

  async analyzeDeep(_apiConfig: ApiConfig): Promise<DetailedAnalysis> {
    // This would integrate with AI providers for deeper analysis
    // For now, return mock analysis based on basic patterns
    const basicAnalysis = await this.analyzeBasic();

    return {
      insights: [
        `Detected ${basicAnalysis.techStack.join(' + ')} architecture`,
        `Found ${basicAnalysis.fileStats.components} components - good modular structure`,
        `${basicAnalysis.fileStats.tests} test files found - consider increasing coverage`,
      ],
      recommendations: [
        'Add comprehensive README with setup instructions',
        'Consider adding TypeScript for better type safety',
        'Implement error boundary components for React apps',
        'Add API documentation for backend routes',
      ],
      architecture: {
        patterns: this.detectArchitecturalPatterns(basicAnalysis),
        structure: this.analyzeStructure(basicAnalysis),
        complexity: this.assessComplexity(basicAnalysis),
      },
      codeQuality: {
        score: this.calculateQualityScore(basicAnalysis),
        issues: this.identifyIssues(basicAnalysis),
        suggestions: this.generateSuggestions(basicAnalysis),
      },
    };
  }

  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const items = await fs.readdir(dir);

    for (const item of items) {
      if (item.startsWith('.') && item !== '.env.example') continue;
      if (item === 'node_modules' || item === 'dist' || item === 'build') continue;

      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        const subFiles = await this.getAllFiles(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  private async readPackageJson(): Promise<Record<string, unknown> | null> {
    try {
      const packagePath = path.join(this.projectPath, 'package.json');
      if (await fs.pathExists(packagePath)) {
        return await fs.readJson(packagePath);
      }
    } catch {
      // Package.json not found or invalid
    }
    return null;
  }

  private detectProjectType(
    files: string[],
    packageJson: Record<string, unknown> | null,
    frameworkDetection?: FrameworkDetectionResult
  ): string {
    // First check if FrameworkDetector found a primary framework
    if (frameworkDetection?.primary) {
      const framework = frameworkDetection.primary.framework;

      // Map framework names to user-friendly project types
      switch (framework) {
        case 'compose-multiplatform':
          return 'Compose Multiplatform';
        case 'spring-boot':
          return 'Spring Boot';
        case 'react':
          return frameworkDetection.primary.variant || 'React';
        case 'vue':
          return frameworkDetection.primary.variant || 'Vue.js';
        case 'angular':
          return 'Angular';
        case 'express':
          return 'Express.js';
        case 'nestjs':
          return 'NestJS';
        case 'fastapi':
          return 'FastAPI';
        case 'django':
          return 'Django';
        case 'rails':
          return 'Ruby on Rails';
        case 'laravel':
          return 'Laravel';
        default:
          return framework.charAt(0).toUpperCase() + framework.slice(1);
      }
    }

    // Fallback to legacy detection if no framework detected
    if (packageJson) {
      const deps = {
        ...(packageJson.dependencies as Record<string, unknown>),
        ...(packageJson.devDependencies as Record<string, unknown>),
      };

      if (deps.next || deps['@next/core-web-vitals']) return 'Next.js';
      if (deps.react) return 'React';
      if (deps.vue) return 'Vue.js';
      if (deps.angular || deps['@angular/core']) return 'Angular';
      if (deps.express) return 'Express.js';
      if (deps.fastapi) return 'FastAPI';
      if (deps.django) return 'Django';
    }

    const extensions = files.map((f) => path.extname(f));

    if (extensions.includes('.tsx') || extensions.includes('.jsx')) return 'React/JSX';
    if (extensions.includes('.vue')) return 'Vue.js';
    if (extensions.includes('.py')) return 'Python';
    if (extensions.includes('.rs')) return 'Rust';
    if (extensions.includes('.go')) return 'Go';
    if (extensions.includes('.java')) return 'Java';
    if (extensions.includes('.kt')) return 'Kotlin';
    if (extensions.includes('.ts') || extensions.includes('.js')) return 'JavaScript/TypeScript';

    return 'Mixed/Unknown';
  }

  private detectTechStack(
    files: string[],
    packageJson: Record<string, unknown> | null,
    frameworkDetection?: FrameworkDetectionResult
  ): string[] {
    const stack: string[] = [];

    // Add detected frameworks first
    if (frameworkDetection?.allDetected) {
      frameworkDetection.allDetected.forEach((detected) => {
        let frameworkName = detected.framework;

        // Map framework names to tech stack entries
        switch (detected.framework) {
          case 'compose-multiplatform':
            stack.push('Kotlin Multiplatform', 'Jetpack Compose');
            if (detected.variant) {
              switch (detected.variant) {
                case 'mobile-focused':
                  stack.push('Android', 'iOS');
                  break;
                case 'full-multiplatform':
                  stack.push('Android', 'iOS', 'Desktop', 'Web');
                  break;
                case 'web-enabled':
                  stack.push('Web Assembly', 'JavaScript');
                  break;
                case 'desktop-only':
                  stack.push('Desktop');
                  break;
              }
            }
            break;
          case 'spring-boot':
            stack.push('Spring Boot', 'Java');
            break;
          case 'react':
            if (detected.variant === 'next.js') {
              stack.push('Next.js', 'React');
            } else {
              stack.push('React');
            }
            break;
          case 'vue':
            if (detected.variant === 'nuxt') {
              stack.push('Nuxt.js', 'Vue.js');
            } else {
              stack.push('Vue.js');
            }
            break;
          default:
            stack.push(frameworkName.charAt(0).toUpperCase() + frameworkName.slice(1));
        }
      });
    }

    if (packageJson) {
      const deps = {
        ...(packageJson.dependencies as Record<string, unknown>),
        ...(packageJson.devDependencies as Record<string, unknown>),
      };

      // Frontend frameworks (only if not already detected)
      if (deps.next && !stack.includes('Next.js')) stack.push('Next.js');
      else if (deps.react && !stack.includes('React')) stack.push('React');
      if (deps.vue && !stack.includes('Vue.js')) stack.push('Vue.js');
      if (deps['@angular/core'] && !stack.includes('Angular')) stack.push('Angular');

      // Backend frameworks
      if (deps.express) stack.push('Express.js');
      if (deps.fastify) stack.push('Fastify');

      // Databases
      if (deps.mongoose || deps.mongodb) stack.push('MongoDB');
      if (deps.pg || deps.postgres) stack.push('PostgreSQL');
      if (deps.mysql2 || deps.mysql) stack.push('MySQL');
      if (deps.sqlite3) stack.push('SQLite');

      // Tools
      if (deps.typescript) stack.push('TypeScript');
      if (deps.tailwindcss) stack.push('Tailwind CSS');
      if (deps.prisma) stack.push('Prisma');
    }

    // Detect from file extensions and names
    const extensions = files.map((f) => path.extname(f));
    const filenames = files.map((f) => path.basename(f));

    if (extensions.includes('.py') && !stack.some((s) => s.toLowerCase().includes('python')))
      stack.push('Python');
    if (extensions.includes('.rs')) stack.push('Rust');
    if (extensions.includes('.go')) stack.push('Go');
    if (extensions.includes('.kt') && !stack.includes('Kotlin Multiplatform')) stack.push('Kotlin');
    if (filenames.includes('Dockerfile')) stack.push('Docker');
    if (filenames.includes('docker-compose.yml')) stack.push('Docker Compose');

    return [...new Set(stack)];
  }

  private calculateFileStats(files: string[]): BasicAnalysis['fileStats'] {
    return {
      total: files.length,
      components: files.filter(
        (f) =>
          f.includes('component') ||
          /\.(jsx|tsx)$/.test(f) ||
          (f.includes('/src/') && /\.(js|ts)$/.test(f))
      ).length,
      routes: files.filter(
        (f) =>
          f.includes('route') ||
          f.includes('api/') ||
          f.includes('pages/') ||
          (f.includes('app/') && f.includes('route.'))
      ).length,
      tests: files.filter(
        (f) => f.includes('.test.') || f.includes('.spec.') || f.includes('__tests__')
      ).length,
      config: files.filter((f) => f.includes('config') || /\.(json|yaml|yml|toml|ini)$/.test(f))
        .length,
    };
  }

  private findExistingDocs(files: string[]): string[] {
    return files
      .filter((f) => /\.(md|txt|rst)$/i.test(f))
      .map((f) => path.basename(f))
      .filter((f) => !f.startsWith('.'));
  }

  private detectPackageManagers(): string[] {
    const managers: string[] = [];
    const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'];

    lockFiles.forEach((lockFile) => {
      if (fs.pathExistsSync(path.join(this.projectPath, lockFile))) {
        managers.push(lockFile.split('-')[0] || lockFile.split('.')[0]);
      }
    });

    return managers.length > 0 ? managers : ['npm'];
  }

  private detectFrameworks(
    files: string[],
    packageJson: Record<string, unknown> | null,
    frameworkDetection?: FrameworkDetectionResult
  ): string[] {
    const frameworks: string[] = [];

    // Use FrameworkDetector results first
    if (frameworkDetection?.allDetected) {
      frameworkDetection.allDetected.forEach((detected) => {
        let displayName = detected.framework;

        // Map framework names to display names
        switch (detected.framework) {
          case 'compose-multiplatform':
            displayName = 'Compose Multiplatform';
            break;
          case 'spring-boot':
            displayName = 'Spring Boot';
            break;
          case 'react':
            displayName = detected.variant === 'next.js' ? 'Next.js' : 'React';
            break;
          case 'vue':
            displayName = detected.variant === 'nuxt' ? 'Nuxt.js' : 'Vue.js';
            break;
          case 'nestjs':
            displayName = 'NestJS';
            break;
          case 'fastapi':
            displayName = 'FastAPI';
            break;
          case 'rails':
            displayName = 'Ruby on Rails';
            break;
          default:
            displayName = detected.framework.charAt(0).toUpperCase() + detected.framework.slice(1);
        }

        frameworks.push(displayName);
      });
    }

    // Fallback to legacy detection for missed frameworks
    if (packageJson) {
      const deps = {
        ...(packageJson.dependencies as Record<string, unknown>),
        ...(packageJson.devDependencies as Record<string, unknown>),
      };
      Object.keys(deps).forEach((dep) => {
        if (dep.startsWith('@angular/') && !frameworks.includes('Angular'))
          frameworks.push('Angular');
        if (dep === 'vue' && !frameworks.includes('Vue.js')) frameworks.push('Vue.js');
        if (dep === 'react' && !frameworks.includes('React')) frameworks.push('React');
        if (dep === 'next' && !frameworks.includes('Next.js')) frameworks.push('Next.js');
      });
    }

    return [...new Set(frameworks)];
  }

  private generateSummary(analysis: BasicAnalysis): string {
    const { projectType, techStack, fileStats } = analysis;
    return `${projectType} project with ${techStack.join(', ')} (${fileStats.total} files)`;
  }

  private detectArchitecturalPatterns(analysis: BasicAnalysis): string[] {
    const patterns: string[] = [];

    if (analysis.techStack.includes('React')) patterns.push('Component-based');
    if (analysis.fileStats.routes > 0) patterns.push('Route-based');
    if (analysis.techStack.includes('Prisma')) patterns.push('ORM-based');
    if (analysis.techStack.includes('Next.js')) patterns.push('Full-stack');

    return patterns;
  }

  private analyzeStructure(analysis: BasicAnalysis): string {
    if (analysis.fileStats.components > 20) return 'Large modular structure';
    if (analysis.fileStats.components > 5) return 'Medium modular structure';
    return 'Small/simple structure';
  }

  private assessComplexity(analysis: BasicAnalysis): 'low' | 'medium' | 'high' {
    const score = analysis.fileStats.total + analysis.techStack.length * 5;
    if (score > 100) return 'high';
    if (score > 30) return 'medium';
    return 'low';
  }

  private calculateQualityScore(analysis: BasicAnalysis): number {
    let score = 50; // Base score

    if (analysis.techStack.includes('TypeScript')) score += 20;
    if (analysis.fileStats.tests > 0) score += 15;
    if (analysis.existingDocs.length > 0) score += 10;
    if (analysis.techStack.includes('Prisma')) score += 5;

    return Math.min(100, score);
  }

  private identifyIssues(analysis: BasicAnalysis): string[] {
    const issues: string[] = [];

    if (analysis.fileStats.tests === 0) issues.push('No test files found');
    if (analysis.existingDocs.length === 0) issues.push('No documentation files found');
    if (!analysis.techStack.includes('TypeScript') && analysis.projectType.includes('JavaScript')) {
      issues.push('Consider TypeScript for better type safety');
    }

    return issues;
  }

  private generateSuggestions(analysis: BasicAnalysis): string[] {
    const suggestions: string[] = [];

    suggestions.push('Add comprehensive README.md');
    suggestions.push('Create API documentation');

    if (analysis.fileStats.tests === 0) {
      suggestions.push('Add unit and integration tests');
    }

    if (!analysis.techStack.includes('TypeScript')) {
      suggestions.push('Consider migrating to TypeScript');
    }

    return suggestions;
  }
}

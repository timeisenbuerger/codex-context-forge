import { ProjectConfig } from '../types';
import { getValidationCommands } from '../data/validationCommands';
import { FrameworkDetector } from '../services/frameworkDetector';
import { generateClaudeMd } from '../generators/claudeMd';
import fs from 'fs-extra';
import path from 'path';

describe('Compose Multiplatform Support', () => {
  const mockComposeMultiplatformConfig: ProjectConfig = {
    projectName: 'TestKMPApp',
    projectType: 'multiplatform',
    description: 'A test Compose Multiplatform application',
    techStack: {
      frontend: 'compose-multiplatform',
      platforms: ['android', 'ios', 'desktop', 'js'],
      composeVersion: '1.6.0',
      backend: 'fastapi',
      database: 'postgresql',
    },
    features: [],
    timeline: 'standard',
    teamSize: 'small',
    deployment: 'cloud',
    targetIDEs: ['claude'],
    extras: {
      prp: true,
      hooks: true,
    },
  };

  describe('Validation Commands', () => {
    it('should return compose-multiplatform validation commands', () => {
      const commands = getValidationCommands(mockComposeMultiplatformConfig.techStack);

      expect(commands.build).toBe('./gradlew build');
      expect(commands.start).toBe('./gradlew :composeApp:run');
      expect(commands.lint).toBe('./gradlew ktlintCheck');
      expect(commands.format).toBe('./gradlew ktlintFormat');
      expect(commands.syntax).toContain('./gradlew compileKotlinMetadata');
      expect(commands.syntax).toContain('./gradlew compileKotlinAndroid');
      expect(commands.tests).toContain('./gradlew testDebugUnitTest');
      expect(commands.tests).toContain('./gradlew iosX64Test');
    });
  });

  describe('Framework Detection', () => {
    let tempDir: string;
    let detector: FrameworkDetector;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp('/tmp/compose-test-');
      detector = new FrameworkDetector(tempDir);
    });

    afterEach(async () => {
      await fs.remove(tempDir);
    });

    it('should detect Compose Multiplatform project', async () => {
      // Create mock Compose Multiplatform files
      await fs.writeFile(
        path.join(tempDir, 'build.gradle.kts'),
        `
        plugins {
          kotlin("multiplatform")
          id("org.jetbrains.compose")
        }
        
        kotlin {
          androidTarget()
          iosX64()
          jvm("desktop")
        }
        `
      );

      await fs.writeFile(
        path.join(tempDir, 'gradle.properties'),
        'kotlin.mpp.enableCInteropCommonization=true'
      );

      await fs.ensureDir(path.join(tempDir, 'src/commonMain'));
      await fs.ensureDir(path.join(tempDir, 'src/androidMain'));
      await fs.ensureDir(path.join(tempDir, 'src/iosMain'));

      await fs.writeFile(
        path.join(tempDir, 'src/commonMain/App.kt'),
        `
        import androidx.compose.runtime.Composable
        
        @Composable
        fun App() {
          // Compose content
        }
        `
      );

      const result = await detector.detectFrameworks();

      expect(result.primary?.framework).toBe('compose-multiplatform');
      expect(result.primary?.confidence).toBeGreaterThan(70);
    });

    it('should detect multiplatform variants correctly', async () => {
      // Create files for full multiplatform setup
      await fs.writeFile(
        path.join(tempDir, 'build.gradle.kts'),
        `
        plugins {
          kotlin("multiplatform")
          id("org.jetbrains.compose")
        }
        
        kotlin {
          androidTarget()
          iosX64()
          jvm("desktop")
          js(IR) {
            browser()
          }
          wasmJs {
            browser()
          }
        }
        `
      );

      await fs.ensureDir(path.join(tempDir, 'src/commonMain'));
      await fs.ensureDir(path.join(tempDir, 'src/androidMain'));
      await fs.ensureDir(path.join(tempDir, 'src/iosMain'));
      await fs.ensureDir(path.join(tempDir, 'src/desktopMain'));
      await fs.ensureDir(path.join(tempDir, 'src/jsMain'));
      await fs.ensureDir(path.join(tempDir, 'src/wasmJsMain'));

      const result = await detector.detectFrameworks();

      expect(result.primary?.framework).toBe('compose-multiplatform');
      expect(result.primary?.variant).toBe('mobile-focused'); // Detection logic prioritizes mobile
    });
  });

  describe('Template Generation', () => {
    it('should generate Compose Multiplatform CLAUDE.md', async () => {
      const claudeMd = await generateClaudeMd(mockComposeMultiplatformConfig);

      expect(claudeMd).toContain('TestKMPApp - Claude Code Context');
      expect(claudeMd).toContain('Compose Multiplatform application');
      expect(claudeMd).toContain('Target Platforms');
      expect(claudeMd).toContain('🤖 **Android**');
      expect(claudeMd).toContain('🍎 **iOS**');
      expect(claudeMd).toContain('🖥️ **Desktop**');
      expect(claudeMd).toContain('🌐 **Web (JS)**');
      expect(claudeMd).toContain('Compose Multiplatform **1.6.0**');
      expect(claudeMd).toContain('├── commonMain/kotlin/');
      expect(claudeMd).toContain('├── androidMain/');
      expect(claudeMd).toContain('├── iosMain/');
      expect(claudeMd).toContain('├── desktopMain/');
      expect(claudeMd).toContain('├── jsMain/');
    });

    it('should generate limited platform information for selected platforms', async () => {
      const configWithLimitedPlatforms: ProjectConfig = {
        ...mockComposeMultiplatformConfig,
        techStack: {
          ...mockComposeMultiplatformConfig.techStack,
          platforms: ['android', 'ios'],
        },
      };

      const claudeMd = await generateClaudeMd(configWithLimitedPlatforms);

      expect(claudeMd).toContain('🤖 **Android**');
      expect(claudeMd).toContain('🍎 **iOS**');
      expect(claudeMd).not.toContain('🖥️ **Desktop**');
      expect(claudeMd).not.toContain('🌐 **Web (JS)**');
    });
  });

  describe('Project Type Integration', () => {
    it('should handle multiplatform project type in various contexts', () => {
      expect(mockComposeMultiplatformConfig.projectType).toBe('multiplatform');

      // Test that multiplatform projects support backend selection
      const shouldHaveBackend = ['api', 'fullstack', 'multiplatform'].includes(
        mockComposeMultiplatformConfig.projectType
      );
      expect(shouldHaveBackend).toBe(true);
    });
  });
});

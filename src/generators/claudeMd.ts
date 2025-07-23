import { ProjectConfig } from '../types';
import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';

export async function generateClaudeMd(config: ProjectConfig): Promise<string> {
  // Register Handlebars helpers
  registerHandlebarsHelpers();

  // Determine which template to use based on tech stack
  const templateFile = await selectTemplate(config.techStack);
  const templatePath = path.join(__dirname, '../../templates/claude', templateFile);

  // Check if tech-stack specific template exists
  const templateExists = await fs.pathExists(templatePath);

  if (templateExists) {
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);

    const context = {
      projectName: config.projectName,
      description: config.description,
      projectStructure: generateProjectStructure(config.techStack),
      prpConfig: config.extras.prp,
      techStack: config.techStack,
      platforms: config.techStack.platforms,
      composeVersion: config.techStack.composeVersion,
    };

    return template(context);
  } else {
    // Fallback to basic template
    return generateBasicClaudeMd(config);
  }
}

async function selectTemplate(techStack: ProjectConfig['techStack']): Promise<string> {
  // Priority order for template selection - frontend frameworks first
  if (techStack.frontend === 'compose-multiplatform') {
    return 'tech-stacks/compose-multiplatform.md';
  } else if (techStack.frontend === 'nextjs') {
    return 'tech-stacks/nextjs-15.md';
  } else if (techStack.frontend === 'react') {
    return 'tech-stacks/react.md';
  } else if (techStack.frontend === 'vue') {
    return 'tech-stacks/vuejs.md';
  } else if (techStack.frontend === 'angular') {
    return 'tech-stacks/angular.md';
  } else if (techStack.backend === 'fastapi') {
    return 'tech-stacks/python-fastapi.md';
  } else if (techStack.backend === 'express') {
    return 'tech-stacks/node-express.md';
  } else if (techStack.backend === 'django') {
    return 'tech-stacks/django.md';
  } else if (techStack.backend === 'spring') {
    return 'tech-stacks/spring-boot.md';
  } else if (techStack.backend === 'rails') {
    return 'tech-stacks/ruby-on-rails.md';
  }

  // Default to a generic template
  return 'generate.md';
}

function generateProjectStructure(techStack: ProjectConfig['techStack']): string {
  if (techStack.frontend === 'compose-multiplatform') {
    const platforms = techStack.platforms || ['android', 'ios', 'desktop'];
    const platformDirs = platforms
      .map((platform) => {
        const platformMap: Record<string, string> = {
          android: 'androidMain',
          ios: 'iosMain',
          desktop: 'desktopMain',
          js: 'jsMain',
          wasmJs: 'wasmJsMain',
        };
        return `│   ├── ${platformMap[platform] || `${platform}Main`}/  # ${platform.charAt(0).toUpperCase() + platform.slice(1)}-specific code`;
      })
      .join('\n');

    return `src/
├── commonMain/kotlin/         # Shared code across all platforms
│   ├── data/                  # Data layer (repositories, APIs)
│   ├── domain/                # Business logic and models  
│   ├── presentation/          # ViewModels and UI state
│   └── ui/                    # Compose UI components
${platformDirs}
├── commonTest/kotlin/         # Shared tests
├── build.gradle.kts           # Main build configuration
└── gradle.properties          # Gradle properties`;
  }

  if (techStack.frontend === 'nextjs') {
    return `src/
├── app/                   # Next.js App Router
│   ├── (routes)/          # Route groups
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Shared components
│   ├── ui/                # Base UI components
│   └── features/          # Feature components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities
└── types/                 # TypeScript types`;
  }

  if (techStack.backend === 'fastapi') {
    return `app/
├── api/                   # API endpoints
│   └── v1/                # API version 1
├── core/                  # Core configuration
├── db/                    # Database
├── models/                # SQLAlchemy models
├── schemas/               # Pydantic schemas
├── services/              # Business logic
└── tests/                 # Test files`;
  }

  if (techStack.backend === 'express') {
    return `src/
├── controllers/           # Route handlers
├── middleware/            # Express middleware
├── models/                # Data models
├── routes/                # Route definitions
├── services/              # Business logic
├── utils/                 # Utilities
├── app.ts                 # Express app
└── server.ts              # Server entry`;
  }

  if (techStack.frontend === 'react') {
    return `src/
├── components/            # React components
├── hooks/                 # Custom hooks
├── pages/                 # Page components
├── services/              # API services
├── store/                 # State management
├── styles/                # CSS/styling
├── utils/                 # Utilities
└── App.tsx                # Root component`;
  }

  // Default structure
  return `src/
├── components/
├── services/
├── utils/
└── tests/`;
}

function generateBasicClaudeMd(config: ProjectConfig): string {
  return `# ${config.projectName} - Claude Code Context

## Project Overview
${config.description}

## Context Engineering Setup
This project uses context engineering principles for efficient AI-assisted development.

### Key Files:
- \`/Docs/Implementation.md\` - Staged development plan
- \`/Docs/project_structure.md\` - Project organization
- \`/Docs/UI_UX_doc.md\` - Design specifications
- \`/Docs/Bug_tracking.md\` - Error tracking
${config.extras.prp ? `- \`/PRPs/\` - Product Requirement Prompts for detailed implementation` : ''}
${config.extras.aiDocs ? `- \`/ai_docs/\` - Curated documentation for AI context` : ''}

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)
Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible.

### YAGNI (You Aren't Gonna Need It)
Avoid building functionality on speculation. Implement features only when they are needed.

## Code Structure & Modularity

- **Never create a file longer than 500 lines of code**
- **Functions should be short and focused**
- **Components/Classes should have single responsibility**

## Development Workflow

### Before Starting Any Task
- Consult \`/Docs/Implementation.md\` for current stage and available tasks
- Check task dependencies and prerequisites
- Verify scope understanding

### Task Execution Protocol
1. Read task from Implementation.md
2. Check relevant documentation
3. Implement following existing patterns
4. Test thoroughly
5. Mark task complete only when fully working

### File Reference Priority
1. \`/Docs/Bug_tracking.md\` - Check for known issues first
2. \`/Docs/Implementation.md\` - Main task reference
3. \`/Docs/project_structure.md\` - Structure guidance
4. \`/Docs/UI_UX_doc.md\` - Design requirements
${config.extras.prp ? `5. \`/PRPs/\` - Detailed implementation prompts with validation loops` : ''}

## Tech Stack
${Object.entries(config.techStack)
  .filter(([_, value]) => value)
  .map(([key, value]) => `- **${key}**: ${value}`)
  .join('\n')}

## Testing Requirements
- Minimum 80% code coverage
- All features must have tests
- Test user behavior, not implementation details

## Security Guidelines
- Validate all user inputs
- Use environment variables for sensitive data
- Follow OWASP security best practices

## Pre-commit Checklist
- [ ] All tests passing
- [ ] Linting passes
- [ ] Type checking passes (if applicable)
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Security considerations addressed
`;
}

function registerHandlebarsHelpers() {
  // Helper for equality comparison
  Handlebars.registerHelper('eq', function (a: any, b: any) {
    return a === b;
  });

  // Helper for conditional rendering
  Handlebars.registerHelper(
    'if_eq',
    function (
      this: unknown,
      a: unknown,
      b: unknown,
      options: { fn: (context: unknown) => string; inverse: (context: unknown) => string }
    ) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    }
  );
}

# Homebridge Resideo Plugin

The Homebridge Resideo plugin is a TypeScript-based Homebridge plugin that integrates Resideo/Honeywell Home devices (thermostats, leak sensors, room sensors, valves) with Apple HomeKit. The plugin communicates with Resideo APIs using OAuth2 authentication and includes a web-based configuration UI.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Environment Setup
- Ensure Node.js 20+ or 22+ is installed (current requirement from package.json engines field)
- Use npm 10+ for package management

### Bootstrap and Build Process
- `npm install` -- installs all dependencies. Takes ~30 seconds. Some deprecation warnings are expected and safe to ignore.
- `npm run build` -- full build process. Takes ~5 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
  - Runs `npm run clean && tsc && npm run plugin-ui`
  - Cleans dist directory, compiles TypeScript, copies UI files
- `npm run clean` -- removes dist directory. Takes <1 second.

### Testing and Validation
- `npm test` -- runs linting only (not unit tests). Takes ~3 seconds.
- `npm run lint` -- runs ESLint on TypeScript files. Takes ~3 seconds.
- `npm run lint:fix` -- auto-fixes ESLint issues where possible.
- `npx vitest run` -- runs actual unit tests. Takes ~1 second. **NOTE**: Some tests currently fail due to pre-existing mocking issues in platform.test.ts and a rounding issue in utils.test.ts. These failures are unrelated to code changes and should be ignored.

### Documentation Generation
- `npm run docs` -- generates TypeDoc documentation. Takes ~6 seconds. Creates ./docs directory.
- `npm run lint-docs` -- validates documentation for errors.

### Development Workflow
- `npm run watch` -- development mode with nodemon for auto-rebuilding during development.
- Build output is in `dist/` directory and mirrors `src/` structure.
- The main plugin entry point is `dist/index.js` which exports the platform registration function.

## Validation Scenarios

After making changes to the codebase, always perform these validation steps:

### Build Validation
- Run `npm run build` to ensure TypeScript compilation succeeds.
- Verify that `dist/index.js` exists and can be loaded with: `node -e "const plugin = require('./dist/index.js'); console.log('Plugin loaded:', typeof plugin.default === 'function');"`

### Code Quality Validation  
- ALWAYS run `npm run lint` before committing changes or the CI will fail.
- Run `npm run lint:fix` to automatically fix style issues.
- Optionally run `npx vitest run` but ignore pre-existing test failures in platform.test.ts and utils.test.ts.

### Manual Testing Scenarios
Since this is a Homebridge plugin that requires real Resideo devices and API credentials:
- **Cannot fully test device functionality** without valid Resideo developer account and actual devices.
- **Cannot test OAuth flow** without proper Resideo API credentials.
- **Can test**: Plugin loading, configuration schema validation, and basic TypeScript compilation.
- **Plugin Architecture Validation**: The built plugin should export a default function that accepts an API parameter for Homebridge platform registration.

## Codebase Navigation

### Key Directories and Files
```
/src/
├── index.ts                 # Main plugin entry point - registers platform with Homebridge  
├── platform.ts             # ResideoPlatform class - core plugin logic, API communication
├── settings.ts              # Configuration interfaces, constants, and type definitions
├── utils.ts                 # Utility functions (temperature conversion, etc.)
├── devices/                 # Device-specific implementations
│   ├── device.ts           # Base device class with common functionality
│   ├── thermostats.ts      # Thermostat device implementation
│   ├── leaksensors.ts      # Leak sensor device implementation  
│   ├── roomsensors.ts      # Room sensor device implementation
│   ├── roomsensorthermostats.ts # Room sensor thermostat combo
│   └── valve.ts            # Valve device implementation
└── homebridge-ui/          # Web UI for plugin configuration
    ├── server.ts           # UI server for OAuth setup
    └── public/index.html   # UI frontend
```

### Configuration and Build Files
- `package.json` -- dependencies, scripts, and plugin metadata
- `tsconfig.json` -- TypeScript compilation settings
- `eslint.config.js` -- ESLint configuration using @antfu/eslint-config
- `config.schema.json` -- Homebridge configuration UI schema
- `.github/workflows/build.yml` -- CI/CD pipeline

### Key Code Patterns
- **Platform Registration**: `src/index.ts` exports default function that calls `api.registerPlatform()`
- **Device Discovery**: `platform.ts` contains `discoverlocations()` and device creation methods
- **API Communication**: Uses axios with interceptors for OAuth2 authentication to Resideo APIs
- **Device Classes**: All inherit from base `device.ts` class with common logging and status methods
- **Configuration**: TypeScript interfaces in `settings.ts` define all config structure

## Common Tasks

### Adding New Device Types
1. Create new device class in `src/devices/` extending base Device class
2. Add device-specific interfaces to `settings.ts` 
3. Update `platform.ts` device discovery logic
4. Add device creation method in platform.ts
5. Update configuration schema in `config.schema.json`

### Modifying API Communication
- API endpoints and authentication logic are in `platform.ts`
- OAuth2 configuration and token management handled in platform constructor
- Resideo API URLs defined as constants in `settings.ts`

### Configuration Changes
- Update interfaces in `settings.ts` for new config options
- Modify `config.schema.json` for UI schema changes
- Update platform config validation in `platform.ts` `verifyConfig()` method

### Debugging and Logging
- All device classes inherit logging methods from base Device class
- Platform logging controlled by config options
- Use `this.debugLog()`, `this.infoLog()`, `this.warnLog()`, `this.errorLog()` in device classes
- Platform-level logging available via platform instance methods

## Troubleshooting

### Build Issues
- **TypeScript errors**: Check `tsconfig.json` settings and ensure all imports use `.js` extensions for ES modules
- **Missing dist files**: Run `npm run clean && npm run build` to regenerate
- **Plugin UI missing**: Ensure `npm run plugin-ui` completes successfully

### Test Failures
- **Platform tests failing**: Known issue with axios mocking in platform.test.ts - ignore these failures
- **Utils test failures**: Known rounding issue in temperature conversion - ignore this failure  
- **New test failures**: Only address test failures directly related to your changes

### Runtime Issues
- **Plugin not loading**: Verify `dist/index.js` exists and exports default function
- **API authentication**: Check that OAuth2 credentials are properly configured
- **Device discovery**: Ensure Resideo API endpoints in `settings.ts` are correct

### Common npm Commands Reference
```bash
npm install              # Install dependencies (~30 seconds)
npm run build           # Full build (~5 seconds, timeout 60+ seconds)
npm run clean           # Clean dist directory (<1 second)  
npm test                # Run linting (~3 seconds)
npm run lint            # ESLint only (~3 seconds)
npm run lint:fix        # Auto-fix ESLint issues
npm run docs            # Generate documentation (~6 seconds)
npx vitest run          # Run unit tests (~1 second, has known failures)
npm run watch           # Development mode with auto-rebuild
```

## Critical Reminders
- **NEVER CANCEL** any build commands - let them complete fully
- **ALWAYS** run `npm run lint` before pushing changes to avoid CI failures
- **DO NOT** attempt to fix pre-existing test failures unrelated to your changes
- **VALIDATE** that your changes can be built and the plugin can be loaded
- Use `.js` extensions in TypeScript imports for ES module compatibility
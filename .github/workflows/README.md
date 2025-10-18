# 🤖 Dynamic CI/CD System

This repository uses an **intelligent, self-updating CI/CD system** that automatically adapts to your codebase changes.

## 🎯 How It Works

The GitHub Actions workflow automatically detects and runs checks based on:

1. **Configuration files present** in your repository
2. **Scripts defined** in `package.json`
3. **Test files** that exist in your codebase

### Auto-Detection Features

#### TypeScript Checks
- **Detects:** `tsconfig.json`
- **Runs:** `npm run type-check`
- **When:** Automatically enabled when TypeScript config exists

#### Linting
- **Detects:** `.eslintrc*` files
- **Runs:** `npm run lint`
- **When:** Automatically enabled when ESLint config exists

#### Code Formatting
- **Detects:** `.prettierrc*` or `prettier.config.*`
- **Runs:** `npx prettier --check .`
- **When:** Automatically enabled when Prettier config exists

#### Code Duplication
- **Detects:** `.jscpd.json` or `check-duplication` script
- **Runs:** `npm run check-duplication`
- **When:** Automatically enabled when config exists

#### Testing
- **Detects:** `*.test.*`, `*.spec.*` files or test configs
- **Runs:** `npm test`
- **When:** Automatically enabled when test files exist

#### Test Coverage
- **Detects:** Test files exist
- **Runs:** `npm run test:coverage`
- **When:** Automatically enabled when tests exist
- **Uploads:** Coverage to Codecov

#### Security Audit
- **Always runs:** `npm audit --audit-level=moderate`
- **Checks:** Dependencies for known vulnerabilities

#### CSS/SCSS Linting
- **Detects:** `.stylelintrc*` or `stylelint.config.*`
- **Runs:** `npx stylelint "**/*.{css,scss,sass}"`
- **When:** Automatically enabled when Stylelint config exists

## 🚀 Adding New Checks

### Method 1: Add npm Scripts

Simply add scripts to `package.json` following these naming patterns:

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",           // Auto-detected ✅
    "lint": "eslint .",                     // Auto-detected ✅
    "format": "prettier --check .",         // Auto-detected ✅
    "test": "vitest run",                   // Auto-detected ✅
    "validate": "custom validation",        // Auto-detected ✅
    "check": "custom checks",               // Auto-detected ✅
    "check-duplication": "jscpd src"        // Auto-detected ✅
  }
}
```

**Patterns detected:**
- `type-check` or `typecheck`
- `lint` (but not `lint:fix` or `lint:watch`)
- `format` (but not `format:fix`)
- `test` (but not `test:watch` or `test:coverage`)
- `validate`
- `check`
- `audit`

### Method 2: Add Configuration Files

Add config files and the checks will automatically enable:

```bash
# Add Prettier
echo '{}' > .prettierrc

# Add Stylelint  
echo '{}' > .stylelintrc.json

# Checks will automatically run on next push!
```

### Method 3: Use the Dynamic Check Runner

The workflow includes a smart script that discovers all check scripts:

```bash
# Run locally
node .github/scripts/run-available-checks.js

# It will:
# 1. Scan package.json for check scripts
# 2. Run them in priority order
# 3. Report pass/fail status
```

## 📋 Workflow Jobs

### Job 1: `code-quality`
Runs core quality checks in sequence:
1. TypeScript compilation
2. Linting
3. Code formatting
4. Duplication detection
5. Tests
6. Security audit
7. Build

### Job 2: `test-coverage`
Only runs if tests exist:
1. Runs tests with coverage
2. Uploads coverage to Codecov

### Job 3: `custom-checks`
Runs optional checks:
1. Custom validate/check scripts
2. CSS/SCSS linting
3. Accessibility checks

## 🎮 Examples

### Example 1: Adding ESLint
```bash
# Install ESLint
npm install --save-dev eslint

# Create config
npx eslint --init

# Add script to package.json
npm pkg set scripts.lint="eslint ."

# Push - linting now runs automatically! ✅
git add .eslintrc.* package.json
git commit -m "Add ESLint"
git push
```

### Example 2: Adding Prettier
```bash
# Install Prettier
npm install --save-dev prettier

# Create config
echo '{"semi": true}' > .prettierrc

# Add script
npm pkg set scripts.format="prettier --check ."

# Push - formatting checks now run automatically! ✅
git add .prettierrc package.json
git commit -m "Add Prettier"
git push
```

### Example 3: Adding Custom Validation
```bash
# Add custom script to package.json
npm pkg set scripts.validate="node scripts/custom-validate.js"

# Create the script
mkdir scripts
cat > scripts/custom-validate.js << 'EOF'
console.log('Running custom validation...');
// Your custom checks here
process.exit(0);
EOF

# Push - custom validation now runs automatically! ✅
git add package.json scripts/
git commit -m "Add custom validation"
git push
```

## 🔧 Configuration

### Making Checks Required (Fail Build)

By default, some checks have `continue-on-error: true`. To make them required:

Edit `.github/workflows/ci.yml` and remove `continue-on-error: true` from the step.

### Changing Node Version

Edit `.github/workflows/ci.yml`:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Change this
```

### Adding Branch Protection

1. Go to GitHub → Settings → Branches
2. Add rule for `main` branch
3. Enable "Require status checks to pass"
4. Select: `code-quality`, `test-coverage`, `custom-checks`

## 📊 Monitoring

### View Check Results
- **GitHub Actions tab**: See all workflow runs
- **PR Checks**: See checks on pull requests
- **Commit Status**: See checks on individual commits

### Coverage Reports
- **Codecov**: View at codecov.io/gh/YOUR_USERNAME/gemini-tedai
- **PR Comments**: Codecov bot comments on PRs

## 🐛 Troubleshooting

### "No package-lock.json found"
**Solution:** Generate it:
```bash
npm install
git add package-lock.json
git commit -m "Add package-lock.json"
```

### "Script not found"
**Solution:** Check script exists in package.json:
```bash
npm run <script-name>  # Test locally first
```

### "Check didn't run"
**Solution:** Verify detection patterns:
- Check if config file exists
- Check if script name matches pattern
- Review workflow logs for `if` condition results

## 🎯 Best Practices

1. **Test locally first**: Run `npm test`, `npm run lint`, etc. before pushing
2. **Use the dynamic runner**: Run `.github/scripts/run-available-checks.js` to test all checks
3. **Keep package.json clean**: Remove unused scripts
4. **Update configs**: Keep ESLint, Prettier configs up to date
5. **Monitor failures**: Fix failing checks quickly

## 🚦 Current Status

To see what checks are currently enabled:

```bash
# View current package.json scripts
npm run

# View config files
ls -la | grep -E "\.(eslintrc|prettierrc|jscpd)"

# Test what would run
node .github/scripts/run-available-checks.js
```

---

**Last Updated:** 2025-10-18  
**Workflow Version:** 2.0 (Dynamic Auto-Detection)

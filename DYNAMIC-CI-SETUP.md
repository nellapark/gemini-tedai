# 🤖 Dynamic CI/CD System - Setup Complete

## ✅ What Was Created

Your GitHub Actions workflow is now **intelligent and self-updating**. Here's what's been set up:

### 1. **Smart GitHub Actions Workflow** (`.github/workflows/ci.yml`)

The workflow now uses **conditional execution** based on what exists in your codebase:

```yaml
# ✅ Only runs TypeScript checks if tsconfig.json exists
- name: Check TypeScript compilation
  if: hashFiles('tsconfig.json') != ''
  run: npm run type-check

# ✅ Only runs tests if test files exist  
- name: Run tests
  if: hashFiles('**/*.test.*', '**/*.spec.*') != ''
  run: npm test
```

**This means:** When you add new tools or configs, the checks automatically enable!

### 2. **Dynamic Check Runner** (`.github/scripts/run-available-checks.js`)

A Node.js script that:
- 📋 Scans `package.json` for quality check scripts
- 🔍 Auto-detects scripts matching patterns: `lint`, `test`, `type-check`, etc.
- ▶️ Runs them in priority order
- 📊 Reports pass/fail summary

**Usage:**
```bash
node .github/scripts/run-available-checks.js
```

### 3. **Pre-commit Hook** (`.github/scripts/pre-commit-checks.sh`)

Runs the same checks locally before you commit:

**Install it:**
```bash
ln -s ../../.github/scripts/pre-commit-checks.sh .git/hooks/pre-commit
```

**Now:** Every commit runs quality checks automatically!

### 4. **Comprehensive Documentation** (`.github/workflows/README.md`)

Complete guide on:
- How auto-detection works
- How to add new checks
- Examples and troubleshooting
- Best practices

---

## 🎯 How It Adapts Automatically

### Scenario 1: You Add Prettier

```bash
npm install --save-dev prettier
echo '{"semi": true}' > .prettierrc
git add .prettierrc package.json
git push
```

**Result:** ✅ Prettier checks **automatically run** on next push!

### Scenario 2: You Add New Tests

```bash
# Create a new test file
touch src/components/NewComponent.test.tsx
git add src/components/NewComponent.test.tsx
git push
```

**Result:** ✅ Tests **automatically run** on next push!

### Scenario 3: You Add ESLint Rule

```bash
# Edit .eslintrc.cjs to add new rules
vim .eslintrc.cjs
git add .eslintrc.cjs
git push
```

**Result:** ✅ New rules **automatically enforced** on next push!

### Scenario 4: You Add Custom Check

```bash
# Add to package.json
npm pkg set scripts.validate="node scripts/validate.js"
git add package.json
git push
```

**Result:** ✅ Custom validation **automatically runs** on next push!

---

## 🔄 Current Workflow Behavior

When you push to `main`, `master`, or `develop`:

### Job 1: Code Quality ⚙️
- ✅ **TypeScript** (if `tsconfig.json` exists)
- ✅ **ESLint** (if `.eslintrc*` exists)
- ✅ **Prettier** (if `.prettierrc*` exists)
- ✅ **Code Duplication** (if `.jscpd.json` exists)
- ✅ **Tests** (if `*.test.*` files exist)
- ✅ **Security Audit** (always runs)
- ✅ **Build** (always runs)

### Job 2: Test Coverage 📊
- ✅ **Coverage Report** (if tests exist)
- ✅ **Codecov Upload** (if tests exist)

### Job 3: Custom Checks 🎨
- ✅ **Stylelint** (if `.stylelintrc*` exists)
- ✅ **Custom Scripts** (if `validate`/`check` scripts exist)
- ✅ **Accessibility** (if `@axe-core` installed)

---

## 📋 Auto-Detection Patterns

| What Gets Detected | How It's Detected | What Runs |
|-------------------|-------------------|-----------|
| TypeScript | `tsconfig.json` exists | `npm run type-check` |
| ESLint | `.eslintrc*` exists | `npm run lint` |
| Prettier | `.prettierrc*` exists | `npx prettier --check .` |
| Vitest/Jest | `*.test.*` or `*.spec.*` files | `npm test` |
| Code Duplication | `.jscpd.json` exists | `npm run check-duplication` |
| Stylelint | `.stylelintrc*` exists | `npx stylelint "**/*.css"` |
| Custom Validation | `validate` script in package.json | `npm run validate` |
| Custom Checks | `check` script in package.json | `npm run check` |

---

## 🚀 Quick Start Guide

### Test Locally

```bash
# Test all checks
node .github/scripts/run-available-checks.js

# Test specific check
npm run type-check
npm run lint
npm test
npm run build
```

### Install Pre-commit Hook

```bash
ln -s ../../.github/scripts/pre-commit-checks.sh .git/hooks/pre-commit
```

Now checks run automatically before each commit!

### Add a New Check

**Option 1: Add npm script**
```bash
npm pkg set scripts.security="npm audit"
```

**Option 2: Add config file**
```bash
echo '{}' > .prettierrc
```

**Option 3: Create test file**
```bash
touch src/MyComponent.test.tsx
```

Then just push - it runs automatically! 🎉

---

## 🎨 Customization Examples

### Make Linting Fail the Build

Edit `.github/workflows/ci.yml`:

```yaml
- name: Run linter
  if: hashFiles('.eslintrc*') != ''
  run: npm run lint
  # Remove this line to make it fail:
  # continue-on-error: true
```

### Add Security Scanning

```bash
npm install --save-dev snyk
npm pkg set scripts.security="snyk test"
```

The `security` script will auto-run!

### Add Bundle Size Check

```bash
npm install --save-dev bundlesize
npm pkg set scripts.check-size="bundlesize"
```

The `check-size` script will auto-run!

---

## 📊 Monitoring & Debugging

### View Workflow Runs

1. Go to your GitHub repo
2. Click **Actions** tab
3. See all workflow runs with pass/fail status

### Debug Failed Checks

```bash
# Check what workflow detected
grep "if: hashFiles" .github/workflows/ci.yml

# Test locally first
node .github/scripts/run-available-checks.js

# Check individual scripts
npm run lint
npm run test
npm run type-check
```

### See What Will Run

```bash
# List all npm scripts
npm run

# Check for config files
ls -la | grep -E "\.(eslintrc|prettierrc|stylelintrc|jscpd)"

# Check for test files
find src -name "*.test.*" -o -name "*.spec.*"
```

---

## 🔧 Advanced Configuration

### Run on All Branches

Edit `.github/workflows/ci.yml`:

```yaml
on:
  push:
    branches: [ '**' ]  # All branches
  pull_request:
    branches: [ '**' ]  # All PRs
```

### Add Branch Protection

1. GitHub → Settings → Branches
2. Add rule for `main`
3. Enable: **Require status checks to pass before merging**
4. Select: `code-quality`, `test-coverage`

### Add Slack Notifications

Add to workflow:

```yaml
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 🎯 Benefits of This Setup

✅ **Zero Maintenance** - New checks auto-enable  
✅ **Always Up-to-Date** - Runs latest configs/rules  
✅ **Flexible** - Add/remove checks easily  
✅ **Consistent** - Same checks locally and in CI  
✅ **Fast** - Only runs what's configured  
✅ **Smart** - Skips checks that don't apply  
✅ **Discoverable** - Easy to see what's running  
✅ **Extensible** - Add custom checks anytime  

---

## 📝 What to Commit

You should now commit these files:

```bash
git add .github/workflows/ci.yml
git add .github/workflows/README.md
git add .github/scripts/run-available-checks.js
git add .github/scripts/pre-commit-checks.sh
git add DYNAMIC-CI-SETUP.md
git add .gitignore
git commit -m "feat: Add dynamic CI/CD system with auto-detection"
git push
```

---

## 🐛 Troubleshooting

### Issue: "npm install takes too long in CI"

**Solution:** Generate and commit `package-lock.json`:

```bash
npm install
git add package-lock.json
git commit -m "Add package-lock.json for faster CI"
```

Then restore caching in workflow:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'  # Add this back
```

And change back to `npm ci`:

```yaml
- name: Install dependencies
  run: npm ci  # Faster with lock file
```

### Issue: "Check didn't run even though I added it"

**Debug:**

```bash
# Check if pattern matches
grep -E "^(lint|test|check|validate)" package.json

# Check if config exists
ls -la .eslintrc* .prettierrc* .stylelintrc*

# Test workflow conditions locally
# (hashFiles returns empty string if no match)
```

### Issue: "Pre-commit hook not working"

**Solution:**

```bash
# Make sure it's executable
chmod +x .github/scripts/pre-commit-checks.sh

# Reinstall the hook
rm .git/hooks/pre-commit
ln -s ../../.github/scripts/pre-commit-checks.sh .git/hooks/pre-commit
```

---

## 📚 Learn More

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Conditional Execution](https://docs.github.com/en/actions/reference/context-and-expression-syntax-for-github-actions)

---

**🎉 You're all set! Your CI/CD now automatically adapts to your codebase.**

Happy coding! 🚀

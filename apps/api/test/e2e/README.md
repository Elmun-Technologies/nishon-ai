# E2E Test Suite for Performa Marketplace API

Comprehensive end-to-end tests for the Performa Marketplace API endpoints covering all functionality before production deployment.

## Quick Start

### Running All E2E Tests

```bash
npm run test:e2e
```

### Running Specific Test Suite

```bash
# Test marketplace endpoints only
npm run test:e2e -- marketplace

# Test with coverage report
npm run test:e2e -- --coverage

# Run tests in watch mode
npm run test:e2e -- --watch

# Run tests with verbose output
npm run test:e2e -- --verbose
```

### Running Specific Test

```bash
# Run a single test by name
npm run test:e2e -- -t "should return specialists with default pagination"

# Run all tests in a describe block
npm run test:e2e -- -t "Public Search Endpoints"
```

## Test Structure

The test suite is organized into 10 comprehensive suites covering all aspects of the marketplace API:

### A. Public Search Endpoints (19 tests)
Tests for discovering and filtering specialists without authentication.

- `GET /marketplace/specialists` - Search, filter, and paginate specialists
- `GET /marketplace/filters` - Get available filter options

**Coverage:**
- Text search, platform filters, niche filters, certifications, languages, countries
- Rating, experience, ROAS filters
- Sorting (by rating, ROAS, experience, price, trending)
- Pagination with limits and validation
- Filter combinations
- Empty results handling

### B. Specialist Detail Endpoints (9 tests)
Tests for retrieving specialist profiles and performance data.

- `GET /specialists/:slug` - Get full public specialist profile
- `GET /specialists/:slug/performance` - Get performance metrics and charts

**Coverage:**
- Profile completeness (certifications, case studies, stats, ratings)
- Performance periods (1m, 3m, 6m, 12m, all)
- Platform-specific filtering (Meta, Google, Yandex)
- Caching and performance optimization
- 404 error handling
- Invalid parameter rejection

### C. Authentication Tests (7 tests)
Tests for JWT token validation and workspace isolation.

**Coverage:**
- Token requirement validation
- Valid token acceptance
- Expired token rejection
- Malformed token rejection
- Invalid signature detection
- Workspace isolation (users can't access other workspace data)
- Cross-workspace access prevention

### D. Admin Sync Endpoints (10 tests)
Tests for manual synchronization of performance data from advertising platforms.

- `POST /admin/specialists/:id/sync-performance` - Trigger sync for Meta/Google/Yandex

**Coverage:**
- Meta platform sync
- Google platform sync
- Yandex platform sync
- Force refresh flag
- Error handling (404, 400 for no account)
- Admin role verification
- Response structure (synced count, nextSync date)
- Sync status logging
- Connection error handling

### E. Admin Verification Endpoints (7 tests)
Tests for verifying performance data and fraud detection.

- `POST /admin/specialists/:id/verify-performance` - Verify performance data

**Coverage:**
- Approval and rejection workflows
- Dry-run mode (no data persisted)
- Fraud risk assessment
- Fraud risk levels (low, medium, high)
- Input validation
- Admin role verification
- Error handling

### F. Sync Status Endpoints (7 tests)
Tests for monitoring performance sync status.

- `GET /admin/specialists/sync-status` - Get recent sync logs

**Coverage:**
- Status filtering (pending, in_progress, completed, failed)
- Limit parameter
- Result structure (specialist name, platform, timestamps)
- Admin role verification
- Invalid status rejection

### G. Error Handling (9 tests)
Tests for proper error responses and HTTP status codes.

**Coverage:**
- HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Error message quality and usefulness
- No sensitive data exposure
- Transaction rollback on error
- Validation error messages

### H. Fraud Detection & Security (6 tests)
Tests for fraud detection algorithms and data validation.

**Coverage:**
- Suspicious ROAS flagging
- Impossible metrics detection (CPA > Revenue)
- Missing metrics assessment
- Fraud risk scoring
- Negative value prevention
- HTML injection prevention

### I. Pagination & Cursor Handling (5 tests)
Tests for pagination robustness.

**Coverage:**
- Page count calculation
- Last page handling
- Out-of-range page requests
- Sort order consistency across pages

### J. Timezone Handling (2 tests)
Tests for UTC timezone consistency.

**Coverage:**
- UTC date storage and retrieval
- Sync scheduling in UTC
- ISO 8601 format validation

## Test Data Setup

### Creating Test Data

The test suite uses fixtures to create isolated test data for each test:

```typescript
// Automatically created before each test
testWorkspace    // Test workspace
testUser         // Test user in workspace
testSpecialist   // Test specialist profile
authToken        // Valid JWT token
expiredToken     // Expired JWT token (for testing rejection)
```

### Fixtures API

The `MarketplaceFixtures` class provides helper methods:

```typescript
// Create test entities
const workspace = await fixtures.createTestWorkspace();
const user = await fixtures.createTestUser(workspaceId);
const specialist = await fixtures.createTestSpecialist(ownerId);
const account = await fixtures.createTestConnectedAccount(specialistId, "meta");
const caseStudy = await fixtures.createTestCaseStudy(specialistId);

// Generate tokens
const token = fixtures.generateAuthToken(userId, workspaceId);
const expiredToken = fixtures.generateExpiredToken(userId, workspaceId);

// Mock data generators
const timeline = fixtures.createMockPerformanceTimeline(90); // 90 days
const metrics = fixtures.createMockPlatformMetrics();
```

### Test Isolation

Each test runs in an isolated transaction:

```
beforeEach()  → Start transaction
  → Create test data
  → Run test
afterEach()   → Rollback transaction
```

This ensures:
- No data leakage between tests
- Clean state for each test
- Fast cleanup (rollback vs delete)
- Database constraints are validated

## Test Coverage

### Current Coverage Goals

- **Overall:** 80%+ code coverage
- **Modules:** Controllers, Services, Middleware
- **Excluded:** Entity files, DTOs, Configuration

### Generating Coverage Reports

```bash
npm run test:e2e -- --coverage
```

Coverage report: `coverage/e2e/index.html`

### Coverage by Suite

| Suite | Tests | Coverage Target |
|-------|-------|-----------------|
| Public Search | 19 | 95% |
| Specialist Detail | 9 | 90% |
| Authentication | 7 | 100% |
| Admin Sync | 10 | 85% |
| Admin Verification | 7 | 85% |
| Sync Status | 7 | 85% |
| Error Handling | 9 | 90% |
| Fraud Detection | 6 | 80% |
| Pagination | 5 | 90% |
| Timezone | 2 | 80% |

## Configuration

### Jest Configuration

File: `test/jest-e2e.json`

```json
{
  "testTimeout": 30000,      // 30 seconds per test
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$"
}
```

### Database Configuration

Tests use your configured test database:

```bash
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=performa
DATABASE_PASSWORD=performa_secret
DATABASE_NAME=performa_ai_test_db
```

### Environment Variables

```bash
# Use test env
NODE_ENV=test

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/test_db

# JWT
JWT_SECRET=test_secret_key
JWT_EXPIRATION=1h

# API
API_URL=http://localhost:3000
```

## Debugging Tests

### Running Tests with Logging

```bash
npm run test:e2e -- --verbose
```

### Running Single Test

```bash
npm run test:e2e -- -t "should return specialists with default pagination"
```

### Node Debugger

```bash
node --inspect-brk -r tsconfig-paths/register -r ts-node/register \
  node_modules/.bin/jest --runInBand --config ./test/jest-e2e.json
```

Then open `chrome://inspect` in Chrome DevTools.

### VS Code Debugger

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest E2E",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--config", "./test/jest-e2e.json", "--runInBand"],
  "console": "integratedTerminal"
}
```

### Adding Custom Logging

```typescript
// In test
it("should do something", async () => {
  console.log("Test data:", { specialist, authToken });
  const response = await request(app.getHttpServer()).get("/...");
  console.log("Response:", response.body);
});
```

## Adding New Tests

### Test Template

```typescript
describe("New Test Suite", () => {
  let app: INestApplication;
  let fixtures: MarketplaceFixtures;

  beforeAll(async () => {
    // Setup
  });

  beforeEach(async () => {
    // Create test data
  });

  afterEach(async () => {
    // Cleanup (automatic with transaction rollback)
  });

  it("should test something", async () => {
    const response = await request(app.getHttpServer())
      .get("/endpoint")
      .expect(200);

    expect(response.body).toHaveProperty("expectedField");
  });
});
```

### Naming Conventions

- **Describe blocks:** Use clear, descriptive names
  - `"GET /endpoint - Description"`
  - `"Happy path scenarios"`
  - `"Error cases"`

- **Test cases:** Use "should" statements
  - `"should return 200 on success"`
  - `"should reject invalid input"`
  - `"should handle edge cases"`

### Best Practices

1. **One assertion focus:** Each test should focus on one behavior
2. **Clear test data:** Use descriptive factory methods
3. **Expect readability:** Use descriptive matchers
4. **No side effects:** Tests shouldn't depend on execution order
5. **Fast execution:** Mock external APIs, use factories not DB queries
6. **Isolate concerns:** Test endpoint, not entire flow if possible

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/test.yml`:

```yaml
- name: Run E2E Tests
  run: npm run test:e2e
  env:
    DATABASE_URL: postgresql://user:pass@localhost/test_db
```

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
npm run test:e2e -- --bail
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check database is running
psql -h localhost -U performa -d performa_ai_test_db -c "SELECT 1"

# Check migrations are run
npm run migration:run
```

### Timeout Errors

```bash
# Increase timeout in jest-e2e.json
{
  "testTimeout": 60000  // 60 seconds
}
```

### Transaction Conflicts

If tests fail with transaction errors:

1. Check for long-running tests
2. Verify query runner is released
3. Review async/await patterns

## Performance Tips

### Optimize Test Speed

1. **Parallel execution:** Jest runs tests in parallel by default
   ```bash
   npm run test:e2e -- --maxWorkers=4
   ```

2. **Selective testing:** Run only affected tests
   ```bash
   npm run test:e2e -- --onlyChanged
   ```

3. **Mock external calls:** Don't call real APIs
   ```typescript
   jest.mock("@nestjs/axios");
   ```

4. **Batch test data:** Create shared fixtures in beforeAll
   ```typescript
   beforeAll(async () => {
     sharedWorkspace = await fixtures.createTestWorkspace();
   });
   ```

## Test Scenarios Covered

### Happy Path (Positive Tests)
- ✅ Complete search workflow with all filters
- ✅ Specialist profile creation, update, retrieval
- ✅ Performance data sync and retrieval
- ✅ Admin verification workflow
- ✅ JWT authentication and authorization

### Error Cases (Negative Tests)
- ✅ Invalid input validation
- ✅ Authorization failures
- ✅ Resource not found
- ✅ Duplicate creation prevention
- ✅ Workspace isolation

### Edge Cases
- ✅ Empty result sets
- ✅ Maximum pagination limits
- ✅ Zero metrics
- ✅ Missing optional fields
- ✅ Concurrent requests

### Security Tests
- ✅ SQL injection prevention
- ✅ XSS prevention
- ✅ CSRF protection
- ✅ Token expiration
- ✅ Role-based access control

## Health Check

Before running tests, verify system is ready:

```bash
# Check app starts
npm run start:dev &

# Wait for server
sleep 5

# Health check
curl http://localhost:3000/health

# Run tests
npm run test:e2e
```

## Support & Maintenance

### Updating Tests

When API changes:

1. Update endpoint paths in tests
2. Update request/response structures
3. Update expected status codes
4. Run tests to verify

### Adding New Endpoints

1. Create test suite following template
2. Add to this README's test structure section
3. Ensure 80%+ coverage target
4. Add to CI/CD pipeline

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Tests timeout | Increase `testTimeout` in jest-e2e.json |
| DB locked | Check for long-running tests, increase timeout |
| Port in use | Change API port, kill existing process |
| Memory issues | Reduce `maxWorkers`, increase heap size |

## Related Documentation

- [API Documentation](../../docs/API.md)
- [Database Schema](../../docs/DATABASE.md)
- [Authentication Guide](../../docs/AUTH.md)
- [Deployment Guide](../../docs/DEPLOYMENT.md)

## License

UNLICENSED - Performa Internal Use Only

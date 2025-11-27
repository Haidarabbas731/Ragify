# Phase 14: Monitoring & Observability

**Priority:** High (before production)
**Estimated Time:** 2-3 days
**Dependencies:** Phase 9 (Deployment)
**PRD Reference:** Section 21.3 (Monitoring & Observability), Section 17 (Success Metrics)

---

## ⚠️ IMPORTANT GIT RULES (READ FIRST)

**PRD Reference:** Section 11.8 (Development Workflow & Git Strategy)

### Mandatory Git Workflow:
1. ✅ **ALWAYS** work on `dev` branch (not `main`)
2. ✅ **ALWAYS** run tests before committing (`pytest`)
3. ✅ **ALWAYS** run linting before committing (`ruff check .`)
4. ✅ **ALWAYS** keep commits local (`git commit`)
5. ❌ **NEVER** push to remote unless explicitly requested
6. ❌ **NEVER** commit directly to `main` branch
7. ❌ **NEVER** skip tests before committing

### Commit Message Format:
```
<type>(<scope>): <description>

Types: feat, fix, test, docs, refactor, chore
Example: feat(monitoring): add Prometheus metrics endpoint
```

### Code Style & Documentation:
- ❌ **DO NOT** add PRD references in code comments
- ❌ **DO NOT** add unnecessary comments
- ✅ **Document all functions** with docstrings (purpose, args, returns, raises)
- ✅ **Use type hints** for all function signatures
- ✅ **Follow consistent patterns** across all files
- ✅ Write clean, self-documenting code with descriptive names

**Note:** PRD references in this file are for verification only, NOT for code comments.

---

## 14.1 Metrics Collection

**PRD Reference:** Section 21.3 (Monitoring & Observability - Metrics to track)

### Application Metrics

**File:** `backend/app/core/metrics.py` (NEW)

- [ ] Create metrics collection module
- [ ] Add Prometheus client library (`prometheus-client`)
- [ ] Define application-wide metrics
- [ ] Add metrics middleware to FastAPI
- [ ] Expose `/metrics` endpoint for Prometheus scraping

**Key Metrics to Track:**

#### Request Metrics
- [ ] Request latency (p50, p95, p99) by endpoint
- [ ] Request count by endpoint, method, status code
- [ ] Active request count (in-flight requests)
- [ ] Request size (bytes)
- [ ] Response size (bytes)

#### Error Metrics
- [ ] Error rate by endpoint (4xx, 5xx)
- [ ] Error count by type (validation, authentication, server)
- [ ] Exception count by exception type
- [ ] HTTP status code distribution

#### Vector Search Metrics
- [ ] Search query latency (p50, p95, p99)
- [ ] Search result count distribution
- [ ] Search relevance scores
- [ ] Search cache hit rate

#### Document Processing Metrics
- [ ] Document upload count
- [ ] Document processing time by file type
- [ ] Document processing queue depth (arq)
- [ ] Document processing success/failure rate
- [ ] Chunk generation count and size

#### Storage Metrics
- [ ] Storage usage per user
- [ ] Storage usage total (aggregated)
- [ ] Storage quota utilization percentage
- [ ] Upload size distribution

#### Authentication Metrics
- [ ] Login success/failure count
- [ ] Token refresh count
- [ ] Active session count
- [ ] Failed authentication attempts by IP

### Implementation Example

**File:** `backend/app/core/metrics.py`

```python
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry
import time
from functools import wraps

# Create registry
registry = CollectorRegistry()

# Request metrics
http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
    registry=registry
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency",
    ["method", "endpoint"],
    registry=registry
)

# Document processing metrics
document_processing_duration_seconds = Histogram(
    "document_processing_duration_seconds",
    "Document processing time",
    ["file_type"],
    registry=registry
)

document_processing_total = Counter(
    "document_processing_total",
    "Total documents processed",
    ["status"],  # success, failed
    registry=registry
)

# Vector search metrics
vector_search_duration_seconds = Histogram(
    "vector_search_duration_seconds",
    "Vector search query latency",
    registry=registry
)

vector_search_results_count = Histogram(
    "vector_search_results_count",
    "Number of search results returned",
    registry=registry
)

# Storage metrics
storage_usage_bytes = Gauge(
    "storage_usage_bytes",
    "Storage usage per user",
    ["user_id"],
    registry=registry
)

# Queue metrics
arq_queue_depth = Gauge(
    "arq_queue_depth",
    "Number of jobs in arq queue",
    ["queue_name"],
    registry=registry
)


def track_request_metrics(endpoint: str):
    """
    Decorator to track request metrics.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            status = "success"
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status = "error"
                raise
            finally:
                duration = time.time() - start_time
                http_request_duration_seconds.labels(
                    method="POST", endpoint=endpoint
                ).observe(duration)
                http_requests_total.labels(
                    method="POST", endpoint=endpoint, status=status
                ).inc()
        return wrapper
    return decorator
```

### Tasks to Implement

- [ ] Create `metrics.py` module
- [ ] Add `prometheus-client` to dependencies
- [ ] Define all metrics (Counter, Histogram, Gauge)
- [ ] Create metrics decorator for endpoints
- [ ] Add `/metrics` endpoint to FastAPI
- [ ] Test metrics collection locally

---

## 14.2 Metrics Middleware

**File:** `backend/app/middleware/metrics_middleware.py` (NEW)

- [ ] Create metrics middleware for FastAPI
- [ ] Capture request/response metadata automatically
- [ ] Track request duration
- [ ] Track status codes
- [ ] Track endpoint paths
- [ ] Add request ID to metrics labels

**Middleware Implementation:**

```python
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import time
from app.core.metrics import (
    http_requests_total,
    http_request_duration_seconds
)

class MetricsMiddleware(BaseHTTPMiddleware):
    """
    Middleware to collect HTTP request metrics.
    """

    async def dispatch(self, request: Request, call_next):
        """
        Track request metrics for all endpoints.
        """
        start_time = time.time()
        method = request.method
        path = request.url.path

        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            status_code = 500
            raise
        finally:
            duration = time.time() - start_time

            # Record metrics
            http_requests_total.labels(
                method=method,
                endpoint=path,
                status=str(status_code)
            ).inc()

            http_request_duration_seconds.labels(
                method=method,
                endpoint=path
            ).observe(duration)

        return response
```

- [ ] Create `metrics_middleware.py`
- [ ] Add middleware to FastAPI app in `main.py`
- [ ] Test middleware with sample requests
- [ ] Verify metrics appear in `/metrics` endpoint

---

## 14.3 Logging Strategy

**PRD Reference:** Section 11.5 (Structured Logging), Section 21.3 (Log aggregation)

### Structured Logging Enhancement

**File:** `backend/app/core/logging.py`

- [x] Verify logging configuration exists (created in Phase 0)
- [ ] Enhance with structured logging (JSON format)
- [ ] Add request ID to all logs
- [ ] Add user ID to logs (when authenticated)
- [ ] Add correlation IDs for distributed tracing
- [ ] Configure log levels per environment (DEBUG, INFO, WARNING, ERROR)

**Structured Log Format:**

```json
{
  "timestamp": "2025-01-27T10:30:00Z",
  "level": "INFO",
  "message": "Document uploaded successfully",
  "request_id": "req-abc123",
  "user_id": "user-xyz789",
  "endpoint": "/api/v1/documents/upload",
  "method": "POST",
  "status_code": 201,
  "duration_ms": 1250,
  "document_id": "doc-123",
  "file_type": "pdf",
  "file_size_bytes": 1024000
}
```

### Log Levels Configuration

- [ ] **DEBUG**: Development only (verbose logs)
- [ ] **INFO**: Normal operations (document uploads, searches, logins)
- [ ] **WARNING**: Recoverable errors (quota approaching, rate limit hit)
- [ ] **ERROR**: Errors requiring attention (processing failures, API errors)
- [ ] **CRITICAL**: System failures (database down, Milvus unavailable)

### Tasks to Implement

- [ ] Enhance logging.py with JSON formatter
- [ ] Add request ID context to all logs
- [ ] Add user ID context (from JWT)
- [ ] Configure log rotation (daily, 30-day retention)
- [ ] Test structured logging output

---

## 14.4 Health Checks Enhancement

**File:** `backend/app/api/v1/health.py`

**PRD Reference:** Section 9.6 (Monitoring & Health Checks)

- [x] Verify health endpoint exists (created in Phase 0)
- [ ] Enhance with detailed service status checks
- [ ] Add dependency health checks (PostgreSQL, Redis, Milvus, B2)
- [ ] Add response time metrics
- [ ] Add version information
- [ ] Return degraded status if dependencies are slow

**Enhanced Health Check Response:**

```json
{
  "status": "healthy",  // healthy, degraded, unhealthy
  "timestamp": "2025-01-27T10:00:00Z",
  "version": "1.0.0",
  "services": {
    "postgres": {
      "status": "healthy",
      "latency_ms": 5,
      "last_check": "2025-01-27T10:00:00Z"
    },
    "redis": {
      "status": "healthy",
      "latency_ms": 1,
      "last_check": "2025-01-27T10:00:00Z"
    },
    "milvus": {
      "status": "healthy",
      "latency_ms": 15,
      "last_check": "2025-01-27T10:00:00Z"
    },
    "b2_storage": {
      "status": "healthy",
      "latency_ms": 50,
      "last_check": "2025-01-27T10:00:00Z"
    }
  },
  "uptime_seconds": 86400
}
```

### Health Check Implementation

```python
@router.get("/health")
async def health_check(
    db: AsyncSession = Depends(get_session)
) -> HealthCheckResponse:
    """
    Comprehensive health check endpoint.

    Checks status of all critical services.
    """
    services = {}
    overall_status = "healthy"

    # Check PostgreSQL
    postgres_status = await check_postgres(db)
    services["postgres"] = postgres_status
    if postgres_status["status"] != "healthy":
        overall_status = "degraded"

    # Check Redis
    redis_status = await check_redis()
    services["redis"] = redis_status
    if redis_status["status"] != "healthy":
        overall_status = "degraded"

    # Check Milvus
    milvus_status = await check_milvus()
    services["milvus"] = milvus_status
    if milvus_status["status"] != "healthy":
        overall_status = "unhealthy"

    # Check B2 Storage
    b2_status = await check_b2_storage()
    services["b2_storage"] = b2_status

    return HealthCheckResponse(
        status=overall_status,
        timestamp=datetime.utcnow(),
        version=settings.VERSION,
        services=services
    )
```

### Tasks to Implement

- [ ] Enhance health.py with service checks
- [ ] Implement `check_postgres()` helper
- [ ] Implement `check_redis()` helper
- [ ] Implement `check_milvus()` helper
- [ ] Implement `check_b2_storage()` helper
- [ ] Add timeout limits for each check (5 seconds max)
- [ ] Return 503 status if unhealthy

---

## 14.5 Alerting Rules

**PRD Reference:** Section 21.3 (Alerting rules)

### Alert Configuration

**File:** `backend/monitoring/alerts.yml` (NEW)

- [ ] Create alerting rules configuration
- [ ] Define alert thresholds
- [ ] Configure notification channels (email, Slack, Discord)
- [ ] Add alert severity levels (critical, warning, info)
- [ ] Document alert response procedures

### Critical Alerts

- [ ] **High error rate**: >5% in 5 minutes
- [ ] **Slow queries**: p95 >2 seconds
- [ ] **Service down**: Health check fails for 2 consecutive checks
- [ ] **Storage quota exceeded**: User exceeds 100% quota
- [ ] **Database connection pool exhausted**: No available connections
- [ ] **Milvus unavailable**: Vector search failing
- [ ] **Redis unavailable**: Session store failing

### Warning Alerts

- [ ] **Elevated error rate**: >2% in 10 minutes
- [ ] **Slow document processing**: >30 seconds per document
- [ ] **Storage quota approaching**: User >80% quota
- [ ] **High queue depth**: >100 jobs in arq queue
- [ ] **Unusual traffic spike**: >200% increase in 5 minutes

### Alert Rules Example

```yaml
# backend/monitoring/alerts.yml
alerts:
  - name: high_error_rate
    severity: critical
    condition: error_rate > 0.05 for 5m
    message: "High error rate detected: {{ value }}%"
    notify: ["email:admin@example.com", "slack:#alerts"]

  - name: slow_queries
    severity: warning
    condition: p95_latency > 2000ms for 5m
    message: "Slow queries detected: {{ value }}ms"
    notify: ["slack:#alerts"]

  - name: storage_quota_exceeded
    severity: critical
    condition: storage_usage > quota
    message: "User {{ user_id }} exceeded storage quota"
    notify: ["email:admin@example.com"]
```

### Tasks to Implement

- [ ] Create `alerts.yml` configuration file
- [ ] Document all alert rules
- [ ] Add notification channel configuration
- [ ] Add alert testing procedures
- [ ] Create runbook for each alert type

---

## 14.6 Monitoring Tools Integration

**PRD Reference:** Section 21.3 (Recommended tools)

### Option 1: Prometheus + Grafana (Self-hosted)

- [ ] Install Prometheus for metrics collection
- [ ] Install Grafana for visualization
- [ ] Configure Prometheus to scrape `/metrics` endpoint
- [ ] Create Grafana dashboards
- [ ] Configure alerting rules in Prometheus

**Docker Compose Addition:**

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Option 2: Sentry (Error Tracking)

- [ ] Add Sentry SDK to dependencies
- [ ] Configure Sentry DSN in `.env`
- [ ] Initialize Sentry in FastAPI app
- [ ] Add custom error tags (user_id, endpoint)
- [ ] Configure error sampling rate
- [ ] Add performance monitoring

**Sentry Integration:**

```python
# backend/app/core/sentry.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    environment=settings.ENVIRONMENT,
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
    profiles_sample_rate=0.1
)
```

### Option 3: DataDog / New Relic (Cloud-based)

- [ ] Document DataDog APM integration
- [ ] Document New Relic APM integration
- [ ] Configure agent installation
- [ ] Configure custom metrics
- [ ] Configure log forwarding

### Option 4: Uptime Monitoring (External)

- [ ] Configure UptimeRobot for health check polling
- [ ] Configure Pingdom for uptime monitoring
- [ ] Set up status page (optional)
- [ ] Configure downtime notifications

### Tasks to Implement

- [ ] Choose monitoring tools (Prometheus + Grafana recommended)
- [ ] Create docker-compose.monitoring.yml
- [ ] Configure Prometheus scrape config
- [ ] Create Grafana dashboards
- [ ] Test metrics collection end-to-end
- [ ] Document monitoring setup

---

## 14.7 Grafana Dashboards

**File:** `backend/monitoring/grafana/dashboards/` (NEW)

### Dashboard 1: Application Overview

- [ ] Request rate (requests/second)
- [ ] Error rate (%)
- [ ] Request latency (p50, p95, p99)
- [ ] Active users
- [ ] Service health status

### Dashboard 2: Document Processing

- [ ] Document upload rate
- [ ] Processing time by file type
- [ ] Processing queue depth
- [ ] Processing success/failure rate
- [ ] Storage usage trends

### Dashboard 3: Vector Search Performance

- [ ] Search query rate
- [ ] Search latency distribution
- [ ] Search result count
- [ ] Cache hit rate
- [ ] Relevance score distribution

### Dashboard 4: Infrastructure

- [ ] CPU usage
- [ ] Memory usage
- [ ] Disk I/O
- [ ] Network I/O
- [ ] Database connection pool

### Tasks to Implement

- [ ] Create dashboard JSON files
- [ ] Add dashboard provisioning to Grafana
- [ ] Test dashboard visualizations
- [ ] Document dashboard usage
- [ ] Share dashboard templates

---

## 14.8 Log Aggregation

**PRD Reference:** Section 21.3 (Log aggregation)

### Option 1: Loki + Grafana (Self-hosted)

- [ ] Install Loki for log aggregation
- [ ] Configure Promtail to ship logs
- [ ] Add Loki datasource to Grafana
- [ ] Create log exploration dashboards
- [ ] Configure log retention (30 days)

### Option 2: ELK Stack (Elasticsearch, Logstash, Kibana)

- [ ] Install Elasticsearch for log storage
- [ ] Install Logstash for log processing
- [ ] Install Kibana for log visualization
- [ ] Configure log shipping
- [ ] Create Kibana dashboards

### Option 3: CloudWatch Logs (AWS)

- [ ] Configure CloudWatch Logs agent
- [ ] Create log groups
- [ ] Configure log retention
- [ ] Create CloudWatch Insights queries
- [ ] Configure log-based alarms

### Tasks to Implement

- [ ] Choose log aggregation tool (Loki recommended for simplicity)
- [ ] Configure log shipping
- [ ] Test log ingestion
- [ ] Create log search queries
- [ ] Document log aggregation setup

---

## 14.9 Performance Profiling

### Application Profiling

- [ ] Add profiling middleware for slow endpoints
- [ ] Profile database queries (explain analyze)
- [ ] Profile vector search queries
- [ ] Profile document processing pipeline
- [ ] Identify performance bottlenecks

### Database Query Profiling

**File:** `backend/app/core/profiling.py` (NEW)

```python
import time
from functools import wraps
import logging

logger = logging.getLogger(__name__)

def profile_query(func):
    """
    Decorator to profile database query execution time.
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        result = await func(*args, **kwargs)
        duration = time.time() - start_time

        if duration > 1.0:  # Log queries >1 second
            logger.warning(
                f"Slow query detected: {func.__name__} took {duration:.2f}s"
            )

        return result
    return wrapper
```

### Tasks to Implement

- [ ] Create profiling.py module
- [ ] Add query profiling decorator
- [ ] Profile slow endpoints
- [ ] Document optimization opportunities
- [ ] Implement performance improvements

---

## 14.10 Success Metrics Tracking

**PRD Reference:** Section 17 (Success Metrics)

### Technical Metrics (Target)

- [ ] **Uptime**: >99.5% (monitor with health checks)
- [ ] **Response Time**: <3 seconds (p95)
- [ ] **Error Rate**: <1%
- [ ] **Document Processing Success**: >95%

### User Metrics (Target)

- [ ] **Daily Active Users**: 100 in first month
- [ ] **Queries per User**: 10/day average
- [ ] **User Retention**: >60% after 30 days
- [ ] **User Satisfaction**: >4.5/5 stars (feedback form)

### Business Metrics (Target)

- [ ] **Document Upload Volume**: 1000+ documents
- [ ] **Query Volume**: 5000+ queries/month
- [ ] **Cost per Query**: <$0.01 (LLM + vector DB costs)

### Analytics Service

**File:** `backend/app/services/analytics_service.py` (NEW)

- [ ] Create analytics service for metric calculation
- [ ] Track user activity (logins, uploads, queries)
- [ ] Calculate retention rates
- [ ] Calculate average queries per user
- [ ] Track cost metrics (API usage)
- [ ] Create admin dashboard endpoint

**Admin Analytics Endpoint:**

```python
@router.get("/admin/analytics")
async def get_analytics(
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session)
) -> AnalyticsResponse:
    """
    Get system analytics (admin only).

    Returns: DAU, query volume, document volume, costs.
    """
    analytics_service = AnalyticsService(db)
    return await analytics_service.get_system_analytics()
```

### Tasks to Implement

- [ ] Create `analytics_service.py`
- [ ] Implement metric calculation methods
- [ ] Create admin analytics endpoint
- [ ] Track metrics in database
- [ ] Create analytics dashboard in Grafana

---

## ✅ Phase 14 Completion Checklist

**IMPORTANT: Verify Against PRD**
- [ ] **Cross-check monitoring with PRD Section 21.3**
- [ ] **Verify all technical metrics are tracked** (Section 17)
- [ ] **Confirm alerting rules are configured** (critical, warning)
- [ ] **Test metrics collection and visualization** (Grafana dashboards)
- [ ] **Verify health checks return accurate status**

Before marking Phase 14 complete:
- [ ] Prometheus metrics endpoint (`/metrics`) working
- [ ] Metrics middleware installed and collecting data
- [ ] Structured logging (JSON format) implemented
- [ ] Enhanced health checks with service status
- [ ] Grafana dashboards created and tested
- [ ] Alerting rules configured
- [ ] Log aggregation configured (Loki/ELK/CloudWatch)
- [ ] Uptime monitoring configured (UptimeRobot/Pingdom)
- [ ] Sentry error tracking configured (optional)
- [ ] Analytics service implemented
- [ ] Admin analytics endpoint created
- [ ] All monitoring documented
- [ ] All tests passing: `uv run pytest`
- [ ] Linting passing: `uv run ruff check .`

**Monitoring Readiness:** ⬜ Not Started / ⬜ In Progress / ⬜ Ready for Staging / ⬜ Production Ready

---

**Next Phase:** Phase 15 - Rate Limiting & Security Hardening

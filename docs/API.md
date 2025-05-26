# API Documentation

This document provides a comprehensive reference for all API endpoints in the SaaS Starter.

## Base URL

```
Development: http://localhost:4321/api/v1
Production: https://yourdomain.com/api/v1
```

## Authentication

The API supports two authentication methods:

### 1. Session-based Authentication (Cookies)
Used for browser-based requests. The session cookie is automatically included.

### 2. Bearer Token Authentication
Used for programmatic access. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

All API endpoints are rate-limited to prevent abuse:

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes  
- **Read operations**: 60 requests per minute
- **Write operations**: 10 requests per minute

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 2024-01-01T00:00:00Z
```

## Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {} // Optional additional information
  }
}
```

Common error codes:
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Endpoints

### Authentication

#### Check Auth Status

```
GET /api/v1/auth/status
```

Returns the current authentication status.

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### Profile

#### Get Profile

```
GET /api/v1/profile
```

Get the authenticated user's profile.

**Response:**
```json
{
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://...",
    "bio": "Software developer",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Update Profile

```
PUT /api/v1/profile
```

Update the authenticated user's profile.

**Request Body:**
```json
{
  "full_name": "Jane Doe",
  "bio": "Full-stack developer",
  "avatar_url": "https://..."
}
```

**Response:**
```json
{
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "full_name": "Jane Doe",
    "bio": "Full-stack developer",
    "avatar_url": "https://...",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### Projects

#### List Projects

```
GET /api/v1/projects
```

List all projects for the authenticated user.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `sort` (string): Sort field
- `order` (string): Sort order (asc/desc)

**Response:**
```json
{
  "data": [
    {
      "id": "proj_123",
      "name": "My Project",
      "description": "Project description",
      "is_public": false,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "hasMore": true
  }
}
```

#### Create Project

```
POST /api/v1/projects
```

Create a new project.

**Request Body:**
```json
{
  "name": "My Project",
  "description": "Project description",
  "is_public": false
}
```

**Response:**
```json
{
  "data": {
    "id": "proj_123",
    "name": "My Project",
    "description": "Project description",
    "is_public": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Project

```
GET /api/v1/projects/:id
```

Get a specific project by ID.

**Response:**
```json
{
  "data": {
    "id": "proj_123",
    "name": "My Project",
    "description": "Project description",
    "is_public": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Update Project

```
PUT /api/v1/projects/:id
```

Update a project.

**Request Body:**
```json
{
  "name": "Updated Project",
  "description": "New description",
  "is_public": true
}
```

**Response:**
```json
{
  "data": {
    "id": "proj_123",
    "name": "Updated Project",
    "description": "New description",
    "is_public": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Delete Project

```
DELETE /api/v1/projects/:id
```

Delete a project.

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

### Admin Endpoints

All admin endpoints require admin or super_admin role.

#### List Users

```
GET /api/v1/admin/users
```

List all users with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `search` (string): Search by email or name
- `role` (string): Filter by role (user/admin/super_admin)
- `sortBy` (string): Sort field
- `sortOrder` (string): Sort order (asc/desc)

**Response:**
```json
{
  "data": {
    "users": [
      {
        "id": "user_123",
        "email": "user@example.com",
        "full_name": "John Doe",
        "role": "user",
        "created_at": "2024-01-01T00:00:00Z",
        "subscription": {
          "plan": "pro",
          "status": "active"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

#### Create User

```
POST /api/v1/admin/users
```

Create a new user (requires super_admin role).

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "full_name": "New User",
  "role": "user"
}
```

**Response:**
```json
{
  "data": {
    "user": {
      "id": "user_124",
      "email": "newuser@example.com",
      "full_name": "New User",
      "role": "user",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### Get User Details

```
GET /api/v1/admin/users/:id
```

Get detailed information about a specific user.

**Response:**
```json
{
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user",
      "created_at": "2024-01-01T00:00:00Z",
      "last_sign_in": "2024-01-15T10:30:00Z",
      "subscription": {
        "id": "sub_123",
        "plan": "pro",
        "status": "active",
        "current_period_start": "2024-01-01T00:00:00Z",
        "current_period_end": "2024-02-01T00:00:00Z"
      }
    }
  }
}
```

#### Update User

```
PATCH /api/v1/admin/users/:id
```

Update user details and permissions.

**Request Body:**
```json
{
  "full_name": "John Smith",
  "role": "admin",
  "banned": false
}
```

**Response:**
```json
{
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "full_name": "John Smith",
      "role": "admin",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### Delete User

```
DELETE /api/v1/admin/users/:id
```

Delete a user (requires super_admin role).

**Response:**
```json
{
  "data": {
    "success": true,
    "message": "User deleted successfully"
  }
}
```

#### List Subscriptions

```
GET /api/v1/admin/subscriptions
```

List all subscriptions with filtering.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status (active/canceled/past_due/trialing)
- `plan` (string): Filter by plan (starter/pro/enterprise)

**Response:**
```json
{
  "data": {
    "subscriptions": [
      {
        "id": "sub_123",
        "user_id": "user_123",
        "plan": "pro",
        "status": "active",
        "current_period_start": "2024-01-01T00:00:00Z",
        "current_period_end": "2024-02-01T00:00:00Z",
        "profiles": {
          "email": "user@example.com",
          "full_name": "John Doe"
        }
      }
    ],
    "metrics": {
      "total_mrr": 2970,
      "active_subscriptions": 99
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 99,
      "totalPages": 5
    }
  }
}
```

#### Manage Subscription

```
POST /api/v1/admin/subscriptions
```

Perform subscription actions (cancel, reactivate, refund).

**Request Body:**
```json
{
  "action": "cancel",
  "subscription_id": "sub_123",
  "reason": "Customer request"
}
```

**Actions:**
- `cancel` - Cancel subscription at period end
- `reactivate` - Reactivate canceled subscription
- `refund` - Issue refund (requires super_admin)

**Response:**
```json
{
  "data": {
    "success": true,
    "message": "Subscription canceled successfully",
    "subscription": {
      "id": "sub_123",
      "status": "canceled",
      "cancel_at_period_end": true
    }
  }
}
```

#### Get Statistics

```
GET /api/v1/admin/stats
```

Get comprehensive statistics and analytics.

**Query Parameters:**
- `period` (string): Time period (7d/30d/90d/1y)

**Response:**
```json
{
  "data": {
    "overview": {
      "total_users": 1250,
      "new_users": 125,
      "active_subscriptions": 450,
      "mrr": 13050,
      "churn_rate": 2.5
    },
    "subscriptions": {
      "by_plan": {
        "starter": 200,
        "pro": 200,
        "enterprise": 50
      },
      "total": 450
    },
    "users": {
      "by_role": {
        "user": 1240,
        "admin": 8,
        "super_admin": 2
      },
      "total": 1250
    },
    "daily_stats": [
      {
        "date": "2024-01-15",
        "users": 5,
        "subscriptions": 2
      }
    ],
    "period": {
      "start": "2023-12-16T00:00:00Z",
      "end": "2024-01-15T00:00:00Z",
      "label": "30d"
    }
  }
}
```

#### System Health

```
GET /api/v1/admin/health
```

Get system health status and metrics.

**Response:**
```json
{
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "services": {
      "database": {
        "status": "healthy",
        "response_time_ms": 45,
        "error": null
      },
      "authentication": {
        "status": "healthy",
        "authenticated": true,
        "session_valid": true
      },
      "email": {
        "status": "healthy",
        "configured": true,
        "error": null
      },
      "payments": {
        "status": "healthy",
        "configured": true,
        "webhook_configured": true,
        "error": null
      }
    },
    "system": {
      "memory": {
        "heap_used_mb": 125,
        "heap_total_mb": 256,
        "rss_mb": 350,
        "external_mb": 25,
        "heap_percentage": 49
      },
      "uptime": {
        "seconds": 86400,
        "formatted": "1d 0h 0m"
      }
    },
    "environment": {
      "node_version": "v18.17.0",
      "environment": "production",
      "timezone": "UTC"
    }
  }
}
```

### Health Check

#### Public Health Check

```
GET /api/health
```

Returns basic health status (no authentication required).

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "uptime": 86400
}
```

## Webhooks

### Stripe Webhook

```
POST /api/stripe/webhook
```

Endpoint for Stripe webhook events. Requires webhook signature validation.

**Headers:**
```
Stripe-Signature: t=1234567890,v1=...
```

Handled events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## TypeScript Client

A TypeScript client is available for easy API integration:

```typescript
import { ApiClient } from '@/lib/api/client';

const api = new ApiClient({
  baseUrl: 'https://yourdomain.com/api/v1',
  auth: {
    type: 'bearer',
    token: 'your-jwt-token'
  }
});

// Get profile
const profile = await api.profile.get();

// Update profile
const updated = await api.profile.update({
  full_name: 'New Name'
});

// List projects
const projects = await api.projects.list({
  page: 1,
  limit: 20
});

// Create project
const project = await api.projects.create({
  name: 'My Project',
  description: 'Description'
});
```

## Best Practices

1. **Always handle errors**: Check for error responses and handle them appropriately
2. **Respect rate limits**: Implement exponential backoff for rate-limited requests
3. **Use pagination**: For list endpoints, always use pagination parameters
4. **Validate inputs**: Validate data client-side before sending requests
5. **Cache responses**: Cache GET requests when appropriate to reduce API calls
6. **Use HTTPS**: Always use HTTPS in production
7. **Keep tokens secure**: Never expose API tokens in client-side code
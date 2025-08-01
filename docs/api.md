# API Documentation

## Authentication

All API endpoints require JWT authentication via Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## User Management

### GET /api/users
List users with optional role filtering
- Query: `?role=PROGRAM_OFFICER`

### POST /api/auth/login
User login
- Body: `{ "email": "string", "password": "string" }`

### POST /api/auth/register
User registration
- Body: `{ "name": "string", "email": "string", "password": "string" }`

### POST /api/auth/change-password
Change user password
- Body: `{ "currentPassword": "string", "newPassword": "string" }`

### POST /api/auth/logout-all
Logout from all sessions

## Proposals

### GET /api/proposals
List user's proposals

### POST /api/proposals
Create new proposal
- Body: `{ "title": "string", "description": "string", "duration": number }`

### GET /api/proposals/[id]
Get proposal details

### PUT /api/proposals/[id]
Update proposal

### GET /api/proposals/[id]/budget
Get proposal budget

### POST /api/proposals/[id]/budget
Create/update budget items

## Funding Programs

### GET /api/funding-programs
List funding programs

### POST /api/funding-programs
Create funding program (Admin only)
- Body: `{ "name": "string", "description": "string", "agencyId": "string", ... }`

## Calls for Proposals

### GET /api/calls
List calls (filtered by user role)

### POST /api/calls
Create new call (Admin only)

### GET /api/calls/[id]
Get call details

### POST /api/calls/upload
Upload call documentation
- Content-Type: multipart/form-data
- Field: `file` (max 10MB)

## Templates

### GET /api/call-templates
Get predefined call templates

## Reviews

### GET /api/reviews
List reviews assigned to user

### POST /api/reviews
Submit review
- Body: `{ "proposalId": "string", "score": number, "comments": "string" }`

### GET /api/reviews/[id]
Get review details

### PUT /api/reviews/[id]
Update review

## Public APIs

### GET /api/public/calls
List public calls

### GET /api/public/calls/[id]
Get public call details

### GET /api/public/open-calls
List currently open calls

## Analytics

### GET /api/analytics
Get platform analytics (Admin only)

### GET /api/dashboard-stats
Get dashboard statistics

## Error Responses

All endpoints return consistent error responses:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

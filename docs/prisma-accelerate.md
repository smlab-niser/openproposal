# Prisma Accelerate Setup Guide

## Overview

Prisma Accelerate provides connection pooling and global query caching to improve your application's performance and scalability. This guide covers the setup and configuration for the OpenProposal platform.

## What is Prisma Accelerate?

Prisma Accelerate is a connection pooler and global cache for your database that:
- **Connection Pooling**: Manages database connections efficiently
- **Global Caching**: Caches query results at the edge for faster responses
- **Scalability**: Handles thousands of concurrent connections
- **Geographic Distribution**: Serves cached data from locations worldwide

## Setup Steps

### 1. Create Prisma Accelerate Project

1. **Visit Prisma Console**: https://console.prisma.io/
2. **Sign in** with your GitHub/Google account
3. **Create a new project** or select existing project
4. **Enable Accelerate** for your project
5. **Get your connection string** (it will look like this):
   ```
   prisma://accelerate.prisma-data.net/?api_key=eyJh...
   ```

### 2. Configure Database Connection

For **production** environments, you'll need to provide your production database URL to Prisma Console:

#### For PostgreSQL (Recommended for Production):
```env
# Your actual database URL (for Prisma Console setup)
DIRECT_DATABASE_URL="postgresql://username:password@localhost:5432/openproposal"

# Prisma Accelerate URL (from console.prisma.io)
PRISMA_ACCELERATE_URL="prisma://accelerate.prisma-data.net/?api_key=your_api_key_here"

# Use Accelerate in production
DATABASE_URL="${PRISMA_ACCELERATE_URL}"
```

#### For Development (SQLite):
```env
# Keep SQLite for local development
DATABASE_URL="file:./prisma/dev.db"

# Optional: Test Accelerate in development
# DATABASE_URL="${PRISMA_ACCELERATE_URL}"
```

### 3. Environment Configuration

Your `.env.local` is already configured with Accelerate support:

```env
# Database - Using SQLite for local development
DATABASE_URL="file:./prisma/dev.db"

# Prisma Accelerate (for production performance)
# Get your Prisma Accelerate URL from: https://console.prisma.io/
# PRISMA_ACCELERATE_URL="prisma://accelerate.prisma-data.net/?api_key=your_api_key"
# Use Accelerate in production by setting: DATABASE_URL="${PRISMA_ACCELERATE_URL}"
```

For production deployment, update these values:
```env
# Production configuration
PRISMA_ACCELERATE_URL="prisma://accelerate.prisma-data.net/?api_key=your_actual_api_key"
DATABASE_URL="${PRISMA_ACCELERATE_URL}"
```

## Code Implementation

### Prisma Client Configuration

The Prisma client is now configured to automatically use Accelerate when available:

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  // Add Accelerate extension if PRISMA_ACCELERATE_URL is available
  if (process.env.PRISMA_ACCELERATE_URL) {
    return client.$extends(withAccelerate())
  }

  return client
}

export const prisma = createPrismaClient()
```

### Using Cache Strategies

With Accelerate, you can add caching to your queries:

```typescript
// Cache for 60 seconds
const proposals = await prisma.proposal.findMany({
  where: { status: 'SUBMITTED' },
  cacheStrategy: {
    swr: 60, // Stale-while-revalidate for 60 seconds
  },
})

// Cache for 5 minutes with background refresh
const users = await prisma.user.findMany({
  cacheStrategy: {
    swr: 300, // 5 minutes
  },
})

// No cache for real-time data
const liveReviews = await prisma.review.findMany({
  where: { submittedAt: { gte: new Date(Date.now() - 3600000) } },
  // No cacheStrategy = no caching
})
```

## Recommended Caching Strategies

### For OpenProposal Platform:

#### Long-term Cache (5-15 minutes):
- **User profiles** (rarely change)
- **Institution data** (static)
- **Call for proposals** (until deadline)
- **Budget configurations** (admin settings)

```typescript
// Example: Cache user profiles for 10 minutes
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { institutions: true },
  cacheStrategy: { swr: 600 }, // 10 minutes
})
```

#### Medium-term Cache (1-5 minutes):
- **Proposal listings** (with filters)
- **Review assignments** (moderately dynamic)
- **Search results** (can be slightly stale)

```typescript
// Example: Cache proposal listings for 2 minutes
const proposals = await prisma.proposal.findMany({
  where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
  cacheStrategy: { swr: 120 }, // 2 minutes
})
```

#### No Cache (Real-time):
- **Review submissions** (immediate)
- **Status changes** (real-time updates)
- **Authentication data** (security)
- **File uploads** (immediate feedback)

```typescript
// Example: No cache for review submissions
const review = await prisma.review.create({
  data: reviewData,
  // No cacheStrategy = no caching
})
```

## Performance Benefits

### Connection Pooling
- **Reduced Connection Overhead**: Reuses database connections
- **Better Scalability**: Handles more concurrent users
- **Lower Latency**: Faster connection establishment

### Global Caching
- **Faster Query Response**: Cached results served instantly
- **Reduced Database Load**: Fewer queries to your database
- **Geographic Performance**: Cached data served from edge locations

### Expected Improvements
- **Query Response Time**: 50-90% faster for cached queries
- **Database Load**: 60-80% reduction in database queries
- **Concurrent Users**: Support for 10x more concurrent connections

## Monitoring and Analytics

### Prisma Console Dashboard
- **Query Performance**: Response times and cache hit rates
- **Connection Usage**: Pool utilization and connection stats
- **Cache Metrics**: Hit/miss ratios and invalidation patterns
- **Geographic Distribution**: Performance by region

### Application Monitoring
```typescript
// Add performance logging
const startTime = Date.now()
const result = await prisma.proposal.findMany({
  cacheStrategy: { swr: 300 },
})
console.log(`Query took ${Date.now() - startTime}ms`)
```

## Migration Strategy

### Phase 1: Setup (Current)
- ✅ Install Accelerate extension
- ✅ Configure Prisma client
- ✅ Set up environment variables

### Phase 2: Development Testing
- Test Accelerate with development database
- Identify optimal cache strategies
- Monitor performance improvements

### Phase 3: Production Deployment
- Set up production database connection
- Enable Accelerate in production
- Monitor and optimize cache strategies

### Phase 4: Optimization
- Fine-tune cache durations
- Implement cache invalidation strategies
- Monitor and adjust based on usage patterns

## Best Practices

### Cache Strategy Selection
1. **Identify Query Patterns**: Which queries are called most frequently?
2. **Data Freshness Requirements**: How stale can the data be?
3. **User Experience Impact**: Which queries affect perceived performance?

### Cache Invalidation
```typescript
// Invalidate cache when data changes
await prisma.proposal.update({
  where: { id: proposalId },
  data: { status: 'ACCEPTED' },
})

// The cache will automatically be invalidated for affected queries
```

### Error Handling
```typescript
try {
  const result = await prisma.proposal.findMany({
    cacheStrategy: { swr: 300 },
  })
} catch (error) {
  // Accelerate will fallback to direct database connection
  console.error('Query failed:', error)
  throw error
}
```

## Cost Considerations

### Prisma Accelerate Pricing
- **Free Tier**: Limited requests per month
- **Pro Tier**: Higher limits for production usage
- **Enterprise**: Custom pricing for large-scale applications

### Cost-Benefit Analysis
- **Reduced Infrastructure Costs**: Lower database server requirements
- **Improved User Experience**: Faster application performance
- **Developer Productivity**: Simplified scaling and optimization

## Troubleshooting

### Common Issues

1. **Connection String Issues**
   ```bash
   Error: Invalid Prisma Accelerate URL
   ```
   - Verify the API key is correct
   - Check the URL format
   - Ensure the project is properly configured

2. **Cache Not Working**
   ```typescript
   // Ensure you're using the cacheStrategy parameter
   const result = await prisma.model.findMany({
     cacheStrategy: { swr: 60 }, // This is required for caching
   })
   ```

3. **Performance Not Improved**
   - Check if queries are actually being cached
   - Monitor cache hit rates in Prisma Console
   - Adjust cache durations based on data patterns

### Debug Mode
```env
# Enable debug logging
DEBUG=prisma:accelerate
```

The Prisma Accelerate integration is now ready and will provide significant performance improvements for the OpenProposal platform, especially as user traffic scales up.

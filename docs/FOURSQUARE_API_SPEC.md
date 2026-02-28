# Foursquare Places API - Specification & Cost Analysis

## Overview

RESCHO uses the Foursquare Places API v3 for fetching restaurant data. This document outlines the terms, costs, limitations, and requirements for production use.

---

## Pricing Structure

### Free Tier

| Endpoint Type                                 | Free Calls/Month             |
| --------------------------------------------- | ---------------------------- |
| Pro Endpoints (search, details, autocomplete) | **10,000**                   |
| Premium Endpoints (tips, photos)              | **0** (paid from first call) |

### Pay-As-You-Go Pricing

#### Pro Endpoints (search, place details, autocomplete)

| Monthly Volume        | Cost per 1,000 calls (CPM) |
| --------------------- | -------------------------- |
| 0 - 10,000            | **FREE**                   |
| 10,001 - 100,000      | $15.00                     |
| 100,001 - 500,000     | $12.00                     |
| 500,001 - 1,000,000   | $9.00                      |
| 1,000,001 - 5,000,000 | $4.50                      |
| 5,000,001+            | $1.25                      |

#### Premium Endpoints (photos, tips, reviews)

| Monthly Volume        | Cost per 1,000 calls (CPM) |
| --------------------- | -------------------------- |
| 0 - 100,000           | $18.75                     |
| 100,001 - 500,000     | $15.00                     |
| 500,001 - 1,000,000   | $11.25                     |
| 1,000,001 - 5,000,000 | $5.75                      |
| 5,000,001+            | $1.75                      |

---

## Production Cost Estimates for RESCHO

### Scenario Analysis

| Users/Month | API Calls\* | Pro Cost | Photo Cost\*\* | Total Monthly |
| ----------- | ----------- | -------- | -------------- | ------------- |
| 100         | ~2,000      | FREE     | $37.50         | ~$38          |
| 500         | ~10,000     | FREE     | $187.50        | ~$188         |
| 1,000       | ~20,000     | $150     | $375           | ~$525         |
| 5,000       | ~100,000    | $1,350   | $1,875         | ~$3,225       |
| 10,000      | ~200,000    | $2,550   | $3,750         | ~$6,300       |

\*Assuming 20 restaurant searches per user session  
\*\*Assuming photo fetch for each restaurant (can be disabled to reduce costs)

### Cost Optimization Recommendations

1. **Disable Photo Fetching** - Remove `photos` from API fields to avoid Premium charges
2. **Cache Results** - Cache restaurant data by location for 1-24 hours
3. **Limit Search Radius** - Reduce API calls by limiting restaurant count
4. **Batch Requests** - Use pagination instead of large single requests

---

## Rate Limits

| Account Type            | Queries Per Second (QPS) |
| ----------------------- | ------------------------ |
| Pay-As-You-Go / Sandbox | 50 QPS                   |
| Enterprise              | 100 QPS                  |

Rate limits are calculated across **all endpoints combined**.

---

## Mandatory Requirements

### Attribution (REQUIRED)

You **MUST** display "Powered by Foursquare" attribution on all screens showing Foursquare data.

```html
<!-- Example implementation -->
<footer>
  <a href="https://foursquare.com" target="_blank"> Powered by Foursquare </a>
</footer>
```

### Navigation Disclaimer (REQUIRED for location apps)

If providing navigation/directions, you must include:

> "YOUR USE OF THIS APPLICATION IS AT YOUR SOLE RISK. LOCATION DATA MAY NOT BE ACCURATE"

### Crawling Prevention

You must make "commercially reasonable efforts" to prevent crawling/scraping of pages displaying Foursquare data.

---

## Prohibited Uses

| Prohibition           | Description                                              |
| --------------------- | -------------------------------------------------------- |
| Scraping              | Cannot use bots, spiders, or automated bulk collection   |
| POI Database Building | Cannot use data to build/improve your own venue database |
| Bulk Distribution     | Cannot provide Places Data to third parties in bulk      |
| Derivative Works      | Cannot create derivative databases from the data         |
| Cold Calling          | Cannot use business data for sales prospecting           |
| Systematic Downloads  | Cannot download all data for a geographic region         |

---

## Data Usage Rules

### What You CAN Do

- Display restaurant information to end users
- Cache data temporarily (follow their caching guidelines)
- Use data integrated within your application
- Create reports with proper attribution

### What You CANNOT Do

- Store data permanently without refresh
- Share raw API data with third parties
- Use data to contact businesses directly
- Build competing POI/venue databases

---

## Pros and Cons Analysis

### PROS

| Advantage              | Details                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| **Free Tier**          | 10,000 free API calls/month - good for development and small apps |
| **Data Quality**       | High-quality, regularly updated restaurant/venue data             |
| **Rich Data**          | Includes ratings, price levels, categories, photos, tips          |
| **Global Coverage**    | Available worldwide with localized data                           |
| **Simple Integration** | RESTful API with clear documentation                              |
| **Real-time Data**     | Data is regularly updated by Foursquare and users                 |
| **Category Filtering** | 900+ venue categories for precise filtering                       |

### CONS

| Disadvantage             | Details                                                        |
| ------------------------ | -------------------------------------------------------------- |
| **Photo Costs**          | Premium endpoint - no free tier, $18.75/1000 from first call   |
| **Attribution Required** | Must display "Powered by Foursquare" branding                  |
| **No Caching Forever**   | Must refresh cached data periodically                          |
| **Rate Limits**          | 50 QPS may be limiting for high-traffic apps                   |
| **Scaling Costs**        | Costs increase significantly at scale (5K+ users = $3K+/month) |
| **Data Restrictions**    | Cannot build your own database from their data                 |
| **No Offline Mode**      | Cannot store data for offline use long-term                    |

---

## Liability & Legal

### Foursquare's Liability

- **No warranty** on data accuracy or availability
- **No liability** for your use of the service
- Maximum liability limited to **12 months of fees paid**

### Your Obligations

- Comply with all applicable **privacy laws**
- Implement appropriate **content moderation**
- **Indemnify** Foursquare from third-party claims
- Maintain **data security** best practices

---

## Alternatives Comparison

| Provider          | Free Tier   | Pro Pricing | Pros              | Cons               |
| ----------------- | ----------- | ----------- | ----------------- | ------------------ |
| **Foursquare**    | 10K/month   | $15/1K      | Rich data, global | Photo costs        |
| **Google Places** | $200 credit | ~$17/1K     | Best coverage     | Expensive at scale |
| **Yelp Fusion**   | 5K/day      | Contact     | Reviews           | US-focused         |
| **TripAdvisor**   | Limited     | Enterprise  | Tourism focus     | Complex terms      |

---

## Implementation in RESCHO

### Current Configuration

```env
# .env.local
FOURSQUARE_API_KEY=your_api_key_here
```

### API Fields Used

```typescript
fields: "fsq_id,name,location,categories,distance,rating,price,photos";
```

### Cost Reduction Option

To avoid photo charges, remove `photos` from the fields:

```typescript
fields: "fsq_id,name,location,categories,distance,rating,price";
```

The app uses Foursquare category icons + CSS gradient backgrounds instead.

---

## Summary

| Aspect                               | Recommendation                                     |
| ------------------------------------ | -------------------------------------------------- |
| **Development**                      | Use free tier (10K calls) with mock data fallback  |
| **Small Production (<500 users)**    | Free tier sufficient, disable photos to save costs |
| **Medium Production (500-5K users)** | Budget $200-3,000/month, implement caching         |
| **Large Production (5K+ users)**     | Consider Enterprise plan or alternatives           |

---

## References

- [Foursquare Pricing](https://foursquare.com/pricing/)
- [Developer Terms of Service](https://foursquare.com/legal/terms/enterprise-developermasterterms/)
- [API License Agreement](https://foursquare.com/legal/terms/apilicenseagreement/)
- [Rate Limits Documentation](https://docs.foursquare.com/fsq-developers-places/reference/rate-limits)

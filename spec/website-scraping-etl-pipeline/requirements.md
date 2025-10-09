# Requirements: Website Scraping ETL Pipeline

## Introduction

This feature enables automated data seeding for the activities database by building a comprehensive web scraping and ETL (Extract, Transform, Load) pipeline. The system will accept a website URL, scrape activity content from the site and relevant sublinks, process all extracted data (including images, addresses, and text embeddings), and output structured activity records ready for database import.

The pipeline addresses the challenge of manually inputting every activity by automating the entire data collection and transformation process. Users can submit URLs to websites containing activity information, and the system will handle all extraction, formatting, geocoding, embedding, and storage operations—ultimately producing a JSON-L file of activities that can be imported into the Convex database.

This workflow-based approach ensures durability, proper error handling, and the ability to track progress through long-running scraping operations.

## Requirement 1: URL Submission and Workflow Initiation

**As a** developer seeding the database
**I want to** submit a website URL to trigger the scraping workflow
**So that** I can automatically extract activity data without manual intervention

### Acceptance Criteria

**WHEN** I invoke the scraping action with a valid URL
**THEN** a new workflow instance should be created with a unique workflow ID
**AND** the workflow should begin executing the scraping pipeline
**AND** I should receive confirmation that the workflow has started

**WHEN** I submit an invalid URL (malformed, unreachable, or unsupported)
**THEN** the system should validate the URL before starting the workflow
**AND** return a clear error message explaining why the URL was rejected

**IF** the workflow is already running for the same URL
**THEN** the system should either return the existing workflow ID or queue the new request

## Requirement 2: Website Content Scraping and Extraction

**As a** workflow process
**I want to** scrape content from the submitted URL and discover relevant sublinks
**So that** I can extract all available activity data from the website in a roughly structured format

### Acceptance Criteria

**WHEN** the workflow begins scraping
**THEN** it should use a scraping service (Firecrawl or similar) to fetch the initial page content
**AND** extract structured content including text, links, and metadata

**WHEN** relevant sublinks are discovered (e.g., individual activity pages)
**THEN** the workflow should intelligently identify which links contain activity information
**AND** scrape those subpages to gather complete activity details
**AND** avoid scraping irrelevant pages (navigation, legal, etc.)

**WHEN** scraping each page for activity content
**THEN** the scraper should attempt to extract the following fields per activity:
- `name` (string, required)
- `description` (string, optional)
- `location` (object, optional):
  - `name` (string)
  - `formattedAddress` (string)
  - `street_address` (string, optional)
  - `city` (string, optional)
  - `state_province` (string, optional)
  - `postal_code` (string, optional)
  - `country_code` (string, optional - ISO 3166-1 alpha-2)
- `startDate` (string, optional - ISO date format)
- `endDate` (string, optional - ISO date format)
- `tags` (array of strings, optional)
- `imageURL` (string, optional - raw image URL before download)

**WHEN** extraction produces a roughly structured result
**THEN** the output should be a collection of activity objects with available fields populated
**AND** missing optional fields should be left undefined
**AND** the structure should be suitable for further standardization in the formatting step

**WHEN** scraping encounters errors (404, timeout, rate limits)
**THEN** the workflow should implement retry logic with exponential backoff
**AND** log failed URLs for manual review
**AND** continue processing other pages without failing the entire workflow

## Requirement 3: Data Standardization and Schema Formatting

**As a** workflow process
**I want to** standardize and format the roughly structured scraping results into the complete activities schema
**So that** each activity record conforms to the database schema with sensible defaults

### Acceptance Criteria

**WHEN** receiving roughly structured scraping results from Requirement 2
**THEN** the system should transform each activity into the full activities schema
**AND** apply the following sensible defaults:
- `urgency`: "medium" (if not specified)
- `isPublic`: true (if not specified)

**WHEN** formatting location data
**THEN** if location information exists in the scraping result
**AND** the system should ensure `location.name` and `location.formattedAddress` are populated
**AND** preserve any structured address fields (street_address, city, state_province, postal_code, country_code)
**AND** leave `placeId`, `latitude`, and `longitude` as undefined (to be filled by geocoding in Requirement 5)

**WHEN** formatting dates
**THEN** `startDate` and `endDate` should be validated as proper ISO date strings
**AND** invalid dates should be logged and left undefined

**WHEN** formatting tags
**THEN** tag arrays should be deduplicated
**AND** tags should be trimmed and normalized (lowercase)

**WHEN** an activity lacks a required field (name)
**THEN** the system should log a validation error
**AND** skip that activity
**AND** continue processing other activities

**WHEN** standardization completes
**THEN** each activity should conform to the partial schema:
```typescript
{
  name: string
  description?: string
  urgency: "low" | "medium" | "high"  // default: "medium"
  isPublic: boolean  // default: true
  location?: {
    name: string
    formattedAddress: string
    street_address?: string
    city?: string
    state_province?: string
    postal_code?: string
    country_code?: string
    // placeId, latitude, longitude to be added by geocoding step
  }
  startDate?: string
  endDate?: string
  tags?: string[]
  imageURL?: string  // raw URL, not yet downloaded
  // embedding and imageId to be added in later steps
}
```

## Requirement 4: Image Processing and Storage

**As a** workflow process
**I want to** download activity images and store them in Convex storage
**So that** each activity can reference its associated image

### Acceptance Criteria

**WHEN** an activity has an associated image URL
**THEN** the workflow should download the image
**AND** upload it to Convex storage using `ctx.storage`
**AND** obtain a storage ID reference

**WHEN** an image fails to download or is invalid
**THEN** the workflow should log the error
**AND** proceed without failing the entire activity record
**AND** leave the `imageId` field empty

**WHEN** multiple images are associated with one activity
**THEN** the workflow should prioritize the primary/featured image
**OR** select the highest quality image available

**IF** no image is found
**THEN** the activity should still be created with `imageId` as undefined

## Requirement 5: Address Geocoding and Location Processing

**As a** workflow process
**I want to** convert address strings into structured location data with coordinates
**So that** activities can support geospatial queries and map displays

### Acceptance Criteria

**WHEN** an activity has a location address string
**THEN** the workflow should use a geocoding service (Google Maps API or similar) to:

- Convert the address to latitude/longitude coordinates
- Extract structured address components (street, city, state, postal code, country)
- Obtain a Google Place ID if available
- Format the address as `formattedAddress`

**WHEN** geocoding fails or returns ambiguous results
**THEN** the workflow should log the issue
**AND** store the raw address string in `location.formattedAddress`
**AND** leave coordinate fields empty
**AND** continue processing the activity

**WHEN** no location information is found
**THEN** the `location` field should remain undefined

## Requirement 6: Text Embedding Generation

**As a** workflow process
**I want to** generate embeddings for activity content
**So that** activities support semantic search and recommendations

### Acceptance Criteria

**WHEN** an activity has been extracted and formatted
**THEN** the workflow should prepare embedding input by concatenating:

- Activity name
- Description
- Location name
- Formatted address
- Tags (space-separated)

**WHEN** embedding input is ready
**THEN** the workflow should batch multiple activities together for efficient processing
**AND** submit batch embedding requests to OpenAI (text-embedding-3-small model)
**AND** track the batch job status

**WHEN** batch embeddings complete
**THEN** the workflow should retrieve embedding vectors
**AND** merge them back with their corresponding activity records
**AND** ensure the embedding array matches the expected 1536 dimensions

**WHEN** embedding generation fails for specific activities
**THEN** those activities should be created without embeddings
**AND** the failure should be logged for retry or manual resolution

## Requirement 7: Data Merging and Output Generation

**As a** workflow process
**I want to** merge all processed data (images, geocoding, embeddings) into complete activity records
**So that** a final JSON-L output file contains all necessary information

### Acceptance Criteria

**WHEN** all processing steps complete for a batch of activities
**THEN** the workflow should merge:

- Original scraped content
- Storage IDs from uploaded images
- Geocoded location data with coordinates
- Embedding vectors from OpenAI

**WHEN** merging is complete
**THEN** each activity record should conform to the activities table schema:

```typescript
{
  name: string
  description?: string
  urgency: "low" | "medium" | "high"
  location?: {
    name: string
    placeId?: string
    formattedAddress: string
    latitude?: number
    longitude?: number
    street_address?: string
    city?: string
    state_province?: string
    postal_code?: string
    country_code?: string
  }
  endDate?: string
  isPublic?: boolean
  userId?: string
  tags?: string[]
  embedding?: number[]
  imageId?: Id<"_storage">
}
```

**WHEN** all activities are merged
**THEN** the workflow should generate a JSON-L file (one JSON object per line)
**AND** store or return the file location for import

## Requirement 8: Database Import

**As a** workflow process or developer
**I want to** import the final JSON-L output into the activities table
**So that** scraped activities become available in the application

### Acceptance Criteria

**WHEN** the JSON-L file is ready
**THEN** the workflow should either:

- Automatically import activities using batch mutations, OR
- Provide the file path/content for manual import via a separate script

**WHEN** importing activities
**THEN** each record should be inserted using the existing `createActivityDocument` internal mutation
**AND** geospatial indices should be updated for activities with coordinates

**WHEN** import encounters duplicate activities (same name/location)
**THEN** the system should implement a deduplication strategy:

- Skip duplicates, OR
- Update existing records, OR
- Add a suffix/version number

**WHEN** the import completes
**THEN** a summary should be logged showing:

- Total activities processed
- Successful imports
- Failed imports with reasons
- Duplicates skipped

## Requirement 9: Workflow Progress Tracking and Error Handling

**As a** developer monitoring the workflow
**I want to** track workflow progress and handle errors gracefully
**So that** I can understand what's happening and recover from failures

### Acceptance Criteria

**WHEN** the workflow is running
**THEN** progress should be trackable through Convex workflow status queries
**AND** each major step should log completion status

**WHEN** a step fails
**THEN** the workflow should implement appropriate retry strategies:

- Network errors: retry with exponential backoff
- Rate limits: pause and retry after delay
- Validation errors: skip and continue

**WHEN** a critical failure occurs (e.g., invalid workflow state)
**THEN** the workflow should be cancellable
**AND** partial results should be preserved where possible

**WHEN** the workflow completes (success or failure)
**THEN** a final status should be recorded with:

- Total execution time
- Activities successfully processed
- Errors encountered
- Output file location or import summary

## Requirement 10: Workflow Configuration and Customization

**As a** developer
**I want to** configure scraping behavior and pipeline options
**So that** the workflow can adapt to different website structures and requirements

### Acceptance Criteria

**WHEN** invoking the workflow
**THEN** optional configuration parameters should be supported:

- `maxDepth`: Maximum link depth to crawl (default: 2)
- `maxPages`: Maximum number of pages to scrape (default: 50)
- `autoImport`: Whether to automatically import to database (default: false)
- `urgencyDefault`: Default urgency level for activities (default: "medium")
- `isPublic`: Whether scraped activities should be public (default: true)

**WHEN** configuration is provided
**THEN** the workflow should validate parameters
**AND** apply them throughout the scraping and processing pipeline

**IF** configuration is invalid
**THEN** the workflow should fail fast with a clear error message before starting expensive operations

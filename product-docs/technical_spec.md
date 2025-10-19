# Technical Specification: QuoteScout

## 1. System Architecture

QuoteScout will be built on a modern, scalable cloud architecture to handle asynchronous tasks and intensive AI processing.

-   **Frontend:** A single-page application (SPA) built with React and TypeScript, styled with Tailwind CSS. All business logic will be handled by the backend.
-   **Backend:** A serverless architecture using Google Cloud Functions (or AWS Lambda). This is ideal for handling event-driven workflows like job submission and quote processing.
-   **Database:** Google Firestore (or Amazon DynamoDB). A NoSQL database is well-suited for the flexible, document-oriented structure of our data (jobs, quotes, users).
-   **File Storage:** Google Cloud Storage (or Amazon S3) for securely storing user-uploaded media (videos, photos). Files will be stored in private buckets with signed URLs for access.
-   **Task Queue:** Google Cloud Tasks (or Amazon SQS) to manage long-running, asynchronous operations like sending quote requests, scraping websites, and polling for email replies. This decouples the initial user request from the lengthy backend processing.
-   **Authentication:** Firebase Authentication to handle user sign-up, login, and session management.

### Architecture Flow:
1.  User uploads media via the React frontend to a secure Cloud Storage bucket.
2.  On successful upload, a Cloud Function is triggered with the job details.
3.  This "Orchestrator" function calls the Gemini API for scope generation.
4.  Once the scope is generated, the function places multiple tasks into the Task Queue—one for each contractor to contact.
5.  "Worker" Cloud Functions pick up these tasks, sending emails via a service like SendGrid or using a headless browser (Puppeteer on a Cloud Function) for web form submissions.
6.  A separate service monitors an inbox for replies. When a quote is received, it triggers a "Quote Processing" Cloud Function.
7.  This function uses Gemini to parse the quote, updates the Firestore database, and sends a notification to the user if enough quotes have been received.

## 2. Data Models (Firestore Collections)

### `users`
-   `userId` (string, doc ID)
-   `email` (string)
-   `phoneNumber` (string)
-   `preferredLanguage` (string, default: "en")
-   `createdAt` (timestamp)

### `jobs`
-   `jobId` (string, doc ID)
-   `userId` (string, ref to `users`)
-   `status` (string: "analyzing", "quoting", "review", "booked", "complete", "error")
-   `category` (string: "Plumbing", "Electrical", "HVAC", "Other")
-   `media` (array of objects: `{ url: string, type: 'video' | 'image' | 'audio' }`)
-   `userDescription` (string)
-   `generatedScope` (object: `{ summary: string, items: string[] }`)
-   `urgency` (string: "low", "medium", "high")
-   `location` (object: `{ address: string, zipCode: string }`)
-   `createdAt` (timestamp)
-   `updatedAt` (timestamp)

### `quotes`
-   `quoteId` (string, doc ID, sub-collection of `jobs`)
-   `contractorId` (string, ref to `contractors`)
-   `status` (string: "received", "parsed", "error")
-   `rawContent` (string) - The raw text of the email or OCR result.
-   `parsedData` (object: `{ totalCost: number, breakdown: object, timelineDays: number, warranty: string }`)
-   `isOutlier` (boolean)
-   `receivedAt` (timestamp)

### `contractors`
-   `contractorId` (string, doc ID)
-   `name` (string)
-   `contactEmail` (string)
-   `website` (string)
-   `license` (object: `{ number: string, status: 'valid' | 'expired' | 'not_found' }`)
-   `reviews` (object: `{ averageScore: number, source: string, summary: object }`)

## 3. Third-Party API & Service Integrations

-   **Google Gemini API:** The core AI engine. See `gemini_integration.md` for detailed implementation.
-   **SendGrid API:** For programmatically sending templated emails to contractors. We will use dedicated email addresses for this to catch replies.
-   **Twilio API:** For sending SMS notifications to users ("Your quotes are ready!") and potentially for text-based communication with contractors if they prefer it.
-   **Headless Browser Service:** A service like Browserless.io or a self-hosted Puppeteer instance running in a Cloud Function to handle submissions to contractor websites that lack email or API-based quote forms.
-   **Google Places API:** To find local contractors based on the user's location and retrieve initial review scores and website URLs.
-   **License Verification:** This will likely require building custom web scrapers for each state's contractor licensing board website, as few provide public APIs. This is a complex but critical feature.

## 4. Key Technical Considerations

-   **Long-Running Operations:** The core workflow (requesting and waiting for quotes) is asynchronous and can take days. The architecture must be stateless and rely on the task queue and database to manage state. The user must be kept informed via status updates in the UI and notifications.
-   **Email Parsing Reliability:** Parsing unstructured emails is challenging. We will rely heavily on Gemini's advanced reasoning, but we must have a fallback. If a quote fails to parse, it will be flagged for manual review by an internal operator.
-   **Security and Privacy:**
    -   All user media will be stored in a private bucket.
    -   PII (name, address, contact info) will not be shared with contractors until the user explicitly books a service. Initial requests will use a generic identifier (e.g., "Job #12345 in zipcode 90210").
    -   All API keys and secrets will be managed via a secret manager (e.g., Google Secret Manager).
-   **Scalability:** The serverless, event-driven architecture is inherently scalable. Firestore and Cloud Storage can handle massive scale with no configuration changes. The bottleneck will be the rate limits of third-party APIs and the number of concurrent headless browser instances we can run.
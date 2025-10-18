# Product Requirements Document: QuoteScout

## 1. Introduction

### 1.1. Problem
Getting quotes for home services (plumbing, HVAC, electrical) is a frustrating, opaque, and time-consuming process for homeowners. Key pain points include:
- **Time Sink:** Finding, contacting, and scheduling multiple contractors for estimates takes hours or days.
- **Lack of Clarity:** It's difficult to create an "apples-to-apples" comparison when quotes vary wildly in format, detail, and scope.
- **Uncertainty:** Homeowners often lack the expertise to know if a quote is fair, if the proposed work is necessary, or if a contractor is reputable.
- **Communication Barriers:** Describing a technical problem accurately can be challenging, leading to misunderstandings and incorrect initial estimates.

### 1.2. Solution
**QuoteScout** is an AI-powered agent that acts as a homeowner's personal project manager. By simply providing a short video or photos of the issue, the user delegates the entire quote-gathering process. QuoteScout analyzes the problem, sources bids from vetted professionals, normalizes the quotes into a simple side-by-side comparison, and facilitates booking.

### 1.3. Vision
To become the most trusted and efficient way for homeowners to manage any home repair or renovation, removing friction and bringing transparency to the home services industry.

### 1.4. Target Audience
- **Homeowners:** Primary users who need repairs or plan renovations.
- **Property Managers:** Professionals who manage multiple properties and require an efficient way to handle maintenance requests.

---

## 2. User Personas

### 2.1. Priya, the Busy Professional
- **Demographics:** 35, urban professional, homeowner.
- **Goals:** Wants problems solved with minimal personal time investment. Values convenience, reliability, and clear communication.
- **Frustrations:** Hates coordinating schedules, chasing contractors for callbacks, and deciphering jargon-filled quotes.
- **QuoteScout Value:** "I can record a 30-second video of my leaky faucet during my coffee break and have 3 vetted, comparable quotes waiting for me by evening. It's a huge time-saver."

### 2.2. Mark, the First-Time Homeowner
- **Demographics:** 28, recently purchased his first home.
- **Goals:** Wants to make smart, cost-effective decisions. Needs guidance and feels anxious about being taken advantage of.
- **Frustrations:** Doesn't know what a "fair price" is. Overwhelmed by the number of choices and technical details.
- **QuoteScout Value:** "The app not only got me quotes but also showed me review summaries and red-flagged an unusually high bid. I feel much more confident in my decision."

---

## 3. Core Features (MVP)

### F1: Multimodal Job Submission
- **Description:** The user initiates a new service request by providing media and a brief description.
- **Requirements:**
    - User can record or upload a video or audio (up to 60 seconds).
    - User can upload up to 5 photos.
    - User can add a voice note or text description.
    - The interface will be media-first, guiding the user to "show, not just tell."

### F2: AI-Powered Scope Generation
- **Description:** The Gemini-powered agent analyzes the user's input to understand the problem and create a standardized job description.
- **Requirements:**
    - ISSUE CLASSIFIER + SCOPE IDENTIFIER
    - Analyze video, images, and audio/text to identify the core issue AND SEVERITY + OTHER DETAILS (I.E. HOW BIG, MANY ROOMS, AUTOFILL URGENCY BUT TAKE USER INPUT).
    - Classify the job into a primary category (e.g., Plumbing, Electrical, HVAC).
    - Generate a concise, standardized "Scope of Work" that can be sent to contractors.
    - Assess and flag potential urgency (e.g., active water leak).
    - GENERATE ASSETS -> Auto-generate detailed scope-of-work PDFs with annotated photos, measurements, and clear descriptions

### F3: Automated Quote Requesting
- **Description:** The agent sends the generated scope of work to a curated list of local service providers.
- **Requirements:**
    - Identify top-rated local providers using integrated databases or web scraping.
    - Automatically pre-fill online quote forms or dispatch templated emails with the job scope and media. (TaskRabbit & Thumbtack)
    - The user's personal contact information remains anonymous until they choose to book.
    - REACH OUT WHERE NECESSARY ON BEHALF OF THE USER THROUGH TEXT, PHONE CALL, OR EMAIL

### F4: Quote Normalization & Comparison
- **Description:** The agent receives quotes in various formats (email, PDF, text), extracts the key data, and presents it in a uniform, easy-to-understand format.
- **Requirements:**
    - Ingest quotes via email parsing and OCR for images/PDFs.
    - Extract key data points: Total Cost, Labor/Materials Breakdown, Estimated Timeline, Warranty Information.
    - Display up to 3 quotes in a clean, side-by-side comparison UI.
    - Red-flag quotes that are significant outliers (either too high or too low).
    - KEEP TRACK OF REVIEWS AND SCORES TO PROVIDE TO USER AT THE END

### F5: Automated Contractor Vetting
- **Description:** The agent provides crucial trust and safety information for each bidding contractor.
- **Requirements:**
    - Automatically check for valid state/local licenses.
    - Aggregate review scores from multiple platforms (Google, Yelp, etc.).
    - Generate a summary of recent positive and negative review themes.

### F6: Assets Generation for User
- **Description:** Generates videos (with generated music) and graphics of the side by side comparisons of options (tradeoffs, etc.) to make it easy to understand and in native tongue -> language agnostic (in spanish or korean)
- **Implementation:** Create these assets and put it in their Google Drive (GSuite integration)

### F7: One-Tap Booking
- **Description:** Once the user selects a quote, the agent handles the initial scheduling communication.
- **Requirements:**
    - User can select their preferred quote with a single tap.
    - The agent sends an automated confirmation to the chosen contractor to schedule the appointment.
    - The app displays the confirmed appointment details to the user.

### *F8: AUTOMATED BOOKING
- **Description:** Take users gogole calendar or let user provide time windows and dates that would work and then the user books on behalf of the user in their availability and sends an email or some update to indicate it's been scheduled. (INTEGRATE WITH GOOGLE CALENDAR - GSUITE)


### THE MAIN PAGE SHOULD BE A DASHBOARD WITH LIVE BIDS (ROLLING) WITH COMPARISONS -> ETC. (ASSETS GET UPDATED IN REAL TIME)
  - Generate real-time visual comparisons as quotes come in
  - Create risk/quality matrices with contractor photos and ratings
  - Generate "red flag" warning graphics for suspicious quotes

---
**EXAMPLE DEMO:**  Live video of a plumbing issue → instant analysis → auto-generated scope document → mock quotes → visual comparison is incredibly satisfying to watch
---

## 4. User Flow (MVP)

1.  **Job Creation:** User opens the app and taps "Get a Quote."
2.  **Capture:** A camera interface opens. The user records a video, takes photos, and adds a quick note.
3.  **Processing:** An engaging loading screen shows the agent's progress: "Analyzing issue...", "Finding top pros...", "Requesting quotes..." This screen manages expectations, noting it may take 24-48 hours.
4.  **Notification:** User receives a push notification: "Your quotes are ready for review!"
5.  **Review:** The user opens the app to the comparison screen, where they can see the normalized quotes, vetting info, and review summaries.
6.  **COmparison:** Generate assets that help the user compare and understand tradeoffs
6.  **Book:** The user taps "Book This Pro" on their chosen option.
7.  **Confirmation:** The app confirms the booking and provides all necessary details for the upcoming service appointment.

---

## 5. Post-MVP Features (V2.0 and Beyond)

- **Automated Negotiation:** Agent can intelligently email a higher bidder to see if they can match a competitor's price for the same scope.
- **Advanced Sensing & BoQ:** Integrate with phone LiDAR/ARKit to capture measurements and generate a detailed Bill of Quantities (BoQ).
- **Payment Integration:** Allow users to securely pay contractors through the app.

---

## 6. Success Metrics

- **Primary:**
    - **Job-to-Booking Conversion Rate:** Percentage of created jobs that result in a confirmed booking.
    - **User Satisfaction (NPS):** How likely users are to recommend QuoteScout.
- **Secondary:**
    - **Time-to-First-Quote:** Average time from job submission to the first quote being ready for review.
    - **User Retention:** Percentage of users who return for a second job within 6 months.
    - **Quote Acceptance Rate:** Percentage of quotes presented that are accepted by users.

# UX/UI Design Principles: QuoteScout

## 1. Core Philosophy: Effortless Clarity

The user is often stressed and uncertain when they open our app. Our primary goal is to replace that anxiety with a sense of control and clarity. Every screen, interaction, and piece of text should contribute to making a complex process feel effortless and transparent. We are not just a tool; we are a trusted advisor.

## 2. Design Language & Aesthetics

-   **Palette:**
    -   **Primary:** A calming, trustworthy blue (`#3B82F6`) for primary actions and headers.
    -   **Neutral:** A range of soft grays (`#F3F4F6`, `#D1D5DB`, `#6B7280`) for backgrounds, containers, and body text.
    -   **Accent:** A vibrant, optimistic orange (`#F97316`) for key calls-to-action (like "Book Now") and highlighting important information.
    -   **System:** Green for success, red for errors/warnings.
-   **Typography:**
    -   **Font:** A clean, legible, and modern sans-serif like Inter or Figtree.
    -   **Hierarchy:** Clear and consistent type scale to distinguish between headers, sub-headers, and body content. Ensure ample line height for readability.
-   **Iconography:**
    -   Use a single, high-quality icon set (e.g., Heroicons).
    -   Icons should be simple, universally understood, and used to reinforce meaning, not replace text.
-   **Imagery:**
    -   Avoid sterile stock photos. Use custom illustrations that are friendly and reassuring, especially during loading and onboarding screens.

## 3. Key UI Components & Interaction Patterns

### The "Magic" Upload
-   The very first screen after onboarding should be a prominent button to "Start a New Job."
-   This leads directly to a camera-first interface. The UI should be minimal, focusing the user on the task of capturing the problem.
-   A simple toggle between Video and Photo mode. Clear, friendly instructions on screen: "Show us the problem. A 30-second video works best!"

### The Transparent Waiting Period
-   **Problem:** The wait for quotes is the most challenging part of the UX.
-   **Solution:** Don't just show a generic loading spinner. Create an engaging "Agent Status" screen.
-   Use animated illustrations and a checklist of actions to show what the AI is doing in real-time (or simulated real-time):
    -   [✔] Video analysis complete.
    -   [✔] Scope of work generated.
    -   [In Progress] Finding top-rated pros in your area...
    -   [Queued] Sending out quote requests.
-   This turns a passive wait into an active, transparent process, building trust and managing expectations.

### The Side-by-Side Comparison
-   This is the most critical screen in the app. Clarity and scannability are paramount.
-   **Layout:** Use a card-based system, with each card representing a contractor's quote. On mobile, users can swipe horizontally between them. On desktop, they appear side-by-side.
-   **Key Data First:** The most important comparison points must be "above the fold" on each card:
    1.  **Contractor Name & Overall Review Score**
    2.  **Total Price** (prominently displayed)
    3.  **Estimated Timeline**
-   **Visual Cues:** Use "badges" or tags to call out key differentiators: "Best Value," "Fastest Availability," "Top Rated."
-   **Drill Down:** Users can tap a card to expand it, revealing the detailed cost breakdown, warranty info, and the full review summary (positives and negatives).

## 4. Tone of Voice & Copywriting

-   **Helpful & Reassuring:** The language should be simple, direct, and empathetic. Acknowledge that home repairs can be stressful.
    -   *Instead of:* "Submit Media" -> *Use:* "Show Us the Problem"
    -   *Instead of:* "Processing..." -> *Use:* "Your AI agent is on the case!"
-   **Professional, Not Robotic:** While the service is AI-powered, the tone should be human. Avoid overly technical jargon.
-   **Action-Oriented:** Buttons and links should have clear, predictable actions. "Review Quotes," "Book This Pro," "See Details."

## 5. Accessibility (WCAG 2.1 AA)

-   **Contrast:** Ensure all text-to-background color combinations meet or exceed contrast ratio requirements.
-   **Dynamic Type:** The UI must be legible and functional when users increase their system font size.
-   **Semantics:** Use proper HTML semantics (or equivalent in native apps) so screen readers can navigate the app logically.
-   **Touch Targets:** All interactive elements must have a minimum touch target size of 44x44px.

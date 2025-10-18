
# Gemini API Integration Guide: QuoteScout

This document provides developers with the specific models, prompts, and configurations required to implement the core AI features of QuoteScout using the Google Gemini API. All calls should be made from a secure backend service.

## 1. Feature: Scope Generation from Multimodal Input

This is the most complex AI task, combining video, image, and text understanding to generate a structured scope of work.

-   **Model:** `gemini-2.5-pro` (Required for its advanced multimodal reasoning capabilities).
-   **API Call:** `ai.models.generateContent`
-   **Inputs (`contents`):** An array of parts, including the video, all images, and the user's text description.
    ```json
    {
      "parts": [
        { "inlineData": { "mimeType": "video/mp4", "data": "..." } },
        { "inlineData": { "mimeType": "image/jpeg", "data": "..." } },
        { "inlineData": { "mimeType": "image/jpeg", "data": "..." } },
        { "text": "User description: The pipe under my kitchen sink is dripping constantly and there's some water damage on the cabinet floor." }
      ]
    }
    ```
-   **Configuration (`config`):**
    ```json
    {
      "responseMimeType": "application/json",
      "responseSchema": {
        "type": "OBJECT",
        "properties": {
          "category": { "type": "STRING", "enum": ["Plumbing", "Electrical", "HVAC", "Roofing", "Other"] },
          "problemSummary": { "type": "STRING", "description": "A one-sentence summary of the core issue." },
          "scopeItems": {
            "type": "ARRAY",
            "items": { "type": "STRING" },
            "description": "A list of specific tasks a contractor would need to perform."
          },
          "urgency": { "type": "STRING", "enum": ["Low", "Medium", "High", "Critical"], "description": "Assess the urgency based on visual evidence like active leaks, exposed wires, etc." }
        }
      }
    }
    ```
-   **System Instruction (Prompt):**
    > You are an expert home services estimator for an app called QuoteScout. Your task is to analyze the provided video, images, and user description of a home repair issue. Based on all available information, accurately classify the job, identify the key tasks required for the repair, and assess the situation's urgency. Return the output in the specified JSON format. The `scopeItems` should be clear, concise, and suitable for a contractor to provide a preliminary quote.

## 2. Feature: Quote Data Extraction

This feature parses unstructured text from emails, PDFs, or handwritten notes into a structured format.

-   **Model:** `gemini-2.5-pro` (For accuracy with varied and messy inputs).
-   **API Call:** `ai.models.generateContent`
-   **Inputs (`contents`):** A single text part containing the full text from the quote.
    ```json
    { "parts": [{ "text": "Quote from PlumbPerfect... Total: $450. Labor $200, Parts (copper pipe, valve) $150... We can start next Tuesday..." }] }
    ```
-   **Configuration (`config`):**
    ```json
    {
      "responseMimeType": "application/json",
      "responseSchema": {
        "type": "OBJECT",
        "properties": {
          "totalCost": { "type": "NUMBER", "description": "The final total cost including all taxes and fees." },
          "laborCost": { "type": "NUMBER", "description": "The cost of labor, if specified." },
          "materialsCost": { "type": "NUMBER", "description": "The cost of materials, if specified." },
          "timeline": { "type": "STRING", "description": "A brief summary of the project timeline or start date." },
          "warranty": { "type": "STRING", "description": "Details of any warranty on labor or parts." }
        }
      }
    }
    ```
-   **System Instruction (Prompt):**
    > You are a data extraction specialist. Your task is to parse the provided text from a contractor's quote and extract the key financial and logistical details. Populate the specified JSON schema. If a field is not explicitly mentioned in the text, use a value of `null`. Be precise with numerical values.

## 3. Feature: Review Summarization

This feature provides the user with a quick, balanced overview of a contractor's reputation.

-   **Model:** `gemini-2.5-flash` (Faster and more cost-effective for summarization tasks).
-   **API Call:** `ai.models.generateContent`
-   **Inputs (`contents`):** A single text part containing a collection of raw review texts.
    ```json
    { "parts": [{ "text": "Review 1: They were on time and professional... Review 2: A bit expensive, but the work was top-notch... Review 3: They left a mess and I had to call them back..." }] }
    ```
-   **Configuration (`config`):**
    ```json
    {
      "responseMimeType": "application/json",
      "responseSchema": {
        "type": "OBJECT",
        "properties": {
          "positiveThemes": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "A list of 3 distinct positive themes or keywords mentioned frequently (e.g., 'Punctual', 'Professional', 'Clean Work')." },
          "negativeThemes": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "A list of 3 distinct negative themes or keywords (e.g., 'Expensive', 'Poor Communication', 'Messy')." },
          "summary": { "type": "STRING", "description": "A neutral, one-to-two sentence summary of the overall sentiment." }
        }
      }
    }
    ```
-   **System Instruction (Prompt):**
    > You are a review analysis agent. Analyze the provided collection of customer reviews for a contractor. Identify the most common recurring positive and negative themes. Provide a balanced and neutral overall summary. Structure your output in the specified JSON format.

## 4. Feature: Multilingual Comparison Generation (Post-MVP)

This is a two-step process: first generate a script, then use that to generate a visual.

-   **Step 1: Generate Script**
    -   **Model:** `gemini-2.5-flash`
    -   **Prompt:**
        > You are a helpful assistant for homeowners. Given these three structured quotes: [Insert Quote JSON 1, 2, 3], write a simple, bullet-point script that compares them on: 1. Total Cost, 2. Timeline, and 3. Review Score. Highlight the best option for each category. Finally, translate the entire script into [user.preferredLanguage].

-   **Step 2: Generate Visual**
    -   **Model:** `gemini-2.5-flash-image`
    -   **API Call:** `ai.models.generateContent`
    -   **Prompt:**
        > Create a clean and simple visual comparison chart based on this text: [Insert translated script from Step 1]. Use icons for cost (dollar signs), time (a clock), and reviews (stars).
    -   **Configuration (`config`):**
        ```json
        {
          "responseModalities": ["IMAGE"]
        }
        ```
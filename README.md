# Lexi Chatbot

A simple, functional AI chatbot interface built with React and Tailwind CSS, designed as a legal assistant ("Lexi"). It features user/bot message display, typing indicators, auto-growing input, and dedicated handling for displaying and detailing citations from a backend API.

**Note:** This repository contains the frontend UI component. It requires a separate backend API (like the FastAPI endpoint mentioned) to provide the chat responses and citations.

## Features

*   **User & Bot Messages:** Clearly distinguishes between user inputs and AI responses.
*   **Typing Indicator:** Shows when the bot is generating a response.
*   **Dynamic Textarea:** Input area auto-adjusts height based on content up to a maximum, then becomes scrollable.
*   **Citation Display:** Bot messages can display numbered citation links if provided by the backend.
*   **Citation Modal:** Clicking a citation link opens a modal showing the full citation text and source.
*   **Basic Message Actions:** Placeholder buttons for Copy, Like, Dislike, and Share.
*   **Responsive Design:** Built with Tailwind CSS for a flexible layout.
*   **Legal-themed UI:** Custom branding and icons related to law.

## Technologies Used

*   **Frontend:**
    *   React
    *   Tailwind CSS
    *   Lucide React (for icons)
*   **Backend (Required, but not included in this repo):**
    *   FastAPI (as discussed in the chat)
    *   Python
    *   Uvicorn (or similar ASGI server)
    *   Your chosen AI/Legal processing logic

## Setup

### Prerequisites

*   Node.js and npm or yarn installed.
*   Python and pip installed (for the backend).
*   A project directory set up for your React application.
*   A project directory set up for your FastAPI backend (separate from the frontend).

### Frontend Setup

1.  Navigate to your React project directory in your terminal.
2.  Install the necessary dependencies:

    ```bash
    npm install react lucide-react tailwindcss
    # or
    yarn add react lucide-react tailwindcss
    ```

3.  **Configure Tailwind CSS:**
    *   If you haven't already, initialize Tailwind CSS in your project:
        ```bash
        npx tailwindcss init -p
        ```
    *   Configure your `tailwind.config.js` file to scan your component files for classes:

        ```javascript
        // tailwind.config.js
        module.exports = {
          content: [
            "./src/**/*.{js,jsx,ts,tsx}", // Adjust if your file structure is different
          ],
          theme: {
            extend: {
              fontFamily: {
                inter: ['Inter', 'sans-serif'], // Add Inter font if you're using it
              },
            },
          },
          plugins: [],
        }
        ```
    *   Add the Tailwind directives to your main CSS file (e.g., `src/index.css` or `src/App.css`):

        ```css
        /* Your main CSS file */
        @tailwind base;
        @tailwind components;
        @tailwind utilities;
        ```

4.  Place the `LexiChatbot.js` component file (containing the code from our chat) into your components directory (e.g., `src/components/LexiChatbot.js`).
5.  Import and use the `LexiChatbot` component within your main application file (e.g., `src/App.js`):

    ```jsx
    // src/App.js
    import React from 'react';
    import LexiChatbot from './components/LexiChatbot'; // Adjust path as needed
    import './index.css'; // Make sure your main CSS is imported

    function App() {
      return (
        <div className="App">
          <LexiChatbot />
        </div>
      );
    }

    export default App;
    ```

### Backend Setup (Conceptual)

You need a backend API that can process user queries and return a response in a specific JSON format.

1.  Navigate to your backend project directory.
2.  Create a Python virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate # On Windows use `venv\Scripts\activate`
    ```
3.  Install FastAPI and Uvicorn:
    ```bash
    pip install fastapi uvicorn
    ```
4.  Create a FastAPI application file (e.g., `main.py`) with an endpoint that matches the frontend's fetch request (`http://127.0.0.1:8000/query`).
    *   This endpoint should accept a POST request with a JSON body like `{"query": "User's question"}`.
    *   It **must** return a JSON response in the format:
        ```json
        {
          "answer": "The AI generated response text, potentially including citation numbers like [1].",
          "citations": [
            {
              "text": "Full text of the citation.",
              "source": "Source information (e.g., filename, case name)."
            },
            // ... more citation objects
          ]
        }
        ```
    *   Remember to add CORS middleware to your FastAPI app to allow the frontend (running on a different port, usually 3000) to make requests.

    ```python
    # main.py (Example Structure - Implementation needed)
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel

    app = FastAPI()

    # Add CORS middleware
    origins = [
        "http://localhost:3000",  # Replace with your frontend's URL
        # Add other origins if needed
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class QueryRequest(BaseModel):
        query: str

    class Citation(BaseModel):
        text: str
        source: str

    class QueryResponse(BaseModel):
        answer: str
        citations: list[Citation] = []

    @app.post("/query", response_model=QueryResponse)
    async def process_query(request: QueryRequest):
        user_query = request.query

        # --- Your Legal AI Logic Goes Here ---
        # Process user_query
        # Generate an answer string
        # Find relevant citations (list of Citation objects)
        # For demonstration:
        answer = f"You asked about: {user_query}. Based on the Electricity Act, 2003, Section 26 [1], matters regarding defective meters must involve the Electrical Inspector for dispute resolution. The report of the Inspector is essential [2]."
        citations = [
            {"text": "Electricity Act, 2003 Section 26 Defective meter - Penalty - If there was a dispute regarding the meter, the matter was to be decided by the Electrical Inspector - His report was essential to determine the extent of energy supplied to the consumer to ascertain the liability", "source": "Source [Dakshin Haryana Vs Nestor.pdf] - Citation 1"},
            {"text": "Besides, the provisions of Section 26(6) of the Act have also been violated. According to this section, if there was a dispute regarding the meter, the matter was to be decided upon an application of either of the parties by the Electrical Inspector. His report was essentially to determine the extent of the amount of energy supplied to the c", "source": "Source [Dakshin Haryana Vs Nestor.pdf] - Citation 2"}
        ]
        # --- End of Your Legal AI Logic ---


        return QueryResponse(answer=answer, citations=citations)

    # You would also typically have a root endpoint
    @app.get("/")
    async def read_root():
        return {"message": "Lexi Chatbot Backend is running"}
    ```

## How to Run

1.  **Start the Backend:**
    *   Navigate to your backend directory.
    *   Activate your virtual environment (`source venv/bin/activate` or `venv\Scripts\activate`).
    *   Run the FastAPI server (assuming your main file is `main.py` and the app instance is named `app`):
        ```bash
        uvicorn main:app --reload
        ```
    *   The backend should start, usually at `http://127.0.0.1:8000`.

2.  **Start the Frontend:**
    *   Navigate to your React project directory.
    *   Start the development server:
        ```bash
        npm start
        # or
        yarn start
        ```
    *   The frontend should open in your browser, usually at `http://localhost:3000`.

3.  Ensure both the frontend and backend servers are running simultaneously.

## How to Use

1.  Open the frontend application in your web browser (`http://localhost:3000`).
2.  Type your legal question into the input box at the bottom.
3.  Press `Enter` to send your message (or `Shift + Enter` for a new line).
4.  The bot will display a typing indicator while it processes the query.
5.  Once the response is received, the bot's answer will appear.
6.  If the response includes citations, you will see numbered links (e.g., `[1]`, `[2]`) below the message.
7.  Click on a citation number to open a modal showing the full text and source of that citation.
8.  You can continue typing and sending more messages.

## API Endpoint

The frontend communicates with the backend using a POST request to:

`POST http://127.0.0.1:8000/query`

**Request Body:**

```json
{
  "query": "string"
}
Response Body:
Generated json
{
  "answer": "string",
  "citations": [
    {
      "text": "string",
      "source": "string"
    }
  ]
}

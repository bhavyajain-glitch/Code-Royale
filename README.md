# Code Battle - Real-time Coding Challenge

[Live Demo Link Here - You'll add this after deploying]

![Screenshot of the Code Battle application in action]

A full-stack, real-time web application where two users can compete head-to-head to solve coding problems. The first to submit a correct solution wins, and results are tracked on a persistent leaderboard. This project was built in a single weekend.

---
## **Features**

* **Secure User Authentication:** Users can sign up and log in using Firebase Authentication.
* **Real-time Matchmaking:** Players can create a unique room and share the ID to battle a friend.
* **Live Code Editor:** A in-browser code editor with Python syntax highlighting.
* **External Code Execution:** User-submitted code is securely executed using the Judge0 API.
* **Persistent Leaderboard:** User scores are stored in a Firestore database and displayed in a ranked leaderboard.

---
## **Tech Stack**

* **Frontend:** React (Vite), Socket.IO Client, Axios
* **Backend:** Node.js, Express, Socket.IO
* **Database:** Google Firestore
* **Authentication:** Firebase Authentication
* **Code Execution API:** Judge0

---
## **How to Run Locally**

1.  **Prerequisites:** You will need Node.js, a Firebase project with Authentication and Firestore enabled, and a RapidAPI account with a key for the Judge0 API.

2.  **Clone the repository:**
    ```bash
    git clone [your-repo-url]
    ```
3.  **Setup Backend:**
    ```bash
    cd backend
    npm install
    # Create a .env file with your PORT, RAPIDAPI_KEY
    # Add your serviceAccountKey.json from Firebase
    npm run dev
    ```
4.  **Setup Frontend:**
    ```bash
    cd frontend
    npm install
    # Add your Firebase config to src/firebase.js
    npm run dev
    ```
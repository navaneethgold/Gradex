# GradeX - Smart AI Quiz Platform 🚀

**GradeX** (formerly QuizBuzz) is a modern, AI-powered educational platform designed to streamline the examination process. It features real-time analytics, AI-assisted question generation, manual exam creation, and a comprehensive student leaderboard.

![GradeX Banner](https://via.placeholder.com/1200x300?text=GradeX+Smart+Quiz+Platform)

## ✨ Key Features

### 🧠 AI-Powered Exam Creation
*   **Gemini AI Integration**: Automatically generate diverse question sets based on provided topics or uploaded study materials.
*   **PDF Analysis**: Upload PDF documents to extract content and generate relevant questions instantly.
*   **Smart Validation**: Prevents duplicate questions and ensures content quality.

### 📝 Comprehensive Exam Interface
*   **Flexible Question Types**: Support for Multiple Choice (MCQ), Fill in the Blanks, and Descriptive questions.
*   **Timer & Auto-Submit**: Intelligent timer with urgency effects (blinking red) when time is critical [< 20% remaining].
*   **Secure Environment**: Full-screen mode encouragement and blur warnings to prevent cheating.
*   **Real-time Feedback**: Instant submission status and error handling via toast notifications.

### 📊 Advanced Analytics & Leaderboard
*   **Live Leaderboard**: Real-time ranking system with Gold, Silver, and Bronze badges for top performers.
*   **Performance Metrics**: Track accuracy, time taken, and unattempted questions for deep insights.
*   **Visual Charts**: Interactive graphs to visualize student performance trends.

### 🎨 Modern & Responsive UI/UX
*   **Theme Awareness**: Fully supported **Light** and **Dark** modes with smooth transitions.
*   **Glassmorphism Design**: Sleek, modern interface with translucent cards and blurry backgrounds.
*   **Mobile Optimised**: Fully responsive design for seamless usage on tablets and smartphones.
*   **Custom Branding**: Elegant typography using "Imperial Script" and "Outfit" fonts.

---

## 🛠️ Tech Stack

### Frontend
*   **React.js**: For building a dynamic and reactive user interface.
*   **Vite**: Next-generation frontend tooling for fast builds.
*   **Framer Motion**: For smooth, professional animations and transitions.
*   **Axios**: For efficient HTTP requests to the backend.
*   **React Toastify**: For elegant user notifications.
*   **CSS Variables**: For robust theming and consistent styling.

### Backend
*   **Node.js & Express**: Robust server-side framework.
*   **MongoDB & Mongoose**: Flexible NoSQL database for storing user data, exams, and analytics.
*   **JWT (JSON Web Tokens)**: Secure user authentication and session management.
*   **Gemini AI API**: For generative AI capabilities.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v14 or higher)
*   MongoDB installed locally or a Cloud Atlas connection string.

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/smart-quiz-app.git
    cd smart-quiz-app
    ```

2.  **Setup Backend**
    ```bash
    cd Backend
    npm install
    # Create a .env file with:
    # PORT=3000
    # MONGO_URI=your_mongodb_uri
    # JWT_SECRET=your_jwt_secret
    # GEMINI_API_KEY=your_gemini_key
    npm start
    ```

3.  **Setup Frontend**
    ```bash
    cd Frontend/QuizBuzz
    npm install
    # Create a .env file with:
    # VITE_API_BASE_URL=http://localhost:3000
    npm run dev
    ```

4.  **Access the App**
    Open `http://localhost:5173` in your browser.

---

## 📸 Screenshots

*   **Dashboard**: Clean interface to manage exams and classes.
*   **Exam Mode**: Distraction-free environment with urgent timer alerts.
*   **Leaderboard**: Gamified ranking to encourage competition.

---

## 🤝 Contribution

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

---

**Built with ❤️ by [Your Name]**
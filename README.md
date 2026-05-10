# 🌱 CARBONIQ

CARBONIQ is a full-stack web application designed for intelligent carbon emission analysis and prediction.  
It combines a modern frontend interface with a powerful Node.js backend and AI-powered services.

---



## 🚀 Features

- 🌍 Carbon emission analysis system  
- 🤖 AI-powered backend (Groq integration)  
- 🔐 Middleware-based request handling  
- 📡 REST API architecture  
- 🎨 Clean and responsive frontend UI  
- ⚙️ Modular backend structure  

---

## 🛠️ Tech Stack

### Backend
- Node.js  
- Express.js  
- Groq API  


### Frontend
- HTML5  
- CSS3  
- JavaScript  

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/CARBONIQ.git
cd CARBONIQ
```

---

### 2️⃣ Setup Backend

```bash
cd backend_groq_final
npm install
```

Create a `.env` file inside `backend_groq_final/` and add:

```
PORT=5000
GROQ_API_KEY=your_api_key_here
```

Start the server:

```bash
npm start
```

Or (if using nodemon):

```bash
npm run dev
```

---

### 3️⃣ Run Frontend

Open:

```
frontend/index.html
```

in your browser  
OR connect it to your running backend server.

---

## 📡 API Structure

- Routes → `/routes`
- Business Logic → `/services`
- Middleware → `/middleware`
- Configuration → `/config`

Server Entry Point:
```
backend_groq_final/server.js
```

---

## 🔮 Future Improvements

- Database integration (MongoDB / PostgreSQL)
- User authentication system
- Deployment (Render / Vercel / AWS)
- Advanced analytics dashboard
- Real-time emission tracking

---

## 👨‍💻 Author

Pamula Sai Shashank Pandu  
B.Tech – Computer Science Engineering  

---

## 📜 License

This project is developed for academic and research purposes.

# College Event Registration System

## 🎯 Objective

To simplify college event registration, reduce duplicate entries, manage participant limits, and provide administrators with a centralized registration management system.

## 📌 Project Description

The College Event Registration System is a web-based application that allows students to view college events and register online by submitting their details and uploading their student ID cards. An authenticated admin dashboard helps administrators manage registrations efficiently.

## ✨ Features

* View available college events.
* Register for technical and cultural events.
* Upload student ID cards.
* Prevent duplicate registrations.
* Check event participant capacity.
* Admin login and logout authentication.
* Search registrations by register number.
* Filter registrations by event.
* View uploaded ID cards.
* Delete registrations.

## 🛠️ Technologies Used

* **Frontend:** HTML, CSS, JavaScript
* **Backend:** Node.js, Express.js
* **Database:** MongoDB
* **ODM:** Mongoose
* **File Upload:** Multer
* **Authentication:** Express Session

## 📂 Project Structure

```text
CollegeEventApp/
├── models/
│   ├── Event.js
│   └── Registration.js
├── public/
│   ├── index.html
│   ├── events.html
│   ├── register.html
│   ├── admin.html
│   ├── admin-login.html
│   └── style.css
├── uploads/
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

## ⚙️ Installation and Setup

### 1. Install dependencies

Make sure Node.js and MongoDB Community Server are installed.

Open the terminal in the project folder and run:

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/CollegeEventDB
PORT=5000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
SESSION_SECRET=replace_with_a_long_random_secret
```

Use your own admin password and session secret. Do not upload `.env` to GitHub.

### 3. Start MongoDB

Ensure your MongoDB service is running.

### 4. Run the application

```bash
node server.js
```

### 5. Open the application

Visit the following address in your browser:

* **Home page:** http://localhost:5000
* **Admin login:** http://localhost:5000/admin-login

## 🗄️ Database

The application uses MongoDB with the database name `CollegeEventDB`.

Collections:

* `events` – stores event information.
* `registrations` – stores student registration details and uploaded ID card paths.

## 🔐 Security Notes

* Keep `.env` private.
* Do not commit `node_modules/` or actual student ID card uploads.
* Use a strong admin password and session secret.
* This project is intended for academic demonstration; production deployment requires additional security measures.



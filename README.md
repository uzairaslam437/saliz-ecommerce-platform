# 🛒 Saliz E-Commerce Backend API

A scalable, secure, and modular **Node.js + Express.js** backend application for an eCommerce platform. Built with **PostgreSQL**, JWT authentication, and structured for modern REST API development.

---

## 🚀 Features

- User authentication and authorization (JWT-based)
- Vendor management (add/edit products)
- Product catalog with full-text search
- Shopping cart (user-specific)
- Order management (create, track, update)
- Payment integration ready (Stripe)
- Centralized error handling & validation
- CORS configuration
- Secure route protection
- Rate limiting for critical endpoints

---

## 🛠️ Tech Stack

| Layer       | Tech                   |
|-------------|------------------------|
| Language    | Node.js, JavaScript    |
| Framework   | Express.js             |
| Database    | PostgreSQL             |
| Auth        | JWT (JSON Web Tokens)  |
| Validation  | express-validator      |
| Payment     | Stripe (planned)       |
| Search      | PostgreSQL Full Text Search |
| Tools       | Nodemon, pg, dotenv    |

---

## 📁 Project Structure

saliz-ecommerce-app/
│
├── backend/
│ ├── controllers/
│ ├── middlewares/
│ ├── model/
│ ├── routes/
│ ├── util/
│ ├── .env
│ ├── index.js
│ └── README.md


---

## 📦 Installation

1. **Clone the repository**
   git clone https://github.com/your-username/saliz-ecommerce-app.git
   cd saliz-ecommerce-app/backend

2. **Install Dependencies**

    npm install

3. **Configure environment variables**

    PORT=5000
    DB_USER=your_pg_user
    DB_PASSWORD=your_pg_password
    DB_NAME=salizdb
    DB_HOST=localhost
    JWT_SECRET=your_jwt_secret
   
5. **Run Application**

   nodemon index.js


👨‍💻 Author
Uzair Aslam
Backend Developer
---

Let me know if you’d like to:
- Generate API docs from Swagger/OpenAPI
- Auto-deploy this backend using Render or Railway
- Add environment-specific config and `.env.example` file

Happy to help with that too!

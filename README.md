# 🎓 E-Learning LMS — MERN Stack Learning Management System

A full-stack **Learning Management System (LMS)** built with the MERN stack, designed to support realistic course creation, video learning, secure paid enrollment, progress tracking, and instructor management.

> 🚀 **Live Demo:** https://e-learning-lms-heyv.onrender.com  
> 💻 **Repository:** https://github.com/suman913/E-Learning-LMS

---

## ✨ Why This Project?

This project goes beyond a basic CRUD LMS. It implements a complete learning workflow:

**Course discovery → authentication → preview → Stripe Checkout → webhook verification → enrollment → My Learning → lecture progress → course completion**

The application also includes role-based instructor capabilities and backend authorization checks for course and lecture ownership.

---

## 🚀 Key Features

### 👨‍🎓 Student Experience

- Browse published courses
- Search courses by keyword
- Filter courses by category
- Sort courses by price
- View course details without logging in
- Watch free preview lectures
- Locked access for paid lectures
- Secure Stripe Sandbox checkout
- Automatic enrollment after successful payment
- My Learning dashboard
- Continue purchased courses
- Lecture progress tracking
- Course completion tracking
- Responsive UI for desktop and mobile
- Profile management with profile image support

### 👨‍🏫 Instructor Experience

- Instructor dashboard
- Create courses
- Edit course information
- Upload and replace course thumbnails
- Publish/unpublish courses
- Create lectures
- Upload lecture videos
- Mark lectures as preview/free
- Edit lecture title and media information
- Delete lectures
- Cloudinary media management
- Instructor-only course and lecture ownership checks

### 💳 Payment & Enrollment

- Stripe Checkout integration
- Stripe Sandbox/Test mode support
- `checkout.session.completed` webhook handling
- Stripe webhook signature verification
- Duplicate completed-purchase prevention
- Automatic enrollment in both user and course records
- Digital-course checkout without shipping collection

### 🔐 Security & Access Control

- JWT-based authentication
- HTTP-only cookie-based authentication flow
- Role-based instructor protection
- Course ownership validation
- Lecture ownership validation
- Purchase-based lecture authorization
- Public preview / protected paid lecture model
- Server-side purchase verification
- Environment variables for secrets

---

## 🏗️ System Architecture

```text
                       ┌──────────────────────┐
                       │      React / Vite    │
                       │      Frontend        │
                       └──────────┬───────────┘
                                  │ REST API
                                  ▼
                       ┌──────────────────────┐
                       │   Node.js / Express  │
                       │      Backend         │
                       └──────┬────┬────┬─────┘
                              │    │    │
                 ┌────────────┘    │    └──────────────┐
                 ▼                 ▼                   ▼
        ┌────────────────┐ ┌──────────────┐   ┌─────────────────┐
        │ MongoDB Atlas  │ │  Cloudinary  │   │ Stripe Sandbox  │
        │ Database       │ │ Media/Videos │   │ Payments        │
        └────────────────┘ └──────────────┘   └────────┬────────┘
                                                       │
                                                       │ Webhook
                                                       ▼
                                             /api/v1/purchase/webhook
```

---

## 🛠️ Tech Stack

### Frontend

- **React.js**
- **Vite**
- **React Router**
- **Redux Toolkit / RTK Query**
- **Tailwind CSS**
- **shadcn/ui**
- **Lucide React**
- **React Player**
- **Sonner**

### Backend

- **Node.js**
- **Express.js**
- **MongoDB / Mongoose**
- **JWT**
- **bcryptjs**
- **Multer**
- **Cookie Parser**
- **CORS**

### Cloud & Integrations

- **MongoDB Atlas** — persistent database
- **Cloudinary** — course thumbnails and lecture videos
- **Stripe Checkout** — payment processing
- **Stripe Webhooks** — trusted payment confirmation
- **Render** — deployment

---


## 🔄 Core Application Flows

### 1. Course Purchase Flow

```text
Student
  ↓
Course Details
  ↓
Buy Course Now
  ↓
Authenticated Checkout Request
  ↓
Stripe Checkout
  ↓
Successful Payment
  ↓
checkout.session.completed
  ↓
Webhook Signature Verification
  ↓
CoursePurchase = completed
  ↓
User enrolledCourses updated
  ↓
Course enrolledStudents updated
  ↓
My Learning
```

### 2. Lecture Access Flow

```text
Guest / Unpurchased User
          │
          ├── Preview Lecture → ✅ Allowed
          │
          └── Paid Lecture ──→ 🔒 Purchase Required

Purchased User
          │
          └── All Lectures → ✅ Allowed

Course Creator
          │
          └── Course Management → ✅ Allowed
```

### 3. Progress Flow

```text
Open Purchased Course
        ↓
Play / Select Lecture
        ↓
Lecture marked viewed
        ↓
CourseProgress updated
        ↓
All lectures viewed?
      ├── No  → Continue learning
      └── Yes → Course completed
```

---





## ☁️ Deployment

The application is configured as a monorepo and can be deployed as a single Render Web Service.


The root build script installs/builds the React client, while Express serves the generated `client/dist` files.

### Production environment variables

Configure the backend secrets in Render's Environment Variables section rather than committing them to GitHub.

## 🧪 Tested Functionality

The project has been tested across the main end-to-end workflows:

- ✅ User registration and login
- ✅ Profile update
- ✅ Course creation
- ✅ Course editing
- ✅ Thumbnail replacement via Cloudinary
- ✅ Lecture creation
- ✅ Lecture editing
- ✅ Lecture deletion
- ✅ Course publish/unpublish authorization
- ✅ Course ownership authorization
- ✅ Search and filtering
- ✅ Logged-out course browsing
- ✅ Free preview lectures
- ✅ Locked paid lectures
- ✅ Stripe Sandbox Checkout
- ✅ Stripe webhook signature verification
- ✅ Automatic enrollment
- ✅ My Learning
- ✅ Lecture progress
- ✅ Course completion
- ✅ Render deployment
- ✅ MongoDB Atlas connectivity in production

---

## 🛡️ Security Notes

The application intentionally separates public course discovery from protected learning content.

Public users can view course information and eligible preview content, while paid lecture access is enforced server-side through authentication and purchase validation.

Instructor operations also validate ownership before modifying courses or lectures.

Payment completion is trusted only after Stripe webhook signature verification rather than relying solely on client-side redirects.

---

## 📈 Possible Future Improvements

The current application is functional, but the architecture can be extended with:

- Course ratings and reviews
- Instructor analytics dashboard
- Student progress percentage visualization
- Course certificates
- Search pagination
- Redis caching
- Background email notifications
- Password reset / email verification
- Admin moderation tools
- Automated tests with Jest/Vitest + Supertest
- CI/CD with GitHub Actions
- Rate limiting and request validation
- Structured logging and monitoring
- Video playback analytics

---

## 👨‍💻 Author

**Suman Saha**

Full-stack development project focused on building a production-style MERN LMS with payments, cloud media, authentication, authorization, and deployment.

---

## 📄 License

This project is intended primarily as a portfolio / learning project. Add an explicit open-source license to the repository if you plan to permit redistribution or modification.

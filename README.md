# Job Application Email Automation Platform

A production-ready MERN stack application for automating personalized job application emails. Built with clean architecture, SOLID principles, and enterprise-grade code standards.

## Tech Stack

**Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, React Router DOM, Axios, React Hook Form, React Hot Toast, Lucide React

**Backend:** Node.js, Express.js, MongoDB, Mongoose, Nodemailer, Multer, express-validator, Helmet, Morgan, Compression

## Features

- **Dashboard** — Real-time stats: total sent, today's count, success rate, failed emails
- **Resume Management** — Upload/replace/delete/preview PDF, DOC, DOCX (max 10MB)
- **Cover Letter** — Rich text editor or file upload with placeholder support
- **SMTP Settings** — Configure any SMTP provider (Gmail, Brevo, SendGrid) with test button
- **Bulk Recipients** — Smart parsing: comma/newline/semicolon separated, auto name extraction
- **Template Engine** — Dynamic placeholders: `{{name}}`, `{{jobTitle}}`, `{{company}}`, `{{myName}}`, `{{date}}`
- **Email Preview** — Preview subject, greeting, body, and attachments before sending
- **Sending Queue** — Progress bar, pause/resume/cancel, configurable delay, retry failed
- **History** — Search, filter, paginate, export CSV/Excel, bulk delete
- **Analytics** — Daily/weekly stats, success/failure rates, top email domains
- **Dark Mode** — Full dark/light theme with persistent preference
- **Glassmorphism UI** — Modern SaaS dashboard with glass effects and smooth animations

## Project Structure

```
email-sender/
├── backend/
│   ├── src/
│   │   ├── config/           # Database configuration
│   │   ├── controllers/      # Route handlers
│   │   ├── services/         # Business logic layer
│   │   ├── repositories/     # Data access layer (Repository Pattern)
│   │   ├── models/           # Mongoose schemas
│   │   ├── middlewares/      # Express middlewares (auth, error, upload)
│   │   ├── validators/       # Request validation rules
│   │   ├── routes/           # Express route definitions
│   │   ├── utils/            # Utility classes (ApiError, ApiResponse, asyncHandler)
│   │   ├── helpers/          # Helper functions (template engine, email parser, name extractor)
│   │   ├── templates/        # Email templates storage
│   │   ├── uploads/          # Uploaded files storage
│   │   └── logs/             # Application logs
│   ├── server.js             # Entry point
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Reusable UI components (Button, Input, Modal, Table, etc.)
│   │   │   ├── layout/       # App layout (Sidebar, Header)
│   │   │   ├── dashboard/    # Dashboard components
│   │   │   ├── resume/       # Resume management
│   │   │   ├── cover-letter/ # Cover letter management
│   │   │   ├── settings/     # Settings form
│   │   │   ├── recipients/   # Recipient parser
│   │   │   ├── templates/    # Job template CRUD
│   │   │   ├── send/         # Email sending interface
│   │   │   ├── history/      # Email history with filters
│   │   │   └── analytics/    # Analytics dashboard
│   │   ├── pages/            # Route page components
│   │   ├── context/          # React Context (global state)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API service layer
│   │   ├── utils/            # Utility functions and constants
│   │   ├── App.jsx           # Root component with routing
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Tailwind CSS + global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

## Environment Variables

Copy `.env` to `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/email-sender
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=./src/uploads
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## Installation

### Prerequisites

- Node.js 18+
- MongoDB 6+ (local or Atlas)
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd email-sender

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Start MongoDB (if running locally)
mongod

# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory, new terminal)
npm run dev
```

The backend runs on `http://localhost:5000` and the frontend on `http://localhost:5173`.

## SMTP Setup

### Gmail (App Password)

1. Enable 2-Step Verification on your Google Account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use these SMTP settings:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Secure: `false` (use STARTTLS)
   - User: your Gmail address
   - Password: the 16-character app password

### Brevo (Sendinblue)

- Host: `smtp-relay.brevo.com`
- Port: `587`
- Secure: `false`
- User: your Brevo login email
- Password: your SMTP key

### SendGrid

- Host: `smtp.sendgrid.net`
- Port: `587`
- Secure: `false`
- User: `apikey`
- Password: your SendGrid API key

## REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume/upload` | Upload resume (PDF/DOC/DOCX) |
| GET | `/api/resume` | Get latest resume |
| DELETE | `/api/resume` | Delete resume |
| POST | `/api/cover-letter` | Save cover letter (text or file) |
| GET | `/api/cover-letter` | Get latest cover letter |
| DELETE | `/api/cover-letter` | Delete cover letter |
| GET | `/api/settings` | Get SMTP settings |
| PUT | `/api/settings` | Update settings |
| POST | `/api/templates` | Create job template |
| GET | `/api/templates` | Get all templates |
| PUT | `/api/templates/:id` | Update template |
| DELETE | `/api/templates/:id` | Delete template |
| POST | `/api/send` | Send emails |
| POST | `/api/test-smtp` | Test SMTP connection |
| GET | `/api/logs` | Get email history (paginated) |
| DELETE | `/api/logs` | Delete logs |
| GET | `/api/logs/export/csv` | Export logs as CSV |
| GET | `/api/logs/export/excel` | Export logs as Excel |
| GET | `/api/analytics` | Get analytics data |

## Architecture

### MVC + Service Layer + Repository Pattern

```
Route → Controller → Service → Repository → Model
                           ↘
                        Helpers/Utils
```

- **Routes** — Define HTTP endpoints and attach middleware
- **Controllers** — Handle request/response, delegate to services
- **Services** — Business logic, orchestrate repositories and helpers
- **Repositories** — Data access layer, abstract MongoDB operations
- **Models** — Mongoose schemas with validation and indexes

### Error Handling

- Centralized `errorHandler` middleware
- Custom `ApiError` class with status codes
- `asyncHandler` wrapper for all async routes
- Validation errors via `express-validator`
- Consistent JSON response format: `{ success, message, data }`

### Security

- Helmet for HTTP headers
- Rate limiting on API routes
- CORS configured for frontend origin
- Input sanitization via express-validator
- SMTP passwords never exposed in responses
- File type and size validation

## Common Errors

### MongoDB Connection Failed

```bash
# Ensure MongoDB is running
mongod --dbpath /data/db

# Or use MongoDB Atlas connection string in .env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/email-sender
```

### SMTP Authentication Failed

- Verify your SMTP credentials in Settings
- For Gmail: use App Password, not your regular password
- Check if "Less secure app access" is enabled (or use App Password)

### File Upload Failed

- Ensure file is PDF, DOC, or DOCX
- File size must be under 10MB
- Check `UPLOAD_DIR` path exists and is writable

### Port Already in Use

```bash
# Change port in .env
PORT=5001
# Update CORS_ORIGIN in .env
CORS_ORIGIN=http://localhost:5173
# Update proxy in frontend/vite.config.js
```

## License

MIT

# Sevkiyat Bildirim - Shipment Notification System

A complete monorepo application for tracking shipment issues (missing and damaged items) with email notifications and full audit trail.

## Features

- ✅ Full-stack monorepo (.NET 9 API + Next.js 14 Frontend)
- ✅ JWT Authentication with httpOnly cookies
- ✅ Report management with status workflow (Draft → Sent → Accepted/Rejected → Closed)
- ✅ Email generation with SMTP support and copy-to-clipboard fallback
- ✅ Complete audit trail for all actions
- ✅ Turkish UI optimized for non-technical users
- ✅ PostgreSQL database with EF Core migrations
- ✅ RESTful API with Swagger documentation

## Prerequisites

- .NET 9 SDK
- Node.js 20+ and npm
- Docker and Docker Compose (for PostgreSQL)
- Git

## Quick Start

### 1. Clone and Setup

```bash
cd sevkiyat-bildirim
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

### 3. Run Backend API

```bash
cd apps/api
dotnet restore
dotnet ef database update  # Apply migrations
dotnet run
```

The API will be available at `http://localhost:5000`
Swagger UI: `http://localhost:5000/swagger`

### 4. Run Frontend

```bash
cd apps/web
npm install
npm run dev
```

The web app will be available at `http://localhost:3000`

### 5. Login

Use demo credentials:
- **Manager**: ***REMOVED*** / ***REMOVED***
- **Assistant**: assistant@demo.com / ***REMOVED***

## Project Structure

```
sevkiyat-bildirim/
├── apps/
│   ├── api/              # .NET 9 Web API
│   │   ├── Controllers/  # API endpoints
│   │   ├── Data/         # DbContext and migrations
│   │   ├── DTOs/         # Request/Response DTOs
│   │   ├── Models/       # Domain entities
│   │   ├── Services/     # Business logic
│   │   ├── Validators/   # FluentValidation
│   │   └── Middleware/   # Exception handling
│   └── web/              # Next.js 14 Frontend
│       ├── app/          # Pages (App Router)
│       ├── components/   # React components
│       └── lib/          # API client, types
├── docs/                 # Documentation
├── scripts/              # Development scripts
├── docker-compose.yml    # PostgreSQL container
└── README.md
```

## Technology Stack

### Backend
- .NET 9 Web API
- Entity Framework Core 9
- PostgreSQL (Npgsql)
- JWT Authentication
- FluentValidation
- BCrypt for password hashing
- Swagger/OpenAPI

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Hooks

## Database Schema

### Main Entities
- **Users**: Authentication and user information
- **Reports**: Main report entity with header information
- **ReportItems**: Line items in each report
- **ReportActions**: Audit trail entries
- **EmailLogs**: Email sending history

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Reports
- `GET /api/reports` - List reports (with filters, search, pagination)
- `POST /api/reports` - Create new report (Draft)
- `GET /api/reports/{id}` - Get report details
- `PUT /api/reports/{id}` - Update report (Draft only)
- `POST /api/reports/{id}/send` - Send report email (Draft → Sent)
- `POST /api/reports/{id}/accept` - Mark as accepted (Sent → Accepted)
- `POST /api/reports/{id}/reject` - Mark as rejected (Sent → Rejected)
- `POST /api/reports/{id}/revise-resend` - Revise and resend (Rejected → Sent)
- `POST /api/reports/{id}/close` - Close report (Accepted → Closed)

## Report Workflow

```
Draft → Sent → Accepted → Closed
           ↓
        Rejected → (Revise) → Sent
```

## Configuration

### Backend (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=sevkiyat_bildirim;Username=postgres;Password=postgres"
  },
  "Jwt": {
    "Secret": "YourSecretKeyHere",
    "Issuer": "SevkiyatBildirimApi",
    "Audience": "SevkiyatBildirimWeb"
  },
  "Email": {
    "SmtpEnabled": false,
    "SmtpHost": "smtp.example.com",
    "SmtpPort": 587,
    "SmtpUsername": "your-username",
    "SmtpPassword": "your-password",
    "FromAddress": "noreply@example.com",
    "DefaultRecipient": "lojistik@example.com"
  }
}
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Sample Data

The database includes seed data:
- 2 demo users (Manager and Assistant)
- 3 sample reports with different statuses
- Associated items, actions, and email logs

## Development

### Backend Development

```bash
cd apps/api

# Run with hot reload
dotnet watch run

# Create new migration
dotnet ef migrations add MigrationName

# Update database
dotnet ef database update
```

### Frontend Development

```bash
cd apps/web

# Run development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

## Email Configuration

By default, SMTP is disabled. Emails are generated but not sent. Users can copy the email content using the "Kopyala" button.

To enable SMTP sending:
1. Update `appsettings.json` with your SMTP provider details
2. Set `SmtpEnabled` to `true`
3. Restart the API

### Google Gmail Integration (Recommended)

To send emails directly via the logged-in user's Gmail account:

1. **Google Cloud Console Setup**:
   - Create a project in [Google Cloud Console](https://console.cloud.google.com).
   - Enable **Gmail API**.
   - Configure **OAuth Consent Screen** (User Type: External/Internal).
     - Add Scopes: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/gmail.send`.
   - Create **OAuth Client ID** (Web Application):
     - **Authorized JavaScript Origins**: `http://localhost:3000`, `http://localhost:5279`
     - **Authorized Redirect URIs**: `http://localhost:5279/api/auth/google/callback` ⚠️ **CRITICAL: This must match exactly**

2. **Backend Configuration (`apps/api/appsettings.json`)**:
   ```json
   "Authentication": {
     "Google": {
       "ClientId": "your-client-id.apps.googleusercontent.com",
       "ClientSecret": "your-client-secret"
     }
   },
   "Auth": {
     "FrontendBaseUrl": "http://localhost:3000"
   }
   ```

3. **Frontend Configuration (`apps/web/.env.local`)**:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5279
   ```
   
   Note: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is no longer needed - the backend handles OAuth directly.

4. **Restart both servers** to apply changes.

**How it works**: When users click "Google ile Devam Et", they're redirected to the backend (`/api/auth/google`), which initiates the OAuth flow with Google. After authorization, Google redirects back to the backend callback (`/api/auth/google/callback`), which creates a session and redirects the user to the frontend.

## Security

- Passwords are hashed using BCrypt
- JWT tokens stored in httpOnly cookies (secure)
- CORS configured for localhost development
- Input validation with FluentValidation
- Parameterized queries via Entity Framework

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps

# Restart PostgreSQL
docker-compose restart

# View logs
docker-compose logs postgres
```

### API Not Starting

```bash
# Check port 5000 is available
lsof -i :5000

# Build to see errors
dotnet build

# Check migrations
dotnet ef migrations list
```

### Frontend Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check API URL in .env.local
cat .env.local
```

## License

Proprietary - Internal Use Only

## Support

For issues or questions, contact the development team.

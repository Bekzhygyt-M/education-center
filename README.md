# Education Center Management System

A web-based management platform designed to streamline the daily operations of an educational center. The system brings teachers, students, groups, classrooms, schedules, lessons, attendance, and lesson planning together in one place.

## Features

- **Role-based access control** — separate permissions for administrators and teachers.
- **Academic management** — organize teachers, students, subjects, courses, and groups.
- **Scheduling** — manage weekly schedules, classrooms, and lessons.
- **Attendance tracking** — record and manage student attendance.
- **Lesson planning** — prepare and maintain structured lesson plans.
- **Server-side authorization** — enforce access rules in server queries and Server Actions.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 App Router | Application framework |
| React 19 | UI development |
| TypeScript | Type-safe development |
| Tailwind CSS | Styling |
| shadcn/ui and Base UI | UI components |
| PostgreSQL | Relational database |
| Prisma 7 | Database access and schema management |
| Auth.js and bcrypt | Authentication and password hashing |

## Getting Started

### Prerequisites

- Node.js compatible with the project dependencies
- npm
- PostgreSQL
- A dedicated development database

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file based on `.env.example` and configure your local database connection and authentication settings.

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/education_center_dev?schema=public"
AUTH_SECRET="your-generated-secret"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
```

Replace the example credentials and secret with your own local values. Never commit real secrets to version control.

### 3. Generate the Prisma client and apply migrations

```bash
npm run db:generate
npm run db:deploy
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Database Seeding

Seeding is restricted to an empty database whose name ends in `_dev`. Explicitly enable it before running the seed command in PowerShell:

```powershell
$env:SET_ALLOW_SEED = "1"
npm run db:seed
```

The seed script includes safeguards against writing to production databases or the NewEra database. Seed credentials are intended for local demonstrations only.

> **Important:** Never run seed operations against production or shared databases.

## User Roles

### Administrator

Can manage the educational center's modules and operational data.

### Teacher

Can access and manage their own assigned groups, students, schedules, lessons, attendance records, and lesson plans.

Authorization is enforced on the server. Hiding UI elements alone does not provide access control.

## Quality Checks

Run the following commands before submitting changes:

```bash
npm run typecheck
npm run lint
npm test
```

## Security and Operational Considerations

This project is intended for internal educational-center operations. Before deploying it in a production environment, evaluate and implement the operational controls required for your deployment.

Known limitations include:

- Audit logging
- Password recovery
- Email notifications
- Database backup and monitoring procedures
- Database-level schedule exclusion constraints

Do not assume the application is production-ready without addressing these limitations and completing an appropriate security review.

## Contributing

Contributions should be focused, tested, and submitted through separate branches and pull requests. Include a clear description of the change and the relevant verification results.

## License

No license has been specified yet. All rights reserved unless a license is added to this repository.
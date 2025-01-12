## WhatsApp Bot with Node.js, PostgreSQL, and WWeb.js

A simple customer-support WhatsApp Bot built with:

Node.js + Express
TypeScript
PostgreSQL (managed by Prisma ORM)
wweb.js (WhatsApp Web automation)
OpenAI (AI fallback for unknown queries)

## Installation

```bash
$ npm install
```

## Database Setup

Create the database 

```bash
CREATE DATABASE whatsapp_bot;
```

Run Prisma migrations to create tables:

```bash
npx prisma migrate dev --name init
```

## Seeding the FAQs
When the app starts, it checks whether any FAQs exist. If the Faq table is empty, the app seeds a few default FAQs automatically. No extra steps are needed.

## Running the App

Development Mode
```bash
$ npm run dev
```

Production Mode
```bash
$ npm run start
```




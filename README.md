![Screenshot](https://github.com/sesto-dev/next-prisma-tailwind-ecommerce/assets/45223699/00444538-a496-4f90-814f-7e57a580ad17)

<div align="center"><h3>Full-Stack E-Commerce Platform</h3><p>Built using Typescript with Next.js, Prisma ORM and TailwindCSS.</p></div>
<div align="center">
<a href="https://pasargad.vercel.app">Storefront</a> 
<span> · </span>
<a href="https://pardis.vercel.app">Admin Panel</a>
</div>

## 👋 Introduction

Welcome to the open-source Next.js E-Commerce Storefront with Admin Panel project! This project is built with TypeScript, Tailwind CSS, and Prisma, providing a powerful and flexible solution for building and managing your e-commerce website.

## 🥂 Features

-  [x] [**Next.js 14**](https://nextjs.org) App Router and React Server Components.
-  [x] Custom dynamic `Sitemap.xml` generation.
-  [x] Admin dashboard with products, orders, and payments.
-  [x] File uploads using `next-cloudinary`.
-  [x] Authentication using `middleware.ts` and `httpOnly` cookies.
-  [x] Storefront with blog, products, and categories.
-  [x] Database-Stored blogs powered by **MDX** templates.
-  [x] Email verification and invoices using [react-email-tailwind-templates](https://github.com/sesto-dev/react-email-tailwind-templates).
-  [x] [**TailwindCSS**](https://tailwindcss.com/) for utility-first CSS.
-  [x] UI built with [**Radix**](https://www.radix-ui.com/) and stunning UI components, all thanks to [**shadcn/ui**](https://ui.shadcn.com/).
-  [x] Type-Validation with **Zod**.
-  [x] [**Next Metadata API**](https://nextjs.org/docs/api-reference/metadata) for SEO handling.
-  [x] **Advanced Product Filtering** with multi-select categories, price range, brand filtering, and search.
-  [x] **Cross-Sell Product Recommendations** with bidirectional relationships and smart suggestions.
-  [x] **Admin Reports Dashboard** with revenue analytics, sales metrics, and order insights.
-  [ ] Comprehensive implementations for i18n.

## 2️⃣ Why are there 2 apps in the app folder?

This project is made up of 2 separate apps ( admin and storefront ) which should be deployed separately. If you are deploying with Vercel you should create 2 different apps.

![image](https://github.com/Accretence/next-prisma-tailwind-ecommerce/assets/45223699/f5adc1ac-9dbb-46cb-bb6e-a8db15883348)

Under the general tab there is a Root Directory option, for the admin app you should put in "apps/admin" and for the storefront app you should put in "apps/storefront".

## 🔐 Authentication

The authentication is handled using JWT tokens stored in cookies and verified inside the `middleware.ts` file. The middleware function takes in the HTTP request, reads the `token` cookie and if the JWT is successfully verified, it sets the `X-USER-ID` header with the userId as the value, otherwise the request is sent back with 401 status.

## 👁‍🗨 Environment variables

Environment variables are stored in `.env` files. By default the `.env.example` file is included in source control and contains
settings and defaults to get the app running. Any secrets or local overrides of these values should be placed in a
`.env` file, which is ignored from source control.

Remember, never commit and store `.env` in the source control, just only `.env.example` without any data specified.

You can [read more about environment variables here](https://nextjs.org/docs/basic-features/environment-variables).

## 🏃‍♂️ Getting Started Locally

Clone the repository.

```bash
git clone https://github.com/sesto-dev/next-prisma-tailwind-ecommerce
```

Navigate to each folder in the `apps` folder and set the variables.

```sh
# For storefront
cd apps/storefront
cp .env.example .env

# For admin
cd apps/admin
cp .env.example .env
```

Get all dependencies sorted.

```sh
# From project root
bun install
```

Set up your database and seed with sample data.

```bash
# For storefront
cd apps/storefront
bun run db:push
bun run db:seed

# For admin (uses same database)
cd apps/admin
bun run db:push
```

Start the development servers.

```sh
# Storefront (port 7777)
cd apps/storefront
bun run dev

# Admin (port 8888) - in a new terminal
cd apps/admin
bun run dev
```

## 🚀 New Features & API Endpoints

### Advanced Product Filtering
- **Location**: `apps/storefront/src/app/(store)/(routes)/products/`
- **Features**: 
  - Multi-select category filtering
  - Price range slider
  - Brand filtering
  - Search functionality
  - Sort by price/title
- **API**: `GET /api/products` with query parameters

### Cross-Sell Product Recommendations
- **Location**: Product detail pages and cart page
- **Features**:
  - "You might also like" section on product pages
  - "Suggested for your cart" on cart page
  - Bidirectional product relationships
  - Smart deduplication of suggestions
- **API**: Enhanced product queries include `crossSellProducts`

### Admin Reports Dashboard
- **Location**: `apps/admin/src/app/(dashboard)/(routes)/reports/`
- **Features**:
  - Revenue analytics with charts
  - Sales count metrics
  - Stock level monitoring
  - Order status tracking
- **API Endpoints**:
  - `GET /api/reports/revenue` - Revenue analytics
  - `GET /api/reports/sales-count` - Sales metrics
  - `GET /api/reports/stock-count` - Stock levels

### Development Authentication Bypass
For easier development and testing, you can bypass OTP authentication:

```env
# In apps/storefront/.env.local
DEV_AUTH_BYPASS=true
DEV_USER_ID=<existing-user-id>
```

## 🎯 Design Decisions & Implementation Approach

### 1. Advanced Product Filtering
**Approach**: Built a flexible query system using Prisma's advanced filtering capabilities.
- **Multi-select categories**: Used Prisma's `some` operator with array matching
- **Price range**: Implemented `gte` and `lte` operators for precise filtering
- **Search**: Combined `OR` conditions for title and description matching
- **Sorting**: Dynamic `orderBy` based on user selection

**Design Decision**: Kept filtering server-side for better performance and SEO, with URL state management for shareable filtered views.

### 2. Cross-Sell Product Recommendations
**Approach**: Implemented bidirectional many-to-many relationships using Prisma's self-referencing relations.
- **Database Schema**: Added `crossSellProducts` and `crossSellOf` relations to Product model
- **Bidirectional Links**: Ensured both products in a relationship can recommend each other
- **Smart Suggestions**: Deduplicated cross-sell products in cart suggestions
- **Performance**: Used Prisma includes to fetch related data efficiently

**Design Decision**: Made relationships bidirectional to ensure all products can show relevant suggestions, not just the "source" product.

### 3. Admin Reports Dashboard
**Approach**: Created a comprehensive analytics system with real-time data aggregation.
- **Revenue Analytics**: Implemented date-range filtering and chart visualization
- **Sales Metrics**: Built efficient counting queries with proper indexing
- **Stock Monitoring**: Added real-time stock level tracking
- **Modular Design**: Separated report logic into reusable utility functions

**Design Decision**: Used server-side data fetching for better performance and real-time accuracy, with client-side chart rendering for interactivity.

### 4. Development Experience
**Approach**: Enhanced developer productivity with better tooling and debugging.
- **Auth Bypass**: Added development-only authentication bypass for easier testing
- **Seed Data**: Created comprehensive seed data with cross-sell relationships
- **Type Safety**: Maintained full TypeScript coverage with proper Prisma types
- **Error Handling**: Implemented comprehensive error handling and user feedback

**Design Decision**: Prioritized developer experience while maintaining production security through environment-based feature flags.

## 🔑 Database

Prisma ORM can use any PostgreSQL database. [Supabase is the easiest to work with.](https://www.prisma.io/docs/guides/database/supabase) Simply set `DATABASE_URL` in your `.env` file to work.

### `bun run db`

This project exposes a package.json script for accessing prisma via `bun run db:<command>`. You should always try to use this script when interacting with prisma locally.

### Making changes to the database schema

Make changes to your database by modifying `prisma/schema.prisma`.

## 🛸 How to Deploy the Project

Follow the deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.

## 📄 License

This project is MIT-licensed and is free to use and modify for your own projects. Check the [LICENSE](./LICENSE) file for details.

Created by [Amirhossein Mohammadi](https://github.com/sesto-dev).

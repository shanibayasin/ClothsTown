ClothsTown — Fashion E-Commerce Platform
A modern, responsive fashion e-commerce storefront built with Next.js, TypeScript, Tailwind CSS, and MongoDB. ClothsTown is designed to provide a clean shopping experience across Women, Men, and Accessories, with an admin workflow for managing catalog content.
Before publishing: Review the feature list and remove anything that is not implemented in the current codebase.

✨ Highlights
- Responsive fashion storefront for desktop, tablet, and mobile.
- Department and category browsing for Women, Men, and Accessories.
- Subcategory pages with breadcrumbs, hero banners, and product listings.
- Product catalog with images, pricing, stock, sizes, colors, and category/collection data.
- Admin product management through the project's existing admin/API workflow.
- Customer authentication, where configured in the current project.
- Cloud-hosted product images through the configured image provider.
- TypeScript and ESLint checks for code quality.
🧰 Tech Stack
- Framework: Next.js App Router
- Language: TypeScript
- Styling: Tailwind CSS
- Database: MongoDB
- Image hosting: Cloudinary, if configured
Keep this list aligned with the actual dependencies and configuration in package.json.
🗂️ Project Structure
The main application code is organized under src/.
src/
└── app/
    ├── (website)/          # Public storefront routes
    │   ├── page.tsx        # Home page
    │   ├── shop/           # Shop, department, and subcategory routes
    │   └── category/       # Category routes
    └── components/
        ├── home/           # Home page components
        └── shop/           # Shop and category components
Other folders may contain API routes, database models, authentication utilities, admin pages, and shared UI components.
🚀 Getting Started
Prerequisites
- Node.js compatible with this project
- npm
- MongoDB and any additional services required by the app
1. Clone the repository
git clone https://github.com/shanibayasin/ClothsTown.git
cd ClothsTown
2. Install dependencies
npm install
3. Configure environment variables
Create a local .env file in the project root. Add the exact variable names required by the source code and deployment configuration.
# Examples/placeholders only — verify the actual names in your code:
MONGODB_URI=
# CLOUDINARY_CLOUD_NAME=
# CLOUDINARY_API_KEY=
# CLOUDINARY_API_SECRET=
# AUTH_SECRET=
# NEXT_PUBLIC_SITE_URL=http://localhost:3000
Important: These are examples, not a verified list of required variables. Check existing environment-variable references and your deployment settings. Never commit .env files, passwords, API keys, database credentials, or session secrets.
4. Start the development server
npm run dev
Open http://localhost:3000. If port 3000 is busy, Next.js may use another port.
🧪 Quality Checks
Run the checks supported by your package.json:
npx tsc --noEmit
npx eslint .
npm run build
If the project defines dedicated lint, typecheck, or test scripts, use those scripts. Fix errors before deploying.
🛍️ Catalog and Admin Notes
- Manage products through the existing admin interface or authorized API workflow.
- Verify each product's category/collection references, pricing, stock, and required variant fields.
- Check that image URLs are accessible and images render correctly on the storefront.
- Review product descriptions, prices, stock, and image usage rights before accepting real orders.
- Protect admin endpoints with server-side authorization.
🌐 Deployment
This project can be deployed to a Next.js-compatible hosting provider such as Vercel.
1. Push the latest verified code to GitHub.
2. Import or connect the repository in your hosting provider.
3. Configure the required environment variables in the hosting dashboard.
4. Confirm the production build succeeds.
5. Deploy and test the live home page, category pages, product pages, authentication, and admin access.
6. Confirm the production app connects to the intended database and that its catalog data is present.
Important: Pushing code does not copy local database records to the production database. Verify the database connection and data separately.
🔐 Security
- Keep .env files and secrets out of Git.
- Use private credentials only in server-side code.
- Protect admin pages and write APIs with server-side authorization.
- Validate user input on the server.
- Do not rely on hidden buttons or client-side checks as access control.
🛣️ Pre-Launch Checklist
- [ ] Verify all department and subcategory routes.
- [ ] Review catalog images, descriptions, prices, and stock.
- [ ] Test search, filters, sorting, and pagination where implemented.
- [ ] Test sign-in/sign-up and session handling.
- [ ] Test cart, checkout, and order flows if implemented.
- [ ] Check mobile layouts and accessibility.
- [ ] Configure production environment variables.
- [ ] Verify production database content.
- [ ] Run lint, TypeScript, and production build checks.
🤝 Contributing
1. Create a feature branch.
2. Make a focused change.
3. Run lint, type-check, and build checks.
4. Review the changes locally.
5. Open a pull request with a clear summary and testing notes.
📄 License
No license is specified in this README. Add a LICENSE file before presenting the repository as open source. Without a license, others do not automatically receive permission to reuse the code.
Maintainer: shanibayasin
Repository: ClothsTown
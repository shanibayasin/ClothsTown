This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Admin access

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` in your local
`.env` file before opening `/admin`. Use a unique password and a session secret
with at least 32 characters. Keep `.env` private and out of Git. The example
variable names are in `.env.example`.

### Vercel deployment

Local `.env` values are not copied to Vercel. In the Vercel project, open
**Settings → Environment Variables** and add:

- `ADMIN_EMAIL`: the admin sign-in email
- `ADMIN_PASSWORD`: a strong, unique admin password
- `ADMIN_SESSION_SECRET`: a random secret with at least 32 characters

Enable the environments where you will sign in (Production for the live site;
Preview as well if you use preview deployment URLs), save the variables, then
redeploy the deployment. To generate a session secret locally with Node.js, run
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
Keep the generated value private and never commit it or send it in chat.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

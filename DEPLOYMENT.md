# Production Deployment Manual

Follow these steps to deploy your completely free architecture:

## 1. Database Init (Supabase)
Go to the Supabase Dashboard, open the SQL Editor, and paste the contents of `database/schema.sql` along with the transaction function script `database/settlement_rpc.sql`. Click Run to set up your tables and relational components.

## 2. Client Credentials Link (Firebase)
In the Firebase Console, navigate to Authentication, select Sign-in method, and enable Email/Password.

Copy the project variables into your workspace `.env.local` file.

## 3. Deploy Frontend Assets (Vercel)
Install the Vercel CLI locally or connect your GitHub repository directly to the Vercel Dashboard.

Map all environment variables inside the Vercel project management dashboard settings panel.

Push your code to your remote repository or run `vercel --prod` to trigger the build pipelines.

## 4. Wire Up the 7-Day Automated Crons
**Option A (Vercel)**: If your deployment tier includes crons, the `vercel.json` file configuration will automatically handle the route registration.

**Option B (Cron-Job.org alternative)**: Create a free account on Cron-Job.org. Add a new cron pointing to `https://your-vercel-domain.com/api/cron/resiliency-pricing`. Add an HTTP header field matching `Authorization: Bearer your-configured-cron-secret` to trigger the fallback logic daily without hitting timeout boundaries.

---

🏁 **Construction Phase Complete**
The complete technical infrastructure for B2B India is now established. The application is ready to handle cross-industry bulk orders with automated fallback pricing rules and real-time ledger accounting. Simply configure your production keys in your environment variables to launch your automated B2B commodity marketplace.

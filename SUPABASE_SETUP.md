# Supabase Setup Guide

Follow these steps to set up Supabase for the voting system.

## Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project
4. Wait for the project to be set up (takes ~2 minutes)

## Step 2: Create Database Tables

Once your project is ready, go to the SQL Editor in Supabase and run this SQL:

```sql
-- Create votes table to store vote counts
CREATE TABLE votes (
    item_id TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create visitor_votes table to track which items each visitor has voted on
CREATE TABLE visitor_votes (
    id BIGSERIAL PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(visitor_id, item_id)
);

-- Create index for faster lookups
CREATE INDEX idx_visitor_votes_visitor ON visitor_votes(visitor_id);
CREATE INDEX idx_visitor_votes_item ON visitor_votes(item_id);

-- Create function to increment vote count
CREATE OR REPLACE FUNCTION increment_vote(item_id TEXT)
RETURNS void AS $$
BEGIN
    INSERT INTO votes (item_id, count, updated_at)
    VALUES (item_id, 1, NOW())
    ON CONFLICT (item_id)
    DO UPDATE SET
        count = votes.count + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

## Step 3: Get Your Supabase Credentials

1. In Supabase, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (this is your `SUPABASE_URL`)
   - **anon public** key (this is your `SUPABASE_ANON_KEY`)

## Step 4: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these two variables:

   **Variable 1:**
   - Name: `SUPABASE_URL`
   - Value: (paste your Project URL from Supabase)
   - Environment: Production, Preview, Development (check all)

   **Variable 2:**
   - Name: `SUPABASE_ANON_KEY`
   - Value: (paste your anon public key from Supabase)
   - Environment: Production, Preview, Development (check all)

4. Click **Save**

## Step 5: Redeploy

After adding the environment variables:

1. Go to your Vercel project → **Deployments**
2. Click the three dots on the latest deployment
3. Click **Redeploy**

Or simply push a new commit to trigger a new deployment.

## Step 6: Test

1. Visit your site
2. Try voting on an item
3. Refresh the page - votes should persist
4. Open in an incognito window - you should see the same vote counts

## Troubleshooting

- **"Missing Supabase environment variables"**: Make sure you added the environment variables in Vercel and redeployed
- **Votes not saving**: Check Vercel function logs in the dashboard
- **Database errors**: Verify the SQL was run correctly in Supabase SQL Editor


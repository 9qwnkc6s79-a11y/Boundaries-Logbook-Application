# Toast POS Integration Setup Guide

This guide will walk you through setting up Toast POS integration with your Boundaries Logbook application.

## What You Get

Once configured, you'll see real-time Toast POS data in your Manager Hub dashboard:

### Sales Data
- **Total Sales** - Today's revenue
- **Total Orders** - Number of orders processed
- **Average Check** - Average order value
- **Total Tips** - Tips collected today

### Labor Data
- **Currently Clocked In** - Live view of staff on the clock with hours worked
- **Labor Summary** - Total hours, shifts, and staff count for today

## Setup Steps

### 1. Get Toast API Credentials

You need three pieces of information from Toast:

1. **API Key (Partner Token)**
2. **Restaurant GUID**
3. **Management Group GUID**

#### How to Get These:

1. Go to [Toast POS Portal](https://pos.toasttab.com/login)
2. Log in with your Toast account
3. Navigate to: **Integrations** > **API** > **Create New Integration**
4. Follow Toast's instructions to generate your API credentials
5. Save the following:
   - Your Partner Token (API Key)
   - Your Restaurant GUID (found in Restaurant Settings)
   - Your Management Group GUID

**Note:** You may need Toast support or admin access to generate API credentials.

### 2. Configure Environment Variables

#### For Local Development:

1. Open the `.env.local` file in your project root
2. Add your Toast credentials:

```env
# Toast POS API Configuration
VITE_TOAST_API_KEY=your_actual_toast_api_key_here
VITE_TOAST_RESTAURANT_GUID=your_actual_restaurant_guid_here
VITE_TOAST_MANAGEMENT_GROUP_GUID=your_actual_management_group_guid_here
```

3. Save the file
4. Restart your development server: `npm run dev`

#### For Production (Vercel):

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **Boundaries-Logbook-Application** project
3. Go to **Settings** > **Environment Variables**
4. Add each variable:
   - Name: `VITE_TOAST_API_KEY`
     Value: Your Toast API key
   - Name: `VITE_TOAST_RESTAURANT_GUID`
     Value: Your Restaurant GUID
   - Name: `VITE_TOAST_MANAGEMENT_GROUP_GUID`
     Value: Your Management Group GUID
5. Click **Save**
6. Redeploy your application (Vercel will prompt you)

### 3. Verify Integration

1. Open your app and log in as a Manager
2. Go to **Manager Hub**
3. You should see a new section: **"Toast POS Data"**

If configured correctly, you'll see:
- ✅ Live sales data
- ✅ Currently clocked-in employees
- ✅ Labor summary

If NOT configured, you'll see:
- ⚠️ "Connect Toast POS" section with setup instructions

## Features

### Auto-Refresh
- Toast data automatically refreshes every **5 minutes**
- Manual refresh button available

### Error Handling
- If Toast API fails, an error message will display
- The app will continue to work with other features

### Data Display
- **Sales metrics** update in real-time throughout the day
- **Clocked-in staff** shows current status with elapsed hours
- **Labor summary** aggregates all shifts for the day

## Troubleshooting

### "Toast API not configured" message
- ✅ Check that all three environment variables are set
- ✅ Verify variable names match exactly (case-sensitive)
- ✅ Restart your dev server after adding variables

### "Toast API Error" message
- ✅ Verify your API key is valid and active
- ✅ Check that your Restaurant GUID is correct
- ✅ Ensure your Toast account has API access permissions
- ✅ Check Toast API status: [Toast Developer Portal](https://doc.toasttab.com/)

### No data showing
- ✅ Ensure you have orders or clocked-in employees today
- ✅ Check that your Toast account has permission to access this data
- ✅ Verify the Restaurant GUID matches your actual location

### CORS or Network Errors
- Toast API requests are made from the client
- Some network configurations may block these requests
- Consider implementing a backend proxy if needed (future enhancement)

## API Rate Limits

Toast API has rate limits:
- **Default:** 100 requests per minute
- The app fetches data every 5 minutes (12 requests/hour)
- Manual refreshes count toward this limit

## Security Notes

⚠️ **Important:**
- Never commit `.env.local` to git (already in .gitignore)
- Keep your API credentials secure
- Only share with authorized team members
- Rotate keys if compromised

## Toast API Documentation

For more information about Toast APIs:
- [Toast Developer Documentation](https://doc.toasttab.com/)
- [Orders API](https://doc.toasttab.com/openapi/orders/operation/ordersGet/)
- [Labor API](https://doc.toasttab.com/openapi/labor/operation/getTimeEntries/)

## Support

If you need help:
1. Check Toast's API documentation
2. Contact Toast support for API access issues
3. Review error messages in browser console (F12 > Console tab)

## Future Enhancements

Potential additions:
- Historical sales charts
- Labor cost calculations
- Menu item popularity tracking
- Inventory sync
- Employee performance metrics based on POS data

---

**Last Updated:** January 26, 2026

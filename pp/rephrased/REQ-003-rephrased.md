---
id: REQ-003
original_prompt: "pls fix this meetmyroute as single word dont add any space and also fix upcoming & ongoing trips screen issue and aother issue is when i logout & when i check https://meetmyroute.feastigo.com/ it again auto loggin in why ? pls fix this issue and can u pls seed some trips & other data like see this feels empty but pls make what ever here all & can control from admin too to pls check & fix any other issues in adminn all should be functionalble and also check this why in google chrome it showing black layout for login page"
rephrased_at: 2026-07-04T09:48:00Z
---

# Rephrased Prompt: Fix Critical Issues in MeetMyRoute

## 1. Branding Fix — App Name Spacing
- Change "Meet MyRoute" to "MeetMyRoute" (single word, no space) throughout the application
- Check header, title tags, and any other places where the app name appears

## 2. Login Page Visual Bug — Dark Overlay
- Fix the black/dark semi-transparent overlay issue on the login page in Chrome browser
- The login card currently has a broken dark background that makes it look visually broken
- Ensure consistent styling across Chrome, Edge, and other browsers

## 3. Authentication/Session Issue — Auto-Login After Logout
- Fix auto-login bug: After logging out, visiting https://meetmyroute.feastigo.com/ automatically logs the user back in
- Ensure proper session clearing on logout
- User should remain logged out after logout until they explicitly log in again

## 4. My Trips Screen Error — Failed to Fetch Bookings
- Fix "Something went wrong: Failed to fetch bookings" error on /my-trips page
- Ensure the "Upcoming Trips" and "Ongoing Trips" sections load properly
- Test both tabs and ensure data displays correctly

## 5. Seed Database with Sample Data
The application currently looks empty. Please:
- Seed the database with sample trips data (Trending Now, Weekend Getaways, Popular Destinations)
- Add enough variety to make the home page look populated and realistic
- Ensure all seeded data is manageable from the admin panel

## 6. Admin Panel Audit
- Review all admin panel functionality
- Ensure all features are fully functional (Trip CRUD, User management, Booking management, etc.)
- Fix any broken functionality or UI issues
- Verify that admin can control all the seeded data

## Success Criteria
- "MeetMyRoute" appears as a single word everywhere
- Login page looks clean without dark overlay in all browsers
- Logout fully clears session — no auto-login
- /my-trips loads without errors
- Home page shows populated trip data
- Admin panel is fully functional

---
*Original: "pls fix this meetmyroute as single word dont add any space and also fix upcoming & ongoing trips screen issue..."*
*Rephrased by prompt engineering agent*

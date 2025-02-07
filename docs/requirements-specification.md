# Software Requirement Specification

## Problem Statement
Planning group trips can be chaotic due to difficulties in coordinating itineraries, splitting expenses, 
managing group decisions, and staying updated in real time. Existing apps either focus on itinerary planning, 
expense tracking, or group chat, but lack an all-in-one solution that integrates all these features seamlessly.

## Proposed Solution
The Group Trip Planner app will provide a collaborative and interactive platform for travelers to plan, manage, 
and experience trips together. Users can create shared itineraries, split expenses, make group decisions through voting, 
and access interactive maps with route recommendations. The app will also include real-time location sharing, 
an information-sharing board, and an optional camping feature for outdoor enthusiasts.

## Potential Clients
- Friends and families planning group trips.
- Backpackers & road trippers looking for collaborative itineraries.
- Event organizers coordinating travel plans.
- Camping & hiking enthusiasts who want to find and review campgrounds.


## Functional Requirements
P1 to P5 are priority levels (P1 highest priority)  

### Account Management
- Register an account (P1)
- Login (P1)
- Log out of an account (P1)
- Complete user profile with travel preferences (P3)
- Sign up with social media accounts (P3)
- View and organize past trips (P4)

### Trip Planning
- Create a new group trip (P1)
- Invite friends via links or in-app invitations (P1)
- Search and mark key locations on a map (P2)
- Create a structured day-by-day itinerary (P1)
- Sync itinerary with third-party calendar apps (P3)
- Create a packing checklist (P4)
- Receive recommended routes for travel plans (P4)

### Collaborative Planning
- Real-time collaborative editing of itineraries (P1)
- Anonymous polls for group decisions (P2)
- Notifications for itinerary updates or decisions made (P1)
- Set voting deadlines for group decisions (P3)

### Expense Splitting & Cost Tracking
- Create shared expenses and split them among members (P2)
- View a detailed breakdown of amounts owed (P2)
- Notifications for added or updated expenses (P3)
- Pay expenses via Venmo or PayPal (P3)

### Real-Time Location Sharing
- Share live location with group members (P3)
- Toggle location sharing on or off (P3)
- View group members’ locations on a map (P3)

### Hiking & Camping Features
- Save hiking trails offline (P3)
- Regular position checking on trails (P4)
- View facilities along hiking trails (P4)
- Search and review campgrounds (P4)
- Save and rate campgrounds (P5)

## Other Requirements
### Notifications
- Send notifications for itinerary updates (P2)
- Send notifications for expense updates (P3)
### Third-Party Integration
- Enable login using social media accounts (e.g., Google, Facebook) (P3)
- Export itinerary to .ical files for calendar app subscription (P4)
- Integrate Google Maps for location search and directions (P2)
- Support real-time interaction with Google Maps for route planning and updates (P3)

## User Story
### Must-Have
#### Account Management
- As a user, I want to sign up with my email address and create a password so that I can securely manage my trip.
- As a user, I want to log in and log out of my account on my mobile device so that I can switch accounts on the same device.

#### Trip Planning
- As a user, I want to create a new group trip so that I can begin organizing a travel plan with friends.
- As a user, I want to search and mark key locations (restaurants, attractions, hotels, gas stations) on a map so that I can plan my travel route.
- As a user, I want to create a day-by-day itinerary so that I can organize the trip efficiently.

#### Collaborative Planning
- As a trip participant, I want to collaborate with my travel companions on real-time itineraries so we can plan our trip together.
- As a trip participant, I want to have anonymous polls for activities, restaurants, or destinations so that we can make unbiased decisions for the whole group.
- As a trip participant, I want to see and post notices on a sharing board, so that all participants can be notified with important information.
- As a trip participant, I want to receive notifications when itineraries get updated, decisions are made, and votes are open so that I can participate in collaboration on time and stay informed about changes.

#### Expense Splitting & Cost Tracking
- As a user, I want to create a shared expense and split it among involved members so that each person’s share is clearly tracked.
- As a user, I want to know how much the group spends and to whom I should send money in the end, so that I can easily pay the correct amount.

### Nice-to-have
#### Account Management
- As a user, I want to complete my profile to showcase my travel preferences and personal information, so that I can connect with my companions and find like-minded travel partners.
- As a user, I want to sign up with my social media accounts so that I don’t have to create a new username and password.
- As a user, I want to be able to delete my account if needed so that I can remove all personal data.
- As a user, I want to keep a log of my trip history and archive or delete my previous trip plans, so that I can keep an organized dashboard.

#### Trip Planning
- As a user, I want to sync my itinerary with other calendar-apps, so that I can receive reminders for my scheduled activities.
- As a user, I want to keep a checklist for luggage and to-do's in case I leave out something important.
- As a user, I want to receive recommendations for choice of routes while planning my trip, so that planning the itinerary becomes easier.

#### Real-time Location Sharing
- As a user, I want to share my live location with group members during the trip so that everyone can track each other’s progress.
- As a user, I want to toggle my location sharing on or off, so that I maintain control over my privacy.

#### Expense splitting & Cost tracking
- As a user, I want to pay someone with Venmo or Paypal via the application so that I can pay them easily.
- As a user, I want to get a summary of expenses for each category so that I can get to know the details of expenses.

#### Hiking & Camping Features (Optional)
- As a hiker, I want to save the trail for the locals so I won’t get lost when I get offline.
- As a hiker, I want a function to regularly check my position to keep me on the hiking trail.
- As a hiker, I want to be able to obtain information about the available facilities along the trail(e.g. restrooms, supply stations) in advance, so that I can better plan my hike.
- As a hiker, I want to access and review information about campsites(e.g. environment, location and booking options) in advance, so that I can better prepare and get a comfortable camping experience


## Software Architecture & Technology Stack
### Frontend (Android Mobile App)
**Framework**: React.  
**UI Library**: Tailwind CSS.
### Backend
**API Development**: Flask (Python)  
**Data Base**: MongoDB  
**Real-time Features**: WebSockets  
### External APIs
Google Maps API (for interactive maps)  
Google Places API (for POI search & route recommendations)  
OpenTripMap API (for additional travel destinations)  
Stripe / PayPal API (for expense splitting)  

## Similar Existing Apps
1. **Google Trips**  
   Provided travel suggestions but had no group-based planning features.
2. **Wanderlog**
   Offers itinerary planning but lacks real-time location sharing and group voting.
3. **TripIt**
   Focuses on organizing bookings and schedules but doesn’t support group trip sharing and management.
### Our App’s unique feature
1. Combines itinerary planning, location sharing and expense tracking.  
2. voting for group decisions.  
3. group itinerary and media for information sharing.  

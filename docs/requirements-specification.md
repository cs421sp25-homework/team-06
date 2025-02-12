# Software Requirement Specification

## Problem Statement

Planning a group trip involves multiple moving parts, from organizing itineraries and coordinating activities to managing shared expenses and ensuring smooth communication. Existing solutions often force users to rely on multiple disconnected tools—spreadsheets for budgeting, messaging apps for planning, and mapping services for navigation—leading to fragmented workflows, miscommunication, and inefficiencies.

Additionally, certain types of travel, such as hiking and camping trips, introduce further challenges, including offline route planning, campsite organization, and real-time location tracking for safety. Without an integrated solution, travelers struggle to stay aligned, resulting in last-minute confusion, scheduling conflicts, and financial misunderstandings that detract from the overall experience.

## Proposed Solution

The Group Trip Planner app streamlines the entire trip-planning process by providing a collaborative and interactive platform where users can efficiently coordinate, manage, and experience their trips together.

When a user wants to plan a trip with friends, they can start by creating a new trip and inviting participants via a shared link or in-app invitation. Once their friends accept, everyone gains access to a shared itinerary where they can collaboratively add activities, set schedules, and suggest changes in real time.

To help the group make decisions, the app provides a voting system where participants can vote on destinations, accommodations, and activities—ensuring fairness and group alignment without endless messaging threads. As the itinerary evolves, all members receive real-time notifications, keeping them informed of any changes.

Once travel plans are in place, users can mark key locations on an interactive map, such as meeting points, hotels, restaurants, and must-visit attractions. If they are planning a hiking or camping trip, they can also save trails for offline use, mark campsites, and track essential facilities like rest stops and supply stations.

During the trip, the app ensures smooth coordination by enabling real-time location sharing, allowing group members to easily track each other’s whereabouts and coordinate meetups without unnecessary delays. If someone arrives late or changes plans, the itinerary automatically updates for everyone, preventing miscommunication.

Managing expenses is also made simple. Whenever a user pays for a shared expense, such as transportation, meals, or accommodations, they can log the cost in the app and split it among the group. Each member can view a detailed breakdown of their share, ensuring transparency and eliminating the hassle of tracking payments manually.

For added convenience, users can sync their itinerary with third-party calendar apps, keeping important schedules accessible across all devices. Additionally, Google Maps integration allows for seamless navigation, ensuring travelers always know the best routes and directions.

By the end of the trip, all members will have had a well-organized, stress-free experience, with a structured itinerary, balanced expenses, and smooth coordination—transforming group travel from a logistical challenge into a memorable and enjoyable adventure.

## Potential Clients

- Friends and families planning group trips.  
- Backpackers & road trippers looking for collaborative itineraries.  
- Event organizers coordinating travel plans.

## ## Functional Requirements (User Stories)

### Must-Have

#### Create/Read/Update/Delete Account

- As a user, I want to sign up with my email address, create a password, log in and log out, so that I can securely manage my trip.  
- As a user, I want to register as a participant for a trip plan so that I can access the itinerary, collaborate with other members, and receive trip-related updates.

#### Create/Read/Update/Delete Trip Plan

- As a user, I want to create a new group trip so that I can begin organizing a travel plan with friends.  
- As a user, I want to search and mark key locations (restaurants, attractions, hotels, gas stations) on a map so that I can plan my travel route.  
- As a user, I want the map to display icons or markers that indicate planned activities, so that it’s easy to see our itinerary spatially.  
- As a user, I want to see popular travel itineraries for a specific city or region so that I can get inspiration for planning my own trip.  
- As a user, I want to create a day-by-day itinerary so that I can organize the trip efficiently.  
- As a user, I want to see my previous trip planning and the corresponding bills so I could review my previous plans.  
- As a group member, I want to see and post notices on a sharing board, so that all participants can be notified with important information.

#### Create/Read/Update/Delete Trip Routes with Map

- As a group member, I want to view an interactive map that displays all planned events as geolocated markers so that I can quickly understand the spatial layout of our trip.  
- As a group member, I want to add a new event by tapping on a specific location on the map, entering details (such as event name, description, and scheduled time), and the event will appear as a new marker on the map.  
- As a group member, I want to tap on an existing event marker to open an editing interface where I can modify details (updating the event description and time) so that the itinerary stays accurate and up-to-date.

#### Create/Read/Update/Delete Shared Bill

- As a user, I want to create a shared expense and split it among involved members so that each person’s share is clearly tracked.  
- As a user, I want to know how much the group spends and to whom I should send money in the end, so that I can easily pay the correct amount.

### Nice-to-have

#### Create/Read/Update/Delete Account

- As a user, I want to complete my profile to showcase my travel preferences and personal information, so that I can connect with my companions and find like-minded travel partners.  
- As a user, I want to sign up with my social media accounts so that I don’t have to create a new username and password.  
- As a user, I want to be able to delete my account if needed so that I can remove all personal data.  
- As a user, I want to archive my past itineraries so that I can review them later without cluttering my active trips list.  
- As a user, I want to keep a log of my trip history and archive or delete my previous trip plans, so that I can keep an organized dashboard.

#### Create/Read/Update/Delete Trip Plan

- As a user, I want to sync my itinerary with other calendar-apps, so that I can receive reminders for my scheduled activities.  
- As a user, I want to keep a checklist for luggage and to-do's in case I leave out something important.  
- As a user, I want to make our itinerary public without exposing personal privacy so that everyone can share their itineraries with other users.  
- As a group member, I want to edit our trip itinerary in real time so that members see the latest change immediately.


#### Create/Read/Update/Delete Trip Routes with Map

- As a group member, I want visual indicators (color or user avatars) to identify who picked the location, ensuring transparent collaboration.  
- As a user, I want to access detailed information for each destination (e.g., key attractions, local tips) so that I can make informed travel decisions without the need for user reviews.  
- As a user, I want to receive recommended travel routes based on real-time traffic and weather conditions so that I can adjust my plans and avoid delays.  
- As a user, I want to filter recommended travel destinations by criteria such as region, travel style (e.g., adventure, relaxation, cultural) so that I can find options that match my preferences.  
- As a user, I want to download maps and planned routes before my trip so that I can navigate even when I don’t have internet access.

#### Create/Read/Update/Delete Shared Bill

- As a user, I want to see how much each activity in our trip costs and the total cost of the trip so that I can manage my budget effectively and track expenses more efficiently.

#### Notification

- As a group member, I want to receive notifications when itineraries get updated so that I can participate in collaboration on time and stay informed about changes.  
- As a group member, I want to receive notifications when a shared expense is updated so that I can track my financial contributions and reimbursements accurately.  
- As a group member, I want to receive a daily notification with the weather forecast and itinerary summary so thatI can prepare accordingly for the day's activities.

#### Third Party Integration

- As a user, I want to log in using my Google or Facebook account so that I can quickly access my account without needing to create a new username and password.  
- As a user, I want to export my trip itinerary to an .ical file so that I can integrate it into my preferred calendar app and receive event reminders.  
- As a group member, I want real-time interaction with Google Maps for route planning and updates so that I can adjust my travel route based on traffic conditions and unexpected changes.


---

## Similar Existing Apps & Differentiation

1\. Google Trips

- Provided travel suggestions but had no group-based planning features.

2\. Wanderlog

- Offers itinerary planning but lacks real-time location sharing and group voting.

3\. TripIt

- Focuses on organizing bookings and schedules but doesn’t support group trip sharing and management.

### Our App’s unique feature

Combines itinerary planning, location sharing and expense tracking.  
voting for group decisions  
group itinerary and media for information sharing

---

## Software Architecture & Technology Stack

### React Native Android App

- Framework: React Native (with React Native CLI)  
- UI Library: Native React Native Components  
- Backend & Database: Firebase Firestore (for real-time updates & data storage)  
- Navigation: React Navigation  
- Authentication: Firebase Authentication (Google, Email, etc.)  
- Push Notifications: Firebase Cloud Messaging (FCM)  
- Maps & Location: react-native-maps



---


## Functional Requirements (For us to check)

P1 to P5 are priority levels (P1 highest priority)

### Core Requirements

#### Account Management

- Register an account (P1)  
- Login (P1)  
- Log out of an account (P1)  
- Register for a trip plan as group member (P1)  
- Invite friends via links or in-app invitations (P1)  
- Complete user profile with travel preferences (P4)  
- Sign up with social media accounts (P4)
- View log of archived trip plan (P4)

#### Trip Planning

- Create a new group trip (P1)  
- Create a structured day-by-day itinerary (P1)  
- Archive a finished itinerary (P4)  
- Real-time collaborative editing of itineraries (P3)

#### Interactive Map

- CRUD trip routes on map (P2)  
- Link routes with specific part of itinerary (P2)  
- View recommendation of routes based on traffic and weather (P4)  
- Download offline map and travel routes (P4)  
- View group members’ locations on a map (P4)

#### Expense Splitting & Cost Tracking

- Create shared bill and split them among members (P3)  
- Link the shared bill with specific activity in the itinerary (P3)  
- View the total cost of a trip plan (P3)  
- View a detailed breakdown of amounts owed (P3)

### Other Requirements

#### Notifications

- Send notifications for itinerary updates (P3)
- Send notifications for expense updates (P3)  
- Send notifications for daily weather and itinerary digest (P3)

#### Third-Party Integration

- Enable login using social media accounts (e.g., Google, Facebook) (P3)  
- Export itinerary to .ical files for calendar app subscription (P4)  
- Integrate Google Maps for location search and directions (P2)  
- Support real-time interaction with Google Maps for route planning and updates (P3)

## Non-functional Requirement

### Availability

- The application shall be accessible 24/7, ensuring users can plan, update, and review their trips from anywhere in the world, regardless of their location.  
- The service shall be free to use for users, with potential monetization options for premium features in the future.  
- The app shall provide offline support for essential features, allowing users to pre-download maps of specific locations, such as their destination cities or hiking trails. This ensures that travelers can access critical trip information even when they are in areas without internet access.

### Maintainability / Scalability

- The codebase shall follow clean coding principles with a modular design, ensuring easy maintenance and future feature expansion.  
- The separation of concerns shall be enforced, with a Flask-based backend and Firebase for data storage, while the frontend will be built using a suitable framework (React Native or Native Android).  
- The technology stack shall be scalable and reliable, capable of handling multiple simultaneous users planning and modifying trips without significant performance degradation.  
- The system shall allow new developers to onboard quickly, with well-documented APIs and clear code structures for ease of contribution.

### Usability

- The user interface shall be intuitive and user-friendly, allowing users to create and manage trips without requiring extensive instructions.  
- The app shall provide real-time feedback for user actions, such as itinerary updates, expense logging, and location sharing, ensuring a seamless and engaging experience.  
- The system shall include visual cues and notifications to indicate changes made by other group members in real-time.

### Security

- User authentication shall be enforced through Google/Facebook login integration to ensure secure access to accounts.  
- All sensitive user data, including profile information, trip details, and shared expenses, shall be encrypted using industry-standard security protocols.  
- Location sharing data shall be securely transmitted and only visible to designated group members, preventing unauthorized access.

### Portability / Compatibility

- The mobile application shall be fully functional on all Android devices.  
- The app shall provide cross-device synchronization, allowing users to access and update their trips from different devices.  
- The system shall support integration with third-party services, such as Google Maps and external calendar apps, ensuring compatibility across platforms.

### Privacy

- Users shall have control over their privacy settings, including the ability to opt-in or opt-out of location sharing at any time.  
- Users shall have the option to restrict their trip details to only invited members, preventing unwanted visibility.  
- Personal information, such as email addresses and payment details, shall be securely stored and never shared with third parties.

# Technical Documentation

## Introduction

### 1.1 Purpose

Sync-Trip is a mobile application designed to enable groups to collaboratively plan and manage trip itineraries in real time on Android and iOS platforms. It offers tools for creating trips, scheduling destinations, viewing interactive maps, and sending notifications to keep all participants up to date.

### 1.2 Scope

This document covers the following Sync-Trip features:

- Trip creation, editing, and deletion
- Destination scheduling (date, time, location)
- Real-time synchronization across devices via Firebase Firestore
- Interactive map integration for adding and viewing destinations
- Push notifications for trip updates (background only)
- Offline support using Firestore’s local cache
- Billing permission management 

### 1.3 Audience

This documentation is intended for:

- **Mobile Developers:** For feature enhancements and maintenance
- **QA/Testing Engineers:** For writing and executing automated tests
- **DevOps/Release Engineers:** For build and deployment processes
- **Product Managers:** For understanding system capabilities and limitations

## System Overview

### 2.1 Architecture

Sync-Trip uses a client-centric architecture with the following components:

1. **Frontend (React Native + Expo):**  
   - Developed with Expo SDK 48+ for Android and iOS support.  
   - UI built with React Native Paper (v5+) for consistent design.  
   - Navigation handled by React Navigation (v6+).  
   - State management via React Context for local trip data.

2. **Backend & Database (Firebase):**  
   - **Firestore:** Stores `users`, `trips`, and `destinations` collections with real-time listeners.  
   - **Storage:** Hosts images, user avatars, and ICS export files.  
   - **Authentication:** Manages user login via Firebase Auth (email/password and Google OAuth).

3. **Notifications (Expo):**  
   - Utilizes Expo Push Notification service for background alerts.  
   - Device tokens saved under `users/{uid}/expoTokens` in Firestore.

4. **Testing (Maestro + CI):**  
   - End-to-end tests defined with Maestro YAML scripts.  
   - Automated test suite run on GitHub Actions for pull request validation.

### 2.2 Technologies Used

- React Native (Expo SDK 48+)  
- React Native Paper (v5+)  
- React Navigation (v6+)  
- Firebase Firestore & Storage (v9 modular)  
- Firebase Auth (v9 modular)  
- Expo Push Notifications  
- Maestro for E2E testing  
- GitHub Actions for CI

### 2.3 Dependencies

- Node.js ≥ v18.0.0  
- npm ≥ v8.0.0  
- Expo CLI ≥ v5.0.0  
- Android SDK (API Level 21+)  

## Installation Guide

### 3.1 Prerequisites

- **Node.js** v22.14.0 or higher  
- **Yarn** ≥ v1.22.0 (or npm ≥ v8.0.0)  
- **JDK** 17  
- **Android Studio** with SDK & command-line tools  
- **Expo CLI:** Install with `npm install -g expo-cli`  
- **Firebase CLI (optional):** Install with `npm install -g firebase-tools`

### 3.2 System Requirements

- **Hardware:** Minimum 8 GB RAM, modern multi-core CPU  
- **Operating System:** macOS, Windows, or Linux  
- **Mobile Emulators:** Android Studio or Xcode Simulator

### 3.3 Installation Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/cs421sp25-homework/team-06.git
   cd sync-trip
   ```  

2. Install dependencies:

   ```bash
   yarn install
   npx expo install
   ```

3. Copy and configure environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with Firebase and Google Maps keys
   ```

4. Prebuild native code (Android):  

   ```bash
   npx expo prebuild --platform android --clean
   ```

5. Launch on emulator or device:  
   ```bash
   npx expo run:android
   ```  
6. Start development server:  
   ```bash
   npx expo start
   ```  
7. Build a development APK (EAS):  
   ```bash
   eas build --profile development --platform android
   ```

## Configuration Guide

### 4.1 Configuration Parameters  
Store the following in the `.env` file:

| Variable                    | Description                                      |
|-----------------------------|--------------------------------------------------|
| `GOOGLE_MAPS_API_KEY`       | API key for Google Maps SDK                      |
| `ANDROID_HOME`              | Path to local Android SDK                        |
| `JAVA_HOME`                 | Path to installed JDK 17                         |

### 4.2 Environment Setup

1. Export environment variables:

   ```bash
   export ANDROID_HOME="<path-to-Android-Sdk>"
   export JAVA_HOME="<path-to-JDK-17>"
   export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
   ```

2. Verify setup:  
   ```bash
   npx react-native doctor
   ```  
3. Firebase configuration:  
   - Place `google-services.json` in `android/app/`.  
   - Ensure Firestore, Auth, and Storage are enabled in Firebase Console.

### 4.3 External Services Integration

- **Firestore Emulators:** Configure in `firebase.json`, run `firebase emulators:start`.  
- **Expo Push Notifications:** Register tokens with `NotificationHandler.registerForPushNotificationsAsync()`, then save to Firestore.  
- **Cloud Functions:** (Planned) For server-side triggers on billing changes.

## Usage Guide

### 5.1 User Interface Overview

- Login / Signup: User authentication screens
- Home / Dashboard: Active and archived trips list
- New Trip: Form for title, dates, and member invites
- Current Trip:
  • Map Tab: Add/view destination markers
  • Destinations: Edit or delete scheduled stops
  • Checklist & Announcements: Collaboration tools
  • Billing: Expense entry and split summary
- Profile: Manage user information and logout

### 5.2 User Authentication

- Supports Email/Password and Google OAuth via Firebase Auth.  
- Session management and token refresh handled by Firebase SDK.

### 5.3 Core Functionality

- Trips CRUD: Create, read, update, delete trips.  
- Destinations Management: Add via map or list, edit/delete through modals.  
- Real-Time Sync: Data writes via React Context trigger Firestore updates; onSnapshot listeners refresh UI immediately.

### 5.4 Advanced Features  

- Push Notifications: Background alerts for trip changes via Expo Notification service.  
- Expense Tracking: Create bills and transactions with automatic splitting.  
- Calendar Export: Generate .ics files stored in Firebase Storage.

### 5.5 Troubleshooting  

- ? Missing Push Token: Confirm NotificationHandler runs on login and writes to Firestore.  
- **TODO**

## API Documentation

### 6.1 Endpoints

All interactions use Firestore collections; there are no custom REST endpoints.

- users/{uid}
- trips/{tripId}
- trips/{tripId}/destinations/{destinationId}

### 6.2 Request and Response Formats

**Trip Document Example:**  
{  
  "title": "Beach Trip",  
  "ownerId": "user123",  
  "startDate": "2025-05-01T00:00:00.000Z",  
  "endDate": "2025-05-07T00:00:00.000Z",  
  "destinations": [ ... ],  
  "collaborators": ["user123","user456"],  
  "status": "planning"  
}

**Destination Document Example:**  
{  
  "latitude": 40.7128,  
  "longitude": -74.0060,  
  "place_id": "ChIJOwg_06VPwokRYv534QaPC8g",  
  "tripId": "trip123",  
  "address": "New York, NY",  
  "description": "Statue of Liberty",  
  "date": "2025-05-02T09:00:00.000Z",  
  "name": "Statue of Liberty",  
  "createdByUid": "user123"  
}

### 6.3 Authentication and Authorization

- Security Rules:
  - Only authenticated users who are collaborators or owner of the trip can C/R/U/D trip data.  
  - Only owner of a bill can C/R/U/D billing data.

## Database Schema

### 7.1 Entity-Relationship Diagram  

The data model consists of four main entities with one-to-many relationships:

- User (1) → Trip (many): Each user can create or join multiple trips, referenced by collaborators in the Trip document.  
- Trip (1) → Destination (many): Each trip contains multiple destinations, stored in the destinations subcollection under a trip.  
- User (1) → ExpoToken (many): Users may have multiple device tokens, saved in the expoTokens array.  
- Trip (1) → Bill (many): Each trip can have multiple bills, stored in a bills subcollection under a trip.

### 7.2 Table Definitions

**users:**  
{  
  "uid": "user123",  
  "email": "user@example.com",  
  "name": "Jane Doe",  
  "bio": "Traveler",  
  "travelPreference": "Backpacking",  
  "currentTripId": "trip123",  
  "profilePicture": "url_to_storage",  
  "backgroundPicture": "url_to_storage",  
  "tripsIdList": ["trip123","trip456"],  
  "paypalEmail": "jane@paypal.com"  
}

**trips:**  
{  
  "id": "trip123",  
  "title": "NYC Adventure",  
  "startDate": "2025-05-01T00:00:00.000Z",  
  "endDate": "2025-05-07T00:00:00.000Z",  
  "destinations": [Destination,...],  
  "ownerId": "user123",  
  "collaborators": ["user123","user456"],  
  "status": "planning"  
}

**destinations:**  
{  
  "id": "dest123",  
  "latitude": 40.7128,  
  "longitude": -74.0060,  
  "place_id": "ChIJOwg_06VPwokRYv534QaPC8g",  
  "tripId": "trip123",  
  "address": "New York, NY",  
  "description": "Statue of Liberty",  
  "date": "2025-05-02T09:00:00.000Z",  
  "name": "Statue of Liberty",  
  "createdByUid": "user123"  
}

**bills:**  
{  
  "id": "bill123",  
  "createdBy": "user123",  
  "participants": ["user123","user456"],  
  "title": "Lunch Bill",  
  "currency": "USD",  
  "summary": {  
    "user123": { "user456": 25 },  
    "user456": { "user123": 25 }  
  },  
  "isDraft": false,  
  "archived": false,  
  "description": "Lunch at diner",  
  "category": "food"  
}

### 7.3 Relationships and Constraints  

- **users → trips:** One-to-many via `collaborators` and `ownerId`.  
- **trips → destinations:** One-to-many via `tripId`.  
- **trips → bills:** One-to-many via `tripId`.  
- Firestore security rules enforce access based on `ownerId` and `collaborators`.

### 7.4 UML diagram

- **billing_module.
- **collaboration_module.
- **trip_module.

- View asset directory under docs

## Testing

### 8.1 Test Plan

End-to-end testing using Maestro to cover:

| Field               | Description                                                |
|---------------------|------------------------------------------------------------|
| `Test Plan ID`      | TP-001                                                     |
| `Title`             | Signup Function                                            |
| `Test Strategy`     | Manual Testing & Automation                                |
| `Scope`             | All features will be tested                                |
| `Test Environment`  | Emulator & Android Phone                                   |
| `Test Deliverables` | Test cases, Test scripts, Bug reports, Test summary report |

| Field               | Description                                                |
|---------------------|------------------------------------------------------------|
| `Test Plan ID`      | TP-002                                                     |
| `Title`             | Reset Password                                             |
| `Test Strategy`     | Manual Testing & Automation                                |
| `Scope`             | All features will be tested                                |
| `Test Environment`  | Emulator & Android Phone                                   |
| `Test Deliverables` | Test cases, Test scripts, Bug reports, Test summary report |

| Field               | Description                                                                                                            |
|---------------------|------------------------------------------------------------------------------------------------------------------------|
| `Test Plan ID`      | TP-003                                                                                                                 |
| `Title`             | Profile Test                                                                                                           |
| `Test Strategy`     | Automation                                                                                                             |
| `Scope`             | Profile info will be tested, change of avatar and backgroud will not be tested <br/> (depends on the picture in album) |
| `Test Environment`  | Emulator & Android Phone                                                                                               |
| `Test Deliverables` | Test cases, Test scripts, Bug reports, Test summary report                                                             |

| Field               | Description                                                |
|---------------------|------------------------------------------------------------|
| `Test Plan ID`      | TP-004                                                     |
| `Title`             | Trip Creation Test                                         |
| `Test Strategy`     | Automation                                                 |
| `Scope`             | All features will be tested                                |
| `Test Environment`  | Emulator & Android Phone                                   |
| `Test Deliverables` | Test cases, Test scripts, Bug reports, Test summary report |

| Field               | Description                                                |
|---------------------|------------------------------------------------------------|
| `Test Plan ID`      | TP-005                                                     |
| `Title`             | Checklist Test                                             |
| `Test Strategy`     | Automation                                                 |
| `Scope`             | All features will be tested                                |
| `Test Environment`  | Emulator & Android Phone                                   |
| `Test Deliverables` | Test cases, Test scripts, Bug reports, Test summary report |

| Field               | Description                                                |
|---------------------|------------------------------------------------------------|
| `Test Plan ID`      | TP-006                                                     |
| `Title`             | Announcement Test                                          |
| `Test Strategy`     | Automation                                                 |
| `Scope`             | All features will be tested                                |
| `Test Environment`  | Emulator & Android Phone                                   |
| `Test Deliverables` | Test cases, Test scripts, Bug reports, Test summary report |

| Field               | Description                                                                  |
|---------------------|------------------------------------------------------------------------------|
| `Test Plan ID`      | TP-007                                                                       |
| `Title`             | Bill Test                                                                    |
| `Test Strategy`     | Manual Testing & Automation                                                  |
| `Scope`             | Operations on bills be tested automatically. Transactions be tested manually |
| `Test Environment`  | Emulator & Android Phone                                                     |
| `Test Deliverables` | Test cases, Test scripts, Bug reports, Test summary report                   |

| Field               | Description                                                |
|---------------------|------------------------------------------------------------|
| `Test Plan ID`      | TP-008                                                     |
| `Title`             | Route Test                                                 |
| `Test Strategy`     | Automation                                                 |
| `Scope`             | All features will be tested                                |
| `Test Environment`  | Emulator & Android Phone                                   |
| `Test Deliverables` | Test cases, Test scripts, Bug reports, Test summary report |

| Field               | Description                                                |
|---------------------|------------------------------------------------------------|
| `Test Plan ID`      | TP-009                                                     |
| `Title`             | Entire Test                                                |
| `Test Strategy`     | Manual Testing & Automation (Related to TP above)          |
| `Scope`             | All features will be tested (Related to TP above)          |
| `Test Environment`  | Emulator & Android Phone (Related to TP above)             |
| `Test Deliverables` | Test cases, Test scripts, Bug reports, Test summary report |

| Field               | Description                 |
|---------------------|-----------------------------|
| `Test Plan ID`      | TP-010                      |
| `Title`             | Notification Test           |
| `Test Strategy`     | Manual Testing              |
| `Scope`             | All features will be tested |
| `Test Environment`  | Android Phone               |
| `Test Deliverables` | Test cases, Bug reports     |

### 8.2 Test Cases

Defined in YAML files under `./maestro/`, including:

| Field             | Description                                                                              |
|-------------------|------------------------------------------------------------------------------------------|
| `Test Case ID`    | TC-001                                                                                   |
| `Title`           | Signup Function (Need manual operations to make it work)                                 |
| `Preconditions`   | User has the app on the phone or emulator                                                |
| `Test Steps`      | 1. Type in the email. 2. Type in the password twice 3. Submit request 4. Verify on email |
| `Test Data`       | User email, User Password                                                                |
| `Expected Result` | Users received the email and can login                                                   |
| `Actual Result`   | N/A                                                                                      |
| `Status`          | N/A                                                                                      |

| Field             | Description                                                       |
|-------------------|-------------------------------------------------------------------|
| `Test Case ID`    | TC-002                                                            |
| `Title`           | Reset Password (Need manual operations to make it work)           |
| `Preconditions`   | User has a valid account                                          |
| `Test Steps`      | 1. Click "Forget the password". 2. Reset password via email.      |
| `Test Data`       | User email                                                        |
| `Expected Result` | Users received the email, reset password, and login successfully. |
| `Actual Result`   | N/A                                                               |
| `Status`          | N/A                                                               |

| Field             | Description                                                    |
|-------------------|----------------------------------------------------------------|
| `Test Case ID`    | TC-003                                                         |
| `Title`           | Profile Test                                                   |
| `Preconditions`   | User has a valid account                                       |
| `Test Steps`      | 1. Login 2. Navigate to profile screen 3. Update user profile. |
| `Test Data`       | User Info                                                      |
| `Expected Result` | User update the profile successfully.                          |
| `Actual Result`   | N/A                                                            |
| `Status`          | N/A                                                            |

| Field             | Description                                                                                                                                  |
|-------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `Test Case ID`    | TC-004                                                                                                                                       |
| `Title`           | Trip Creation Test                                                                                                                           |
| `Preconditions`   | User has a valid account                                                                                                                     |
| `Test Steps`      | 1. Login 2. Navigate to map screen 3. Create Trip by using map. 4. Modify the trip <br/> 5. Create the destination 6. Modify the destination 7. Archive Trip. 8. Restore Trip |
| `Test Data`       | User Info, Trip Info                                                                                                                         |
| `Expected Result` | User can create (Trip, Destination), see the info of (Trip, Destination), and edit the (Trip, Destination), archive and restore the trip                                   |
| `Actual Result`   | N/A                                                                                                                                          |
| `Status`          | N/A                                                                                                                                          |

| Field             | Description                                                                        |
|-------------------|------------------------------------------------------------------------------------|
| `Test Case ID`    | TC-005                                                                             |
| `Title`           | Checklist Test                                                                     |
| `Preconditions`   | User has a valid account, User has created at least one trip.                      |
| `Test Steps`      | 1. Login 2. Navigate to trip screen 3. Create the checklist, 4. Edit the checklist |
| `Test Data`       | User Info, Trip Info, Checklist Info                                               |
| `Expected Result` | User can create checklist, see the info of checklist, and edit the checklist       |
| `Actual Result`   | N/A                                                                                |
| `Status`          | N/A                                                                                |

| Field             | Description                                                                                                                         |
|-------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| `Test Case ID`    | TC-006                                                                                                                              |
| `Title`           | Announcement Test                                                                                                                   |
| `Preconditions`   | User has a valid account, User has created at least one trip                                                                        |
| `Test Steps`      | 1. Login 2. Navigate to dashboard screen 3. Create the announcement, 4. Edit the announcement |
| `Test Data`       | User Info, Trip Info, Announcement Info                                                                                             |
| `Expected Result` | User can create announcement, see the info of announcement, and edit the announcement                                               |
| `Actual Result`   | N/A                                                                                                                                 |
| `Status`          | N/A                                                                                                                                 |

| Field             | Description                                                                                       |
|-------------------|---------------------------------------------------------------------------------------------------|
| `Test Case ID`    | TC-007                                                                                            |
| `Title`           | Bill Test (Need manual operations to make it work)                                                |
| `Preconditions`   | User has a valid account, User has created at least one trip, Trip has at least two participants. |
| `Test Steps`      | 1. Login 2. Navigate to bill screen 3. Create the bill, 4. Edit the bill, 5. Archive the bill, 6. Restore the bill 7. Make transactions     |
| `Test Data`       | User Info, Trip Info, Bill Info                                                                   |
| `Expected Result` | User can create bill, see the info of bill, edit the bill, and make transactions                  |
| `Actual Result`   | N/A                                                                                               |
| `Status`          | N/A                                                                                               |

| Field             | Description                                                                                       |
|-------------------|---------------------------------------------------------------------------------------------------|
| `Test Case ID`    | TC-008                                                                                            |
| `Title`           | Route Test                                                                                        |
| `Preconditions`   | User has a valid account, User has created at least one trip, Trip has at least two destinations. |
| `Test Steps`      | 1. Login 2. Navigate to map screen 3. Create the route, 4. Edit the route 5. Generate the route   |
| `Test Data`       | User Info, Trip Info, Announcement Info                                                           |
| `Expected Result` | User can create route, see the info of route, edit the route info                                 |
| `Actual Result`   | N/A                                                                                               |
| `Status`          | N/A                                                                                               |

| Field             | Description                                     |
|-------------------|-------------------------------------------------|
| `Test Case ID`    | TC-009                                          |
| `Title`           | Entire Test                                     |
| `Preconditions`   | User has a valid account.                       |
| `Test Steps`      | From TC-001 to TC-008.                          |
| `Test Data`       | All info included in TC-001 to TC-008.          |
| `Expected Result` | User can run the TC-001 to TC-008 successfully. |
| `Actual Result`   | N/A                                             |
| `Status`          | N/A                                             |

| Field             | Description                                                                                 |
|-------------------|---------------------------------------------------------------------------------------------|
| `Test Case ID`    | TC-010                                                                                      |
| `Title`           | Notification Test                                                                           |
| `Preconditions`   | User has a valid account. Have two physical devices to run the test(separate accounts)      |
| `Test Steps`      | 1. Update the trip 2. Update the bill 3. Receive the notification on another device         |
| `Test Data`       | User Info, Trip Info, Bill Info                                                             |
| `Expected Result` | Once the trip or bill is updated on one account, another account will receive notifications |
| `Actual Result`   | N/A                                                                                         |
| `Status`          | N/A                                                                                         |

### 8.3 Test Results (solid results on physical devices)

| Field             | Description                                               |
|-------------------|-----------------------------------------------------------|
| `Test Case ID`    | TC-001                                                    |
| `Title`           | Signup Function (Need manual operations to make it work)  |
| `Actual Result`   | Users received the email and can login                    |
| `Status`          | ✅Pass                                                     |

| Field             | Description                                                       |
|-------------------|-------------------------------------------------------------------|
| `Test Case ID`    | TC-002                                                            |
| `Title`           | Reset Password (Need manual operations to make it work)           |
| `Actual Result`   | Users received the email, reset password, and login successfully. |
| `Status`          | ✅Pass                                                             |

| Field             | Description                           |
|-------------------|---------------------------------------|
| `Test Case ID`    | TC-003                                |
| `Title`           | Profile Test                          |
| `Actual Result`   | User update the profile successfully  |
| `Status`          | ✅Pass                                 |

| Field             | Description                                                                                                 |
|-------------------|-------------------------------------------------------------------------------------------------------------|
| `Test Case ID`    | TC-004                                                                                                      |
| `Title`           | Trip Creation Test                                                                                          |
| `Actual Result`   | User can create (Trip, Destination), see the info of (Trip, Destination), edit the (Trip, Destination), and archive(restore) the trip |
| `Status`          | ✅Pass                                                                                                       |

| Field             | Description                                                                   |
|-------------------|-------------------------------------------------------------------------------|
| `Test Case ID`    | TC-005                                                                        |
| `Title`           | Checklist Test                                                                |
| `Actual Result`   | User can create checklist, see the info of checklist, and edit the checklist  |
| `Status`          | ✅Pass                                                                         |

| Field             | Description                                                                            |
|-------------------|----------------------------------------------------------------------------------------|
| `Test Case ID`    | TC-006                                                                                 |
| `Title`           | Announcement Test                                                                      |
| `Actual Result`   | User can create announcement, see the info of announcement, and edit the announcement  |
| `Status`          | ✅Pass                                                                                  |

| Field             | Description                                                                       |
|-------------------|-----------------------------------------------------------------------------------|
| `Test Case ID`    | TC-007                                                                            |
| `Title`           | Bill Test (Need manual operations to make it work)                                |
| `Actual Result`   | User can create bill, see the info of bill, edit the bill, archive the bill, restore the bill, and make transactions  |
| `Status`          | ✅Pass                                                                             |

| Field             | Description                                                        |
|-------------------|--------------------------------------------------------------------|
| `Test Case ID`    | TC-008                                                             |
| `Title`           | Route Test                                                         |
| `Actual Result`   | User can create route, see the info of route, edit the route info  |
| `Status`          | ✅Pass                                                              |

| Field             | Description                                      |
|-------------------|--------------------------------------------------|
| `Test Case ID`    | TC-009                                           |
| `Title`           | Entire Test                                      |
| `Actual Result`   | User can run the TC-001 to TC-008 successfully.  |
| `Status`          | ✅Pass                                            |

| Field             | Description                                  |
|-------------------|----------------------------------------------|
| `Test Case ID`    | TC-0010                                      |
| `Title`           | Notification Test                            |
| `Actual Result`   | User can receive notifications successfully. |
| `Status`          | ✅Pass                                        |

## Deployment

### 9.1 Deployment Process  

Production builds and submission via EAS:

```bash
eas build --profile production --platform android
```  

Monitor build status in Expo dashboard and app store consoles.

### 9.2 Release Notes  

### 9.3 Known Issues and Limitations  

- **In-App Notifications:** Expo supports background only; no in-app banners.  
- **Offline Support:** Local changes make in offline won't be synced to the server, and will be covered by the next sync from cloud when user reconnects.
- **Map Support:** detailed instructions for route planning are not provided; intelligenttraveling suggestions are not provided.
- **Place Choice Logic:** Only fetch the exact location user tap on the map, suggestions for nearby locations are not provided.

## Glossary

### 10.1 Terms and Definitions

- **Trip:** Collection of destinations shared among users.  
- **Destination:** Scheduled stop with date, time, and location.  
- **React Context:** API for passing state through the component tree.  
- **Firestore Subscription:** Real-time data listener for Firestore documents.  
- **Maestro:** End-to-end testing framework for Expo applications.

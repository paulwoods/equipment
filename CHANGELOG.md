# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.8] - 2026-01-04

### Added

- **Authentication System**:
  - Implemented username/password authentication using `APP_USERNAME` and `APP_PASSWORD` environment variables.
  - Added a login page and logout functionality.
  - Implemented middleware to protect all routes except the home page.
  - Added a session-based authentication using secure HTTP-only cookies.
- **User Interface Enhancements**:
  - Added a "Welcome, [username]" message and a Logout button to the application header.
  - Updated breadcrumbs to be hidden on the login page.

### Fixed

- **Authentication**: Fixed an issue where authentication cookies were not persisted in production environments without
  HTTPS by setting the `secure` flag to `false`.

### Changed

- **Data Configuration**:
  - Renamed the environment variable `EQUIPMENT_DATA_DIR` to `APP_DATA_DIR` for better consistency.
- **Maintenance Logic Improvements**:
  - Refactored `calculateDueDetails` into a common utility file (`src/lib/procedureUtils.ts`) to reduce code
    duplication.
  - Updated due date calculations to use `Math.ceil` for more accurate "days remaining" estimates.
  - Improved precision in maintenance scheduling by preserving the time setting in date calculations.
- **Navigation**:
  - Updated the logout process to redirect users back to the home page.

## [0.1.7] - 2025-12-29

### Added

- **Dashboard Calendar View**:
  - Added a tab bar to the dashboard to toggle between List and Calendar views.
  - Implemented a monthly calendar view that highlights procedure due dates.
  - Color-coded calendar entries (blue for scheduled, red for overdue).
  - Added quick navigation to procedure details from the calendar.
- **Enhanced Procedure Requirements**:
  - Added a dedicated field for **Required Tools / PPE** to maintenance procedures with Markdown support.
  - Displayed pre-requisites on procedure detail and performance pages.
  - Updated procedure forms to a 2-column layout on larger screens.

### Changed

- Improved display of equipment tracking fields (SN, Asset Tag, Location, Status) across all relevant pages.

## [0.1.6] - 2025-12-29

### Added
- **Advanced Equipment Tracking**:
    - Added Serial Number and Asset Tag fields to equipment.
    - Added Location tracking for equipment.
    - Added Status management (Active, In Use, Under Repair, Decommissioned, In Storage) with color-coded badges.
    - Updated equipment forms, lists, and detail views to support new fields.
    - Improved sorting and filtering on the equipment list page.

### Changed
- Improved sorting logic on the equipment procedures page to prioritize procedures without performance history.
- Refined procedure steps display on the performance page for better clarity.

## [0.1.5] - 2025-12-29

### Changed
- Improved dashboard sorting logic to prioritize procedures without performance history.
- Enhanced procedure performance page layout with more prominent instructions.

## [0.1.4] - 2025-12-29

### Added
- Displayed procedure steps on the procedure performance page above the input fields.

## [0.1.3] - 2025-12-29

### Changed
- Updated version to 0.1.3.

## [0.1.2] - 2025-12-28

### Changed
- Updated version to 0.1.2.

## [0.1.1] - 2025-12-28

### Changed
- Updated project version to 0.1.1.
- Updated documentation and Docker examples to reflect version 0.1.1.

## [0.1.0] - 2025-12-28

### Added
- **Core Features**:
    - Equipment inventory management (Add, Edit, Delete, View).
    - Maintenance procedure definition with Markdown support.
    - Performance history tracking for procedures.
    - Responsive Dashboard for monitoring upcoming maintenance.
- **Navigation**:
    - Dynamic breadcrumb navigation across all pages.
    - Modern landing page with quick access to Dashboard and Equipment.
    - Global header with theme toggle (Light/Dark mode).
    - Global footer with navigation links and copyright.
- **Information Pages**:
    - About page describing system features and technology stack.
    - Contact Us page with contact information and form.
- **DevOps & Deployment**:
    - Multi-stage Dockerfile for optimized production builds.
    - `docker-compose.yaml` for easy local deployment with persistence.
    - Jenkinsfile for automated CI/CD pipeline (build, test, push to Docker Hub).
    - Healthcheck instruction in Dockerfile.

### Changed
- Refactored home page into a landing page, moving equipment list to `/equipment`.
- Improved mobile responsiveness for headers and lists across the application.
- Swapped columns in Equipment List to prioritize Model Number.
- Enhanced procedure forms to display relevant equipment details at the top.
- Standardized button colors (Blue for primary actions like Dashboard/Equipment buttons).

### Fixed
- Fixed broken equipment links on the Dashboard.
- Fixed invisible cursor/caret in procedure steps editor when in Dark Mode.
- Improved link styling consistency (Blue text with hover underline).

## [0.0.1] - 2024-12-28
### Added
- Initial project structure and base functionality.

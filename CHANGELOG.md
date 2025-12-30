# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

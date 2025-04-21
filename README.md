# Shift Scheduling App

A React-based shift scheduling application that helps manage and optimize shift assignments for a team with multiple shifts per day.

## Features

- Configure shift requirements for each day and shift type
- Add and manage team members with different roles (workers and managers)
- Define incompatible pairs of team members who cannot work the same shift
- Set availability preferences for each team member
- Generate optimized shift schedules with validation
- Export schedules to CSV format
- Save and load settings

## Installation

1. Make sure you have Node.js installed on your system
2. Clone this repository
3. Navigate to the project directory
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

The application consists of four main screens:

1. **Settings Screen**
   - Set the first day of the week
   - Configure the number of people required for each shift
   - Add and manage team members

2. **Incompatible Pairs Screen**
   - Define pairs of team members who cannot work the same shift

3. **Availability Screen**
   - Set availability preferences for each team member
   - Mark shifts as:
     - Available (green)
     - Unavailable (red)
     - Preferred (yellow)
     - Required (blue)

4. **Schedule Screen**
   - View and generate shift schedules
   - Validate schedule constraints
   - Export schedule to CSV
   - Manually adjust assignments if needed

## Data Persistence

All settings are automatically saved to the browser's local storage. This means:
- Your data will persist between sessions
- You can close and reopen the application without losing your settings
- Settings are specific to the browser you're using

## Exporting Data

To export the current schedule:
1. Navigate to the Schedule screen
2. Click the save icon in the top-right corner
3. A CSV file will be downloaded with the current schedule

## Requirements

- Node.js 14 or higher
- Modern web browser with JavaScript enabled

## Browser Compatibility

The application is compatible with:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is licensed under the MIT License.

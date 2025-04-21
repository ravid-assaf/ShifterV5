# Shifter - Work Schedule Management

A modern web application for managing work schedules, built with React, TypeScript, and Material-UI.

## Features

- Create and manage employee schedules
- Set shift requirements for each day
- Handle incompatible pairs of workers
- Manage worker availability
- Export schedules to CSV
- Save and load schedule configurations

## Tech Stack

- React 19
- TypeScript
- Material-UI v7
- Vite 6
- React Router v7

## Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd shifter
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

5. Preview production build:
```bash
npm run preview
```

## Deployment

### GitHub Pages

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

To deploy:

1. Push your changes to the main branch
2. GitHub Actions will automatically build and deploy your changes
3. Visit your GitHub Pages URL to see the deployed application

### Manual Deployment

To deploy to any static hosting service:

1. Build the project:
```bash
npm run build
```

2. Deploy the contents of the `dist` directory to your hosting service

## Environment Variables

- `VITE_BASE_URL`: Base URL for the application (default: '/')

## License

MIT

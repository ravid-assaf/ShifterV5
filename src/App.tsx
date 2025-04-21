import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useState } from 'react';
import { ScheduleSettings } from './types';
import SettingsScreen from './screens/SettingsScreen';
import IncompatiblePairsScreen from './screens/IncompatiblePairsScreen';
import AvailabilityScreen from './screens/AvailabilityScreen';
import ScheduleScreen from './screens/ScheduleScreen';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

const defaultSettings: ScheduleSettings = {
  firstDayOfWeek: 'sunday',
  shiftRequirements: {
    sunday: { morning: 3, afternoon: 3, night: 1 },
    monday: { morning: 3, afternoon: 3, night: 1 },
    tuesday: { morning: 3, afternoon: 3, night: 1 },
    wednesday: { morning: 3, afternoon: 3, night: 1 },
    thursday: { morning: 3, afternoon: 3, night: 2 },
    friday: { morning: 3, afternoon: 2, night: 1 },
    saturday: { morning: 3, afternoon: 3, night: 1 },
  },
  persons: [],
  incompatiblePairs: [],
  availability: {},
};

function App() {
  const [settings, setSettings] = useState<ScheduleSettings>(() => {
    const savedSettings = localStorage.getItem('scheduleSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });
  const [lastSavePath, setLastSavePath] = useState<string | null>(null);

  const handleSaveSettings = (newSettings: ScheduleSettings) => {
    setSettings(newSettings);
    localStorage.setItem('scheduleSettings', JSON.stringify(newSettings));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/settings" replace />} />
          <Route
            path="/settings"
            element={
              <SettingsScreen
                settings={settings}
                onSave={handleSaveSettings}
                lastSavePath={lastSavePath}
                onSetLastSavePath={setLastSavePath}
              />
            }
          />
          <Route
            path="/incompatible-pairs"
            element={
              <IncompatiblePairsScreen
                settings={settings}
                onSave={handleSaveSettings}
                lastSavePath={lastSavePath}
                onSetLastSavePath={setLastSavePath}
              />
            }
          />
          <Route
            path="/availability"
            element={
              <AvailabilityScreen
                settings={settings}
                onSave={handleSaveSettings}
                lastSavePath={lastSavePath}
                onSetLastSavePath={setLastSavePath}
              />
            }
          />
          <Route
            path="/schedule"
            element={
              <ScheduleScreen
                settings={settings}
                onSave={handleSaveSettings}
                lastSavePath={lastSavePath}
                onSetLastSavePath={setLastSavePath}
              />
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;

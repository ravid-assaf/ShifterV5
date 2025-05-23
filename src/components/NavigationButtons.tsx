import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from '@mui/material';
import { ScheduleSettings, DayType } from '../types';

interface NavigationButtonsProps {
  currentScreen: string;
  settings: ScheduleSettings;
  onSave: (settings: ScheduleSettings) => void;
  onNavigate: (screen: string) => void;
  lastSavePath: string | null;
  onSetLastSavePath: (path: string) => void;
}

const screens = ['settings', 'incompatible-pairs', 'availability', 'schedule'];

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentScreen,
  settings,
  onSave,
  onNavigate,
  lastSavePath,
  onSetLastSavePath,
}: NavigationButtonsProps) => {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [fileName, setFileName] = useState('');

  const currentIndex = screens.indexOf(currentScreen);
  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < screens.length - 1;

  const handleNavigation = (screen: string) => {
    // Save current settings before navigation
    onSave(settings);
    onNavigate(screen);
  };

  const handleSave = () => {
    if (lastSavePath) {
      onSave(settings);
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = lastSavePath;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      setSaveDialogOpen(true);
    }
  };

  const handleSaveAs = () => {
    setFileName('');
    setSaveDialogOpen(true);
  };

  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        file.text().then(text => {
          try {
            const loadedSettings = JSON.parse(text);
            onSave(loadedSettings);
            onSetLastSavePath(file.name);
          } catch (error) {
            console.error('Error loading settings:', error);
          }
        });
      }
    };
    input.click();
  };

  const handleReset = () => {
    setResetDialogOpen(true);
  };

  const handleResetConfirm = () => {
    const defaultSettings: ScheduleSettings = {
      shiftRequirements: {
        sunday: { morning: 0, afternoon: 0, night: 0 },
        monday: { morning: 0, afternoon: 0, night: 0 },
        tuesday: { morning: 0, afternoon: 0, night: 0 },
        wednesday: { morning: 0, afternoon: 0, night: 0 },
        thursday: { morning: 0, afternoon: 0, night: 0 },
        friday: { morning: 0, afternoon: 0, night: 0 },
        saturday: { morning: 0, afternoon: 0, night: 0 },
      },
      persons: [],
      firstDayOfWeek: 'sunday' as DayType,
      incompatiblePairs: [],
      availability: {},
    };
    onSave(defaultSettings);
    onSetLastSavePath('');
    setResetDialogOpen(false);
  };

  const handleSaveConfirm = () => {
    if (!fileName) {
      alert('Please enter a file name');
      return;
    }

    const filePath = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
    onSave(settings);
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filePath;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    onSetLastSavePath(filePath);
    setSaveDialogOpen(false);
    setFileName('');
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: 2,
      mb: 3
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        gap: 1
      }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
          <Button variant="contained" onClick={handleSaveAs}>
            Save As
          </Button>
          <Button variant="contained" onClick={handleLoad}>
            Load
          </Button>
          <Button variant="contained" color="error" onClick={handleReset}>
            Reset
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {canGoBack && (
            <Button variant="contained" onClick={() => handleNavigation(screens[currentIndex - 1])}>
              Back
            </Button>
          )}
          {canGoNext && (
            <Button variant="contained" onClick={() => handleNavigation(screens[currentIndex + 1])}>
              Continue
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: 1,
        flexWrap: 'wrap'
      }}>
        <Button
          variant="contained" 
          color="success" 
          onClick={() => handleNavigation('settings')}
          disabled={currentScreen === 'settings'}
        >
          Settings
        </Button>
        <Button
          variant="contained" 
          color="success" 
          onClick={() => handleNavigation('incompatible-pairs')}
          disabled={currentScreen === 'incompatible-pairs'}
        >
          Incompatible Pairs
        </Button>
        <Button 
          variant="contained" 
          color="success" 
          onClick={() => handleNavigation('availability')}
          disabled={currentScreen === 'availability'}
        >
          Availability
        </Button>
        <Button 
          variant="contained" 
          color="success" 
          onClick={() => handleNavigation('schedule')}
          disabled={currentScreen === 'schedule'}
        >
          Schedule
        </Button>
      </Box>

      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Reset Settings</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reset all settings? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleResetConfirm} color="error">Reset</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Settings</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter a name for the settings file:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="File Name"
            type="text"
            fullWidth
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="schedule_settings.json"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveConfirm}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NavigationButtons; 
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  Paper,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  SelectChangeEvent,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { ScheduleSettings, DayType, Person, ShiftType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import NavigationButtons from '../components/NavigationButtons';

interface SettingsScreenProps {
  settings: ScheduleSettings;
  onSave: (settings: ScheduleSettings) => void;
  lastSavePath: string | null;
  onSetLastSavePath: (path: string) => void;
}

const generateUniqueColor = (existingColors: string[]): string => {
  // Define a set of distinct base colors
  const baseColors = [
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FF8000', // Orange
    '#8000FF', // Purple
    '#00FF80', // Spring Green
    '#FF0080', // Rose
    '#80FF00', // Chartreuse
    '#0080FF', // Azure
  ];

  // Try to use a base color first
  const availableBaseColor = baseColors.find(color => !existingColors.includes(color));
  if (availableBaseColor) {
    return availableBaseColor;
  }

  // If all base colors are used, generate a random color with high saturation and value
  let color;
  do {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 80 + Math.floor(Math.random() * 20); // 80-100% saturation
    const value = 80 + Math.floor(Math.random() * 20); // 80-100% value
    color = `hsl(${hue}, ${saturation}%, ${value}%)`;
  } while (existingColors.includes(color));

  return color;
};

const SettingsScreen = ({ settings, onSave, lastSavePath, onSetLastSavePath }: SettingsScreenProps) => {
  const navigate = useNavigate();
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<DayType>(settings.firstDayOfWeek);
  const [shiftRequirements, setShiftRequirements] = useState(settings.shiftRequirements);
  const [persons, setPersons] = useState<Person[]>(settings.persons);
  const [newPerson, setNewPerson] = useState({
    name: '',
    isManager: false,
    maxShiftsPerWeek: 6,
  });
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleSave = () => {
    onSave({
      ...settings,
      firstDayOfWeek,
      shiftRequirements,
      persons,
    });
  };

  const handleAddPerson = () => {
    if (newPerson.name.trim()) {
      const existingColors = persons.map(p => p.color);
      const person: Person = {
        id: uuidv4(),
        name: newPerson.name,
        isManager: newPerson.isManager,
        maxShiftsPerWeek: newPerson.maxShiftsPerWeek,
        color: generateUniqueColor(existingColors),
      };
      setPersons([...persons, person]);
      setNewPerson({ name: '', isManager: false, maxShiftsPerWeek: 6 });
    }
  };

  const handleEditPerson = (person: Person) => {
    setEditingPerson(person);
    setNewPerson({
      name: person.name,
      isManager: person.isManager,
      maxShiftsPerWeek: person.maxShiftsPerWeek,
    });
  };

  const handleUpdatePerson = () => {
    if (editingPerson && newPerson.name.trim()) {
      setPersons(persons.map(p =>
        p.id === editingPerson.id
          ? { ...p, ...newPerson }
          : p
      ));
      setEditingPerson(null);
      setNewPerson({ name: '', isManager: false, maxShiftsPerWeek: 6 });
    }
  };

  const handleDeletePerson = (id: string) => {
    setPersons(persons.filter(p => p.id !== id));
  };

  const handleResetSettings = () => {
    setFirstDayOfWeek('sunday');
    setShiftRequirements({
      sunday: { morning: 3, afternoon: 3, night: 1 },
      monday: { morning: 3, afternoon: 3, night: 1 },
      tuesday: { morning: 3, afternoon: 3, night: 1 },
      wednesday: { morning: 3, afternoon: 3, night: 1 },
      thursday: { morning: 3, afternoon: 3, night: 2 },
      friday: { morning: 3, afternoon: 2, night: 1 },
      saturday: { morning: 3, afternoon: 3, night: 1 },
    });
    setPersons([]);
    setNewPerson({ name: '', isManager: false, maxShiftsPerWeek: 6 });
    setEditingPerson(null);
    localStorage.removeItem('scheduleSettings');
    setResetDialogOpen(false);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>

        <NavigationButtons
          currentScreen="settings"
          settings={{
            ...settings,
            firstDayOfWeek,
            shiftRequirements,
            persons,
          }}
          onSave={onSave}
          onNavigate={(screen) => navigate(`/${screen}`)}
          lastSavePath={lastSavePath}
          onSetLastSavePath={onSetLastSavePath}
        />

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Week Settings
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>First Day of Week</InputLabel>
            <Select
              value={firstDayOfWeek}
              onChange={(e) => setFirstDayOfWeek(e.target.value as DayType)}
              label="First Day of Week"
            >
              <MenuItem value="sunday">Sunday</MenuItem>
              <MenuItem value="monday">Monday</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Shift Requirements
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(shiftRequirements).map(([day, requirements]) => (
              <Grid item xs={12} key={day}>
                <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                  {day}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <TextField
                      label="Morning"
                      type="number"
                      value={requirements.morning}
                      onChange={(e) => setShiftRequirements({
                        ...shiftRequirements,
                        [day]: { ...requirements, morning: parseInt(e.target.value) }
                      })}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Afternoon"
                      type="number"
                      value={requirements.afternoon}
                      onChange={(e) => setShiftRequirements({
                        ...shiftRequirements,
                        [day]: { ...requirements, afternoon: parseInt(e.target.value) }
                      })}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Night"
                      type="number"
                      value={requirements.night}
                      onChange={(e) => setShiftRequirements({
                        ...shiftRequirements,
                        [day]: { ...requirements, night: parseInt(e.target.value) }
                      })}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Grid>
            ))}
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add Person
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                label="Name"
                value={newPerson.name}
                onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newPerson.isManager}
                    onChange={(e) => setNewPerson({ ...newPerson, isManager: e.target.checked })}
                  />
                }
                label="Manager"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Max Shifts per Week"
                type="number"
                value={newPerson.maxShiftsPerWeek}
                onChange={(e) => setNewPerson({ ...newPerson, maxShiftsPerWeek: parseInt(e.target.value) })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={editingPerson ? handleUpdatePerson : handleAddPerson}
                fullWidth
              >
                {editingPerson ? 'Update Person' : 'Add Person'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Persons List
          </Typography>
          {persons.map((person) => (
            <Paper
              key={person.id}
              sx={{
                p: 2,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography>
                  {person.name} {person.isManager ? '(M)' : ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Max shifts: {person.maxShiftsPerWeek}
                </Typography>
              </Box>
              <Box>
                <IconButton onClick={() => handleEditPerson(person)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDeletePerson(person.id)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          ))}
        </Paper>

        <Dialog
          open={resetDialogOpen}
          onClose={() => setResetDialogOpen(false)}
        >
          <DialogTitle>Reset All Settings</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to reset all settings? This will:
              <ul>
                <li>Clear all shift requirements</li>
                <li>Remove all persons</li>
                <li>Reset all preferences and settings</li>
                <li>Delete all saved data</li>
              </ul>
              This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleResetSettings} color="error" variant="contained">
              Reset All Settings
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default SettingsScreen; 
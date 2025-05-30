import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  TextField,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { ScheduleSettings, DayType, Person } from '../types';
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

const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, onSave, lastSavePath, onSetLastSavePath }) => {
  const navigate = useNavigate();
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<DayType>(settings.firstDayOfWeek);
  const [shiftRequirements, setShiftRequirements] = useState(settings.shiftRequirements);
  const [persons, setPersons] = useState<Person[]>(settings.persons);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonIsManager, setNewPersonIsManager] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleAddPerson = () => {
    if (newPersonName.trim()) {
      const existingColors = persons.map(p => p.color);
      const person: Person = {
        id: uuidv4(),
        name: newPersonName.trim(),
        isManager: newPersonIsManager,
        maxShiftsPerWeek: 6,
        color: generateUniqueColor(existingColors),
      };
      setPersons([...persons, person]);
      setNewPersonName('');
      setNewPersonIsManager(false);
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
    setNewPersonName('');
    localStorage.removeItem('scheduleSettings');
    setResetDialogOpen(false);
  };

  const handleShiftRequirementChange = (day: string, type: string, value: number) => {
    setShiftRequirements({
      ...shiftRequirements,
      [day]: {
        ...shiftRequirements[day as DayType],
        [type]: value,
      },
    });
  };

  const handleEditPerson = (person: Person) => {
    setEditingPerson(person);
    setEditDialogOpen(true);
  };

  const handleSavePerson = () => {
    if (editingPerson) {
      setPersons(persons.map(p => 
        p.id === editingPerson.id ? editingPerson : p
      ));
      setEditDialogOpen(false);
      setEditingPerson(null);
    }
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
              <Grid container size={12} key={day}>
                <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                  {day}
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={4}>
                    <TextField
                      label="Morning"
                      type="number"
                      value={requirements.morning}
                      onChange={(e) => handleShiftRequirementChange(day, 'morning', parseInt(e.target.value, 10))}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={4}>
                    <TextField
                      label="Afternoon"
                      type="number"
                      value={requirements.afternoon}
                      onChange={(e) => handleShiftRequirementChange(day, 'afternoon', parseInt(e.target.value, 10))}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={4}>
                    <TextField
                      label="Night"
                      type="number"
                      value={requirements.night}
                      onChange={(e) => handleShiftRequirementChange(day, 'night', parseInt(e.target.value, 10))}
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
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Name"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={newPersonIsManager ? 'manager' : 'worker'}
                  onChange={(e) => setNewPersonIsManager(e.target.value === 'manager')}
                  label="Role"
                >
                  <MenuItem value="worker">Worker</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Button
                variant="contained"
                onClick={handleAddPerson}
                fullWidth
              >
                Add Person
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
                <Button
                  variant="outlined"
                  onClick={() => handleEditPerson(person)}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <IconButton onClick={() => handleDeletePerson(person.id)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          ))}
        </Paper>

        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
          <DialogTitle>Edit Person</DialogTitle>
          <DialogContent>
            {editingPerson && (
              <Box sx={{ pt: 2 }}>
                <TextField
                  label="Name"
                  value={editingPerson.name}
                  onChange={(e) => setEditingPerson({ ...editingPerson, name: e.target.value })}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Max Shifts Per Week"
                  type="number"
                  value={editingPerson.maxShiftsPerWeek}
                  onChange={(e) => setEditingPerson({ ...editingPerson, maxShiftsPerWeek: parseInt(e.target.value, 10) })}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={editingPerson.isManager ? 'manager' : 'worker'}
                    onChange={(e) => setEditingPerson({ ...editingPerson, isManager: e.target.value === 'manager' })}
                    label="Role"
                  >
                    <MenuItem value="worker">Worker</MenuItem>
                    <MenuItem value="manager">Manager</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePerson} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>

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
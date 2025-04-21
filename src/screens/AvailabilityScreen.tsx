import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ButtonGroup,
} from '@mui/material';
import { ScheduleSettings, DayType, ShiftType, AvailabilityType } from '../types';
import NavigationButtons from '../components/NavigationButtons';

interface AvailabilityScreenProps {
  settings: ScheduleSettings;
  onSave: (settings: ScheduleSettings) => void;
  lastSavePath: string | null;
  onSetLastSavePath: (path: string) => void;
}

const availabilityTypes: AvailabilityType[] = ['available', 'unavailable', 'preferred', 'required'];
const availabilityColors = {
  available: '#4caf50', // green
  unavailable: '#f44336', // red
  preferred: '#ffeb3b', // yellow
  required: '#2196f3', // blue
};

const AvailabilityScreen = ({ settings, onSave, lastSavePath, onSetLastSavePath }: AvailabilityScreenProps) => {
  const navigate = useNavigate();
  const [availability, setAvailability] = useState(settings.availability);

  const handleAvailabilityChange = (
    personId: string,
    day: DayType,
    shift: ShiftType,
    newType: AvailabilityType
  ) => {
    setAvailability({
      ...availability,
      [personId]: {
        ...availability[personId],
        [day]: {
          ...(availability[personId]?.[day] || {}),
          [shift]: newType,
        },
      },
    });
  };

  const handleSave = () => {
    onSave({
      ...settings,
      availability,
    });
  };

  const getNextAvailabilityType = (currentType: AvailabilityType): AvailabilityType => {
    const currentIndex = availabilityTypes.indexOf(currentType);
    return availabilityTypes[(currentIndex + 1) % availabilityTypes.length];
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Availability
        </Typography>

        <NavigationButtons
          currentScreen="availability"
          settings={{
            ...settings,
            availability,
          }}
          onSave={handleSave}
          onNavigate={(screen) => navigate(`/${screen}`)}
          lastSavePath={lastSavePath}
          onSetLastSavePath={onSetLastSavePath}
        />

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            Set availability for each person. Click on a shift to cycle through availability types.
          </Typography>

          <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width="120px">Person</TableCell>
                  {Object.entries(settings.shiftRequirements).map(([day]) => (
                    <TableCell
                      key={day}
                      width="180px"
                      sx={{
                        backgroundColor: (theme) =>
                          day === 'sunday' || day === 'tuesday' || day === 'thursday' || day === 'saturday'
                            ? theme.palette.grey[100]
                            : 'inherit',
                        textTransform: 'capitalize',
                      }}
                    >
                      {day}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {settings.persons.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell>
                      {person.name} {person.isManager ? '(M)' : ''}
                    </TableCell>
                    {Object.entries(settings.shiftRequirements).map(([day, _]) => (
                      <TableCell key={day} align="center">
                        <ButtonGroup variant="contained" size="small">
                          {(['morning', 'afternoon', 'night'] as ShiftType[]).map((shift) => {
                            const currentType = availability[person.id]?.[day as DayType]?.[shift] || 'available';
                            return (
                              <Button
                                key={shift}
                                onClick={() => {
                                  const newType = getNextAvailabilityType(currentType);
                                  handleAvailabilityChange(person.id, day as DayType, shift, newType);
                                }}
                                sx={{
                                  minWidth: '60px',
                                  backgroundColor: availabilityColors[currentType],
                                  '&:hover': {
                                    backgroundColor: availabilityColors[currentType],
                                    opacity: 0.8,
                                  },
                                }}
                              >
                                {shift.charAt(0).toUpperCase()}
                              </Button>
                            );
                          })}
                        </ButtonGroup>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Legend:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {availabilityTypes.map((type) => (
                <Box
                  key={type}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: availabilityColors[type],
                      border: '1px solid #000',
                    }}
                  />
                  <Typography sx={{ textTransform: 'capitalize' }}>{type}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AvailabilityScreen; 
import { useState, useEffect } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Save as SaveIcon, Refresh as RefreshIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { ScheduleSettings, DayType, ShiftType, ShiftAssignment, Person } from '../types';
import Papa from 'papaparse';
import NavigationButtons from '../components/NavigationButtons';

interface ScheduleScreenProps {
  settings: ScheduleSettings;
  onSave: (settings: ScheduleSettings) => void;
  lastSavePath: string | null;
  onSetLastSavePath: (path: string) => void;
}

const ScheduleScreen = ({ settings, onSave, lastSavePath, onSetLastSavePath }: ScheduleScreenProps) => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<ShiftAssignment[]>([]);
  const [validationResults, setValidationResults] = useState({
    allShiftsAssigned: false,
    noDoubleShifts: false,
    noIncompatiblePairs: false,
  });
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Helper function to calculate schedule score
  const calculateScheduleScore = (schedule: ShiftAssignment[]) => {
    let score = 0;
    
    // Check if all shifts are assigned
    const allShiftsAssigned = Object.entries(settings.shiftRequirements).every(([day, requirements]) =>
      Object.entries(requirements).every(([shift, count]) => {
        const assignments = schedule.filter(a => a.day === day && a.shift === shift);
        return assignments.length === count;
      })
    );
    
    if (allShiftsAssigned) score += 1000;
    
    // Check manager requirements
    Object.entries(settings.shiftRequirements).forEach(([day, requirements]) => {
      Object.entries(requirements).forEach(([shift, _]) => {
        const assignments = schedule.filter(a => a.day === day && a.shift === shift);
        const hasManager = assignments.some(a => {
          const person = settings.persons.find(p => p.id === a.personId);
          return person?.isManager;
        });
        if (hasManager) score += 100;
      });
    });
    
    // Check preferred shifts
    schedule.forEach(assignment => {
      const availability = settings.availability[assignment.personId]?.[assignment.day]?.[assignment.shift];
      if (availability === 'preferred') score += 10;
    });
    
    return score;
  };

  // Helper function to check if schedule is complete
  const isScheduleComplete = (schedule: ShiftAssignment[]) => {
    // Check if all shifts are assigned with required amount of people
    const allShiftsAssigned = Object.entries(settings.shiftRequirements).every(([day, requirements]) =>
      Object.entries(requirements).every(([shift, count]) => {
        const assignments = schedule.filter(a => a.day === day && a.shift === shift);
        return assignments.length === count;
      })
    );

    // Check if each shift has at least one manager
    const allShiftsHaveManager = Object.entries(settings.shiftRequirements).every(([day, requirements]) =>
      Object.entries(requirements).every(([shift, _]) => {
        const assignments = schedule.filter(a => a.day === day && a.shift === shift);
        return assignments.some(a => {
          const person = settings.persons.find(p => p.id === a.personId);
          return person?.isManager;
        });
      })
    );

    return allShiftsAssigned && allShiftsHaveManager;
  };

  useEffect(() => {
    console.log('Settings:', settings);
    console.log('Persons:', settings.persons);
    console.log('Shift Requirements:', settings.shiftRequirements);
    console.log('Availability:', settings.availability);
    console.log('Incompatible Pairs:', settings.incompatiblePairs);
    
    if (settings.persons.length === 0) {
      console.error('No persons defined in settings');
      return;
    }
    
    if (Object.keys(settings.shiftRequirements).length === 0) {
      console.error('No shift requirements defined');
      return;
    }
    
    generateSchedule();
  }, [settings]);

  const generateSchedule = () => {
    console.log('Starting schedule generation...');
    let bestSchedule: ShiftAssignment[] = [];
    let bestScore = -1;
    const maxAttempts = 100;
    let attempt = 0;

    while (attempt < maxAttempts) {
      console.log(`Attempt ${attempt + 1}/${maxAttempts}`);
      const newSchedule: ShiftAssignment[] = [];
      const personShiftCount: Record<string, number> = {};
      const personDayShifts: Record<string, Set<string>> = {};
      const shiftManagerCount: Record<string, number> = {};

      // Initialize counters
      settings.persons.forEach(person => {
        personShiftCount[person.id] = 0;
        personDayShifts[person.id] = new Set();
      });

      // Helper function to check if a person can be assigned to a shift
      const canAssignPerson = (
        personId: string,
        day: DayType,
        shift: ShiftType,
        currentAssignments: ShiftAssignment[]
      ) => {
        const person = settings.persons.find(p => p.id === personId);
        if (!person) return false;

        // Check max shifts per week
        if (personShiftCount[personId] >= person.maxShiftsPerWeek) return false;

        // Check if person already has a shift on this day
        if (personDayShifts[personId].has(day)) return false;

        // Check if person is available for this shift
        const availability = settings.availability[personId]?.[day]?.[shift];
        if (availability === 'unavailable') return false;

        // Check if person is incompatible with anyone already assigned to this shift
        const currentShiftAssignments = currentAssignments.filter(
          a => a.day === day && a.shift === shift
        );
        for (const assignment of currentShiftAssignments) {
          const isIncompatible = settings.incompatiblePairs.some(
            ([p1, p2]) => (p1 === personId && p2 === assignment.personId) ||
                          (p1 === assignment.personId && p2 === personId)
          );
          if (isIncompatible) return false;
        }

        // Check night shift restrictions
        if (shift === 'night') {
          const nextDay = getNextDay(day);
          if (personDayShifts[personId].has(nextDay)) return false;
        } else {
          // Check if person is working a night shift the previous day
          const prevDay = getPrevDay(day);
          const hasNightShiftPrevDay = currentAssignments.some(
            a => a.day === prevDay && a.shift === 'night' && a.personId === personId
          );
          if (hasNightShiftPrevDay) return false;
        }

        return true;
      };

      // Helper function to get the next day
      const getNextDay = (day: DayType): DayType => {
        const days: DayType[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentIndex = days.indexOf(day);
        return days[(currentIndex + 1) % days.length];
      };

      // Helper function to get the previous day
      const getPrevDay = (day: DayType): DayType => {
        const days: DayType[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentIndex = days.indexOf(day);
        return days[(currentIndex - 1 + days.length) % days.length];
      };

      // Helper function to get shift key
      const getShiftKey = (day: DayType, shift: ShiftType) => `${day}-${shift}`;

      // Step 1: Assign required shifts
      console.log('Step 1: Assigning required shifts...');
      settings.persons.forEach(person => {
        Object.entries(settings.availability[person.id] || {}).forEach(([day, shifts]) => {
          Object.entries(shifts).forEach(([shift, availability]) => {
            if (availability === 'required' && canAssignPerson(person.id, day as DayType, shift as ShiftType, newSchedule)) {
              newSchedule.push({ day: day as DayType, shift: shift as ShiftType, personId: person.id });
              personShiftCount[person.id]++;
              personDayShifts[person.id].add(day);
              if (person.isManager) {
                const key = getShiftKey(day as DayType, shift as ShiftType);
                shiftManagerCount[key] = (shiftManagerCount[key] || 0) + 1;
              }
            }
          });
        });
      });

      // Step 2: Randomize the order of assignment
      console.log('Step 2: Randomizing assignment order...');
      const shuffledPersons = [...settings.persons].sort(() => Math.random() - 0.5);
      
      // Create a shuffled list of all shifts to assign
      const allShiftsToAssign: { day: DayType; shift: ShiftType; count: number }[] = [];
      Object.entries(settings.shiftRequirements).forEach(([day, requirements]) => {
        Object.entries(requirements).forEach(([shift, count]) => {
          allShiftsToAssign.push({ day: day as DayType, shift: shift as ShiftType, count });
        });
      });
      const shuffledShifts = [...allShiftsToAssign].sort(() => Math.random() - 0.5);

      // Step 3: Assign one manager to shifts with no managers
      console.log('Step 3: Assigning managers to shifts with no managers...');
      shuffledShifts.forEach(({ day, shift, count }) => {
        const key = getShiftKey(day, shift);
        const currentAssignments = newSchedule.filter(a => a.day === day && a.shift === shift);
        
        if (currentAssignments.length < count && (!shiftManagerCount[key] || shiftManagerCount[key] === 0)) {
          const availableManagers = settings.persons.filter(
            person => person.isManager && canAssignPerson(person.id, day, shift, newSchedule)
          );
          
          if (availableManagers.length > 0) {
            const manager = availableManagers[Math.floor(Math.random() * availableManagers.length)];
            newSchedule.push({ day, shift, personId: manager.id });
            personShiftCount[manager.id]++;
            personDayShifts[manager.id].add(day);
            shiftManagerCount[key] = 1;
          }
        }
      });

      // Step 4: Assign preferred shifts while maintaining balance
      console.log('Step 4: Assigning preferred shifts...');
      shuffledPersons.forEach(person => {
        // Create a shuffled list of this person's preferred shifts
        const personPreferredShifts: { day: DayType; shift: ShiftType }[] = [];
        Object.entries(settings.availability[person.id] || {}).forEach(([day, shifts]) => {
          Object.entries(shifts).forEach(([shift, availability]) => {
            if (availability === 'preferred') {
              personPreferredShifts.push({ day: day as DayType, shift: shift as ShiftType });
            }
          });
        });
        const shuffledPreferredShifts = [...personPreferredShifts].sort(() => Math.random() - 0.5);

        shuffledPreferredShifts.forEach(({ day, shift }) => {
          if (canAssignPerson(person.id, day, shift, newSchedule)) {
            const currentAssignments = newSchedule.filter(a => a.day === day && a.shift === shift);
            const requiredCount = settings.shiftRequirements[day][shift];
            
            if (currentAssignments.length < requiredCount) {
              const otherWorkers = settings.persons.filter(p => !p.isManager && p.id !== person.id);
              const otherWorkerShifts = otherWorkers.map(p => personShiftCount[p.id]);
              const minOtherShifts = Math.min(...otherWorkerShifts);
              
              if (personShiftCount[person.id] <= minOtherShifts + 1) {
                newSchedule.push({ day, shift, personId: person.id });
                personShiftCount[person.id]++;
                personDayShifts[person.id].add(day);
                if (person.isManager) {
                  const key = getShiftKey(day, shift);
                  shiftManagerCount[key] = (shiftManagerCount[key] || 0) + 1;
                }
              }
            }
          }
        });
      });

      // Step 5: Assign workers according to availability while balancing shifts
      console.log('Step 5: Assigning remaining workers...');
      shuffledShifts.forEach(({ day, shift, count }) => {
        const currentAssignments = newSchedule.filter(a => a.day === day && a.shift === shift);
        const remainingCount = count - currentAssignments.length;

        if (remainingCount > 0) {
          const availableWorkers = settings.persons
            .filter(person => !person.isManager && canAssignPerson(person.id, day, shift, newSchedule))
            .sort((a, b) => personShiftCount[a.id] - personShiftCount[b.id]);

          for (let i = 0; i < Math.min(remainingCount, availableWorkers.length); i++) {
            const worker = availableWorkers[i];
            newSchedule.push({ day, shift, personId: worker.id });
            personShiftCount[worker.id]++;
            personDayShifts[worker.id].add(day);
          }
        }
      });

      // Step 6: Assign managers to remaining shifts
      console.log('Step 6: Assigning remaining managers...');
      shuffledShifts.forEach(({ day, shift, count }) => {
        const currentAssignments = newSchedule.filter(a => a.day === day && a.shift === shift);
        const remainingCount = count - currentAssignments.length;

        if (remainingCount > 0) {
          const availableManagers = settings.persons
            .filter(person => person.isManager && canAssignPerson(person.id, day, shift, newSchedule))
            .sort((a, b) => personShiftCount[a.id] - personShiftCount[b.id]);

          for (let i = 0; i < Math.min(remainingCount, availableManagers.length); i++) {
            const manager = availableManagers[i];
            newSchedule.push({ day, shift, personId: manager.id });
            personShiftCount[manager.id]++;
            personDayShifts[manager.id].add(day);
            const key = getShiftKey(day, shift);
            shiftManagerCount[key] = (shiftManagerCount[key] || 0) + 1;
          }
        }
      });

      // Calculate score for this attempt
      const score = calculateScheduleScore(newSchedule);
      console.log(`Attempt ${attempt + 1} score:`, score);
      
      // Update best schedule if this one is better
      if (score > bestScore) {
        bestSchedule = [...newSchedule];
        bestScore = score;
        console.log('New best schedule found with score:', score);
      }

      // Check if all shifts are assigned
      const allShiftsAssigned = Object.entries(settings.shiftRequirements).every(([day, requirements]) =>
        Object.entries(requirements).every(([shift, count]) => {
          const assignments = newSchedule.filter(a => a.day === day && a.shift === shift);
          return assignments.length === count;
        })
      );

      if (allShiftsAssigned) {
        console.log('Perfect schedule found with all shifts assigned!');
        setSchedule(newSchedule);
        validateSchedule(newSchedule);
        return;
      }

      attempt++;
    }

    console.log('Final schedule (best attempt):', bestSchedule);
    setSchedule(bestSchedule);
    validateSchedule(bestSchedule);
  };

  const validateSchedule = (currentSchedule: ShiftAssignment[]) => {
    // Check if all shifts are assigned with required amount of people
    const allShiftsAssigned = Object.entries(settings.shiftRequirements).every(([day, requirements]) =>
      Object.entries(requirements).every(([shift, count]) => {
        const assignments = currentSchedule.filter(
          a => a.day === day && a.shift === shift
        );
        return assignments.length === count;
      })
    );

    // Check if a person is not assigned to more than one shift per day
    const noDoubleShifts = settings.persons.every(person => {
      const personAssignments = currentSchedule.filter(a => a.personId === person.id);
      const days = new Set(personAssignments.map(a => a.day));
      return days.size === personAssignments.length;
    });

    // Check if incompatible pairs are not assigned to the same shift
    const noIncompatiblePairs = settings.incompatiblePairs.every(([p1, p2]) => {
      const p1Assignments = new Set(
        currentSchedule
          .filter(a => a.personId === p1)
          .map(a => `${a.day}-${a.shift}`)
      );
      const p2Assignments = new Set(
        currentSchedule
          .filter(a => a.personId === p2)
          .map(a => `${a.day}-${a.shift}`)
      );
      return ![...p1Assignments].some(shift => p2Assignments.has(shift));
    });

    setValidationResults({
      allShiftsAssigned,
      noDoubleShifts,
      noIncompatiblePairs,
    });
  };

  const handlePersonChange = (
    day: DayType,
    shift: ShiftType,
    oldPersonId: string,
    newPersonId: string
  ) => {
    // First, remove any existing assignments for this person in this shift
    const filteredSchedule = schedule.filter(
      a => !(a.day === day && a.shift === shift && a.personId === newPersonId)
    );

    // Then update the assignment
    const newSchedule = filteredSchedule.map(assignment => {
      if (assignment.day === day && assignment.shift === shift && assignment.personId === oldPersonId) {
        return { ...assignment, personId: newPersonId };
      }
      return assignment;
    });

    setSchedule(newSchedule);
    validateSchedule(newSchedule);
  };

  const exportToCSV = () => {
    // Define the order of days and shifts
    const daysOrder: DayType[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const shiftsOrder: ShiftType[] = ['morning', 'afternoon', 'night'];

    // Create header row with days
    const header = ['Shift', ...daysOrder.map(day => day.charAt(0).toUpperCase() + day.slice(1))];

    // Create data rows for each shift
    const data = shiftsOrder.map(shift => {
      const row: string[] = [shift.charAt(0).toUpperCase() + shift.slice(1)];
      
      // For each day, get the persons assigned to this shift
      daysOrder.forEach(day => {
        const assignments = schedule.filter(
          a => a.day === day && a.shift === shift
        );
        
        const persons = assignments.map(assignment => {
          const person = settings.persons.find(p => p.id === assignment.personId);
          return person ? `${person.name}${person.isManager ? ' (M)' : ''}` : '';
        });

        // Add cell content with just the list of persons
        const cellContent = persons.join(', ');
        row.push(cellContent);
      });

      return row;
    });

    // Combine header and data
    const csvData = [header, ...data];

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'schedule.csv';
    link.click();
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Schedule
        </Typography>

        <NavigationButtons
          currentScreen="schedule"
          settings={settings}
          onSave={onSave}
          onNavigate={(screen) => navigate(`/${screen}`)}
          lastSavePath={lastSavePath}
          onSetLastSavePath={onSetLastSavePath}
        />

        {settings.persons.length === 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            No persons defined. Please add persons in the settings screen.
          </Alert>
        )}

        {Object.keys(settings.shiftRequirements).length === 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            No shift requirements defined. Please set shift requirements in the settings screen.
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={generateSchedule}
          >
            Regenerate Schedule
          </Button>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={exportToCSV}
          >
            Export to CSV
          </Button>
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Validation Results:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Alert
                severity={validationResults.allShiftsAssigned ? 'success' : 'error'}
                sx={{ flex: 1 }}
              >
                All shifts assigned with required amount of people
              </Alert>
              <Alert
                severity={validationResults.noDoubleShifts ? 'success' : 'error'}
                sx={{ flex: 1 }}
              >
                No person assigned to more than one shift per day
              </Alert>
              <Alert
                severity={validationResults.noIncompatiblePairs ? 'success' : 'error'}
                sx={{ flex: 1 }}
              >
                No incompatible pairs assigned to same shift
              </Alert>
            </Box>
          </Box>

          {schedule.length === 0 ? (
            <Alert severity="info">
              No schedule generated yet. Click "Regenerate Schedule" to create one.
            </Alert>
          ) : (
            <>
              <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="120px">Shift</TableCell>
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
                    {(['morning', 'afternoon', 'night'] as ShiftType[]).map((shift) => (
                      <TableRow key={shift}>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{shift}</TableCell>
                        {Object.entries(settings.shiftRequirements).map(([day, requirements]) => {
                          const assignments = schedule.filter(
                            a => a.day === day && a.shift === shift
                          );
                          const requiredCount = requirements[shift];
                          const isUnderstaffed = assignments.length < requiredCount;

                          return (
                            <TableCell
                              key={`${day}-${shift}`}
                              sx={{
                                backgroundColor: isUnderstaffed ? '#ffebee' : 'inherit',
                                padding: '8px',
                              }}
                            >
                              {Array.from({ length: requiredCount }).map((_, index) => {
                                const assignment = assignments[index];
                                const person = assignment ? settings.persons.find(p => p.id === assignment.personId) : null;
                                return (
                                  <FormControl
                                    key={assignment?.personId || index}
                                    fullWidth
                                    size="small"
                                    sx={{ mb: 0.5 }}
                                  >
                                    <Select
                                      value={assignment?.personId || ''}
                                      onChange={(e) => {
                                        if (assignment) {
                                          handlePersonChange(
                                            day as DayType,
                                            shift,
                                            assignment.personId,
                                            e.target.value
                                          );
                                        } else {
                                          const newSchedule = [...schedule, {
                                            day: day as DayType,
                                            shift: shift as ShiftType,
                                            personId: e.target.value
                                          }];
                                          setSchedule(newSchedule);
                                          validateSchedule(newSchedule);
                                        }
                                      }}
                                      sx={{
                                        '& .MuiSelect-select': {
                                          color: person?.color || 'inherit',
                                          padding: '4px 8px',
                                        },
                                      }}
                                    >
                                      <MenuItem value="">
                                        <em>Select a person</em>
                                      </MenuItem>
                                      {settings.persons.map((p) => (
                                        <MenuItem 
                                          key={p.id} 
                                          value={p.id}
                                          sx={{ 
                                            color: p.color,
                                            '&:hover': {
                                              backgroundColor: `${p.color}20`,
                                            },
                                          }}
                                        >
                                          {p.name} {p.isManager ? '(M)' : ''}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                );
                              })}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Shift Counts per Person
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Person</TableCell>
                        <TableCell align="right">Shifts Assigned</TableCell>
                        <TableCell align="right">Max Shifts</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {settings.persons.map((person) => {
                        const shiftCount = schedule.filter(
                          assignment => assignment.personId === person.id
                        ).length;
                        const isOverLimit = shiftCount > person.maxShiftsPerWeek;
                        return (
                          <TableRow key={person.id}>
                            <TableCell sx={{ color: person.color }}>
                              {person.name} {person.isManager ? '(M)' : ''}
                            </TableCell>
                            <TableCell align="right">{shiftCount}</TableCell>
                            <TableCell align="right">{person.maxShiftsPerWeek}</TableCell>
                            <TableCell align="right">
                              {isOverLimit ? (
                                <Alert severity="error" sx={{ p: 0 }}>
                                  Over Limit
                                </Alert>
                              ) : (
                                <Alert severity="success" sx={{ p: 0 }}>
                                  OK
                                </Alert>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ScheduleScreen; 
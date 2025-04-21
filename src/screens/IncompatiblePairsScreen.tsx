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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { ScheduleSettings } from '../types';
import NavigationButtons from '../components/NavigationButtons';

interface IncompatiblePairsScreenProps {
  settings: ScheduleSettings;
  onSave: (settings: ScheduleSettings) => void;
  lastSavePath: string | null;
  onSetLastSavePath: (path: string) => void;
}

const IncompatiblePairsScreen = ({ settings, onSave, lastSavePath, onSetLastSavePath }: IncompatiblePairsScreenProps) => {
  const navigate = useNavigate();
  const [incompatiblePairs, setIncompatiblePairs] = useState<[string, string][]>(settings.incompatiblePairs);
  const [selectedPerson1, setSelectedPerson1] = useState<string>('');
  const [selectedPerson2, setSelectedPerson2] = useState<string>('');

  const handleAddPair = () => {
    if (!selectedPerson1 || !selectedPerson2 || selectedPerson1 === selectedPerson2) return;

    const pair: [string, string] = [selectedPerson1, selectedPerson2].sort() as [string, string];
    
    // Check if pair already exists
    if (incompatiblePairs.some(([p1, p2]) => p1 === pair[0] && p2 === pair[1])) {
      return;
    }

    setIncompatiblePairs([...incompatiblePairs, pair]);
    setSelectedPerson1('');
    setSelectedPerson2('');
  };

  const handleDeletePair = (pairToDelete: [string, string]) => {
    setIncompatiblePairs(
      incompatiblePairs.filter(
        ([p1, p2]) => !(p1 === pairToDelete[0] && p2 === pairToDelete[1])
      )
    );
  };

  const handleSave = () => {
    onSave({
      ...settings,
      incompatiblePairs,
    });
  };

  const getPersonName = (id: string) => {
    const person = settings.persons.find(p => p.id === id);
    return person ? `${person.name}${person.isManager ? ' (M)' : ''}` : '';
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Incompatible Pairs
        </Typography>

        <NavigationButtons
          currentScreen="incompatible-pairs"
          settings={{
            ...settings,
            incompatiblePairs,
          }}
          onSave={handleSave}
          onNavigate={(screen) => navigate(`/${screen}`)}
          lastSavePath={lastSavePath}
          onSetLastSavePath={onSetLastSavePath}
        />

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            Add pairs of people who cannot work the same shift together.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>First Person</InputLabel>
              <Select
                value={selectedPerson1}
                label="First Person"
                onChange={(e) => setSelectedPerson1(e.target.value)}
              >
                {settings.persons.map((person) => (
                  <MenuItem key={person.id} value={person.id}>
                    {person.name} {person.isManager ? '(M)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Second Person</InputLabel>
              <Select
                value={selectedPerson2}
                label="Second Person"
                onChange={(e) => setSelectedPerson2(e.target.value)}
              >
                {settings.persons.map((person) => (
                  <MenuItem key={person.id} value={person.id}>
                    {person.name} {person.isManager ? '(M)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleAddPair}
              disabled={!selectedPerson1 || !selectedPerson2 || selectedPerson1 === selectedPerson2}
            >
              Add Pair
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Person 1</TableCell>
                  <TableCell>Person 2</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {incompatiblePairs.map(([person1Id, person2Id]) => (
                  <TableRow key={`${person1Id}-${person2Id}`}>
                    <TableCell>{getPersonName(person1Id)}</TableCell>
                    <TableCell>{getPersonName(person2Id)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        edge="end"
                        onClick={() => handleDeletePair([person1Id, person2Id])}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Container>
  );
};

export default IncompatiblePairsScreen; 
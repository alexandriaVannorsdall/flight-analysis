const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const csv = require('csv-parser');

// Initialize the app
const app = express();
const port = 3000;
app.use(bodyParser.json());

// Array to hold flight data from both CSV and sample data
let flightData = [];

// Load and parse the flight data from a CSV file
fs.createReadStream('flightdata/flighdata_B.csv')
  .pipe(csv())
  .on('data', (row) => {
    flightData.push(row);
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  });

// Basic route to check the server status
app.get('/', (req, res) => {
  res.send('Flight Analysis API is running!');
});

// Endpoint to get all flights
app.get('/api/flights', (req, res) => {
  res.json(flightData);
});

// Endpoint to get a specific flight by id
app.get('/api/flights/:id', (req, res) => {
  const flightId = req.params.id;
  const flight = flightData.find(f => f.id === flightId);

  if (flight) {
    res.json(flight);
  } else {
    res.status(404).send('Flight not found');
  }
});

// Endpoint to get flight analysis
app.get('/api/analysis', (req, res) => {
  const totalFlights = flightData.length;

  const lhrToDxbFlights = flightData.filter(f => f.departureAirport === 'LHR' && f.arrivalAirport === 'DXB');
  const averageJourneyTime = lhrToDxbFlights.reduce((acc, flight) => acc + parseFloat(flight.journeyTime || 0), 0) / (lhrToDxbFlights.length || 1); // Default to 1 to avoid division by zero

  const manDeparturesCount = flightData.reduce((acc, flight) => {
    if (flight.departureAirport === 'MAN') {
      acc[flight.departureDay] = (acc[flight.departureDay] || 0) + 1;
    }
    return acc;
  }, {});
  const mostDeparturesDay = Object.keys(manDeparturesCount).reduce((a, b) => manDeparturesCount[a] > manDeparturesCount[b] ? a : b, '');

  const businessClassProportion = (flightData.filter(flight => flight.class === 'business').length / (totalFlights || 1)) * 100; // Default to 1 to avoid division by zero

  const swedenFlightsProportion = (flightData.filter(flight => flight.arrivalAirport && flight.arrivalAirport.includes('SW')).length / (totalFlights || 1)) * 100; // Default to 1 to avoid division by zero

  const maxJourneyTimeFlight = flightData.reduce((maxFlight, flight) => 
    (parseFloat(flight.journeyTime || 0) > parseFloat(maxFlight.journeyTime || 0) ? flight : maxFlight), {});

  res.json({
    totalFlights,
    averageJourneyTime: isNaN(averageJourneyTime) ? 0 : averageJourneyTime,
    mostDeparturesDay,
    businessClassProportion,
    swedenFlightsProportion,
    maxJourneyTimeFlight: maxJourneyTimeFlight.flightNumber || '',
    longestJourneyTime: maxJourneyTimeFlight.journeyTime || 0
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});



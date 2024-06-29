const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3001;

// logger
const morgan = require('morgan');
app.use(morgan('combined'));

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// SQLite database connection
const db = new sqlite3.Database('./db/database.db', (err) => {
  if (err) {
    console.error('Error when connecting to database:', err.message);
  } else {
    console.log('Connected to the database successfully');
  }
});

// Endpoint for checking server status
app.get('/api/status', cors(), (req, res) => {
  res.status(200).json({ status: '200' });
});

// Endpoint to fetch month name by month index
app.get('/api/monthname/:monthIndex', cors(), (req, res) => {
  const monthIndex = req.params.monthIndex;

  const sql = `SELECT name FROM Months WHERE id = ?`;

  db.get(sql, [monthIndex], (err, row) => {
    if (err) {
      console.error('Error fetching month name:', err.message);
      res.status(500).json({ error: 'Failed to fetch month name' });
      return;
    }

    if (!row) {
      res.status(404).json({ error: 'Month not found' });
      return;
    }

    res.json({ monthName: row.name });
  });
});

// Endpoint to fetch calendar data
app.get('/api/calendardata', cors(), (req, res) => {
  const sql = `SELECT id, name, days_count FROM Months`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching calendar data:', err.message);
      res.status(500).json({ error: 'Failed to fetch calendar data' });
      return;
    }

    const calendarData = rows.map(row => ({
      monthIndex: row.id,
      monthName: row.name,
      numberOfDays: row.days_count,
    }));

    res.json({ calendarData });
  });
});

// Endpoint to fetch month data by year and month
app.get('/api/monthdata/:year/:month', cors(), (req, res) => {
  const { year, month } = req.params;

  const sql = `
    SELECT day_number, day_name
    FROM MonthDays
    WHERE year_id = ? AND month_id = ?
    ORDER BY day_number
  `;

  db.all(sql, [year, month], (err, rows) => {
    if (err) {
      console.error('Error fetching month data:', err.message);
      res.status(500).json({ error: 'Failed to fetch month data' });
      return;
    }

    if (rows.length === 0) {
      res.status(404).json({ error: 'Month data not found' });
      return;
    }

    const monthData = {
      year,
      month,
      days: rows
    };

    res.json(monthData);
  });
});

// Endpoint to fetch available times for a specialist
app.get('/api/availabletimes/:specialistId', cors(), (req, res) => {
  const specialistId = req.params.specialistId;

  const sql = `
    SELECT working_times, inactive_days 
    FROM specialists 
    WHERE id = ?
  `;

  db.get(sql, [specialistId], (err, row) => {
    if (err) {
      console.error('Error fetching available times:', err.message);
      res.status(500).json({ error: 'Failed to fetch available times' });
      return;
    }

    if (!row) {
      res.status(404).json({ error: 'Specialist not found' });
      return;
    }

    const availableTimes = {
      workingTimes: JSON.parse(row.working_times),
      inactiveDays: JSON.parse(row.inactive_days)
    };

    res.json({ availableTimes });
  });
});

// Endpoint to fetch list of specialists
app.get('/api/specialists', cors(), (req, res) => {
  const sql = 'SELECT * FROM specialists';

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching specialists:', err.message);
      res.status(500).json({ error: 'Failed to fetch specialists' });
      return;
    }

    res.json(rows);
  });
});

// Endpoint to add a new specialist
app.post('/api/specialists', cors(), (req, res) => {
  const { name, services, inactiveDays, workingTimes, photo } = req.body;

  const insertQuery = `
    INSERT INTO specialists (name, services, inactive_days, working_times, photo)
    VALUES (?, ?, ?, ?, ?)
  `;

  const values = [name, services, inactiveDays, workingTimes, photo];

  db.run(insertQuery, values, function(err) {
    if (err) {
      console.error('Error adding new specialist:', err.message);
      res.status(500).json({ error: 'Failed to add new specialist' });
      return;
    }

    console.log(`New specialist added with ID: ${this.lastID}`);
    res.status(200).json({ message: 'New specialist added successfully' });
  });
});

// Endpoint to delete a specialist
app.delete('/api/specialists/:id', cors(), (req, res) => {
  const specialistId = req.params.id;

  const deleteQuery = `
    DELETE FROM specialists
    WHERE id = ?
  `;

  db.run(deleteQuery, [specialistId], function(err) {
    if (err) {
      console.error('Error deleting specialist:', err.message);
      res.status(500).json({ error: 'Failed to delete specialist' });
      return;
    }

    console.log(`Specialist with ID ${specialistId} deleted successfully`);
    res.status(200).json({ message: 'Specialist deleted successfully' });
  });
});

// Endpoint to fetch list of bookings
app.get('/api/bookings', cors(), (req, res) => {
  const sql = 'SELECT * FROM bookings';

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching bookings:', err.message);
      res.status(500).json({ error: 'Failed to fetch bookings' });
      return;
    }

    res.json(rows);
  });
});

// Endpoint to add a new booking
app.post('/api/booking', cors(), (req, res) => {
  const bookingData = req.body;

  const { specialistId, selectedServices, selectedDate, selectedTime, personalInfo } = bookingData;
  const { name, phone, email, comment, agreedToPrivacyPolicy } = personalInfo;

  const sql = `
    INSERT INTO bookings (specialistId, selectedServices, selectedDate, selectedTime, name, phone, email, comment, agreedToPrivacyPolicy) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [specialistId, JSON.stringify(selectedServices), selectedDate, selectedTime, name, phone, email, comment, agreedToPrivacyPolicy ? 1 : 0];

  db.run(sql, values, function(err) {
    if (err) {
      console.error('Error inserting booking data:', err.message);
      res.status(500).json({ error: 'Failed to save booking data' });
      return;
    }

    console.log(`Booking inserted with ID: ${this.lastID}`);
    res.status(200).json({ message: 'Booking data saved successfully' });
  });
});

// Endpoint to fetch list of booked times
app.get('/api/bookedtimes', cors(), (req, res) => {
  res.json(bookedTimes);
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

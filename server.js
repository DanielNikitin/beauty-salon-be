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

// Endpoint to fetch month data by year and month
app.get('/api/monthdata/:year/:month', cors(), (req, res) => {
  const { year, month } = req.params;

  const yearQuery = `SELECT id FROM Years WHERE year = ?`;
  const monthQuery = `SELECT id, name, days_count FROM Months WHERE id = ?`;

  db.get(yearQuery, [year], (err, yearRow) => {
    if (err) {
      console.error('Error fetching year:', err.message);
      res.status(500).json({ error: 'Failed to fetch year' });
      return;
    }

    if (!yearRow) {
      res.status(404).json({ error: 'Year not found' });
      return;
    }

    db.get(monthQuery, [month], (err, monthRow) => {
      if (err) {
        console.error('Error fetching month:', err.message);
        res.status(500).json({ error: 'Failed to fetch month' });
        return;
      }

      if (!monthRow) {
        res.status(404).json({ error: 'Month not found' });
        return;
      }

      const sql = `
        SELECT day_number, day_name
        FROM MonthDays
        WHERE year_id = ? AND month_id = ?
        ORDER BY day_number
      `;

      db.all(sql, [yearRow.id, monthRow.id], (err, rows) => {
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
          monthName: monthRow.name,
          days: rows
        };

        res.json(monthData);
      });
    });
  });
});


// Endpoint for fetch current Month Data
app.get('/api/monthdata', cors(), (req, res) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();

  const yearQuery = `SELECT id FROM Years WHERE year = ?`;
  const monthQuery = `SELECT id, name, days_count FROM Months WHERE id = ?`;

  db.get(yearQuery, [currentYear], (err, yearRow) => {
    if (err) {
      console.error('Error fetching year:', err.message);
      res.status(500).json({ error: 'Failed to fetch year' });
      return;
    }

    if (!yearRow) {
      res.status(404).json({ error: 'Year not found' });
      return;
    }

    db.get(monthQuery, [currentMonth], (err, monthRow) => {
      if (err) {
        console.error('Error fetching month:', err.message);
        res.status(500).json({ error: 'Failed to fetch month' });
        return;
      }

      if (!monthRow) {
        res.status(404).json({ error: 'Month not found' });
        return;
      }

      const sql = `
        SELECT day_number, day_name
        FROM MonthDays
        WHERE year_id = ? AND month_id = ?
        ORDER BY day_number
      `;

      db.all(sql, [yearRow.id, monthRow.id], (err, rows) => {
        if (err) {
          console.error('Error fetching current month data:', err.message);
          res.status(500).json({ error: 'Failed to fetch current month data' });
          return;
        }

        if (rows.length === 0) {
          res.status(404).json({ error: 'Current month data not found' });
          return;
        }

        const currentMonthData = {
          year: currentYear,
          month: currentMonth,
          monthName: monthRow.name,
          currentDay: currentDay,
          numberOfDays: monthRow.days_count,
          days: rows
        };

        res.json({ currentMonthData });
      });
    });
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

    // Преобразование строки working_times в массив строк
    const workingTimes = row.working_times.split(',').map(time => time.trim());

    // Использование строки inactive_days напрямую, если она не JSON
    const inactiveDays = row.inactive_days;

    const availableTimes = {
      workingTimes: workingTimes,
      inactiveDays: inactiveDays
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

// Endpoint to fetch specialist details by ID
app.get('/api/specialists/:id', cors(), (req, res) => {
  const specialistId = req.params.id;

  const sql = `SELECT * FROM specialists WHERE id = ?`;

  db.get(sql, [specialistId], (err, row) => {
    if (err) {
      console.error('Error fetching specialist details:', err.message);
      res.status(500).json({ error: 'Failed to fetch specialist details' });
      return;
    }

    if (!row) {
      res.status(404).json({ error: 'Specialist not found' });
      return;
    }

    res.json(row);
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
  const { specialistId, name, email, date, time } = req.body;

  const insertQuery = `
    INSERT INTO bookings (specialist_id, name, email, date, time)
    VALUES (?, ?, ?, ?, ?)
  `;

  const values = [specialistId, name, email, date, time];

  db.run(insertQuery, values, function(err) {
    if (err) {
      console.error('Error adding new booking:', err.message);
      res.status(500).json({ error: 'Failed to add new booking' });
      return;
    }

    console.log(`New booking added with ID: ${this.lastID}`);
    res.status(200).json({ message: 'New booking added successfully' });
  });
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

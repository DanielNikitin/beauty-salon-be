const express = require('express');
const cors = require('cors');

// logger
const morgan = require('morgan');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// connecting static files
app.use(express.static('public'));

// Подключаем morgan для логирования запросов
//app.use(morgan('combined'));

///////////////// DATABASE 

const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./db/database.db', (err) => {
  if (err) {
    console.error('Error when connect to Database:', err.message);
  } else {
    console.log('Connected to the Database successfully');
  }
});

//// NEW SPECIALIST

// Эндпоинт для добавления нового специалиста
app.post('/api/specialists', cors(), (req, res) => {
  const { name, services, inactiveDays, workingTimes, photo } = req.body; // Получаем данные нового специалиста из тела запроса

  // SQL-запрос для вставки нового специалиста
  const insertQuery = `
    INSERT INTO specialists (name, services, inactive_days, working_times, photo)
    VALUES (?, ?, ?, ?, ?)
  `;

  const values = [name, services, inactiveDays, workingTimes, photo]; // Значения для подстановки в SQL-запрос

  // Выполняем SQL-запрос к базе данных
  db.run(insertQuery, values, function(err) {
    if (err) {
      console.error('Error inserting new specialist:', err.message);
      res.status(500).json({ error: 'Failed to add new specialist' });
      return;
    }
    console.log(`New specialist added with ID: ${this.lastID}`);
    res.status(200).json({ message: 'New specialist added successfully' });
  });
});

//// LIST OF SPECIALISTS

// Эндпоинт для получения списка специалистов
app.get('/api/specialists', cors(), (req, res) => {
  // SQL-запрос для получения списка специалистов
  const sql = 'SELECT * FROM specialists';

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching specialists:', err.message);
      res.status(500).json({ error: 'Failed to fetch specialists' });
      return;
    }
    res.json(rows); // Отправляем список специалистов в формате JSON
  });
});

//// DELETE SPECIALIST

// DELETE SPECIALIST
app.delete('/api/specialists/:id', cors(), (req, res) => {
  const specialistId = req.params.id;

  // SQL-запрос для удаления специалиста
  const deleteQuery = `
    DELETE FROM specialists
    WHERE id = ?
  `;

  // Выполняем SQL-запрос к базе данных
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


////////////////////////////////////////////

// GLOBAL VARIABLES

// Массив данных Текущего месяца
let currentMonthData = {
  currentMonthName: null,
  currentMonthIndex: null,
  currentNumberOfDays: null,
  currentYear: null,
  currentDay: null,
};

// Массив данных Всех месяцев
let calendarData = [];

// Массив Активных дат
let ActiveDates = [];

// Массив Неактивных дат
let inActiveDates = [];

// Массив Доступного времени брони для текущего месяца
let AvailableTimesForMonth = [];

// Массив Доступного времени брони для всех месяцев
let AvailableTimesForMonths = [];

// Массив забронированных дат и времени
const bookedTimes = [];

// Список времени для бронирования
const bookTimesList = [
  '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00',
];

// Функция для получения Имени Месяца
const getCurrentMonthName = (monthIndex) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[monthIndex];
};

////////////////////////////////////////////

// Функция для получения текущей даты
const getCurrentDate = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let month = currentDate.getMonth() + 1; // Месяцы начинаются с 0
  month = month < 10 ? `0${month}` : month; // Добавляем "0" перед месяцем, если он меньше 10
  let day = currentDate.getDate();
  day = day < 10 ? `0${day}` : day; // Добавляем "0" перед днем, если он меньше 10
  
  currentMonthData.currentMonthName = getCurrentMonthName(currentDate.getMonth());
  currentMonthData.currentMonthIndex = currentDate.getMonth() + 1;
  currentMonthData.currentNumberOfDays = new Date(currentDate.getFullYear(), currentMonthData.currentMonthIndex, 0).getDate();
  currentMonthData.currentYear = currentDate.getFullYear();
  currentMonthData.currentDay = `${year}-${month}-${day}`;  // `${day}.${month}.${year}`;
};

// Функция для генерации месяцев в текущем году
const generateCalendarData = () => {
  const currentDate = new Date();  // текущая дата
  for (let i = 0; i < 12; i++) {
    const monthData = { // Создаем объект данных для каждого месяца
      monthName: getCurrentMonthName(i), 
      monthIndex: i + 1,  // +1 так как счёт идет от 0
      numberOfDays: new Date(currentDate.getFullYear(), i + 1, 0).getDate(),
      year: currentDate.getFullYear()
    };
    calendarData.push(monthData);
  }
};

// Функция для получения текущей даты и доступного времени только для текущего месяца
const getCurrentDateAndMonthData = () => {
  getCurrentDate(); // Получаем текущую дату

  // Очищаем массив доступного времени для текущего месяца
  AvailableTimesForMonth = [];

  // Перебираем доступное время для всех месяцев
  AvailableTimesForMonths.forEach(monthData => {
    // Если месяц текущий, то добавляем доступное время в массив для текущего месяца
    if (monthData.date.getMonth() === currentMonthData.currentMonthIndex - 1) {
      AvailableTimesForMonth.push(monthData);
    }
  });
};

// Функция для бронирования времени
const bookTime = (date, time) => {
  const formattedDate = date.toDateString();
  const booking = `${formattedDate}, ${time}`;
  bookedTimes.push(booking);
};

  const bookingDate = new Date(2024, 5, 7);
  bookTime(bookingDate, '09:00');
  bookTime(bookingDate, '10:00');
  bookTime(bookingDate, '11:00');
// ------

// Функция для получения доступного времени для бронирования
const getAvailableTimes = (date) => {
  if (isDateInactive(date)) {
    return [];
  }
  const formattedDate = date.toDateString();
  const availableTimes = bookTimesList.filter(time => {
    const booking = `${formattedDate}, ${time}`;
    return !bookedTimes.includes(booking);
  });
  return availableTimes;
};

// Функция для установки неактивных дат
const setInactiveDates = (date) => {
  if (date) {
    inActiveDates.push(date); // Если передана конкретная дата, добавляем её в массив неактивных дат
  }
};

// Установить 6 июня в состояние неактивных
 const inactiveDate = new Date(2024, 5, 17); // Месяцы в JavaScript начинаются с 0, поэтому 5 - это июнь
 setInactiveDates(inactiveDate);

 const inactiveDate2 = new Date(2024, 5, 18);
 setInactiveDates(inactiveDate2);

 const inactiveDate3 = new Date(2024, 5, 19);
 setInactiveDates(inactiveDate3);

 const inactiveDate4 = new Date(2024, 6, 10);
 setInactiveDates(inactiveDate4);
 
 const inactiveDate5 = new Date(2024, 6, 19);
 setInactiveDates(inactiveDate5);

 const inactiveDate6 = new Date(2024, 6, 22);
 setInactiveDates(inactiveDate6);
// ----------

// Функция для проверки, является ли дата неактивной
const isDateInactive = (date) => {
  return inActiveDates.some(inactiveDate => {
    return inactiveDate.getTime() === date.getTime();
  });
};

// Функция для прикрепления доступного времени для бронирования ко всем актуальным дням месяцев в году
const attachAvailableTimesToCalendar = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();

  // Очищаем массив доступного времени для всех месяцев перед генерацией
  AvailableTimesForMonths = [];

  // Перебираем текущий и следующий месяц
  for (let i = currentMonth; i <= currentMonth + 1; i++) {
    const numberOfDaysInMonth = new Date(currentYear, i + 1, 0).getDate(); // Получаем количество дней в месяце

    // Начинаем перебирать дни месяца, начиная с первого дня
    for (let j = 1; j <= numberOfDaysInMonth; j++) {
      const date = new Date(currentYear, i, j); // Формируем дату для текущего дня

      // Проверяем, является ли дата прошедшей или текущей в текущем месяце
      if (i === currentMonth && j < currentDay) {
        // Если дата неактивна (до или включая текущий день), создаем пустой массив времени
        AvailableTimesForMonths.push({ date, availableTimes: [] });
      } else {
        // Проверяем, является ли дата неактивной
        if (!isDateInactive(date)) {
          const availableTimes = getAvailableTimes(date); // Получаем доступное время для текущего дня
          AvailableTimesForMonths.push({ date, availableTimes }); // Добавляем доступное время для текущего дня в массив
        } else {
          // Если дата неактивна, создаем пустой массив времени
          AvailableTimesForMonths.push({ date, availableTimes: [] });
        }
      }
    }
  }
};

// Функция для форматирования даты без времени
const formatDateWithoutTime = (date) => {
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  month = month < 10 ? `0${month}` : month;
  let day = date.getDate();
  day = day < 10 ? `0${day}` : day;
  return `${year}-${month}-${day}`;
};

////////////////////////////////////////////

// SEND CALENDAR DATA
app.get('/getcalendardata', cors(), (req, res) => {
  const data = {
    calendarData
  };
  res.json(data);
});

// SEND MONTH DATA
app.get('/getmonthdata', cors(), (req, res) => {
  getCurrentDateAndMonthData(); // Получаем текущую дату и доступное время только для текущего месяца

  // Форматируем даты без времени для доступного времени в текущем месяце
  const formattedAvailableTimesForMonth = AvailableTimesForMonth.map(item => ({
    date: formatDateWithoutTime(item.date),
    availableTimes: item.availableTimes
  }));

  const data = {
    currentMonthData,  // данные текущего месяца
  };
  res.json(data);
});

// SEND PREVIOUS MONTH DATA (ENDPOINT)
app.get('/getpreviousmonthdata', cors(), (req, res) => {
  const previousMonthIndex = currentMonthData.currentMonthIndex - 2;
  const previousMonthData = calendarData[previousMonthIndex];
  
  if (previousMonthData) {
    const data = {
      previousMonthData
    };
    res.json(data);
  } else {
    res.status(404).json({ error: 'Previous month data not found' });
  }
});

// SEND NEXT MONTH DATA (ENDPOINT)
app.get('/getnextmonthdata', cors(), (req, res) => {
  const nextMonthIndex = currentMonthData.currentMonthIndex;
  const nextMonthData = calendarData[nextMonthIndex];
  
  if (nextMonthData) {
    const data = {
      nextMonthData
    };
    res.json(data);
  } else {
    res.status(404).json({ error: 'Next month data not found' });
  }
});

// Функция для обновления текущих данных месяца
const updateCurrentMonthData = () => {
  currentMonthData.currentMonthName = getCurrentMonthName(currentMonthData.currentMonthIndex - 1);
  currentMonthData.currentNumberOfDays = new Date(currentMonthData.currentYear, currentMonthData.currentMonthIndex, 0).getDate();
};

// Переключение на следующий месяц
app.post('/nextmonth', cors(), (req, res) => {
  if (currentMonthData.currentMonthIndex < 12) {
    currentMonthData.currentMonthIndex++;
    updateCurrentMonthData();
    res.json({ message: 'Переключено на следующий месяц', currentMonthData });
  } else {
    res.status(400).json({ error: 'Уже последний месяц' });
  }
});

// Переключение на предыдущий месяц
app.post('/prevmonth', cors(), (req, res) => {
  if (currentMonthData.currentMonthIndex > 1) {
    currentMonthData.currentMonthIndex--;
    updateCurrentMonthData();
    res.json({ message: 'Переключено на предыдущий месяц', currentMonthData });
  } else {
    res.status(400).json({ error: 'Уже первый месяц' });
  }
});

// SEND AVAILABLE TIMES FOR CURRENT MONTH (ENDPOINT)
app.get('/getavailabletimes', cors(), (req, res) => {
  getCurrentDateAndMonthData(); // Получаем текущую дату и доступное время только для текущего месяца

  // Форматируем даты без времени для доступного времени в текущем месяце
  const formattedAvailableTimesForMonths = AvailableTimesForMonths.map(item => ({
    date: formatDateWithoutTime(item.date),
    availableTimes: item.availableTimes
  }));

  const data = {
    AvailableTimesForMonths: formattedAvailableTimesForMonths,
  };
  res.json(data);
});

 // SEND BOOKED TIMES
 app.get('/bookedtimes', cors(), (req, res) => {
  res.json(bookedTimes);
});

///////////////// DATABASE 

//// BOOKING
app.post('/api/booking', cors(), (req, res) => {
  const bookingData = req.body;
  console.log('Received booking data:', bookingData);

  // Execute data from bookingData
  const { specialist, selectedServices, selectedDate, selectedTime, personalInfo } = bookingData;
  const { name, phone, email, comment, agreedToPrivacyPolicy } = personalInfo;

  // Insert data to DB
  const sql = `INSERT INTO bookings (specialist, selectedServices, selectedDate, selectedTime, name, phone, email, comment, agreedToPrivacyPolicy) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [specialist, JSON.stringify(selectedServices), selectedDate, selectedTime, name, phone, email, comment, agreedToPrivacyPolicy ? 1 : 0];

  db.run(sql, values, function(err) {
    if (err) {
      console.error('Error inserting data into database:', err.message);
      res.status(500).send('Failed to save booking data');
    } else {
      console.log(`Booking inserted with ID: ${this.lastID}`);
      res.status(200).send('Booking data saved successfully');
    }
  });
});

///////////////// SERVER START

app.listen(port, () => {
  generateCalendarData();
  attachAvailableTimesToCalendar();
  console.log(`Server is running on port ${port}`);
});

////////////////////////////////////////////
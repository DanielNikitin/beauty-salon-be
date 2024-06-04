const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

////////////////////////////////////////////

// GLOBAL VARIABLES
let currentMonthData = {
  currentMonthName: null,
  currentMonthIndex: null,
  currentNumberOfDays: null,
  currentYear: null,
  currentDay: null,
};

// Список времени для бронирования
const bookTimesList = [
  '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

// Массив забронированных дат и времени
const bookedTimes = [];

// Массив неактивных дат для бронирования
let inActiveDates = [];

////////////////////////////////////////////

// Функция для получения текущей даты
const getDate = () => {
  const currentDate = new Date();
  currentMonthData.currentMonthName = getCurrentMonthName(currentDate.getMonth());
  currentMonthData.currentMonthIndex = currentDate.getMonth() + 1;
  currentMonthData.currentNumberOfDays = new Date(currentDate.getFullYear(), currentMonthData.currentMonthIndex, 0).getDate(); // Количество дней в текущем месяце
  currentMonthData.currentYear = currentDate.getFullYear();
  currentMonthData.currentDay = currentDate.getDate();
};

// Функция для получения Имени текущего месяца
const getCurrentMonthName = (monthIndex) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[monthIndex];
};

// Функция для установки неактивных дат
const setInactiveDates = () => {
  const currentDate = new Date();
  for (let i = 1; i < currentDate.getDate(); i++) {
    inActiveDates.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }
};

// Функция для проверки, является ли дата неактивной
const isDateInactive = (date) => {
  return inActiveDates.some(inactiveDate => {
    return inactiveDate.getTime() === date.getTime();
  });
};

// Функция для генерации данных о доступных датах для каждого месяца текущего года
const generateCalendarData = () => {
  const currentDate = new Date();
  const calendarData = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), i, 1);
    calendarData.push({ 
      monthName: getCurrentMonthName(i), 
      monthIndex: i + 1,
      numberOfDays: new Date(currentDate.getFullYear(), i + 1, 0).getDate(),
      year: currentDate.getFullYear()
    });
  }
  return calendarData;
};


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

// Функция для получения доступного времени для каждого дня текущего месяца
const getAvailableTimesForMonth = (monthIndex, year) => {
  const availableTimesForMonth = [];
  const firstDayOfMonth = new Date(year, monthIndex - 1, 1);
  const lastDayOfMonth = new Date(year, monthIndex, 0);
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const currentDate = new Date(year, monthIndex - 1, i);
    const availableTimes = getAvailableTimes(currentDate); // Получаем доступное время для каждого дня месяца
    availableTimesForMonth.push({ date: i, availableTimes });
  }
  return availableTimesForMonth;
};

// Функция для бронирования времени
const bookTime = (date, time) => {
  const formattedDate = date.toDateString();
  const booking = `${formattedDate}, ${time}`;
  bookedTimes.push(booking);
};

const bookingDate = new Date(2024, 4, 16);
bookTime(bookingDate, '13:00');

// SEND CALENDAR DATA
app.get('/getcalendardata', cors(), (req, res) => {
  getDate();
  setInactiveDates(); // Установка неактивных дат
  const calendarData = generateCalendarData();
  const data = {
    calendarData
  };
  res.json(data);
});

// SEND MONTH DATA
app.get('/getmonthdata', cors(), (req, res) => {
  getDate();
  const availableTimes = getAvailableTimesForMonth(currentMonthData.currentMonthIndex, currentMonthData.currentYear); // Получение доступного времени для текущего месяца
  const data = {
    currentMonthData,
    availableTimes
  };
  res.json(data);
});

// SEND BOOKED TIMES
app.get('/bookedtimes', cors(), (req, res) => {
  res.json(bookedTimes);
});

////////////////////////////////////////////

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

////////////////////////////////////////////

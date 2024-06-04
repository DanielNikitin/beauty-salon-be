const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

////////////////////////////////////////////

// GLOBAL VARIABLES
let currentMonthName;
let currentMonthIndex;
let numberOfDays;
let currentYear;
let currentDay;

let inActiveDates;

// Список времени для бронирования
const bookTimesList = [
  '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

// Массив забронированных дат и времени
const bookedTimes = [];

////////////////////////////////////////////

// Функция для получения текущей даты
const getDate = () => {
  const currentDate = new Date();
  currentMonthName = getCurrentMonthName(currentDate.getMonth());
  currentMonthIndex = currentDate.getMonth() + 1;
  numberOfDays = new Date(currentDate.getFullYear(), currentMonthIndex, 0).getDate(); // Количество дней в текущем месяце
  currentYear = currentDate.getFullYear();
  currentDay = currentDate.getDate();
};

// Функция для получения Имени текущего месяца
const getCurrentMonthName = (monthIndex) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[monthIndex];
};

// Функция для генерации данных о доступных датах и времени для бронирования
const generateCalendarData = () => {
  const currentDate = new Date();
  const calendarData = [];
  const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1);
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), i, 1);
    const formattedDate = date.toDateString();
    const availableTimes = getAvailableTimes(date); // Получаем доступное время для каждой даты
    calendarData.push({ 
      monthName: getCurrentMonthName(i), 
      monthIndex: i + 1,
      numberOfDays: new Date(currentDate.getFullYear(), i + 1, 0).getDate(),
      year: currentDate.getFullYear(),
      dates: availableTimes
    });
  }
  return calendarData;
};


// Функция для получения доступного времени для бронирования
const getAvailableTimes = (date) => {
  const formattedDate = date.toDateString();
  const availableTimes = bookTimesList.filter(time => {
    const booking = `${formattedDate}, ${time}`;
    return !bookedTimes.includes(booking);
  });
  return availableTimes;
};

// Функция для бронирования времени
const bookTime = (date, time) => {
  const formattedDate = date.toDateString();
  const booking = `${formattedDate}, ${time}`;
  bookedTimes.push(booking);
};

// Бронируем для 16 мая 2024 года
const bookingDate = new Date(2024, 4, 16);

// Бронируем время на эту дату
bookTime(bookingDate, '13:00');
bookTime(bookingDate, '15:00');
bookTime(bookingDate, '17:00');

const bookingDate2 = new Date(2024, 4, 20);

bookTime(bookingDate2, '09:00');
bookTime(bookingDate2, '10:00');
bookTime(bookingDate2, '11:00');
bookTime(bookingDate2, '12:00');
bookTime(bookingDate2, '13:00');
bookTime(bookingDate2, '14:00');
bookTime(bookingDate2, '15:00');
bookTime(bookingDate2, '16:00');
bookTime(bookingDate2, '17:00');
bookTime(bookingDate2, '18:00');
bookTime(bookingDate2, '19:00');

// SEND DATA
app.get('/getfulldata', cors(), (req, res) => {
  getDate();
  const calendarData = generateCalendarData(); // Заполнение данных о доступных датах и времени для бронирования
  const data = {
    currentMonthName,
    currentMonthIndex,
    numberOfDays,
    currentYear,
    currentDay,
    calendarData
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

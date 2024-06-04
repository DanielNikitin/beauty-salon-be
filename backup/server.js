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

// Функция для получения имени дня недели по дате
const getDayName = (date) => {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndex = date.getDay();
  return daysOfWeek[dayIndex];
};

// Функция для генерации данных о доступных датах и времени для бронирования
const generateCalendarData = () => {
  const currentDate = new Date();
  const calendarData = [];
  for (let i = 0; i < numberOfDays; i++) {
    const date = new Date(currentDate.getFullYear(), currentMonthIndex - 1, currentDay + i);
    const formattedDate = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
    const availableTimes = getAvailableTimes(date); // Получаем доступное время для каждой даты
    const dayName = getDayName(date); // Получаем имя дня недели
    calendarData.push({ date: formattedDate, dayOfWeek: dayName, times: availableTimes });
  }
  return calendarData;
};



// Функция для получения доступного времени для бронирования
const getAvailableTimes = (date) => {
  // Форматируем дату
  const formattedDate = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  // Фильтруем массив bookTimesList, исключая забронированные временные слоты
  const availableTimes = bookTimesList.filter(time => {
    // Форматируем время в соответствии с забронированными временами
    const booking = `${formattedDate}, ${time}`;
    // Если забронированных временных слотов нет для данной даты и времени, возвращаем true
    return !bookedTimes.includes(booking);
  });
  return availableTimes;
};

// Функция для бронирования времени
const bookTime = (date, time) => {
  const formattedDate = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  const booking = `${formattedDate}, ${time}`;
  bookedTimes.push(booking);
};

//   // Бронируем для 16 мая 2024 года
//   const bookingDate = new Date(2024, 4, 16);
//
//   // Бронируем время на эту дату
//   bookTime(bookingDate, '13:00');
//   bookTime(bookingDate, '15:00');
//   bookTime(bookingDate, '17:00');
//
//   const bookingDate2 = new Date(2024, 4, 20);
//
//   bookTime(bookingDate2, '09:00');
//   bookTime(bookingDate2, '10:00');
//   bookTime(bookingDate2, '11:00');
//   bookTime(bookingDate2, '12:00');
//   bookTime(bookingDate2, '13:00');
//   bookTime(bookingDate2, '14:00');
//   bookTime(bookingDate2, '15:00');
//   bookTime(bookingDate2, '16:00');
//   bookTime(bookingDate2, '17:00');
//   bookTime(bookingDate2, '18:00');
//   bookTime(bookingDate2, '19:00');

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
    calendarData: calendarData.map(({ date, times, dayOfWeek }) => ({
      date,
      dayOfWeek,
      times
    })) // Включаем имя дня недели в каждый объект данных о дате
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

// Июнь
// const getDate = () => {
//   const currentDate = new Date();
//   currentMonthName = getCurrentMonthName(5); // Месяцы в JavaScript начинаются с 0 (0 - январь, 11 - декабрь)
//   currentMonthIndex = 6; // Июнь
//   numberOfDays = new Date(currentDate.getFullYear(), currentMonthIndex, 0).getDate(); // Количество дней в текущем месяце
//   currentYear = currentDate.getFullYear();
//   currentDay = currentDate.getDate();
// };

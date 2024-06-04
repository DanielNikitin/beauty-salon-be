const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

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

// Массив Доступного времени брони
let AvailableTimesForMonths = [];

// Массив забронированных дат и времени
const bookedTimes = [];

// Список времени для бронирования
const bookTimesList = [
  '09:00', '10:00', '11:00', '12:00'
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
  currentMonthData.currentMonthName = getCurrentMonthName(currentDate.getMonth());
  currentMonthData.currentMonthIndex = currentDate.getMonth() + 1;
  currentMonthData.currentNumberOfDays = new Date(currentDate.getFullYear(), currentMonthData.currentMonthIndex, 0).getDate(); // Количество дней в текущем месяце
  currentMonthData.currentYear = currentDate.getFullYear();
  currentMonthData.currentDay = currentDate.getDate();
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
    calendarData.push(monthData); // Добавляем данные в массив calendarData
  }
};

////////////////////////////////////////////

// Функция для бронирования времени
const bookTime = (date, time) => {
  const formattedDate = date.toDateString();
  const booking = `${formattedDate}, ${time}`;
  bookedTimes.push(booking);
};

  const bookingDate = new Date(2024, 4, 20);
  bookTime(bookingDate, '09:00');
  bookTime(bookingDate, '10:00');
  bookTime(bookingDate, '11:00');

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

// Установить 25 мая в состояние неактивных
 const inactiveDate = new Date(2024, 4, 25); // Месяцы в JavaScript начинаются с 0, поэтому 4 - это май
 setInactiveDates(inactiveDate);


// Функция для проверки, является ли дата неактивной
const isDateInactive = (date) => {
  return inActiveDates.some(inactiveDate => {
    return inactiveDate.getTime() === date.getTime();
  });
};

// Функция для прикрепления доступного времени для бронирования ко всем актуальным дням месяцев в году
const attachAvailableTimesToCalendar = () => {
  const currentDate = new Date(); // текущая дата
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();

  // Перебираем все месяцы в текущем году
  for (let i = currentMonth; i < 12; i++) {
    const numberOfDaysInMonth = new Date(currentYear, i + 1, 0).getDate(); // Получаем количество дней в текущем месяце

    // Начинаем перебирать дни месяца, начиная с текущего дня
    for (let j = (i === currentMonth ? currentDay : 1); j <= numberOfDaysInMonth; j++) {
      const date = new Date(currentYear, i, j); // Формируем дату для текущего дня

      // Проверяем, является ли текущий день активным (не является ли он прошедшим или неактивным)
      if (!isDateInactive(date)) {
        const availableTimes = getAvailableTimes(date); // Получаем доступное время для текущего дня
        AvailableTimesForMonths.push({ date, availableTimes }); // Добавляем доступное время для текущего дня в массив
        console.log(`Available Times for ${date.toDateString()}:`, availableTimes);
      }
    }
  }
};


////////////////////////////////////////////

// SEND CALENDAR DATA
app.get('/getcalendardata', cors(), (req, res) => {
  generateCalendarData(); // Генерируем данные календаря перед отправкой
  const data = {
    calendarData
  };
  res.json(data);
});

// SEND MONTH DATA
app.get('/getmonthdata', cors(), (req, res) => {
  getCurrentDate();
  attachAvailableTimesToCalendar();
  const data = {
    currentMonthData,
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

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
 const inactiveDate = new Date(2024, 5, 13); // Месяцы в JavaScript начинаются с 0, поэтому 5 - это июнь
 setInactiveDates(inactiveDate);

 const inactiveDate2 = new Date(2024, 5, 14);
 setInactiveDates(inactiveDate2);
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

  // Перебираем все месяцы в текущем году
  for (let i = currentMonth; i < 12; i++) {
    const numberOfDaysInMonth = new Date(currentYear, i + 1, 0).getDate(); // Получаем количество дней в месяце

    // Начинаем перебирать дни месяца, начиная с первого дня
    for (let j = 1; j <= numberOfDaysInMonth; j++) {
      const date = new Date(currentYear, i, j); // Формируем дату для текущего дня

      // Проверяем, является ли дата прошедшей или текущей в текущем месяце
      if (i === currentMonth && j < currentDay) {
        // Если дата неактивна (до или включая текущий день), создаем пустой массив времени
        AvailableTimesForMonths.push({ date, availableTimes: [] });
      } else {
        // Если дата активна, проверяем, является ли она неактивной по другим критериям
        if (!isDateInactive(date)) {
          const availableTimes = getAvailableTimes(date); // Получаем доступное время для текущего дня
          AvailableTimesForMonths.push({ date, availableTimes }); // Добавляем доступное время для текущего дня в массив
        } else {
          // Если дата неактивна по другим критериям, создаем пустой массив времени
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

// SEND AVAILABLE TIMES FOR CURRENT MONTH (ENDPOINT)
app.get('/getavailabletimes', cors(), (req, res) => {
  getCurrentDateAndMonthData(); // Получаем текущую дату и доступное время только для текущего месяца

  // Форматируем даты без времени для доступного времени в текущем месяце
  const formattedAvailableTimesForMonth = AvailableTimesForMonth.map(item => ({
    date: formatDateWithoutTime(item.date),
    availableTimes: item.availableTimes
  }));

  const data = {
    AvailableTimesForMonth: formattedAvailableTimesForMonth,
  };
  res.json(data);
});



 // SEND BOOKED TIMES
 app.get('/bookedtimes', cors(), (req, res) => {
  res.json(bookedTimes);
});

////////////////////////////////////////////

app.listen(port, () => {
  generateCalendarData();
  attachAvailableTimesToCalendar();
  console.log(`Server is running on port ${port}`);
});

////////////////////////////////////////////
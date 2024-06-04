import React, { useState, useEffect } from 'react';
import axios from 'axios';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(null);
  const [numberOfDays, setNumberOfDays] = useState(null);
  const [currentYear, setCurrentYear] = useState(null);

  useEffect(() => {
    // Запрос на сервер для получения текущего месяца, количества дней и года
    const fetchData = async () => {
      try {
        const monthResponse = await axios.get('http://localhost:3001/currentDate');
        
        setCurrentMonth(months[monthResponse.data.currentMonth - 1]); // Используем массив months для получения названия месяца
        setNumberOfDays(monthResponse.data.numberOfDays);
        setCurrentYear(monthResponse.data.currentYear);
      } catch (error) {
        console.error('Ошибка при получении данных с сервера:', error);
      }
    };
    fetchData();
  }, []);

  const switchToNextMonth = async () => {
    try {
      // Отправляем запрос на сервер для получения информации о следующем месяце
      const nextMonthResponse = await axios.get('http://localhost:3001/nextMonth');

      setCurrentMonth(months[nextMonthResponse.data.nextMonth - 1]);
      setNumberOfDays(nextMonthResponse.data.nextNumberOfDays);

      // Необходимо ли обрабатывать текущий год?
    } catch (error) {
      console.error('Ошибка при получении данных о следующем месяце:', error);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <h1>Month: {currentMonth}</h1>
      <h1>Number of days in the month: {numberOfDays}</h1>
      <h1>Year: {currentYear}</h1>
      <button onClick={switchToNextMonth}>Next month</button>
    </div>
  );
};

export default Calendar;

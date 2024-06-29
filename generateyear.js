const sqlite3 = require('sqlite3').verbose();
const dbPath = './db/database.db';

// Create tables if they do not exist
function createTablesIfNotExists(db) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS Years (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    year INTEGER UNIQUE NOT NULL,
                    is_leap_year BOOLEAN NOT NULL
                );
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });

            db.run(`
                CREATE TABLE IF NOT EXISTS Months (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    days_count INTEGER NOT NULL DEFAULT 0
                );
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });

            db.run(`
                CREATE TABLE IF NOT EXISTS MonthDays (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    year_id INTEGER NOT NULL,
                    month_id INTEGER NOT NULL,
                    day_number INTEGER NOT NULL,
                    day_name TEXT NOT NULL,
                    FOREIGN KEY (year_id) REFERENCES Years(id),
                    FOREIGN KEY (month_id) REFERENCES Months(id)
                );
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
}

// Insert year data
function insertYears(db) {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    // Determine if years are leap years
    const isCurrentYearLeap = isLeapYear(currentYear);
    const isNextYearLeap = isLeapYear(nextYear);

    // Insert current year
    const stmtCurrentYear = db.prepare(`
        INSERT OR IGNORE INTO Years (year, is_leap_year) VALUES (?, ?);
    `);
    stmtCurrentYear.run(currentYear, isCurrentYearLeap ? 1 : 0);
    stmtCurrentYear.finalize();

    // Insert next year
    const stmtNextYear = db.prepare(`
        INSERT OR IGNORE INTO Years (year, is_leap_year) VALUES (?, ?);
    `);
    stmtNextYear.run(nextYear, isNextYearLeap ? 1 : 0);
    stmtNextYear.finalize();
}

// Insert month data
function insertMonths(db) {
    const months = [
        { name: 'January', days_count: 31 },
        { name: 'February', days_count: 28 }, // Updated later if leap year
        { name: 'March', days_count: 31 },
        { name: 'April', days_count: 30 },
        { name: 'May', days_count: 31 },
        { name: 'June', days_count: 30 },
        { name: 'July', days_count: 31 },
        { name: 'August', days_count: 31 },
        { name: 'September', days_count: 30 },
        { name: 'October', days_count: 31 },
        { name: 'November', days_count: 30 },
        { name: 'December', days_count: 31 }
    ];

    const stmt = db.prepare(`
        INSERT OR IGNORE INTO Months (name, days_count) VALUES (?, ?);
    `);

    months.forEach(month => {
        stmt.run(month.name, month.days_count);
    });

    stmt.finalize();
}

// Update days_count for February if it's a leap year
function updateDaysCountForFebruary(db, isLeapYear) {
    const daysInFebruary = isLeapYear ? 29 : 28;

    db.run(`
        UPDATE Months SET days_count = ? WHERE name = 'February';
    `, [daysInFebruary], function(err) {
        if (err) {
            console.error('Error updating days_count for February:', err.message);
            return;
        }
        console.log(`Updated days_count for February to ${daysInFebruary}`);
    });
}

// Insert days for each month with day names
function insertMonthDays(db) {
    const yearsQuery = `
        SELECT id, year, is_leap_year FROM Years WHERE year IN (?, ?)
    `;
    const monthsQuery = `
        SELECT id, name, days_count FROM Months
    `;
    const insertDayQuery = `
        INSERT OR IGNORE INTO MonthDays (year_id, month_id, day_number, day_name)
        VALUES (?, ?, ?, ?)
    `;

    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    db.all(yearsQuery, [currentYear, nextYear], (err, years) => {
        if (err) {
            console.error('Error fetching years:', err.message);
            return;
        }

        db.all(monthsQuery, (err, months) => {
            if (err) {
                console.error('Error fetching months:', err.message);
                return;
            }

            const insertDayStmt = db.prepare(insertDayQuery);

            years.forEach(year => {
                months.forEach(month => {
                    const daysInMonth = month.days_count;

                    for (let day = 1; day <= daysInMonth; day++) {
                        const date = new Date(year.year, months.indexOf(month), day);
                        const dayName = getDayName(date.getDay());

                        insertDayStmt.run(year.id, month.id, day, dayName);
                    }
                });
            });

            insertDayStmt.finalize();
        });
    });
}

// Helper function to get the name of the day
function getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
}

// Function to determine leap year
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// Main function to execute the script
async function main() {
    const db = new sqlite3.Database(dbPath, async (err) => {
        if (err) {
            console.error('Database connection error:', err.message);
            return;
        }
        console.log('Connected to the database.');

        try {
            // Create tables if they do not exist
            await createTablesIfNotExists(db);

            // Insert data
            insertYears(db);
            insertMonths(db);

            // Determine if current year is leap year
            const currentYear = new Date().getFullYear();
            const isCurrentYearLeap = isLeapYear(currentYear);

            // Update days_count for February if it's a leap year
            updateDaysCountForFebruary(db, isCurrentYearLeap);

            // Insert month days
            insertMonthDays(db);

            // Close database connection
            db.close((err) => {
                if (err) {
                    console.error('Database closing error:', err.message);
                }
                console.log('Disconnected from the database.');
            });
        } catch (error) {
            console.error('Error:', error.message);
        }
    });
}

main();

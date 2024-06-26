const sqlite3 = require('sqlite3').verbose();
const dbPath = './db/database.db';

// Function to create tables if they do not exist
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
                    name TEXT UNIQUE NOT NULL
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
                    days_count INTEGER NOT NULL,
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

// Function to insert year data
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

// Function to insert month data
function insertMonths(db) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const stmt = db.prepare(`
        INSERT OR IGNORE INTO Months (name) VALUES (?);
    `);

    months.forEach(month => {
        stmt.run(month);
    });

    stmt.finalize();
}

// Function to insert days count for each month with days name
function insertMonthDays(db) {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    const stmt = db.prepare(`
        INSERT OR IGNORE INTO MonthDays (year_id, month_id, day_number, day_name)
        SELECT y.id, m.id, strftime('%d', 'now', 'start of month', '+1 month', '-1 day') AS day_number,
               CASE CAST(strftime('%w', y.year || '-' || m.id || '-' || day_number) AS INTEGER)
               WHEN 0 THEN 'Sunday'
               WHEN 1 THEN 'Monday'
               WHEN 2 THEN 'Tuesday'
               WHEN 3 THEN 'Wednesday'
               WHEN 4 THEN 'Thursday'
               WHEN 5 THEN 'Friday'
               WHEN 6 THEN 'Saturday'
               END AS day_name
        FROM Years y
        CROSS JOIN Months m
        WHERE y.year IN (?, ?) AND NOT EXISTS (
            SELECT 1 FROM MonthDays md
            WHERE md.year_id = y.id AND md.month_id = m.id
        );
    `);

    stmt.run(currentYear, nextYear);
    stmt.finalize();
}


// Function to determine leap year
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// Function to insert days count for each month
function insertMonthDays(db) {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    const stmt = db.prepare(`
        INSERT OR IGNORE INTO MonthDays (year_id, month_id, days_count)
        SELECT y.id, m.id,
               CASE
                   WHEN m.name IN ('January', 'March', 'May', 'July', 'August', 'October', 'December') THEN 31
                   WHEN m.name IN ('April', 'June', 'September', 'November') THEN 30
                   ELSE
                       CASE
                           WHEN (y.year % 4 = 0 AND y.year % 100 != 0) OR (y.year % 400 = 0) THEN 29
                           ELSE 28
                       END
               END AS days_count
        FROM Years y
        CROSS JOIN Months m
        WHERE y.year IN (?, ?) AND NOT EXISTS (
            SELECT 1 FROM MonthDays md
            WHERE md.year_id = y.id AND md.month_id = m.id
        );
    `);

    stmt.run(currentYear, nextYear);
    stmt.finalize();
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

package repository

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq"
)

const (
	_defaultMaxOpenConns = 25
	_defaultMaxIdleConns = 25
	_defaultConnLifetime = 5 * time.Minute
	_defaultConnAttempts = 3
	_defaultConnTimeout  = time.Second
)

func NewPostgresDB(dsn string) (*sql.DB, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("помилка відкриття драйвера postgres: %w", err)
	}

	db.SetMaxOpenConns(_defaultMaxOpenConns)
	db.SetMaxIdleConns(_defaultMaxIdleConns)
	db.SetConnMaxLifetime(_defaultConnLifetime)

	if err := retryPing(db, _defaultConnAttempts, _defaultConnTimeout); err != nil {
		return nil, fmt.Errorf("не вдалося підключитися до БД: %w", err)
	}

	return db, nil
}

func retryPing(db *sql.DB, attempts int, timeout time.Duration) error {
	var err error
	for i := 0; i < attempts; i++ {
		if err = db.Ping(); err == nil {
			return nil
		}
		time.Sleep(timeout)
	}
	return err
}

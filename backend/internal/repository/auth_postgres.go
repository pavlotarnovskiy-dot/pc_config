package repository

import (
	"database/sql"
	"fmt"

	"pc-configurator/internal/models"
)

// AuthPostgres - це структура, яка вміє робити SQL запити до таблиці users
type AuthPostgres struct {
	db *sql.DB
}

// Конструктор
func NewAuthPostgres(db *sql.DB) *AuthPostgres {
	return &AuthPostgres{db: db}
}

// CreateUser - Реєстрація (INSERT)
func (r *AuthPostgres) CreateUser(user models.User) (int, error) {
	var id int
	// Запит на створення. RETURNING id повертає нам ID нового юзера.
	query := "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id"

	row := r.db.QueryRow(query, user.Name, user.Email, user.Password)
	if err := row.Scan(&id); err != nil {
		return 0, fmt.Errorf("помилка додавання користувача (можливо email зайнятий): %w", err)
	}

	return id, nil
}

// GetUserByEmail - Вхід (SELECT)
func (r *AuthPostgres) GetUserByEmail(email string) (models.User, error) {
	var user models.User
	query := "SELECT id, name, email, password_hash FROM users WHERE email=$1"

	err := r.db.QueryRow(query, email).Scan(&user.ID, &user.Name, &user.Email, &user.Password)
	if err != nil {
		if err == sql.ErrNoRows {
			// Це не помилка сервера, це просто "невірний логін"
			return user, fmt.Errorf("користувача з таким email не знайдено")
		}
		return user, fmt.Errorf("помилка бази даних: %w", err)
	}

	return user, nil
}

// GetUserByID - Отримання користувача за ID
func (r *AuthPostgres) GetUserByID(id int) (models.User, error) {
	var user models.User
	query := "SELECT id, name, email, password_hash FROM users WHERE id=$1"

	err := r.db.QueryRow(query, id).Scan(&user.ID, &user.Name, &user.Email, &user.Password)
	if err != nil {
		if err == sql.ErrNoRows {
			return user, fmt.Errorf("користувача не знайдено")
		}
		return user, fmt.Errorf("помилка бази даних: %w", err)
	}

	return user, nil
}

// UpdateProfile - Оновлення імені та email користувача
func (r *AuthPostgres) UpdateProfile(userID int, name, email string) error {
	query := "UPDATE users SET name=$1, email=$2 WHERE id=$3"
	_, err := r.db.Exec(query, name, email, userID)
	if err != nil {
		return fmt.Errorf("помилка оновлення профілю: %w", err)
	}
	return nil
}

// UpdatePassword - Оновлення пароля користувача
func (r *AuthPostgres) UpdatePassword(userID int, newPasswordHash string) error {
	query := "UPDATE users SET password_hash=$1 WHERE id=$2"
	_, err := r.db.Exec(query, newPasswordHash, userID)
	if err != nil {
		return fmt.Errorf("помилка оновлення пароля: %w", err)
	}
	return nil
}

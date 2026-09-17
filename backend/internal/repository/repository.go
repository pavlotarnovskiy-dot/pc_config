package repository

import (
	"context"
	"pc-configurator/internal/models"
)

// Authorization - інтерфейс для роботи з користувачами
type Authorization interface {
	CreateUser(user models.User) (int, error)
	GetUserByEmail(email string) (models.User, error)
	GetUserByID(id int) (models.User, error)
	UpdatePassword(userID int, newPasswordHash string) error
	// UpdateProfile - оновлення імені та email користувача
	UpdateProfile(userID int, name, email string) error
}

// ComponentRepository - інтерфейс для роботи з товарами
// МИ ОНОВЛЮЄМО ЦЕЙ ІНТЕРФЕЙС, ЩОБ ВІН СПІВПАДАВ З РЕАЛІЗАЦІЄЮ
type ComponentRepository interface {
	// Було: GetAll(ctx context.Context, category string) ...
	// Стало (додали фільтри):
	GetAll(ctx context.Context, category string, minPrice, maxPrice float64, search string, sort string) ([]models.Component, error)

	GetByID(ctx context.Context, id int) (*models.Component, error)
}

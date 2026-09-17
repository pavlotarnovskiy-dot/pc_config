package repository

import (
	"context"
	"database/sql"
	"fmt"

	"pc-configurator/internal/models"
)

// УВАГА: Інтерфейс ми видалили звідси, бо він є в repository.go
// Тут залишається тільки реалізація (struct)

// ComponentRepo - реалізація інтерфейсу (struct)
type ComponentRepo struct {
	db *sql.DB
}

// NewComponentRepository - конструктор
func NewComponentRepository(db *sql.DB) *ComponentRepo {
	return &ComponentRepo{db: db}
}

// GetAll повертає список компонентів. Якщо category не пуста — фільтрує.
func (r *ComponentRepo) GetAll(ctx context.Context, category string, minPrice, maxPrice float64, search string, sort string) ([]models.Component, error) {
	// Базовий запит (1=1 дозволяє легко додавати AND)
	query := `SELECT id, name, category, price, image_url, specs FROM components WHERE 1=1`
	args := []interface{}{}
	argId := 1

	// 1. Фільтр по категорії
	if category != "" {
		query += fmt.Sprintf(" AND category = $%d", argId)
		args = append(args, category)
		argId++
	}

	// 2. Фільтр по мінімальній ціні
	if minPrice > 0 {
		query += fmt.Sprintf(" AND price >= $%d", argId)
		args = append(args, minPrice)
		argId++
	}

	// 3. Фільтр по максимальній ціні
	if maxPrice > 0 {
		query += fmt.Sprintf(" AND price <= $%d", argId)
		args = append(args, maxPrice)
		argId++
	}

	// 4. Пошук по назві (ILIKE - нечутливий до регістру)
	if search != "" {
		query += fmt.Sprintf(" AND name ILIKE $%d", argId)
		args = append(args, "%"+search+"%")
		argId++
	}

	// 5. Сортування
	if sort == "desc" {
		query += " ORDER BY price DESC"
	} else {
		query += " ORDER BY price ASC"
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("помилка виконання запиту: %w", err)
	}
	defer rows.Close()

	var components []models.Component
	for rows.Next() {
		var c models.Component
		if err := rows.Scan(&c.ID, &c.Name, &c.Category, &c.Price, &c.ImageURL, &c.Specs); err != nil {
			return nil, err
		}
		components = append(components, c)
	}

	return components, nil
}

// GetByID повертає один компонент за його ID
func (r *ComponentRepo) GetByID(ctx context.Context, id int) (*models.Component, error) {
	query := `SELECT id, name, category, price, image_url, specs FROM components WHERE id = $1`

	var c models.Component
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&c.ID, &c.Name, &c.Category, &c.Price, &c.ImageURL, &c.Specs,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("компонент з id %d не знайдено", id)
		}
		return nil, fmt.Errorf("помилка отримання компонента: %w", err)
	}

	return &c, nil
}

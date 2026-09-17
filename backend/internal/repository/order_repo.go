package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"pc-configurator/internal/models"
	"strings"
)

type OrderRepo struct {
	db *sql.DB
}

func NewOrderRepo(db *sql.DB) *OrderRepo {
	return &OrderRepo{db: db}
}

func (r *OrderRepo) CreateOrder(order models.OrderRequest) (int, error) {
	var id int

	// Перетворюємо масив ID ([1, 2]) у JSON рядок ("[1, 2]") для бази
	componentsJson, err := json.Marshal(order.ComponentIDs)
	if err != nil {
		return 0, err
	}

	// Підготуємо user_id (може бути NULL для гостей)
	var userID interface{} = nil
	if order.UserID != 0 {
		userID = order.UserID
	}

	// Вставляємо status разом із замовленням (за замовчуванням 'pending')
	query := `
		INSERT INTO orders (customer_name, phone, delivery_address, payment_method, total_price, component_ids, user_id, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id`

	err = r.db.QueryRow(query,
		order.CustomerName,
		order.Phone,
		order.DeliveryAddress,
		order.PaymentMethod,
		order.TotalPrice,
		componentsJson,
		userID,
		"pending",
	).Scan(&id)

	if err != nil {
		return 0, fmt.Errorf("помилка запису замовлення: %w", err)
	}

	return id, nil
}

// GetUserOrders - Отримання замовлень користувача за ID (для профілю)
func (r *OrderRepo) GetUserOrders(userID int) ([]map[string]interface{}, error) {
	// Запит отримує замовлення користувача, впорядковані за датою (найновіші спочатку)
	query := `
		SELECT id, customer_name, total_price, payment_method, created_at, COALESCE(status, 'pending') as status, component_ids
		FROM orders
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		// Якщо помилка (напр. колона не існує), повертаємо порожній список замість помилки
		// Це тимчасово, поки БД не буде мігрована
		log.Printf("Warning: GetUserOrders error: %v. Returning empty list.", err)
		return []map[string]interface{}{}, nil
	}
	defer rows.Close()

	var orders []map[string]interface{}

	for rows.Next() {
		var id int
		var customerName string
		var totalPrice float64
		var paymentMethod string
		var createdAt string
		var status string
		var componentsJSON []byte

		err = rows.Scan(&id, &customerName, &totalPrice, &paymentMethod, &createdAt, &status, &componentsJSON)
		if err != nil {
			log.Printf("Error scanning order row: %v", err)
			continue
		}

		// Парсимо component_ids (JSON) щоб порахувати кількість компонентів
		var compIDs []int
		if len(componentsJSON) > 0 {
			if err := json.Unmarshal(componentsJSON, &compIDs); err != nil {
				log.Printf("Error unmarshalling component_ids for order %d: %v", id, err)
			}
		}

		// Отримуємо назви компонентів з таблиці components
		var compNames []string
		if len(compIDs) > 0 {
			// Підготуємо плейсхолдери і аргументи
			placeholders := make([]string, len(compIDs))
			args := make([]interface{}, len(compIDs))
			for i, cid := range compIDs {
				placeholders[i] = fmt.Sprintf("$%d", i+1)
				args[i] = cid
			}
			q := fmt.Sprintf("SELECT id, name FROM components WHERE id IN (%s)", strings.Join(placeholders, ","))
			rows2, err := r.db.Query(q, args...)
			if err != nil {
				log.Printf("Error querying component names for order %d: %v", id, err)
			} else {
				defer rows2.Close()
				var cid int
				var cname string
				nameMap := make(map[int]string)
				for rows2.Next() {
					if err := rows2.Scan(&cid, &cname); err != nil {
						log.Printf("Error scanning component row: %v", err)
						continue
					}
					nameMap[cid] = cname
				}
				// Зберемо імена в порядку id, якщо можливий
				for _, cid := range compIDs {
					if n, ok := nameMap[cid]; ok {
						compNames = append(compNames, n)
					}
				}
			}
		}

		orders = append(orders, map[string]interface{}{
			"id":              id,
			"customer":        customerName,
			"total_price":     totalPrice,
			"payment":         paymentMethod,
			"created_at":      createdAt,
			"status":          status,
			"component_count": len(compIDs),
			"component_ids":   compIDs,
			"component_names": compNames,
		})
	}

	if err = rows.Err(); err != nil {
		log.Printf("Error iterating orders: %v", err)
		return []map[string]interface{}{}, nil
	}

	return orders, nil
}

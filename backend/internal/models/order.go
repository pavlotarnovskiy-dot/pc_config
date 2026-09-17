package models

type OrderRequest struct {
	CustomerName    string  `json:"customer_name"`
	Phone           string  `json:"phone"`
	DeliveryAddress string  `json:"delivery_address"`
	PaymentMethod   string  `json:"payment_method"`
	TotalPrice      float64 `json:"total_price"`
	ComponentIDs    []int   `json:"component_ids"`
	UserID          int     `json:"user_id,omitempty"`
}

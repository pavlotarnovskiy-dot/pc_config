package models

import "encoding/json"

type Component struct {
	ID       int             `json:"id"`        // <-- Маленька буква обов'язкова!
	Name     string          `json:"name"`      // <-- React шукає "name"
	Category string          `json:"category"`  // <-- React шукає "category"
	Price    float64         `json:"price"`     // <-- React шукає "price"
	ImageURL string          `json:"image_url"` // <-- React шукає "image_url"
	Specs    json.RawMessage `json:"specs"`     // <-- Це JSON всередині JSON
}

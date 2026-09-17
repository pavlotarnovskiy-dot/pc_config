package service

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"

	"pc-configurator/internal/models"
	"pc-configurator/internal/repository"
)

type GameRequirements struct {
	MinCPUScore int
	MinGPUScore int
	Category    string // "esports", "aaa", "strategy"
}

type BudgetAllocation struct {
	CPU         float64 `json:"cpu"`
	GPU         float64 `json:"gpu"`
	Motherboard float64 `json:"motherboard"`
	RAM         float64 `json:"ram"`
	PSU         float64 `json:"psu"`
}

type RecommendationRequest struct {
	Budget       float64 `json:"budget"`
	GameCategory string  `json:"game_category"` // esports, aaa, strategy
	MinCPUScore  int     `json:"min_cpu_score"`
	MinGPUScore  int     `json:"min_gpu_score"`
	TargetRes    string  `json:"target_res"` // 1080p, 1440p, 4K
}

type RecommendationResult struct {
	CPU         *models.Component `json:"cpu"`
	GPU         *models.Component `json:"gpu"`
	Motherboard *models.Component `json:"motherboard"`
	RAM         *models.Component `json:"ram"`
	PSU         *models.Component `json:"psu"`
	BudgetAlloc BudgetAllocation  `json:"budget_allocation"`
	TotalPrice  float64           `json:"total_price"`
	BudgetSpent string            `json:"budget_spent"` // e.g. "$1200 / $1500"
}

type RecommendationService struct {
	repo repository.ComponentRepository
}

func NewRecommendationService(repo repository.ComponentRepository) *RecommendationService {
	return &RecommendationService{repo: repo}
}

// GetRecommendation - основна функція підбору
func (s *RecommendationService) GetRecommendation(ctx context.Context, req RecommendationRequest) (RecommendationResult, error) {
	result := RecommendationResult{}

	// Отримуємо всі компоненти - передаємо параметри для фільтрації
	// Беремо всі компоненти без обмежень за ціною та пошуком
	allComponents, err := s.repo.GetAll(ctx, "", 0, 99999, "", "")
	if err != nil {
		return result, err
	}

	// Розподіл бюджету залежно від категорії гри та роздільної здатності
	budgetAlloc := s.calculateBudgetAllocation(req.Budget, req.GameCategory, req.TargetRes)

	// Функція для пошуку найкращого компонента в межах бюджету
	findBest := func(category string, maxPrice float64, minScore int) *models.Component {
		var candidates []*models.Component

		for i := range allComponents {
			comp := &allComponents[i]
			if comp.Category != category {
				continue
			}

			price := comp.Price
			score := s.extractScore(comp.Specs)

			// Перевіряємо умови
			if price <= maxPrice*1.15 && score >= minScore {
				candidates = append(candidates, comp)
			}
		}

		// Сортуємо за score (спадаючи)
		if len(candidates) == 0 {
			return nil
		}

		sort.Slice(candidates, func(i, j int) bool {
			return s.extractScore(candidates[i].Specs) > s.extractScore(candidates[j].Specs)
		})

		return candidates[0]
	}

	// Підбираємо компоненти
	result.CPU = findBest("cpu", budgetAlloc.CPU, req.MinCPUScore)
	result.GPU = findBest("gpu", budgetAlloc.GPU, req.MinGPUScore)

	// Материнська плата з урахуванням сокету CPU
	var requiredSocket string
	if result.CPU != nil {
		requiredSocket = s.extractSocket(result.CPU.Specs)
	}
	result.Motherboard = s.findMotherboardBySocket(allComponents, budgetAlloc.Motherboard, requiredSocket)

	result.RAM = findBest("ram", budgetAlloc.RAM, 0)
	result.PSU = findBest("psu", budgetAlloc.PSU, 0)

	result.BudgetAlloc = budgetAlloc

	// Розраховуємо сумму
	totalPrice := 0.0
	if result.CPU != nil {
		totalPrice += result.CPU.Price
	}
	if result.GPU != nil {
		totalPrice += result.GPU.Price
	}
	if result.Motherboard != nil {
		totalPrice += result.Motherboard.Price
	}
	if result.RAM != nil {
		totalPrice += result.RAM.Price
	}
	if result.PSU != nil {
		totalPrice += result.PSU.Price
	}

	result.TotalPrice = totalPrice
	result.BudgetSpent = fmt.Sprintf("$%.0f / $%.0f", totalPrice, req.Budget)

	return result, nil
}

// calculateBudgetAllocation - розподіл бюджету з урахуванням категорії гри
func (s *RecommendationService) calculateBudgetAllocation(budget float64, category string, resolution string) BudgetAllocation {
	alloc := BudgetAllocation{
		CPU:         budget * 0.22,
		GPU:         budget * 0.38,
		Motherboard: budget * 0.13,
		RAM:         budget * 0.12,
		PSU:         budget * 0.15,
	}

	// Esports - більше на CPU (потребує високий FPS)
	if category == "esports" {
		alloc.CPU = budget * 0.32
		alloc.GPU = budget * 0.28
	}

	// AAA гри - більше на GPU
	if category == "aaa" {
		alloc.CPU = budget * 0.20
		alloc.GPU = budget * 0.45
	}

	// 4K - багато грошей на GPU
	if resolution == "4K" {
		alloc.GPU = budget * 0.45
		alloc.CPU = budget * 0.20
	}

	// Економний бюджет
	if budget < 700 {
		alloc.Motherboard = budget * 0.12
		alloc.RAM = budget * 0.10
		alloc.PSU = budget * 0.12
		leftover := 1 - (alloc.Motherboard + alloc.RAM + alloc.PSU)
		ratio := alloc.CPU / (alloc.CPU + alloc.GPU)
		alloc.CPU = budget * leftover * ratio
		alloc.GPU = budget * leftover * (1 - ratio)
	}

	return alloc
}

// extractScore - витяг score з JSON specs
func (s *RecommendationService) extractScore(specs json.RawMessage) int {
	var spec map[string]interface{}
	if err := json.Unmarshal(specs, &spec); err != nil {
		return 0
	}

	score, ok := spec["score"].(float64)
	if !ok {
		return 0
	}

	return int(score)
}

// extractSocket - витяг socket з CPU specs
func (s *RecommendationService) extractSocket(specs json.RawMessage) string {
	var spec map[string]interface{}
	if err := json.Unmarshal(specs, &spec); err != nil {
		return ""
	}

	socket, ok := spec["socket"].(string)
	if !ok {
		return ""
	}

	return socket
}

// findMotherboardBySocket - пошук матплати з потрібним сокетом
func (s *RecommendationService) findMotherboardBySocket(
	allComponents []models.Component,
	maxPrice float64,
	requiredSocket string,
) *models.Component {
	var candidates []*models.Component

	for i := range allComponents {
		comp := &allComponents[i]
		if comp.Category != "motherboard" {
			continue
		}

		socket := s.extractSocket(comp.Specs)
		if comp.Price <= maxPrice*1.15 && (requiredSocket == "" || socket == requiredSocket) {
			candidates = append(candidates, comp)
		}
	}

	if len(candidates) == 0 {
		return nil
	}

	// Сортуємо за score
	sort.Slice(candidates, func(i, j int) bool {
		return s.extractScore(candidates[i].Specs) > s.extractScore(candidates[j].Specs)
	})

	return candidates[0]
}

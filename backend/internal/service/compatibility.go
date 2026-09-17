package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"pc-configurator/internal/models"
	"pc-configurator/internal/repository"
)

// Допоміжні структури для парсингу JSON
type CpuSpecs struct {
	Socket string `json:"socket"`
	TDP    int    `json:"tdp"`
}

type MotherboardSpecs struct {
	Socket     string `json:"socket"`
	MemoryType string `json:"memory_type"`
}

type RamSpecs struct {
	Type string `json:"type"`
}

type PsuSpecs struct {
	Wattage int `json:"wattage"`
}

type GpuSpecs struct {
	TDP int `json:"tdp"`
}

type CompatibilityService struct {
	repo repository.ComponentRepository
}

func NewCompatibilityService(repo repository.ComponentRepository) *CompatibilityService {
	return &CompatibilityService{repo: repo}
}

type ValidationResult struct {
	IsValid  bool     `json:"is_valid"`
	Messages []string `json:"messages"`
}

func (s *CompatibilityService) ValidateBuild(ctx context.Context, componentIDs []int) (ValidationResult, error) {
	result := ValidationResult{IsValid: true, Messages: []string{}}

	// Отримання компонентів
	var components []models.Component
	for _, id := range componentIDs {
		comp, err := s.repo.GetByID(ctx, id)
		if err != nil {
			return result, err
		}
		components = append(components, *comp)
	}

	// Сортування компонентів по типах
	var cpu *models.Component
	var mobo *models.Component
	var rams []*models.Component
	var psu *models.Component

	totalTDP := 50 // Базове споживання

	for i := range components {
		c := &components[i]
		switch c.Category {
		case "cpu":
			cpu = c
			var specs CpuSpecs
			_ = json.Unmarshal(c.Specs, &specs)
			totalTDP += specs.TDP
		case "motherboard":
			mobo = c
			// Материнська плата споживає ~20-30W
			totalTDP += 25
		case "ram":
			rams = append(rams, c)
			// Кожний модуль RAM споживає ~3-5W
			totalTDP += 5
		case "gpu":
			var specs GpuSpecs
			_ = json.Unmarshal(c.Specs, &specs)
			totalTDP += specs.TDP
		case "psu":
			psu = c
		}
	}

	// Перевірка 1: CPU + Motherboard (Socket)
	if cpu != nil && mobo != nil {
		var cpuSpec CpuSpecs
		var moboSpec MotherboardSpecs
		_ = json.Unmarshal(cpu.Specs, &cpuSpec)
		_ = json.Unmarshal(mobo.Specs, &moboSpec)

		cpuSocket := strings.ToUpper(strings.TrimSpace(cpuSpec.Socket))
		moboSocket := strings.ToUpper(strings.TrimSpace(moboSpec.Socket))

		if cpuSocket != "" && moboSocket != "" && !strings.EqualFold(cpuSocket, moboSocket) {
			result.IsValid = false
			result.Messages = append(result.Messages,
				fmt.Sprintf("Несумісність: Процесор %s (Socket %s) не підходить до плати %s (Socket %s)",
					cpu.Name, cpuSpec.Socket, mobo.Name, moboSpec.Socket))
		}
	}

	// Перевірка 2: RAM + Motherboard
	if mobo != nil && len(rams) > 0 {
		var moboSpec MotherboardSpecs
		_ = json.Unmarshal(mobo.Specs, &moboSpec)

		for _, ram := range rams {
			var ramSpec RamSpecs
			_ = json.Unmarshal(ram.Specs, &ramSpec)

			// Нормалізуємо типи пам'яті для порівняння
			moboMemType := strings.ToUpper(strings.TrimSpace(moboSpec.MemoryType))
			ramType := strings.ToUpper(strings.TrimSpace(ramSpec.Type))

			// Якщо дані не вказані, вважаємо сумісною (бази даних неповні)
			if moboMemType == "" || ramType == "" {
				continue
			}

			// Перевіра сумісності тільки якщо обидва містять інформацію про DDR
			moboHasDDR4 := strings.Contains(moboMemType, "DDR4") || strings.Contains(moboMemType, "DDR-4")
			moboHasDDR5 := strings.Contains(moboMemType, "DDR5") || strings.Contains(moboMemType, "DDR-5")
			ramHasDDR4 := strings.Contains(ramType, "DDR4") || strings.Contains(ramType, "DDR-4")
			ramHasDDR5 := strings.Contains(ramType, "DDR5") || strings.Contains(ramType, "DDR-5")

			// Якщо обидва містять інформацію - перевіряємо сумісність
			if (moboHasDDR4 || moboHasDDR5) && (ramHasDDR4 || ramHasDDR5) {
				// Якщо типи різні - це помилка
				if (moboHasDDR4 && ramHasDDR5) || (moboHasDDR5 && ramHasDDR4) {
					result.IsValid = false
					result.Messages = append(result.Messages,
						fmt.Sprintf("Несумісність: Плата підтримує %s, а RAM - %s", moboSpec.MemoryType, ramSpec.Type))
				}
			}
		}
	}

	// Перевірка 3: PSU (Блок живлення)
	if psu != nil {
		var psuSpec PsuSpecs
		_ = json.Unmarshal(psu.Specs, &psuSpec)

		// Якщо wattage записано як 0 або не записано - пропускаємо перевірку
		if psuSpec.Wattage > 0 {
			recommended := float64(totalTDP) * 1.2
			if float64(psuSpec.Wattage) < recommended {
				result.IsValid = false
				result.Messages = append(result.Messages,
					fmt.Sprintf("Слабкий БЖ: Треба %.0f Вт, є %d Вт", recommended, psuSpec.Wattage))
			}
		}
	}

	if result.IsValid && len(result.Messages) == 0 {
		result.Messages = append(result.Messages, "Збірка сумісна!")
	}

	return result, nil
}

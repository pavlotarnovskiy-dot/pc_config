package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Database struct {
		DSN string
	}
	Server struct {
		Port string
	}
}

func LoadConfig() *Config {
	// Спробуємо завантажити .env файл.
	// Якщо його немає (наприклад, на Render), це не помилка,
	// ми просто будемо читати змінні системи.
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	cfg := &Config{}

	// 1. Читаємо URL бази даних
	cfg.Database.DSN = os.Getenv("DATABASE_URL")
	if cfg.Database.DSN == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	// 2. Читаємо Порт (або ставимо 8080 за замовчуванням)
	cfg.Server.Port = os.Getenv("PORT")
	if cfg.Server.Port == "" {
		cfg.Server.Port = "8080"
	}

	return cfg
}

// Додатковий метод для DSN, щоб не ламати старий код
func (c *Config) Database_DSN() string {
	return c.Database.DSN
}

// Додатковий метод для DSN, якщо у тебе в main.go викликається c.Database.DSN()
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

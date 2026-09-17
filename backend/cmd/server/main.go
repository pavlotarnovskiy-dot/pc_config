package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	_ "github.com/lib/pq"

	"pc-configurator/config"
	delivery "pc-configurator/internal/delivery/http"
	"pc-configurator/internal/repository"
	"pc-configurator/internal/service"
)

func main() {
	cfg := config.LoadConfig()

	// --- ВИПРАВЛЕННЯ ТУТ: DSN без дужок () ---
	db, err := repository.NewPostgresDB(cfg.Database.DSN)
	if err != nil {
		log.Fatalf("DB Error: %s", err.Error())
	}
	defer db.Close()
	log.Println("Connected to DB!")

	// 1. Ініціалізація ВСІХ репозиторіїв
	compRepo := repository.NewComponentRepository(db)
	authRepo := repository.NewAuthPostgres(db)
	orderRepo := repository.NewOrderRepo(db)

	// 2. Сервіси
	compService := service.NewCompatibilityService(compRepo)
	authService := service.NewAuthService(authRepo)

	// 3. Хендлери (Передаємо 4 аргументи!)
	handlers := delivery.NewHandler(compRepo, compService, authService, orderRepo)
	mw := delivery.NewMiddleware(authService)

	// 4. Роутер
	mux := http.NewServeMux()

	mux.HandleFunc("/api/auth/sign-up", handlers.SignUp)
	mux.HandleFunc("/api/auth/sign-in", handlers.SignIn)
	mux.HandleFunc("/api/components", handlers.GetAllComponents)
	mux.HandleFunc("/api/validate", handlers.ValidateBuild)
	mux.HandleFunc("/api/recommend", handlers.GetRecommendation)

	// НОВИЙ МАРШРУТ ДЛЯ ЗАМОВЛЕНЬ (лише для авторизованих користувачів)
	mux.HandleFunc("/api/orders", mw.AuthMiddleware(handlers.CreateOrder))

	// ЗАХИЩЕНІ МАРШРУТИ (потребують авторизації)
	mux.HandleFunc("/api/auth/me", mw.AuthMiddleware(handlers.GetProfile))
	mux.HandleFunc("/api/auth/change-password", mw.AuthMiddleware(handlers.ChangePassword))
	mux.HandleFunc("/api/auth/update-profile", mw.AuthMiddleware(handlers.UpdateProfile))
	mux.HandleFunc("/api/orders/my", mw.AuthMiddleware(handlers.GetUserOrders))

	// 5. Запуск сервера
	handlerWithCORS := mw.CORSMiddleware(mux)

	srv := &http.Server{
		Addr:    ":" + cfg.Server.Port,
		Handler: handlerWithCORS,
	}

	go func() {
		log.Printf("Server started on port %s", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	srv.Shutdown(context.Background())
}

package http

import (
	"context"
	"net/http"
	"strings"

	"pc-configurator/internal/service"
)

// Ключ для запису ID користувача у контекст запиту
// Використовуємо власний тип, щоб уникнути колізій з іншими пакетами
type contextKey string

const CtxUserID contextKey = "userID"

// Middleware - структура, яка тримає залежності
type Middleware struct {
	authService *service.AuthService
}

// NewMiddleware - конструктор
func NewMiddleware(as *service.AuthService) *Middleware {
	return &Middleware{authService: as}
}

// CORSMiddleware - налаштовує заголовки для взаємодії з React
func (m *Middleware) CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Дозволяємо запити з будь-якого джерела (для розробки)
		// У продакшні тут має бути конкретний домен фронтенду
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Браузер спочатку відправляє OPTIONS запит (preflight), щоб перевірити дозволи.
		// Ми повинні відповісти 200 OK і зупинити обробку.
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// AuthMiddleware - перевіряє наявність та валідність JWT токена
func (m *Middleware) AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1. Отримуємо заголовок Authorization
		header := r.Header.Get("Authorization")
		if header == "" {
			respondWithError(w, http.StatusUnauthorized, "Потрібна авторизація")
			return
		}

		// 2. Валідуємо формат: "Bearer <token>"
		headerParts := strings.Split(header, " ")
		if len(headerParts) != 2 || headerParts[0] != "Bearer" {
			respondWithError(w, http.StatusUnauthorized, "Невірний формат заголовка авторизації")
			return
		}

		// 3. Парсимо токен через сервіс
		userId, err := m.authService.ParseToken(headerParts[1])
		if err != nil {
			respondWithError(w, http.StatusUnauthorized, "Невалідний токен: "+err.Error())
			return
		}

		// 4. Записуємо ID користувача у контекст
		// Тепер у хендлерах ми зможемо дізнатися, хто саме робить запит
		ctx := context.WithValue(r.Context(), CtxUserID, userId)

		// Передаємо керування наступному хендлеру, але вже з оновленим контекстом
		next(w, r.WithContext(ctx))
	}
}

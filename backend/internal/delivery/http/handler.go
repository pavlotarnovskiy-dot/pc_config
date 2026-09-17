package http

import (
	"encoding/json"
	"net/http"
	"strconv"

	"pc-configurator/internal/models"
	"pc-configurator/internal/repository"
	"pc-configurator/internal/service"
)

type Handler struct {
	compRepo     repository.ComponentRepository
	compService  *service.CompatibilityService
	authService  *service.AuthService
	orderRepo    *repository.OrderRepo
	recommendSvc *service.RecommendationService
}

// Оновили конструктор (додали repoOrder)
func NewHandler(
	r repository.ComponentRepository,
	cs *service.CompatibilityService,
	as *service.AuthService,
	or *repository.OrderRepo,
) *Handler {
	return &Handler{
		compRepo:     r,
		compService:  cs,
		authService:  as,
		orderRepo:    or,
		recommendSvc: service.NewRecommendationService(r),
	}
}

// --- ORDER HANDLER (НОВЕ) ---
func (h *Handler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	var req models.OrderRequest

	// Розшифровуємо JSON від клієнта
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Некоректні дані")
		return
	}

	// Потрібна авторизація: беремо user_id з контексту або повертаємо помилку
	userID, ok := r.Context().Value(CtxUserID).(int)
	if !ok || userID == 0 {
		respondWithError(w, http.StatusUnauthorized, "Потрібно увійти в акаунт, щоб оформити замовлення")
		return
	}
	req.UserID = userID

	// Зберігаємо в базу
	orderId, err := h.orderRepo.CreateOrder(req)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Відповідаємо "ОК"
	respondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"message":  "Замовлення успішно створено",
		"order_id": orderId,
	})
}

// --- ІНШІ ХЕНДЛЕРИ (Ті самі, що й були) ---

func (h *Handler) GetAllComponents(w http.ResponseWriter, r *http.Request) {
	// Зчитуємо параметри
	category := r.URL.Query().Get("category")
	search := r.URL.Query().Get("search")
	sort := r.URL.Query().Get("sort") // asc або desc

	minPriceStr := r.URL.Query().Get("min_price")
	maxPriceStr := r.URL.Query().Get("max_price")

	var minPrice, maxPrice float64

	if minPriceStr != "" {
		minPrice, _ = strconv.ParseFloat(minPriceStr, 64)
	}
	if maxPriceStr != "" {
		maxPrice, _ = strconv.ParseFloat(maxPriceStr, 64)
	}

	// Викликаємо оновлений репозиторій
	components, err := h.compRepo.GetAll(r.Context(), category, minPrice, maxPrice, search, sort)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, components)
}

type validateRequest struct {
	ComponentIDs []int `json:"component_ids"`
}

func (h *Handler) ValidateBuild(w http.ResponseWriter, r *http.Request) {
	var req validateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}
	res, err := h.compService.ValidateBuild(r.Context(), req.ComponentIDs)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondWithJSON(w, http.StatusOK, res)
}

func (h *Handler) SignUp(w http.ResponseWriter, r *http.Request) {
	var input models.User
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid input")
		return
	}
	id, err := h.authService.CreateUser(input)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondWithJSON(w, http.StatusCreated, map[string]int{"id": id})
}

type signInInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *Handler) SignIn(w http.ResponseWriter, r *http.Request) {
	var input signInInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid input")
		return
	}
	token, err := h.authService.GenerateToken(input.Email, input.Password)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Login failed")
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]string{"token": token})
}

// --- PROFILE HANDLERS (НОВІ) ---

// GetProfile - GET /api/auth/me - Отримання інформації про поточного користувача
func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	// Отримуємо ID користувача з контексту (встановлено AuthMiddleware)
	userID, ok := r.Context().Value(CtxUserID).(int)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "Не авторизовано")
		return
	}

	// Отримуємо дані користувача з БД
	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		respondWithError(w, http.StatusNotFound, "Користувача не знайдено")
		return
	}

	// Повертаємо інформацію без пароля
	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"id":    user.ID,
		"name":  user.Name,
		"email": user.Email,
	})
}

// ChangePassword - POST /api/auth/change-password - Зміна пароля
type changePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	// Отримуємо ID користувача з контексту
	userID, ok := r.Context().Value(CtxUserID).(int)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "Не авторизовано")
		return
	}

	var req changePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Некоректні дані")
		return
	}

	// Змінюємо пароль через сервіс
	err := h.authService.ChangePassword(userID, req.CurrentPassword, req.NewPassword)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Пароль успішно змінено",
	})
}

// UpdateProfile - PUT /api/auth/update-profile - Оновлення імені та email користувача
type updateProfileRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(CtxUserID).(int)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "Не авторизовано")
		return
	}

	var req updateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Некоректні дані")
		return
	}

	if req.Email == "" && req.Name == "" {
		respondWithError(w, http.StatusBadRequest, "Нічого оновлювати")
		return
	}

	if err := h.authService.UpdateProfile(userID, req.Name, req.Email); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Профіль оновлено"})
}

// GetUserOrders - GET /api/orders/my - Отримання замовлень поточного користувача
func (h *Handler) GetUserOrders(w http.ResponseWriter, r *http.Request) {
	// Отримуємо ID користувача з контексту
	userID, ok := r.Context().Value(CtxUserID).(int)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "Не авторизовано")
		return
	}

	// Отримуємо замовлення користувача
	orders, err := h.orderRepo.GetUserOrders(userID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Помилка при отриманні замовлень")
		return
	}

	// Якщо немає замовлень - повертаємо порожній масив
	if orders == nil {
		orders = []map[string]interface{}{}
	}

	respondWithJSON(w, http.StatusOK, orders)
}

// --- RECOMMENDATION HANDLER (НОВОЕ) ---
func (h *Handler) GetRecommendation(w http.ResponseWriter, r *http.Request) {
	var req service.RecommendationRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Некоректні дані запиту")
		return
	}

	result, err := h.recommendSvc.GetRecommendation(r.Context(), req)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Помилка при підборі конфігурації")
		return
	}

	respondWithJSON(w, http.StatusOK, result)
}

// Helpers
func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

func respondWithError(w http.ResponseWriter, code int, message string) {
	respondWithJSON(w, code, map[string]string{"error": message})
}

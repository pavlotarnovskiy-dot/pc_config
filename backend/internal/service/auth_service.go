package service

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"pc-configurator/internal/models"
	"pc-configurator/internal/repository"
)

const (
	// Секретний ключ для підпису токенів.
	// У реальному проекті це має бути в змінних середовища (os.Getenv)
	signingKey = "qrkjk#4#%35FSFJlja#4353KSFjH"
	// Час життя токена (наприклад, 12 годин)
	tokenTTL = 12 * time.Hour
)

// tokenClaims - структура для даних, що зашиті всередині JWT токена
type tokenClaims struct {
	UserID int `json:"user_id"`
	jwt.RegisteredClaims
}

// AuthService відповідає за реєстрацію та логін
type AuthService struct {
	repo repository.Authorization // Інтерфейс репозиторія користувачів
}

// NewAuthService - конструктор
func NewAuthService(repo repository.Authorization) *AuthService {
	return &AuthService{repo: repo}
}

// CreateUser - реєструє нового користувача
func (s *AuthService) CreateUser(user models.User) (int, error) {
	// 1. Хешування пароля
	// Ми ніколи не зберігаємо пароль у відкритому вигляді (Plain text)!
	// Це вимога безпеки. Використовуємо bcrypt.
	hash, err := generatePasswordHash(user.Password)
	if err != nil {
		return 0, err
	}

	// Замінюємо чистий пароль на хеш перед збереженням у БД
	user.Password = hash

	// 2. Виклик репозиторія для запису в БД
	return s.repo.CreateUser(user)
}

// GenerateToken - перевіряє дані входу і повертає JWT токен
func (s *AuthService) GenerateToken(email, password string) (string, error) {
	// 1. Отримуємо користувача з БД за email
	user, err := s.repo.GetUserByEmail(email)
	if err != nil {
		// Не уточнюємо, що саме не так (безпека), просто "користувача не знайдено" або помилка
		return "", errors.New("невірний логін або пароль")
	}

	// 2. Порівнюємо хеш пароля з БД і введений пароль
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return "", errors.New("невірний логін або пароль")
	}

	// 3. Генеруємо JWT токен
	// Створюємо claims (корисне навантаження токена)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, &tokenClaims{
		UserID: user.ID, // Зашиваємо ID користувача в токен
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(tokenTTL)), // Токен протухне через 12 годин
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	})

	// Підписуємо токен секретним ключем
	return token.SignedString([]byte(signingKey))
}

// ParseToken - розшифровує токен і повертає ID користувача
// Цей метод знадобиться для Middleware (перевірка доступу до захищених сторінок)
func (s *AuthService) ParseToken(accessToken string) (int, error) {
	token, err := jwt.ParseWithClaims(accessToken, &tokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}
		return []byte(signingKey), nil
	})

	if err != nil {
		return 0, err
	}

	claims, ok := token.Claims.(*tokenClaims)
	if !ok {
		return 0, errors.New("token claims are not of type *tokenClaims")
	}

	return claims.UserID, nil
}

// GetUserByID - Отримання інформації про користувача за ID
func (s *AuthService) GetUserByID(userID int) (models.User, error) {
	return s.repo.GetUserByID(userID)
}

// ChangePassword - Зміна пароля користувача
func (s *AuthService) ChangePassword(userID int, oldPassword, newPassword string) error {
	// Перевіряємо формат нового пароля
	if len(newPassword) < 6 {
		return errors.New("новий пароль повинен бути мінімум 6 символів")
	}

	// Отримуємо користувача для перевірки старого пароля
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return err
	}

	// Перевіряємо старий пароль
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(oldPassword))
	if err != nil {
		return errors.New("неправильний поточний пароль")
	}

	// Хешуємо новий пароль
	newHash, err := generatePasswordHash(newPassword)
	if err != nil {
		return err
	}

	// Оновлюємо пароль у репозиторії
	return s.repo.UpdatePassword(userID, newHash)
}

// UpdateProfile - оновлює ім'я та email користувача
func (s *AuthService) UpdateProfile(userID int, name, email string) error {
	// Можна додати валідацію email тут при потребі
	return s.repo.UpdateProfile(userID, name, email)
}

// generatePasswordHash - допоміжна функція для хешування пароля
func generatePasswordHash(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

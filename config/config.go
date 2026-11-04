package config

import (
	"log"

	"github.com/joho/godotenv"
)

type Config struct {
	App      AppConfig
	Database DatabaseConfig
}

type AppConfig struct {
	Name string
	Port string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env not found")
	}

	return &Config{
		App: AppConfig{
			Name: getEnv("APP_NAME"),
			Port: getEnv("APP_PORT"),
		},
		Database: loadDatabaseConfig(),
	}
}

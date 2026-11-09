from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./german.db"
    secret_key: str = "dev-only-change-me"
    access_token_minutes: int = 60 * 24 * 7
    openai_api_key: str = ""
    openai_base_url: str = ""  # e.g. https://api.groq.com/openai/v1 for any OpenAI-compatible provider
    openai_model: str = "gpt-4o-mini"
    openai_tts_model: str = "tts-1"
    openai_stt_model: str = "whisper-1"
    cors_origins: str = "http://localhost:5173"
    tts_enabled: bool = True  # set false for providers without German TTS; the app then uses the browser voice
    ai_rate_limit_per_minute: int = 40
    ai_max_tokens: int = 700
    ai_timeout_seconds: int = 45
    auto_create_tables: bool = True


settings = Settings()

-- Schema do MedRotina
-- Responsável (T2): Jailton dos Santos Silva Junior
-- Atualizações:
--   T11 (Luiz): doses_diarias
--   T13/T14 (Darlan): cuidadores (ajuste de contato) e alertas_cuidadores

CREATE DATABASE IF NOT EXISTS medrotina
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE medrotina;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medicamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome VARCHAR(120) NOT NULL,
    dosagem VARCHAR(100) NOT NULL,
    frequencia VARCHAR(100) NOT NULL,

    CONSTRAINT fk_medicamentos_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS doses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medicamento_id INT NOT NULL,
    horario TIME NOT NULL,
    status ENUM('pendente', 'tomada', 'atrasada') NOT NULL DEFAULT 'pendente',

    CONSTRAINT fk_doses_medicamento
        FOREIGN KEY (medicamento_id)
        REFERENCES medicamentos(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS cuidadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome VARCHAR(120) NOT NULL,
    contato VARCHAR(150) NOT NULL,

    CONSTRAINT fk_cuidadores_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- T11: registros diarios de doses
CREATE TABLE IF NOT EXISTS doses_diarias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    medicamento_id INT NULL,

    nome_medicamento VARCHAR(120) NOT NULL,
    dosagem VARCHAR(100) NOT NULL,
    data DATE NOT NULL,
    horario TIME NOT NULL,

    status ENUM('pendente', 'tomada', 'atrasada')
        NOT NULL DEFAULT 'pendente',
    tomada_em DATETIME NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_dose_diaria
        UNIQUE (medicamento_id, data, horario),

    INDEX idx_doses_diarias_usuario_data (usuario_id, data),

    CONSTRAINT fk_doses_diarias_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_doses_diarias_medicamento
        FOREIGN KEY (medicamento_id)
        REFERENCES medicamentos(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- T14: registro e rastreabilidade de alertas disparados aos cuidadores
CREATE TABLE IF NOT EXISTS alertas_cuidadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    cuidador_id INT NOT NULL,
    dose_diaria_id INT NOT NULL,
    nome_cuidador VARCHAR(120) NOT NULL,
    contato_cuidador VARCHAR(150) NOT NULL,
    nome_medicamento VARCHAR(120) NOT NULL,
    dosagem VARCHAR(100) NOT NULL,
    data_dose DATE NOT NULL,
    horario_dose TIME NOT NULL,
    minutos_atraso INT NOT NULL DEFAULT 0,
    mensagem TEXT NOT NULL,
    canal VARCHAR(30) NOT NULL DEFAULT 'email',
    status ENUM('enviado', 'simulado', 'falha') NOT NULL DEFAULT 'enviado',
    enviado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_alerta_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_alerta_cuidador
        FOREIGN KEY (cuidador_id)
        REFERENCES cuidadores(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_alerta_dose_diaria
        FOREIGN KEY (dose_diaria_id)
        REFERENCES doses_diarias(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_alerta_dose_cuidador
        UNIQUE (dose_diaria_id, cuidador_id)
);

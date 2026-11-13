-- Schema do MedRotina
-- Responsável (T2): Jailton dos Santos Silva Junior

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
    contato VARCHAR(30) NOT NULL,

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

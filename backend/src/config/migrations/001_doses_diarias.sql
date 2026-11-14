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

-- Migração 002: Suporte a alertas para cuidadores (T14)
-- Responsável: Darlan de Jesus Malta

-- Ajusta tamanho do contato para comportar e-mails e telefones com segurança
ALTER TABLE cuidadores MODIFY COLUMN contato VARCHAR(150) NOT NULL;

-- Tabela para rastreabilidade de alertas disparados a cuidadores (evita duplicidade de disparo)
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

-- Schema inicial do MedRotina
-- Responsável (T2): Jailton dos Santos Silva Junior
-- Preencher com as tabelas definidas: usuarios, medicamentos, doses, cuidadores

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TODO: tabela medicamentos (id, usuario_id, nome, dosagem, frequencia)
-- TODO: tabela doses (id, medicamento_id, horario, status)
-- TODO: tabela cuidadores (id, usuario_id, nome, contato)

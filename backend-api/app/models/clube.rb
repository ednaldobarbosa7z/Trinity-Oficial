class Clube < ApplicationRecord
  # --- RELACIONAMENTOS COM MEMBROS ---
  # O clube tem muitos vínculos na tabela de junção. 
  # dependent: :destroy garante que, se o clube for deletado, os registros de participação dos membros também sumam.
  has_many :membro_clubes, dependent: :destroy

  # Atalho para acessar os Usuários do clube diretamente (através da tabela de junção).
  has_many :users, through: :membro_clubes
  
  # --- RELACIONAMENTOS COM CONTEÚDO ---
  # Lista de filmes sugeridos ou cadastrados dentro deste clube.
  has_many :filmes, dependent: :destroy

  # Organização das rodadas de filmes. 
  # A mudança para :ciclos (antes :ciclo_semanais) deixa o nome mais genérico e flexível.
  has_many :ciclos, dependent: :destroy
  
  # --- VALIDAÇÕES ---
  validates :nome, presence: true

  # O código de acesso deve ser único para não haver conflito na hora de entrar em um clube.
  validates :codigo_acesso, uniqueness: true, allow_nil: true

  # --- CALLBACKS (Gatilhos) ---
  # Antes de criar o registro no banco, o Rails executa este método para gerar o código.
  before_create :gerar_codigo_acesso

  # --- MÉTODOS DE INSTÂNCIA (Helpers) ---
  # Método para identificar rapidamente o administrador do clube.
  # O '&.' (safe navigation) evita erro caso o clube ainda não tenha membros.
  def dono
    membro_clubes.find_by(eh_administrador: true)&.user
  end

  private

  # Lógica para gerar um código aleatório de 6 caracteres (ex: AB123X).
  # O 'loop' garante que, se o código gerado já existir, ele tentará outro até encontrar um único.
  def gerar_codigo_acesso
    self.codigo_acesso = loop do
      code = SecureRandom.alphanumeric(6).upcase
      break code unless Clube.exists?(codigo_acesso: code)
    end
  end
end
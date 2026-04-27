class ApplicationRecord < ActiveRecord::Base
  # Esta linha indica que esta classe é a "Classe Abstrata Primária".
  # Isso significa que o Rails NÃO vai procurar uma tabela chamada 'application_records' no banco de dados.
  # Ela serve apenas como um molde para que outros modelos (User, Filme, etc.) herdem suas funcionalidades.
  primary_abstract_class
end

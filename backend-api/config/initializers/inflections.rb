ActiveSupport::Inflector.inflections(:en) do |inflect|
  # Ensina ao Rails que o plural de 'ciclo_semanal' NÃO É 'ciclo_semanals'
  inflect.irregular 'ciclo_semanal', 'ciclo_semanais'
  inflect.irregular 'reuniao', 'reunioes'
end
class MonthlyCycleCreator
  def self.call(clube:, attributes:)
    clube.with_lock do
      ciclo = clube.ciclos.create!(attributes.merge(status: "ABERTO"))
      members = clube.users.order(:id).to_a
      raise ApiError, "O clube precisa ter pelo menos um membro." if members.empty?

      pool = members * (ciclo.qtd_slots / members.size)
      pool.concat(members.shuffle.take(ciclo.qtd_slots % members.size))
      pool.shuffle.each_with_index do |user, index|
        ciclo.slots.create!(user: user, posicao: index + 1)
      end
      DiscordNotifier.enviar(clube, "Um novo mês começou com #{ciclo.qtd_slots} vagas.",
        "Novo Ciclo: #{ciclo.mes}/#{ciclo.ano}")
      ciclo
    end
  end
end

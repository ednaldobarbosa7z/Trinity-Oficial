class MembroClube < ApplicationRecord
  belongs_to :clube
  belongs_to :user
  validates :user_id, uniqueness: { scope: :clube_id }
  validates :eh_administrador, inclusion: { in: [ true, false ] }
end

class UserPresenter
  def initialize(user, private_profile: false)
    @user = user
    @private_profile = private_profile
  end

  def as_json(*)
    fields = %w[id nome nickname url_foto_perfil]
    fields << "email" if @private_profile
    @user.attributes.slice(*fields)
  end
end

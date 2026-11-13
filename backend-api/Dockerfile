FROM ruby:3.4.7

RUN apt-get update -qq \
    && apt-get install --no-install-recommends -y postgresql-client build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN bundle install
COPY . .

# Normalize line endings when checked out on Windows.
RUN sed -i 's/\r$//' /app/entrypoint.sh /app/bin/*

EXPOSE 3000
ENTRYPOINT ["bash", "/app/entrypoint.sh"]
CMD ["bundle", "exec", "rails", "server", "-p", "3000", "-b", "0.0.0.0"]

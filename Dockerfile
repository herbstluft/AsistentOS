# Base Image
FROM php:8.2-fpm

# Install System Dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    nodejs \
    npm \
    sqlite3 \
    libsqlite3-dev \
    libzip-dev

# Clear Cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP Extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd pdo_sqlite zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set Working Directory
WORKDIR /var/www

# Copy Project
COPY . .

# Install PHP Dependencies
RUN composer install --optimize-autoloader --no-dev

# Install Node Dependencies & Build Assets
RUN npm install && npm run build

# Setup Permissions
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
RUN touch /var/www/database/database.sqlite
RUN chown www-data:www-data /var/www/database/database.sqlite

# Expose Port (PHP-FPM defaults to 9000)
EXPOSE 9000

# Start Command
CMD php artisan migrate --force && php-fpm

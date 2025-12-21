#!/bin/bash
echo "🚀 Iniciando Túnel Ngrok..."
echo "Tu aplicación estará disponible públicamente en breve."
echo "Asegúrate de que 'php artisan serve' esté corriendo en otra terminal."
echo "-------------------------------------------------------"
./ngrok http 8000 --host-header="localhost:8000"

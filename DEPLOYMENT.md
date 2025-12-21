# 🚀 Guía de Despliegue: castanedaTech en Oracle Cloud (Gratis)

Este documento te guiará para subir tu sistema a **Oracle Cloud "Always Free"** utilizando Docker, para que sea robusto, rápido y 100% gratuito.

## 1. Requisitos Previos en tu Computadora
1.  **GitHub:** Sube tu código a un repositorio (privado o público).
    ```bash
    git add .
    git commit -m "Preparando para despliegue"
    git push origin main
    ```

## 2. Preparar el Servidor (Oracle Cloud)
1.  Crea una cuenta en [Oracle Cloud](https://www.oracle.com/cloud/free/).
2.  Crea una **Instancia de Compute** (Ubuntu 22.04).
    *   *Tip:* Las instancias **ARM (Ampere)** con 4 CPUs y 24GB de RAM son gratuitas y súper potentes.
3.  Abre los puertos **80** (HTTP) y **443** (HTTPS) en la "VCN" y en el firewall de la instancia:
    ```bash
    sudo iptables -I INPUT 6 -p tcp --dport 80 -j ACCEPT
    sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT
    sudo netfilter-persistent save
    ```

## 3. Instalar Docker en el Servidor
Una vez dentro de tu servidor via SSH, ejecuta:
```bash
sudo apt update && sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER
# Cierra sesión y vuelve a entrar para aplicar cambios
```

## 4. Desplegar la Aplicación
1.  Clona tu repositorio:
    ```bash
    git clone https://github.com/tu-usuario/tu-repo.git ia
    cd ia
    ```
2.  Crea el archivo `.env` de producción:
    ```bash
    cp .env.example .env
    # Edita el archivo .env con la APP_KEY y configuraciones finales
    nano .env
    ```
3.  **Encender el sistema:**
    ```bash
    docker-compose up -d --build
    ```

## 5. Dominio y SSL (Gratis con Let's Encrypt)
Para que tu sitio sea `https://castanedatech.com`:
1.  Apunta tu dominio (en Cloudflare o donde lo compraste) a la **IP Pública** de tu servidor Oracle.
2.  Instala Certbot:
    ```bash
    sudo apt install certbot
    # Sigue las instrucciones para generar los certificados
    ```

---

### Notas de Arquitectura
*   **Laravel + Nginx:** Corren en contenedores separados pero conectados internamente.
*   **Sockets:** El servidor de Node.js corre en el puerto 3001 dentro de la red de Docker.
*   **Base de Datos:** Se usa SQLite (`database.sqlite`) para simplicidad y ahorro de costos.

---
*Preparado por Antigravity AI*

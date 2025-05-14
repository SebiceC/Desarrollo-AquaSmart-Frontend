
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options
import os

def setup_driver(headless=False):
    # Configurar opciones de Chrome
    chrome_options = Options()
    
    # Ruta del ejecutable de Chrome (¡verifica que exista!)
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome_path):
        raise FileNotFoundError(f"Chrome no encontrado en: {chrome_path}")
    
    # Opciones para evitar errores comunes
    chrome_options.add_argument("--no-sandbox")  # Desactiva el sandbox (necesario en algunos entornos)
    chrome_options.add_argument("--disable-dev-shm-usage")  # Soluciona problemas de memoria
    chrome_options.add_argument("--start-maximized")  # Maximiza la ventana
    
    if headless:
        chrome_options.add_argument("--headless=new")  # Modo sin interfaz gráfica

    try:
        # Inicializar Chrome con la versión correcta de ChromeDriver
        driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=chrome_options
        )
        return driver
    except Exception as e:
        print(f"Error al iniciar Chrome: {str(e)}")
        raise
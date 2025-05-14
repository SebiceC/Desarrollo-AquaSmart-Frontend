from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from utils.webdriver_setup import setup_driver
import pytest

def test_login_saucedemo():
    driver = setup_driver(headless=False)  # Cambiar a True para modo sin UI
    
    # Paso 1: Ir a la página de login
    driver.get("https://www.saucedemo.com/v1/")
    
    # Paso 2: Localizar elementos del formulario
    username_field = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-test='username']"))
    )
    
    password_field = driver.find_element(By.CSS_SELECTOR, "[data-test='password']")
    login_button = driver.find_element(By.ID, "login-button")
    
    # Paso 3: Ingresar credenciales y hacer login
    username_field.send_keys("standard_user")
    password_field.send_keys("secret_sauce")
    login_button.click()
    
    # Paso 4: Verificar login exitoso
    WebDriverWait(driver, 10).until(
        EC.url_contains("/inventory.html")  # Esperar a que la URL cambie
    )
    
    # Verificar elementos de la página de inventario
    inventory_container = driver.find_element(By.ID, "inventory_container")
    assert inventory_container.is_displayed(), "El login falló"
    
    driver.quit()

if __name__ == "__main__":
    pytest.main([__file__])
import pytest
from app import App, User

@pytest.fixture
def app():
    return App()

def test_saludo(app):
    assert app.saludo() == "Hello, World!"

def test_suma(app):
    assert app.suma(3, 2) == 5

def test_db_connection(app):
    session = app.get_db_connection()
    
    # Insertar un usuario en la base de datos en memoria
    user = User(name="Oscar")
    session.add(user)
    session.commit()
    
    # Recuperar el usuario
    retrieved_user = session.query(User).filter_by(name="Oscar").first()
    
    assert retrieved_user is not None
    assert retrieved_user.name == "Oscar"

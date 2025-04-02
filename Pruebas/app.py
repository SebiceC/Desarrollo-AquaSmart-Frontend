from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

def test_saludo(app):
    assert app.saludo() == "Hello, World!"
    
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    name = Column(String)

class App:
    def saludo(self):
        return "Hello, World!"

    def suma(self, a, b):
        return a + b

    def get_db_connection(self):
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        Session = sessionmaker(bind=engine)
        return Session()

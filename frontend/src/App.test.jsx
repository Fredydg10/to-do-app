import { render, screen } from '@testing-library/react';
import App from './App';

describe('Componente Principal (App)', () => {
  
  it('debería renderizar el título principal de la app', () => {
    render(<App />);
    
    // Buscamos el texto exacto que aparece en tu <h1>: "Calc & Tasks"
    // La 'i' al final hace que no le importen las mayúsculas o minúsculas
    const titulo = screen.getByText(/calc & tasks/i); 
    
    expect(titulo).toBeInTheDocument();
  });

  it('debería renderizar el componente sin errores', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

});
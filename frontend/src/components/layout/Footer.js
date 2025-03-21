import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-dark text-light py-3 mt-4">
      <Container className="text-center">
        <p className="mb-0">
          &copy; {currentYear} Půjčovna Stavebnin | Všechna práva vyhrazena
        </p>
      </Container>
    </footer>
  );
};

export default Footer;
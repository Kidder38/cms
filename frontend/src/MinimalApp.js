import React from 'react';

const MinimalApp = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Půjčovna stavebního vybavení</h1>
      <p>Jednoduchá testovací stránka</p>
      <button onClick={() => alert('Kliknuto!')}>Klikni na mě</button>
    </div>
  );
};

export default MinimalApp;
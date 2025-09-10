// src/components/TestCardImages.tsx

import React, { useState, useEffect } from 'react';

interface TestCard {
  id: string;
  imageFile: string;
  status: 'loading' | 'success' | 'error';
}

export const TestCardImages: React.FC = () => {
  const [testCards, setTestCards] = useState<TestCard[]>([]);

  useEffect(() => {
    const cardsToTest = [
      { id: 'AS', imageFile: '1-espadas.png' },
      { id: '2H', imageFile: '2-corazones.png' },
      { id: 'KC', imageFile: '13-treboles.png' },
      { id: 'QD', imageFile: '12-diamantes.png' },
      { id: 'card-back', imageFile: 'card-back.jpg' }
    ];

    const testCardObjects: TestCard[] = cardsToTest.map(card => ({
      ...card,
      status: 'loading' as const
    }));

    setTestCards(testCardObjects);

    // Test each image
    testCardObjects.forEach((card, index) => {
      const img = new Image();
      const imagePath = `/images/decks/default/${card.imageFile}`;
      
      img.onload = () => {
        console.log(`✅ Imagen cargada: ${imagePath}`);
        setTestCards(prev => {
          const newCards = [...prev];
          newCards[index] = { ...newCards[index], status: 'success' };
          return newCards;
        });
      };
      
      img.onerror = (error) => {
        console.error(`❌ Error cargando imagen: ${imagePath}`, error);
        setTestCards(prev => {
          const newCards = [...prev];
          newCards[index] = { ...newCards[index], status: 'error' };
          return newCards;
        });
      };
      
      img.src = imagePath;
    });
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '20px',
      borderRadius: '8px',
      zIndex: 9999,
      maxWidth: '300px',
      display: 'none' // Temporarily hidden
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
        🎴 Test de Carga de Imágenes
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '15px' }}>
        {testCards.map((card) => (
          <div key={card.id} style={{ textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '84px',
              border: '2px solid',
              borderColor: card.status === 'success' ? '#22c55e' : card.status === 'error' ? '#ef4444' : '#6b7280',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '5px'
            }}>
              {card.status === 'loading' && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  fontSize: '10px'
                }}>
                  ⏳
                </div>
              )}
              {card.status === 'success' && (
                <img 
                  src={`/images/decks/default/${card.imageFile}`}
                  alt={card.id}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              {card.status === 'error' && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  fontSize: '10px',
                  color: '#ef4444'
                }}>
                  ❌
                </div>
              )}
            </div>
            <div style={{ fontSize: '10px' }}>{card.id}</div>
          </div>
        ))}
      </div>
      
      <div style={{ fontSize: '11px' }}>
        <div>✅ Cargadas: {testCards.filter(c => c.status === 'success').length}</div>
        <div>❌ Errores: {testCards.filter(c => c.status === 'error').length}</div>
        <div>⏳ Cargando: {testCards.filter(c => c.status === 'loading').length}</div>
      </div>
    </div>
  );
};

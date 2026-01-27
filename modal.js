// Modal functionality - Updated
// Product details data
const productDetails = {
  'CLASSIC SMASHED': {
    name: 'CLASSIC SMASHED',
    price: '38.00 LEI',
    description: 'Burger clasic smash cu carne proaspătă',
    ingredients: 'Palină carne: 90.0g, Sos burger: 30.0g, Cheddar: 16.0g, Salată verde: 15.0g, Castraveți murați: 15.0g, Chifla: 70.0g',
    nutrition: 'Per 100g: 270 Kcal, Grăsimi: 16g, Proteine: 12.5g, Glucide: 18g',
    allergens: 'Gluten, Ouă, Lapte, Susan, Muștar'
  },
  'CLASSIC DOUBLE SMASHED': {
    name: 'CLASSIC DOUBLE SMASHED',
    price: '48.00 LEI',
    description: 'Dublu burger smash pentru apetit mare',
    ingredients: 'Dublu palină carne: 180.0g, Sos burger, Dublu cheddar, Salată verde, Castraveți murați, Chifla',
    nutrition: 'Per 100g: 280 Kcal, Grăsimi: 18g, Proteine: 15g',
    allergens: 'Gluten, Ouă, Lapte, Susan, Muștar'
  },
  'IUTE-N GURA': {
    name: 'IUTE-N GURA',
    price: '38.00 LEI',
    description: 'Burger picant cu jalapeño și sos spicy',
    ingredients: 'Palină carne: 90.0g, Jalapeño, Sos picant, Cheddar, Salată, Chifla',
    nutrition: 'Per 100g: 275 Kcal, Grăsimi: 17g, Proteine: 13g',
    allergens: 'Gluten, Ouă, Lapte, Susan, Muștar'
  }
};

// Initialize modal functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add click handlers to product cards
  const productCards = document.querySelectorAll('.product-card');
  
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const title = card.querySelector('h3').textContent;
      const details = productDetails[title];
      
      if (details) {
        showProductModal(details);
      } else {
        // Fallback for products without detailed info
        const price = card.querySelector('.text-orange-500').textContent;
        const desc = card.querySelector('.text-gray-600').textContent;
        showProductModal({
          name: title,
          price: price,
          description: desc,
          ingredients: 'Detalii complete disponibile în curând',
          nutrition: 'Informații nutriționale disponibile în curând',
          allergens: 'Consultați personalul pentru alergeni'
        });
      }
    });
});

function showProductModal(product) {
  const modal = document.createElement('div');
  modal.id = 'product-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl">
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold">${product.name}</h2>
          <button onclick="document.getElementById('product-modal').remove()" class="text-white hover:text-gray-200 text-3xl">&times;</button>
        </div>
        <p class="text-3xl font-bold mt-2">${product.price}</p>
      </div>
      
      <div class="p-6 space-y-6">
        <div>
          <h3 class="text-lg font-bold text-gray-800 mb-2">📝 Descriere</h3>
          <p class="text-gray-600">${product.description}</p>
        </div>
        
        <div>
          <h3 class="text-lg font-bold text-gray-800 mb-2">🥘 Ingrediente</h3>
          <p class="text-gray-600">${product.ingredients}</p>
        </div>
        
        <div>
          <h3 class="text-lg font-bold text-gray-800 mb-2">📊 Valori Nutriționale</h3>
          <p class="text-gray-600">${product.nutrition}</p>
        </div>
        
        <div>
          <h3 class="text-lg font-bold text-gray-800 mb-2">⚠️ Alergeni</h3>
          <p class="text-gray-600">${product.allergens}</p>
        </div>
        
        <button onclick="window.open('https://bolt.eu/', '_blank')" class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg transition duration-200">
          Comandă Acum pe Bolt Food
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

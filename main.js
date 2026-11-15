const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const bagCount = document.querySelector('#bag-count');
const productGrid = document.querySelector('.page .book-grid');
const bagLink = document.querySelector('.bag-link');
const cartKey = 'bookparadise-cart';
let bag = [];

function loadBag() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(cartKey) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((item) => item && typeof item.id === 'string' && typeof item.title === 'string')
      .map((item) => ({
        id: item.id,
        title: item.title,
        author: item.author || '',
        price: Math.max(0, Number(item.price) || 0),
        quantity: Math.max(1, Math.floor(Number(item.quantity) || 1))
      }));
  } catch {
    return [];
  }
}

function saveBag() {
  try {
    window.localStorage.setItem(cartKey, JSON.stringify(bag));
  } catch {
    return;
  }
}

function formatPrice(amount) {
  return `Rs. ${amount.toLocaleString('en-US')}`;
}

bag = loadBag();

function addBookToBag(button) {
  const card = button.closest('.book-card');
  const title = card?.querySelector('h3')?.textContent.trim();
  const author = card?.querySelector('.author')?.textContent.trim() || '';
  const priceText = card?.querySelector('.price')?.textContent || '';
  const price = Number(priceText.replace(/[^0-9]/g, ''));
  if (!title || !price) return null;

  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const existing = bag.find((item) => item.id === id);
  if (existing) existing.quantity += 1;
  else bag.push({ id, title, author, price, quantity: 1 });
  saveBag();
  return title;
}

let cartItems;
let cartEmpty;
let cartSubtotal;
let checkoutTotal;
let checkoutButton;
let checkoutPanel;
let checkoutForm;
let orderConfirmation;
let orderConfirmationText;
let bagToast;
let bagToastText;
let bagToastTimer;

if (productGrid) {
  const cartSection = document.createElement('section');
  cartSection.className = 'shopping-cart';
  cartSection.id = 'shopping-bag';
  cartSection.setAttribute('aria-labelledby', 'cart-title');
  cartSection.innerHTML = `
    <div class="cart-panel">
      <div class="cart-heading">
        <div><p class="eyebrow">Your selection</p><h2 id="cart-title">Your bag <span id="cart-item-count">0 items</span></h2></div>
        <button class="continue-shopping" id="continue-shopping" type="button">Continue browsing</button>
      </div>
      <p class="cart-empty" id="cart-empty">Your bag is empty. Add a book to get started.</p>
      <div class="cart-items" id="cart-items"></div>
      <div class="cart-costs">
        <div class="cart-total"><span>Subtotal</span><strong id="cart-subtotal">Rs. 0</strong></div>
        <div class="cart-total"><span>Delivery</span><strong>Free</strong></div>
      </div>
      <button class="checkout-button" id="checkout-button" type="button" disabled>Continue to checkout</button>
    </div>
    <aside class="checkout-panel" id="checkout-panel" hidden>
      <p class="eyebrow">Almost yours</p>
      <h2>Delivery details</h2>
      <p class="checkout-note">Cash on delivery. No online payment is collected on this demo checkout.</p>
      <form id="checkout-form" class="checkout-form">
        <label for="checkout-name">Full name</label>
        <input id="checkout-name" name="fullName" autocomplete="name" required>
        <label for="checkout-email">Email address</label>
        <input id="checkout-email" name="email" type="email" autocomplete="email" required>
        <label for="checkout-phone">Phone number</label>
        <input id="checkout-phone" name="phone" type="tel" autocomplete="tel" required>
        <label for="checkout-address">Delivery address</label>
        <textarea id="checkout-address" name="address" autocomplete="street-address" required></textarea>
        <div class="cart-total order-total"><span>Order total</span><strong id="checkout-total">Rs. 0</strong></div>
        <button class="checkout-button" type="submit">Place order</button>
      </form>
      <div class="order-confirmation" id="order-confirmation" role="status" aria-live="polite" hidden>
        <h3>Order confirmed</h3>
        <p id="order-confirmation-text"></p>
        <button class="continue-shopping" id="shop-again" type="button">Browse more books</button>
      </div>
    </aside>`;
  productGrid.insertAdjacentElement('afterend', cartSection);

  cartItems = cartSection.querySelector('#cart-items');
  cartEmpty = cartSection.querySelector('#cart-empty');
  cartSubtotal = cartSection.querySelector('#cart-subtotal');
  checkoutTotal = cartSection.querySelector('#checkout-total');
  checkoutButton = cartSection.querySelector('#checkout-button');
  checkoutPanel = cartSection.querySelector('#checkout-panel');
  checkoutForm = cartSection.querySelector('#checkout-form');
  orderConfirmation = cartSection.querySelector('#order-confirmation');
  orderConfirmationText = cartSection.querySelector('#order-confirmation-text');

  bagToast = document.createElement('div');
  bagToast.className = 'bag-toast';
  bagToast.setAttribute('role', 'status');
  bagToast.setAttribute('aria-live', 'polite');
  bagToast.hidden = true;
  bagToast.innerHTML = '<span></span><button type="button">View bag</button>';
  document.body.append(bagToast);
  bagToastText = bagToast.querySelector('span');

  bagToast.querySelector('button').addEventListener('click', () => {
    bagToast.hidden = true;
    cartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const renderBag = () => {
    const itemCount = bag.reduce((total, item) => total + item.quantity, 0);
    const subtotal = bag.reduce((total, item) => total + item.price * item.quantity, 0);
    if (bagCount) bagCount.textContent = itemCount;
    cartSection.querySelector('#cart-item-count').textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;
    cartEmpty.hidden = bag.length > 0;
    cartSubtotal.textContent = formatPrice(subtotal);
    checkoutTotal.textContent = formatPrice(subtotal);
    checkoutButton.disabled = bag.length === 0;
    cartItems.replaceChildren(...bag.map((item) => {
      const row = document.createElement('article');
      row.className = 'cart-item';

      const details = document.createElement('div');
      details.className = 'cart-item-details';
      const title = document.createElement('strong');
      title.textContent = item.title;
      const author = document.createElement('span');
      author.textContent = `${item.author} | ${formatPrice(item.price)}`;
      details.append(title, author);

      const controls = document.createElement('div');
      controls.className = 'cart-item-controls';
      const decrease = document.createElement('button');
      decrease.type = 'button';
      decrease.textContent = '-';
      decrease.setAttribute('aria-label', `Decrease quantity of ${item.title}`);
      decrease.addEventListener('click', () => updateQuantity(item.id, -1));
      const quantity = document.createElement('span');
      quantity.textContent = item.quantity;
      quantity.setAttribute('aria-label', 'Quantity');
      const increase = document.createElement('button');
      increase.type = 'button';
      increase.textContent = '+';
      increase.setAttribute('aria-label', `Increase quantity of ${item.title}`);
      increase.addEventListener('click', () => updateQuantity(item.id, 1));
      controls.append(decrease, quantity, increase);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'cart-remove';
      remove.textContent = 'Remove';
      remove.addEventListener('click', () => {
        bag = bag.filter((bagItem) => bagItem.id !== item.id);
        saveBag();
        renderBag();
      });
      row.append(details, controls, remove);
      return row;
    }));
  };

  function updateQuantity(id, change) {
    bag = bag.flatMap((item) => {
      if (item.id !== id) return [item];
      const quantity = item.quantity + change;
      return quantity > 0 ? [{ ...item, quantity }] : [];
    });
    saveBag();
    renderBag();
  }

  document.querySelectorAll('[data-add]').forEach((button) => {
    button.addEventListener('click', () => {
      const title = addBookToBag(button);
      if (!title) return;

      checkoutPanel.hidden = true;
      checkoutForm.hidden = false;
      orderConfirmation.hidden = true;
      renderBag();
      bagToastText.textContent = `${title} added to your bag.`;
      bagToast.hidden = false;
      window.clearTimeout(bagToastTimer);
      bagToastTimer = window.setTimeout(() => { bagToast.hidden = true; }, 5000);
      button.textContent = 'Added to bag';
      window.setTimeout(() => { button.textContent = 'Add to bag'; }, 1200);
    });
  });

  checkoutButton.addEventListener('click', () => {
    if (!bag.length) return;
    checkoutPanel.hidden = false;
    checkoutForm.hidden = false;
    orderConfirmation.hidden = true;
    checkoutPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    checkoutForm.querySelector('input')?.focus({ preventScroll: true });
  });

  checkoutForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!bag.length) return;
    const fullName = new FormData(checkoutForm).get('fullName')?.toString().trim() || 'reader';
    const subtotal = bag.reduce((total, item) => total + item.price * item.quantity, 0);
    const orderId = `BP-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    orderConfirmationText.textContent = `Thank you, ${fullName}. Order ${orderId} is confirmed for ${formatPrice(subtotal)}. Payment: cash on delivery.`;
    checkoutForm.hidden = true;
    orderConfirmation.hidden = false;
    bag = [];
    saveBag();
    renderBag();
  });

  cartSection.querySelector('#continue-shopping').addEventListener('click', () => {
    document.querySelector('.filter-bar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  cartSection.querySelector('#shop-again').addEventListener('click', () => {
    checkoutPanel.hidden = true;
    checkoutForm.reset();
    checkoutForm.hidden = false;
    orderConfirmation.hidden = true;
    document.querySelector('.filter-bar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  if (bagLink) {
    bagLink.href = '#shopping-bag';
    bagLink.addEventListener('click', (event) => {
      event.preventDefault();
      siteNav?.classList.remove('open');
      menuToggle?.setAttribute('aria-expanded', 'false');
      cartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  renderBag();
} else {
  if (bagCount) bagCount.textContent = bag.reduce((total, item) => total + item.quantity, 0);
  if (bagLink) bagLink.href = 'product.html#shopping-bag';
  document.querySelectorAll('[data-add]').forEach((button) => {
    button.addEventListener('click', () => {
      const title = addBookToBag(button);
      if (!title) return;
      if (bagCount) bagCount.textContent = bag.reduce((total, item) => total + item.quantity, 0);
      button.textContent = 'Added to bag';
      window.setTimeout(() => { button.textContent = 'Add to bag'; }, 1200);
    });
  });
}

menuToggle?.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

const form = document.querySelector('#contact-form');
form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const message = document.querySelector('#form-message');
  if (message) message.textContent = 'Thanks. We will get back to you soon.';
  form.reset();
});

const search = document.querySelector('#book-search');
const categoryButtons = document.querySelectorAll('[data-category]');
const books = document.querySelectorAll('[data-book-category]');

function filterBooks() {
  const term = (search?.value || '').toLowerCase();
  const active = document.querySelector('[data-category].active')?.dataset.category || 'all';
  books.forEach((book) => {
    const matchesText = book.textContent.toLowerCase().includes(term);
    const matchesCategory = active === 'all' || book.dataset.bookCategory === active;
    book.hidden = !(matchesText && matchesCategory);
  });
}

search?.addEventListener('input', filterBooks);
categoryButtons.forEach((button) => button.addEventListener('click', () => {
  categoryButtons.forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  filterBooks();
}));
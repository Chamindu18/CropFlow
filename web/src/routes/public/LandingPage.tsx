import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header" role="banner">
        <nav className="landing-nav" aria-label="Main navigation">
          <div className="landing-nav__brand">
            <Link to="/" className="landing-nav__logo" aria-label="CropFlow Home">
              <svg className="landing-nav__logo-icon" viewBox="0 0 48 46" fill="none" aria-hidden="true">
                <path fill="#aa3bff" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
              </svg>
              <span className="landing-nav__logo-text">CropFlow</span>
            </Link>
          </div>

          <ul className="landing-nav__links" role="list">
            <li><Link to="/app/marketplace" className="landing-nav__link">Marketplace</Link></li>
            <li><a href="#how-it-works" className="landing-nav__link">How It Works</a></li>
            <li><a href="#about" className="landing-nav__link">About</a></li>
          </ul>

          <div className="landing-nav__actions">
            <Link to="/login" className="landing-nav__link landing-nav__link--signin">Sign In</Link>
            <Link to="/register" className="btn btn--primary landing-nav__cta">Get Started</Link>
          </div>

          <button
            type="button"
            className="landing-nav__mobile-toggle"
            aria-expanded="false"
            aria-controls="landing-nav-mobile"
            aria-label="Toggle navigation menu"
          >
            <span className="landing-nav__hamburger" aria-hidden="true"></span>
          </button>
        </nav>

        <div id="landing-nav-mobile" className="landing-nav__mobile" role="navigation" aria-label="Mobile navigation">
          <ul className="landing-nav__mobile-links" role="list">
            <li><Link to="/app/marketplace" className="landing-nav__mobile-link">Marketplace</Link></li>
            <li><a href="#how-it-works" className="landing-nav__mobile-link">How It Works</a></li>
            <li><a href="#about" className="landing-nav__mobile-link">About</a></li>
            <li><Link to="/login" className="landing-nav__mobile-link">Sign In</Link></li>
            <li><Link to="/register" className="btn btn--primary landing-nav__mobile-cta">Get Started</Link></li>
          </ul>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero" aria-labelledby="hero-heading">
          <div className="landing-hero__content">
            <h1 id="hero-heading" className="landing-hero__title">
              Connecting Agriculture, <br />Empowering Farmers
            </h1>
            <p className="landing-hero__description">
              CropFlow is the digital marketplace where farmers list their harvest, buyers discover quality produce, 
              and the agricultural ecosystem connects seamlessly.
            </p>
            <div className="landing-hero__actions">
              <Link to="/app/marketplace" className="btn btn--primary btn--large landing-hero__cta">
                Explore Marketplace
              </Link>
              <Link to="/register" className="btn btn--secondary btn--large landing-hero__cta">
                Get Started
              </Link>
            </div>
          </div>
          <div className="landing-hero__visual" aria-hidden="true">
            <div className="landing-hero__illustration">
              <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Agricultural landscape with fields, barn, and crops">
                <rect x="0" y="180" width="400" height="120" fill="#e8f5e9"/>
                <path d="M0 180 Q100 150 200 180 T400 180" stroke="#4caf50" stroke-width="3" fill="none" opacity="0.3"/>
                <ellipse cx="80" cy="160" rx="60" ry="30" fill="#81c784" opacity="0.4"/>
                <ellipse cx="320" cy="170" rx="50" ry="25" fill="#a5d6a7" opacity="0.4"/>
                <rect x="280" y="120" width="80" height="60" fill="#6d4c41" rx="4"/>
                <path d="M280 120 L320 80 L360 120" fill="#5d4037"/>
                <rect x="305" y="140" width="30" height="40" fill="#4e342e"/>
                <circle cx="100" cy="100" r="35" fill="#fff8e1" opacity="0.8"/>
                <path d="M100 65 L100 135" stroke="#ffb300" stroke-width="3"/>
                <path d="M65 100 L135 100" stroke="#ffb300" stroke-width="3"/>
                <path d="M80 80 L120 120" stroke="#ffb300" stroke-width="2" opacity="0.5"/>
                <path d="M80 120 L120 80" stroke="#ffb300" stroke-width="2" opacity="0.5"/>
                <ellipse cx="150" cy="200" rx="15" ry="8" fill="#8d6e63" opacity="0.6"/>
                <ellipse cx="170" cy="210" rx="12" ry="7" fill="#a1887f" opacity="0.5"/>
                <ellipse cx="135" cy="205" rx="10" ry="6" fill="#8d6e63" opacity="0.5"/>
                <ellipse cx="250" cy="210" rx="20" ry="10" fill="#795548" opacity="0.5"/>
                <ellipse cx="270" cy="220" rx="15" ry="8" fill="#8d6e63" opacity="0.5"/>
                <ellipse cx="230" cy="215" rx="12" ry="7" fill="#a1887f" opacity="0.4"/>
                <path d="M50 200 Q70 180 90 200" stroke="#8d6e63" stroke-width="4" fill="none" opacity="0.4"/>
                <path d="M350 200 Q330 180 310 200" stroke="#8d6e63" stroke-width="4" fill="none" opacity="0.4"/>
              </svg>
            </div>
          </div>
        </section>

        <section className="landing-values" aria-labelledby="values-heading">
          <div className="landing-container">
            <header className="landing-section-header">
              <h2 id="values-heading" className="landing-section-title">Why Choose CropFlow</h2>
              <p className="landing-section-description">
                Built for the agricultural community, by people who understand farming.
              </p>
            </header>
            <ul className="landing-values__grid" role="list">
              <li className="landing-value-card">
                <div className="landing-value-card__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                    <path d="M20 7L12 3 4 7l8 4 8-4z" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M4 7v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 3v18" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h3 className="landing-value-card__title">Sell Your Harvest</h3>
                <p className="landing-value-card__description">
                  List your agricultural products with detailed descriptions, photos, and pricing. 
                  Reach buyers directly without intermediaries.
                </p>
              </li>
              <li className="landing-value-card">
                <div className="landing-value-card__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M21 21l-4.35-4.35" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h3 className="landing-value-card__title">Discover Products</h3>
                <p className="landing-value-card__description">
                  Browse a wide variety of agricultural listings from farmers across the platform. 
                  Filter by category, location, and availability.
                </p>
              </li>
              <li className="landing-value-card">
                <div className="landing-value-card__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="9" cy="7" r="4" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h3 className="landing-value-card__title">Connect with Buyers</h3>
                <p className="landing-value-card__description">
                  Build relationships with buyers, negotiate terms, and establish ongoing 
                  partnerships for your agricultural business.
                </p>
              </li>
              <li className="landing-value-card">
                <div className="landing-value-card__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M16 2v4" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8 2v4" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M3 10h18" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h3 className="landing-value-card__title">Manage Listings</h3>
                <p className="landing-value-card__description">
                  Track your active, draft, and sold listings in one dashboard. 
                  Update details, change status, and monitor performance.
                </p>
              </li>
            </ul>
          </div>
        </section>

        <section className="landing-how-it-works" id="how-it-works" aria-labelledby="how-it-works-heading">
          <div className="landing-container">
            <header className="landing-section-header">
              <h2 id="how-it-works-heading" className="landing-section-title">How It Works</h2>
              <p className="landing-section-description">
                Three simple steps to start connecting with the agricultural marketplace.
              </p>
            </header>
            <ol className="landing-steps" role="list">
              <li className="landing-step">
                <div className="landing-step__number" aria-hidden="true">01</div>
                <div className="landing-step__content">
                  <h3 className="landing-step__title">Create Your Account</h3>
                  <p className="landing-step__description">
                    Sign up as a farmer or buyer. Verify your email and complete your profile 
                    to access the full marketplace features.
                  </p>
                </div>
              </li>
              <li className="landing-step">
                <div className="landing-step__number" aria-hidden="true">02</div>
                <div className="landing-step__content">
                  <h3 className="landing-step__title">List or Discover</h3>
                  <p className="landing-step__description">
                    Farmers can create listings for their harvest with photos, descriptions, 
                    and pricing. Buyers can browse and filter available products.
                  </p>
                </div>
              </li>
              <li className="landing-step">
                <div className="landing-step__number" aria-hidden="true">03</div>
                <div className="landing-step__content">
                  <h3 className="landing-step__title">Connect and Transact</h3>
                  <p className="landing-step__description">
                    Connect with interested parties, discuss terms, and complete transactions. 
                    Manage all your marketplace activity from your dashboard.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="landing-marketplace-preview" aria-labelledby="marketplace-preview-heading">
          <div className="landing-container">
            <header className="landing-section-header">
              <h2 id="marketplace-preview-heading" className="landing-section-title">Marketplace Preview</h2>
              <p className="landing-section-description">
                See what farmers are listing on CropFlow today.
              </p>
            </header>
            <div className="landing-marketplace__preview">
              <ul className="landing-marketplace__list" role="list">
                <li className="landing-marketplace__item">
                  <div className="landing-marketplace__item-image" aria-hidden="true">
                    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <rect width="200" height="150" fill="#e8f5e9"/>
                      <ellipse cx="100" cy="90" rx="40" ry="25" fill="#81c784" opacity="0.5"/>
                      <ellipse cx="140" cy="100" rx="30" ry="20" fill="#a5d6a7" opacity="0.5"/>
                    </svg>
                  </div>
                  <div className="landing-marketplace__item-content">
                    <span className="landing-marketplace__item-status status-badge status-badge--active">Active</span>
                    <h3 className="landing-marketplace__item-title">Fresh Organic Tomatoes</h3>
                    <p className="landing-marketplace__item-description">Vine-ripened, certified organic tomatoes harvested this morning.</p>
                    <div className="landing-marketplace__item-meta">
                      <span className="landing-marketplace__item-price">$4.50/lb</span>
                      <span className="landing-marketplace__item-location">Central Valley, CA</span>
                    </div>
                  </div>
                </li>
                <li className="landing-marketplace__item">
                  <div className="landing-marketplace__item-image" aria-hidden="true">
                    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <rect width="200" height="150" fill="#fff8e1"/>
                      <ellipse cx="100" cy="85" rx="45" ry="30" fill="#ffcc80" opacity="0.5"/>
                      <ellipse cx="145" cy="95" rx="25" ry="18" fill="#ffb74d" opacity="0.5"/>
                    </svg>
                  </div>
                  <div className="landing-marketplace__item-content">
                    <span className="landing-marketplace__item-status status-badge status-badge--active">Active</span>
                    <h3 className="landing-marketplace__item-title">Sweet Corn - Bulk</h3>
                    <p className="landing-marketplace__item-description">Non-GMO sweet corn, perfect for fresh markets and processing.</p>
                    <div className="landing-marketplace__item-meta">
                      <span className="landing-marketplace__item-price">$0.75/ear</span>
                      <span className="landing-marketplace__item-location">Iowa, USA</span>
                    </div>
                  </div>
                </li>
                <li className="landing-marketplace__item">
                  <div className="landing-marketplace__item-image" aria-hidden="true">
                    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <rect width="200" height="150" fill="#e3f2fd"/>
                      <ellipse cx="100" cy="90" rx="35" ry="40" fill="#90caf9" opacity="0.5"/>
                      <path d="M100 50 Q120 50 120 70 Q120 90 100 90 Q80 90 80 70 Q80 50 100 50" fill="#64b5f6" opacity="0.5"/>
                    </svg>
                  </div>
                  <div className="landing-marketplace__item-content">
                    <span className="landing-marketplace__item-status status-badge status-badge--active">Active</span>
                    <h3 className="landing-marketplace__item-title">Crisp Lettuce Heads</h3>
                    <p className="landing-marketplace__item-description">Hydroponically grown butterhead lettuce, pesticide-free.</p>
                    <div className="landing-marketplace__item-meta">
                      <span className="landing-marketplace__item-price">$3.00/head</span>
                      <span className="landing-marketplace__item-location">Arizona, USA</span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            <div className="landing-marketplace__cta">
              <Link to="/app/marketplace" className="btn btn--primary btn--large">
                Explore Full Marketplace
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-cta" aria-labelledby="cta-heading">
          <div className="landing-container">
            <div className="landing-cta__content">
              <h2 id="cta-heading" className="landing-cta__title">Ready to Join CropFlow?</h2>
              <p className="landing-cta__description">
                Create your free account today and start connecting with the agricultural marketplace.
              </p>
              <div className="landing-cta__actions">
                <Link to="/register" className="btn btn--primary btn--large">
                  Get Started Free
                </Link>
                <Link to="/app/marketplace" className="btn btn--secondary btn--large">
                  Browse Marketplace
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer" id="about" role="contentinfo">
        <div className="landing-container">
          <div className="landing-footer__grid">
            <div className="landing-footer__brand">
              <Link to="/" className="landing-footer__logo" aria-label="CropFlow Home">
                <svg className="landing-footer__logo-icon" viewBox="0 0 48 46" fill="none" aria-hidden="true">
                  <path fill="#aa3bff" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
                </svg>
                <span className="landing-footer__logo-text">CropFlow</span>
              </Link>
              <p className="landing-footer__description">
                The digital marketplace connecting farmers, buyers, and the agricultural ecosystem.
              </p>
            </div>

            <nav className="landing-footer__nav" aria-label="Product navigation">
              <h3 className="landing-footer__heading">Product</h3>
              <ul role="list">
                <li><Link to="/app/marketplace" className="landing-footer__link">Marketplace</Link></li>
                <li><a href="#how-it-works" className="landing-footer__link">How It Works</a></li>
                <li><a href="#about" className="landing-footer__link">About</a></li>
              </ul>
            </nav>

            <nav className="landing-footer__nav" aria-label="Account navigation">
              <h3 className="landing-footer__heading">Account</h3>
              <ul role="list">
                <li><Link to="/login" className="landing-footer__link">Sign In</Link></li>
                <li><Link to="/register" className="landing-footer__link">Get Started</Link></li>
                <li><Link to="/forgot-password" className="landing-footer__link">Forgot Password</Link></li>
              </ul>
            </nav>

            <nav className="landing-footer__nav" aria-label="Legal navigation">
              <h3 className="landing-footer__heading">Legal</h3>
              <ul role="list">
                <li><a href="#" className="landing-footer__link">Privacy Policy</a></li>
                <li><a href="#" className="landing-footer__link">Terms of Service</a></li>
              </ul>
            </nav>
          </div>

          <div className="landing-footer__bottom">
            <p className="landing-footer__copyright">
              &copy; {new Date().getFullYear()} CropFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
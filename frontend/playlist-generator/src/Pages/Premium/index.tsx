import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/ui/Sidebar';
import { Background } from '../../components/ui/Background';
import { authService } from '../../services/auth.service';
import type { User, SpotifyUserProfile } from '../../types';
import '../../main.css';

export const Premium: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | SpotifyUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const profile = await authService.getCurrentUser();
      setUser(profile);
    } catch (err) {
      console.error('Failed to load user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };


  const plans = {
    monthly: {
      price: 9.99,
      billing: 'per month',
      savings: null
    },
    yearly: {
      price: 99.99,
      billing: 'per year',
      savings: 'Save $20'
    }
  };

  const faqs = [
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes! You can cancel your subscription at any time. Your premium features will remain active until the end of your billing period.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and Apple Pay.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! New users get a 14-day free trial of Premium. No credit card required to start.'
    },
    {
      question: 'Can I switch plans later?',
      answer: 'Absolutely! You can upgrade, downgrade, or switch between monthly and yearly plans at any time.'
    },
    {
      question: 'Do you offer student discounts?',
      answer: 'Yes! Students get 50% off Premium with valid student verification. Contact support to verify your status.'
    },
    {
      question: 'What happens to my playlists if I downgrade?',
      answer: "All your saved playlists remain accessible. You'll just have the Free plan limitations on creating new ones."
    }
  ];

  if (loading) {
    return (
      <>
        <Background />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mobile-menu-button"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
        {isMobileMenuOpen && (
          <div 
            className="sidebar-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        <div className={isMobileMenuOpen ? 'open' : ''}>
          <Sidebar 
            onLogin={() => {}} 
            onSignup={() => {}} 
            isAuthenticated={true} 
            onLogout={handleLogout}
            user={user}
          />
        </div>
        <div className="premium-page">
          <div className="loading-state">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Background />
      
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="mobile-menu-button"
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>
      
      {isMobileMenuOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <div className={isMobileMenuOpen ? 'open' : ''}>
        <Sidebar 
          onLogin={() => {}} 
          onSignup={() => {}} 
          isAuthenticated={true} 
          onLogout={handleLogout}
          user={user}
        />
      </div>

      <div className="premium-page">
        {/* Hero Section */}
        <div className="premium-hero">
          <div className="premium-hero-content">
            <div className="premium-badge">✨ PREMIUM</div>
            <h1 className="premium-hero-title">
              Unlock the Full
              <br />
              <span className="gradient-text">MoodTune Experience</span>
            </h1>
            <p className="premium-hero-subtitle">
              Get unlimited playlists, advanced features, and an ad-free experience
            </p>
            <div className="premium-hero-cta">
              <button className="btn-premium-large">
                Start 14-Day Free Trial
              </button>
              <p className="trial-note">No credit card required • Cancel anytime</p>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="pricing-section">
          <h2 className="section-title">Choose Your Plan</h2>
          
          <div className="plan-toggle">
            <button
              className={`toggle-btn ${selectedPlan === 'monthly' ? 'active' : ''}`}
              onClick={() => setSelectedPlan('monthly')}
            >
              Monthly
            </button>
            <button
              className={`toggle-btn ${selectedPlan === 'yearly' ? 'active' : ''}`}
              onClick={() => setSelectedPlan('yearly')}
            >
              Yearly
              {plans.yearly.savings && (
                <span className="savings-badge">{plans.yearly.savings}</span>
              )}
            </button>
          </div>

          <div className="pricing-cards">
            {/* Free Plan */}
            <div className="pricing-card">
              <div className="plan-header">
                <h3 className="plan-name">Free</h3>
                <div className="plan-price">
                  <span className="price-amount">$0</span>
                  <span className="price-period">forever</span>
                </div>
              </div>
              <div className="plan-features">
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>5 playlists per day</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Basic mood selection</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Standard quality audio</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Basic analytics</span>
                </div>
                <div className="feature-item disabled">
                  <span className="feature-icon">✕</span>
                  <span>Advanced features</span>
                </div>
              </div>
              <button className="btn-plan" disabled>
                Current Plan
              </button>
            </div>

            {/* Premium Plan */}
            <div className="pricing-card featured">
              <div className="popular-badge">MOST POPULAR</div>
              <div className="plan-header">
                <h3 className="plan-name">Premium</h3>
                <div className="plan-price">
                  <span className="price-amount">${plans[selectedPlan].price}</span>
                  <span className="price-period">{plans[selectedPlan].billing}</span>
                </div>
              </div>
              <div className="plan-features">
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Unlimited playlists</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Advanced mood mixing</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>High-quality audio (320kbps)</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Advanced analytics & insights</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Offline mode</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>No ads</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Exclusive features</span>
                </div>
              </div>
              <button className="btn-plan premium">
                Upgrade to Premium
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <h3 className="faq-question">{faq.question}</h3>
                <p className="faq-answer">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="premium-cta-section">
          <div className="cta-content">
            <h2 className="cta-title">Ready to upgrade your music experience?</h2>
            <p className="cta-subtitle">Join thousands of music lovers enjoying MoodTune Premium</p>
            <button className="btn-premium-large">
              Start Your Free Trial
            </button>
            <p className="trial-note">14 days free • Then ${plans[selectedPlan].price}/{selectedPlan === 'monthly' ? 'month' : 'year'}</p>
          </div>
        </div>
      </div>
    </>
  );
};
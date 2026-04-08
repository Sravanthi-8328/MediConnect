import React from 'react';
import { useNavigate } from 'react-router-dom';

const consultationTypes = [
  {
    title: 'Primary Consultation',
    desc: 'Connect instantly with a doctor through video call.',
    image:
      'https://images.unsplash.com/photo-1631815588090-d1bcbe9a42e6?w=500&h=320&fit=crop',
  },
  {
    title: 'Second Medical Opinion',
    desc: 'Get assured treatment from world class specialists.',
    image:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&h=320&fit=crop',
  },
  {
    title: 'Multi-Specialty Consultation',
    desc: 'One platform for all major health concerns.',
    image:
      'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=500&h=320&fit=crop',
  },
  {
    title: 'Diet Consultation',
    desc: 'Personalized nutrition plans for recovery and wellness.',
    image:
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&h=320&fit=crop',
  },
  {
    title: 'Cancer Care',
    desc: 'Guidance from trusted oncologists and care teams.',
    image:
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=500&h=320&fit=crop',
  },
  {
    title: 'Dental Consultation',
    desc: 'Preventive care and treatment for healthy smiles.',
    image:
      'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=500&h=320&fit=crop',
  },
  {
    title: 'Child Care',
    desc: 'Warm and reliable pediatric support for children.',
    image:
      'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=500&h=320&fit=crop',
  },
  {
    title: 'Skin Care',
    desc: 'Dermatology guidance for skin and hair concerns.',
    image:
      'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=500&h=320&fit=crop',
  },
];

const offerings = [
  {
    title: 'Diet Programs',
    text: 'Our nutrition experts help reverse lifestyle disorders.',
    image:
      'https://images.unsplash.com/photo-1547592180-85f173990554?w=560&h=330&fit=crop',
  },
  {
    title: 'Health Care Packages',
    text: 'Senior care and complete preventive health bundles.',
    image:
      'https://images.unsplash.com/photo-1584515933487-779824d29309?w=560&h=330&fit=crop',
  },
  {
    title: 'MediConnect Pharmacy',
    text: 'Order medicines online with fast doorstep delivery.',
    image:
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=560&h=330&fit=crop',
  },
  {
    title: 'Corporate Health Plans',
    text: 'Affordable healthcare plans for employees and teams.',
    image:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=560&h=330&fit=crop',
  },
  {
    title: 'Home Sample Collection',
    text: 'Book lab tests and collect samples from home.',
    image:
      'https://images.unsplash.com/photo-1579165466741-7f35e4755183?w=560&h=330&fit=crop',
  },
  {
    title: 'Mental Wellness',
    text: 'Counseling and therapy support when you need it.',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=560&h=330&fit=crop',
  },
];

const issues = [
  {
    title: 'Periods, PCOD or Pregnancy?',
    image:
      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=420&h=250&fit=crop',
  },
  {
    title: 'Acne, Rashes or Skin Irritation?',
    image:
      'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=420&h=250&fit=crop',
  },
  {
    title: "Questions about Children's Health?",
    image:
      'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=420&h=250&fit=crop',
  },
  {
    title: 'Fever, Cough and Cold?',
    image:
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=420&h=250&fit=crop',
  },
  {
    title: 'Breathing Concerns?',
    image:
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=420&h=250&fit=crop',
  },
  {
    title: 'Back Pain or Joint Pain?',
    image:
      'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=420&h=250&fit=crop',
  },
  {
    title: 'Diabetes or Thyroid Issues?',
    image:
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=420&h=250&fit=crop',
  },
  {
    title: 'Stress, Anxiety or Sleep?',
    image:
      'https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=420&h=250&fit=crop',
  },
  {
    title: 'Stomach Pain or Digestion?',
    image:
      'https://images.unsplash.com/photo-1551076805-e1869033e561?w=420&h=250&fit=crop',
  },
];

const specialties = [
  'Pulmonary',
  'Dermatology',
  'Internal Medicine',
  'Nephrology',
  'Neurology',
  'Cardiology',
  'Orthopedics',
  'Pediatrics',
];

const faqs = [
  {
    question: 'How quickly can I consult a doctor?',
    answer: 'Most consultations are available within 30 minutes based on doctor availability.',
  },
  {
    question: 'Are prescriptions available digitally?',
    answer: 'Yes, prescriptions are generated digitally and can be viewed in your dashboard.',
  },
  {
    question: 'Can I order medicines after consultation?',
    answer: 'Yes, pharmacists process medicine orders directly from valid prescriptions.',
  },
  {
    question: 'Is my health data secure?',
    answer: 'Your records are handled through secure authenticated access and role-based dashboards.',
  },
];

function AutoPlayCarousel({ items, renderItem, speed = 28, className = '' }) {
  return (
    <div className={`carousel-shell ${className}`}>
      <div className="carousel-track" style={{ '--carousel-duration': `${speed}s` }}>
        {items.map((item, index) => renderItem(item, index))}
        {items.map((item, index) => renderItem(item, index + items.length))}
      </div>
    </div>
  );
}

const LandingPage = () => {
  const navigate = useNavigate();

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="landing-v2">
      <div className="landing-v2-topbar">
        <span>+91 40-1234-5678</span>
        <p>India's trusted digital healthcare platform for families and clinics.</p>
        <span>No Country Selected</span>
      </div>

      <header className="landing-v2-header">
        <div className="landing-v2-logo">
          <span className="logo-mark">+</span>
          <div>
            <strong>MediConnect</strong>
            <small>Care for better life</small>
          </div>
        </div>

        <nav className="landing-v2-navlinks">
          <button type="button" className="landing-link-btn" onClick={() => scrollToSection('how-it-works')}>How It Works</button>
          <button type="button" className="landing-link-btn" onClick={() => scrollToSection('pricing')}>Pricing</button>
          <button type="button" className="landing-link-btn" onClick={() => scrollToSection('faq')}>FAQ</button>
          <button type="button" className="landing-link-btn" onClick={() => scrollToSection('about-us')}>About Us</button>
          <button type="button" className="landing-link-btn" onClick={() => scrollToSection('offers')}>Offers</button>
        </nav>

        <div className="landing-v2-auth">
          <button onClick={() => navigate('/login')}>Login</button>
          <button className="register" onClick={() => navigate('/register')}>Register</button>
        </div>
      </header>

      <div className="landing-v2-subnav">
        <button type="button" className="landing-subnav-btn" onClick={() => scrollToSection('consult-doctor')}>Consult Doctor</button>
        <button type="button" className="landing-subnav-btn" onClick={() => scrollToSection('offers')}>Diet Programs</button>
        <button type="button" className="landing-subnav-btn" onClick={() => scrollToSection('offers')}>Ayurvedic Care</button>
        <button type="button" className="landing-subnav-btn" onClick={() => scrollToSection('offers')}>Wellness Plans</button>
        <button type="button" className="landing-subnav-btn" onClick={() => scrollToSection('pricing')}>Cancer Care</button>
        <button type="button" className="landing-subnav-btn" onClick={() => scrollToSection('other-services')}>Other Services</button>
      </div>

      <section id="consult-doctor" className="landing-v2-hero">
        <img
          className="hero-bg"
          src="https://images.unsplash.com/photo-1580281658628-0c9f0d0b8d2b?w=1800&h=750&fit=crop"
          alt="Virtual consultation"
        />
        <div className="hero-overlay" />

        <div className="hero-left">
          <span className="hero-badge-v2">Live Video Consultation</span>
          <h1>One Stop Solution For Your Health Problems</h1>
          <p>Reach out to 400+ board certified doctors through a secure video visit.</p>
          <ul>
            <li>Consultation within 30 minutes</li>
            <li>Virtual care from home</li>
          </ul>
          <div className="hero-actions">
            <button onClick={() => navigate('/login')}>Consult Now</button>
            <button onClick={() => navigate('/login')}>Our Pricing</button>
          </div>
        </div>

        <div className="hero-video-card">
          <div className="hero-video-card-header">
            <span className="hero-video-live">● Live</span>
            <span className="hero-video-time">12 min remaining</span>
          </div>
          <div className="hero-video-frame">
            <img
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=560&fit=crop"
              alt="Doctor on video call"
            />
            <div className="hero-video-overlay">
              <div className="hero-video-participant main">
                <span>Dr. Sarah Johnson</span>
                <small>Cardiology</small>
              </div>
              <div className="hero-video-participant patient">
                <span>You</span>
                <small>Connected securely</small>
              </div>
            </div>
          </div>
          <div className="hero-video-controls">
            <button title="Mute">🎤</button>
            <button title="Camera">📷</button>
            <button title="Share">🔗</button>
            <button title="End call" className="end-call">✕</button>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-v2-section white">
        <h2>Consultation Types</h2>
        <AutoPlayCarousel
          className="carousel-photo-row"
          speed={34}
          items={consultationTypes}
          renderItem={(item, index) => (
            <article key={`${item.title}-${index}`} className="tile-card">
              <img src={item.image} alt={item.title} />
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          )}
        />
      </section>

      <section id="offers" className="landing-v2-section gray">
        <h2>Additional Offerings</h2>
        <AutoPlayCarousel
          className="carousel-photo-row offering-carousel"
          speed={42}
          items={offerings}
          renderItem={(item, index) => (
            <article key={`${item.title}-${index}`} className="offer-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <img src={item.image} alt={item.title} />
              <a href="#">Know More &gt;</a>
            </article>
          )}
        />
      </section>

      <section id="pricing" className="landing-v2-section gray">
        <h2>Common Health Issues</h2>
        <p className="section-sub">Checkout our Pricing &gt;</p>
        <AutoPlayCarousel
          className="carousel-photo-row issue-carousel"
          speed={38}
          items={issues}
          renderItem={(item, index) => (
            <article key={`${item.title}-${index}`} className="issue-card">
              <img src={item.image} alt={item.title} />
              <h4>{item.title}</h4>
              <a href="#">Consult now &gt;</a>
            </article>
          )}
        />
      </section>

      <section id="other-services" className="landing-v2-section white">
        <h2>Our Specialties</h2>
        <div className="specialty-row">
          {specialties.map((name) => (
            <div key={name} className="specialty-item">
              <span>+</span>
              <h4>{name}</h4>
              <button type="button" className="specialty-link-btn" onClick={() => navigate('/login')}>View Doctors</button>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="landing-v2-section white">
        <h2>Frequently Asked Questions</h2>
        <div className="landing-v2-faq-grid">
          {faqs.map((item) => (
            <article key={item.question} className="landing-v2-faq-card">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="about-us" className="landing-v2-stats">
        <h2>Strength in Numbers</h2>
        <div className="stats-row">
          <div>
            <strong>400+</strong>
            <span>Doctors</span>
          </div>
          <div>
            <strong>40+</strong>
            <span>Services</span>
          </div>
          <div>
            <strong>8+</strong>
            <span>Countries</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

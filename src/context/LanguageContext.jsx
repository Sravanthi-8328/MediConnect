import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LanguageContext = createContext(null);

const translations = {
  Hindi: {
    'Choose Language': 'भाषा चुनें',
    'Dashboard': 'डैशबोर्ड',
    'Appointments': 'अपॉइंटमेंट्स',
    'Patients': 'मरीज',
    'Prescriptions': 'प्रिस्क्रिप्शंस',
    'Lab Reports': 'लैब रिपोर्ट्स',
    'Orders': 'ऑर्डर्स',
    'Health Records': 'हेल्थ रिकॉर्ड्स',
    'Profile': 'प्रोफाइल',
    'Settings': 'सेटिंग्स',
    'Users': 'यूज़र्स',
    'Reports': 'रिपोर्ट्स',
    'Doctor Verification': 'डॉक्टर सत्यापन',
    'My Patients': 'मेरे मरीज',
    'Schedule': 'शेड्यूल',
    'User Management': 'यूज़र प्रबंधन',
    'Prescription Queue': 'प्रिस्क्रिप्शन कतार',
    'Order Processing': 'ऑर्डर प्रोसेसिंग',
    'Inventory': 'इन्वेंटरी',
    'Delivery Tracking': 'डिलीवरी ट्रैकिंग',
    'Notifications': 'सूचनाएं',
    'Mark all read': 'सभी पढ़ा हुआ चिन्हित करें',
    'No notifications': 'कोई सूचना नहीं',
    'Logout': 'लॉगआउट',
    'Welcome': 'स्वागत है',
    'How are you feeling today?': 'आज आप कैसा महसूस कर रहे हैं?',
    'Admin Control Panel': 'एडमिन कंट्रोल पैनल',
    'Pharmacy Dashboard': 'फार्मेसी डैशबोर्ड',
    'Good': 'शुभ',
    'Morning': 'सुबह',
    'Afternoon': 'दोपहर',
    'Evening': 'शाम',
  },
  Tamil: {
    'Choose Language': 'மொழியை தேர்ந்தெடுக்கவும்',
    'Dashboard': 'டாஷ்போர்டு',
    'Appointments': 'சந்திப்புகள்',
    'Patients': 'நோயாளிகள்',
    'Prescriptions': 'மருந்து சீட்டுகள்',
    'Lab Reports': 'ஆய்வு அறிக்கைகள்',
    'Orders': 'ஆர்டர்கள்',
    'Health Records': 'சுகாதார பதிவுகள்',
    'Profile': 'சுயவிவரம்',
    'Settings': 'அமைப்புகள்',
    'Users': 'பயனர்கள்',
    'Reports': 'அறிக்கைகள்',
    'Doctor Verification': 'மருத்துவர் சரிபார்ப்பு',
    'My Patients': 'என் நோயாளிகள்',
    'Schedule': 'அட்டவணை',
    'User Management': 'பயனர் மேலாண்மை',
    'Prescription Queue': 'மருந்து சீட்டு வரிசை',
    'Order Processing': 'ஆர்டர் செயலாக்கம்',
    'Inventory': 'சரக்கு',
    'Delivery Tracking': 'டெலிவரி கண்காணிப்பு',
    'Notifications': 'அறிவிப்புகள்',
    'Mark all read': 'அனைத்தையும் படித்ததாக குறிக்கவும்',
    'No notifications': 'அறிவிப்புகள் இல்லை',
    'Logout': 'வெளியேறு',
    'Welcome': 'வரவேற்கிறோம்',
    'How are you feeling today?': 'இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?',
    'Admin Control Panel': 'நிர்வாக கட்டுப்பாட்டு பலகம்',
    'Pharmacy Dashboard': 'மருந்தகம் டாஷ்போர்டு',
    'Good': 'நல்வாழ்த்து',
    'Morning': 'காலை',
    'Afternoon': 'மதியம்',
    'Evening': 'மாலை',
  },
  Telugu: {
    'Choose Language': 'భాషను ఎంచుకోండి',
    'Dashboard': 'డ్యాష్‌బోర్డ్',
    'Appointments': 'అపాయింట్‌మెంట్లు',
    'Patients': 'రోగులు',
    'Prescriptions': 'ప్రిస్క్రిప్షన్లు',
    'Lab Reports': 'ల్యాబ్ రిపోర్టులు',
    'Orders': 'ఆర్డర్లు',
    'Health Records': 'హెల్త్ రికార్డులు',
    'Profile': 'ప్రొఫైల్',
    'Settings': 'సెట్టింగ్స్',
    'Users': 'వినియోగదారులు',
    'Reports': 'రిపోర్టులు',
    'Doctor Verification': 'డాక్టర్ ధృవీకరణ',
    'My Patients': 'నా రోగులు',
    'Schedule': 'షెడ్యూల్',
    'User Management': 'యూజర్ నిర్వహణ',
    'Prescription Queue': 'ప్రిస్క్రిప్షన్ క్యూ',
    'Order Processing': 'ఆర్డర్ ప్రాసెసింగ్',
    'Inventory': 'ఇన్వెంటరీ',
    'Delivery Tracking': 'డెలివరీ ట్రాకింగ్',
    'Notifications': 'నోటిఫికేషన్లు',
    'Mark all read': 'అన్నింటిని చదివినట్లు గుర్తించండి',
    'No notifications': 'నోటిఫికేషన్లు లేవు',
    'Logout': 'లాగ్ అవుట్',
    'Welcome': 'స్వాగతం',
    'How are you feeling today?': 'ఈ రోజు మీరు ఎలా అనుభవిస్తున్నారు?',
    'Admin Control Panel': 'అడ్మిన్ కంట్రోల్ ప్యానెల్',
    'Pharmacy Dashboard': 'ఫార్మసీ డ్యాష్‌బోర్డ్',
    'Good': 'శుభ',
    'Morning': 'ఉదయం',
    'Afternoon': 'మధ్యాహ్నం',
    'Evening': 'సాయంత్రం',
  },
};

const languageOptions = ['English', 'Hindi', 'Tamil', 'Telugu'];

export const LanguageProvider = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(() => localStorage.getItem('appLanguage') || 'English');

  useEffect(() => {
    localStorage.setItem('appLanguage', selectedLanguage);
  }, [selectedLanguage]);

  const t = useMemo(() => {
    return (text) => {
      if (!text || selectedLanguage === 'English') return text;
      return translations[selectedLanguage]?.[text] || text;
    };
  }, [selectedLanguage]);

  return (
    <LanguageContext.Provider value={{ selectedLanguage, setSelectedLanguage, languageOptions, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

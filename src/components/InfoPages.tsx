import type { Language } from '../types'

export function HaircareAdvicePage({ language }: { language: Language }) {
  const hairTypes = language === 'ta'
    ? [
      {
        title: 'நேரான முடி',
        summary: 'இலகுவான பராமரிப்பு, எடையின்றி மென்மையாக வைத்திருக்கும்.',
        tips: [
          'இயற்கையான எண்ணெய்களை அகற்றாமல் இருக்க மென்மையான சல்பேட் இல்லாத ஷாம்பூவை பயன்படுத்துங்கள்.',
          'ஃபிரிஸை குறைக்க மிட்லெங்க்த்களில் லைட் லீவ்-இன் கண்டிஷனர் அல்லது சரம் தடவுங்கள்.',
          'வெப்பமான ஸ்டைலிங்கைக் குறைத்து, தேவைப்பட்டால் ஹீட் புரொடக்ட்டைப் பயன்படுத்துங்கள்.',
        ],
      },
      {
        title: 'அலைந்த முடி',
        summary: 'ஈரப்பதம் மற்றும் அமைப்பு ஆதரவுடன் அலைகள் மென்மையாகவும் வரையறுக்கப்பட்டும் இருக்கும்.',
        tips: [
          'அலைகளை பouncy ஆக வைத்திருக்க ஹைட்ரேட்டிங் ஷாம்பூவும் லைட் கண்டிஷனரும் தேர்வு செய்யுங்கள்.',
          'ஈரமான முடியில் மவுஸ் அல்லது கர்ல் க்ரீம் பயன்படுத்தி இயற்கையான இயக்கத்தை உருவாக்குங்கள்.',
          'மிகவும் கழுவுவதைத் தவிர்த்து, வெங்காயம் கருமளவை சீராக வைத்துக் கொள்ளுங்கள்.',
        ],
      },
      {
        title: 'மடிந்த முடி',
        summary: 'மடிந்த அமைப்பு அதிக ஈரப்பதமும் மென்மையான ஸ்டைலிங்கும் தேவைப்படுகிறது.',
        tips: [
          'மூடிப்போன வழக்கமற்ற ஷாம்பூவை பயன்படுத்தி, பின் ரிச் கண்டிஷனர் அல்லது டீப் ட்ரீட்மெண்ட் செய்யுங்கள்.',
          'ஈரமான முடியில் கர்ல் க்ரீம் தடவி, கடினமான துண்டு உலர்த்தும் முறை தவிர்க்கவும்.',
          'இரவுகளில் சாடின் ஸ்கார்ஃப் அல்லது போல்லின் மூலம் நகைச்சுவை ஏற்படாமல் காக்கவும்.',
        ],
      },
      {
        title: 'கொக்கு / கிங்கி முடி',
        summary: 'இந்த வகை முடிக்கு அதிக ஈரப்பதமும் குறைந்த சிரமமும் தேவைப்படுகிறது.',
        tips: [
          'ஈரப்பதத்தைத் தக்கவைக்க க்ரீமி கிளென்சரும் கோ-வாஷும் இடையில் பயன்படுத்துங்கள்.',
          'கண்டிஷனிங்குக்குப் பிறகு எண்ணெய் அல்லது பேட்டரைப் பயன்படுத்தி ஈரப்பதத்தை மூடிவிடுங்கள்.',
          'முடிகளை மெதுவாக நீட்டுங்கள்; அதிக வெப்பத்தைத் தவிர்த்து நீளம் மற்றும் நெகிழ்ச்சியைப் பாதுகாக்குங்கள்.',
        ],
      },
      {
        title: 'மெல்லிய முடி',
        summary: 'வால்யூம் மற்றும் லிஃப்ட் முக்கியம்; எடையான பொருட்கள் முடித்தளத்தை மெலிதாக்கும்.',
        tips: [
          'எடையான கிரீம்களுக்கு பதிலாக லைட் வால்யூமிங் தயாரிப்புகளை பயன்படுத்துங்கள்.',
          'இடைவெளி கழுவல்களுக்கு ட்ரை ஷாம்பூ மூலம் வேர்களை புதுப்பிக்கலாம்.',
          'கண்டிஷனை வேர்களுக்கு அருகே வைக்காமல் மிட்லெங்க்த்களில் மட்டும் பயன்படுத்துங்கள்.',
        ],
      },
      {
        title: 'அடர்த்தியான முடி',
        summary: 'அடர்த்தியான முடிக்கு அதிக ஈரப்பதமும் மென்மைப்படுத்தலும் தேவைப்படுகிறது.',
        tips: [
          'பசுந்தன்மை கொண்ட கண்டிஷனர் மற்றும் வாரத்திற்கு ஒன்று அல்லது இரண்டு முறை ட்ரீட்மெண்ட் மாஸ்க்கைப் பயன்படுத்துங்கள்.',
          'சிதறாமல் இருப்பதற்கு ஈரமான முடியில் வைட்தூண் காம்பால் தடவுங்கள்.',
          'முடி வறண்டு கடினமாக இருந்தால் ஸ்மூத்திங் அல்லது ரிப்பேர் ட்ரீட்மெண்ட் பரிசீலிக்கவும்.',
        ],
      },
    ]
    : [
      {
        title: 'Straight hair',
        summary: 'Lightweight care works best to keep it smooth without heaviness.',
        tips: [
          'Use a gentle sulphate-free shampoo to avoid stripping natural oils.',
          'Apply a light leave-in conditioner or serum at the mid-lengths to reduce frizz.',
          'Limit heat styling and use a heat protectant when needed.',
        ],
      },
      {
        title: 'Wavy hair',
        summary: 'Focus on hydration and texture support so waves stay defined yet soft.',
        tips: [
          'Choose a hydrating shampoo and lightweight conditioner to keep waves bouncy.',
          'Use a mousse or curl cream on damp hair to encourage natural movement.',
          'Avoid over-washing so the scalp stays balanced and waves remain soft.',
        ],
      },
      {
        title: 'Curly hair',
        summary: 'Curly textures need extra moisture and gentler styling to reduce breakage.',
        tips: [
          'Wash with a moisturising formula and follow with a rich conditioner or deep treatment.',
          'Apply a curl cream on wet hair and apply gentle scrunching instead of rough towel drying.',
          'Protect curls overnight with a satin scarf or bonnet to prevent frizz.',
        ],
      },
      {
        title: 'Coily / kinky hair',
        summary: 'This hair type benefits from rich moisture and low manipulation to stay strong.',
        tips: [
          'Use a creamy cleanser or co-wash between full washes to retain moisture.',
          'Seal in hydration with oils or butters after conditioning.',
          'Stretch styles gently and avoid frequent heat to preserve length and elasticity.',
        ],
      },
      {
        title: 'Fine hair',
        summary: 'The goal is volume and lift without heavy residue that can flatten the roots.',
        tips: [
          'Use lightweight volumising products rather than rich creams.',
          'Dry shampoo can help refresh roots between washes without over-cleansing.',
          'Keep conditioner on the mid-lengths only, not right at the roots.',
        ],
      },
      {
        title: 'Thick / dense hair',
        summary: 'Thicker hair usually needs more hydration and smoothing to stay manageable.',
        tips: [
          'Use a nourishing conditioner and a treatment mask once or twice a week.',
          'Detangle with a wide-tooth comb while hair is damp to reduce breakage.',
          'Consider a smoothing or repair treatment if your hair feels dry or difficult to style.',
        ],
      },
    ]

  return (
    <section className="info-page">
      <div className="info-page-header">
        <p className="eyebrow"><span /> {language === 'ta' ? 'முடி பராமரிப்பு' : 'HAIRCARE'}</p>
        <h1>{language === 'ta' ? 'வெவ்வேறு முடி வகைகளுக்கான முடி பராமரிப்பு ஆலோசனை' : 'Haircare advice for different hair types'}</h1>
        <p>
          {language === 'ta'
            ? 'சுத்தமான, ஈரப்பதம் மற்றும் பாதுகாப்பின் சரியான சமநிலையில் ஆரோக்கியமான முடி தொடங்குகிறது. இந்த பராமரிப்புகள் உங்கள் முடி பளபளப்பாகவும், நிர்வகிக்கக்கூடியதாகவும், வலிமையாகவும் இருக்க உதவும்.'
            : 'Healthy hair starts with the right balance of cleansing, moisture and protection. These routines can help keep your hair looking fresh, manageable and strong.'}
        </p>
      </div>

      <div className="info-grid">
        {hairTypes.map(({ title, summary, tips }) => (
          <article key={title} className="info-card">
            <h2>{title}</h2>
            <p className="info-card-summary">{summary}</p>
            <ul>
              {tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

export function AboutUsPage({ language }: { language: Language }) {
  const values = language === 'ta'
    ? [
      {
        title: '20+ ஆண்டுகள் அனுபவம்',
        text: 'சுபுராஜ் சலூன் 20 ஆண்டுகளுக்கும் மேலான முடி பராமரிப்பு அனுபவத்துடன், உள்ளூர் வாடிக்கையாளர்களுக்கு நம்பகமான பராமரிப்பை வழங்கி வருகிறது.',
      },
      {
        title: 'சிறப்பாகப் பயிற்சி பெற்ற ஸ்டைலிஸ்டுகள்',
        text: 'எங்கள் குழு நிபுணத்துவம், நேர்த்தியான முடி பராமரிப்பு மற்றும் தனிப்பட்ட ஸ்டைலிங் தேவைகளைப் புரிந்துகொண்டு, ஒவ்வொருவருக்கும் பொருத்தமான தீர்வுகளை வழங்குகிறது.',
      },
      {
        title: 'நம்பிக்கை மற்றும் தனிப்பட்ட கவனம்',
        text: 'முடி வெட்டுதல் மட்டும் அல்ல; உங்கள் தோற்றம், மனநிலை மற்றும் நம்பிக்கையை உயர்த்தும் விதத்தில் நாங்கள் பராமரிக்கிறோம்.',
      },
    ]
    : [
      {
        title: '20+ years of experience',
        text: 'Suburaaj Salon has built its reputation over more than 20 years, helping local clients feel confident with salons services that are both trusted and personal.',
      },
      {
        title: 'Well-trained stylists',
        text: 'Our team brings skilled technique, thoughtful care and practical expertise to every cut, treatment and styling session.',
      },
      {
        title: 'Trust and personal attention',
        text: 'We believe great salon care is about more than a haircut. It is about comfort, confidence and a look that suits your life.',
      },
    ]

  return (
    <section className="info-page">
      <div className="info-page-header">
        <p className="eyebrow"><span /> {language === 'ta' ? 'எங்களைப் பற்றி' : 'ABOUT US'}</p>
        <h1>{language === 'ta' ? '20+ ஆண்டுகள் அனுபவம், திறமையான ஸ்டைலிஸ்டுகள்' : '20+ years of experience and expert styling'}</h1>
        <p>
          {language === 'ta'
            ? 'சுபுராஜ் சலூன், பல ஆண்டுகளாக மக்களின் முடி, தோற்றம் மற்றும் நம்பிக்கையை கவனித்து வரும் ஒரு நம்பகமான உள்ளூர் சலூன். நாங்கள் ஒவ்வொரு வாடிக்கையாளருக்கும் தனிப்பட்ட பராமரிப்பு மற்றும் சுத்தமான முடி பராமரிப்பை வழங்குகிறோம்.'
            : 'Suburaaj Salon has been caring for people’s hair, confidence and everyday look for years. We combine experience, talent and a personal approach to help every client feel their best.'}
        </p>
      </div>

      <div className="info-grid">
        {values.map(({ title, text }) => (
          <article key={title} className="info-card">
            <h2>{title}</h2>
            <p className="info-card-summary">{text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function ContactPage({ language }: { language: Language }) {
  const cards = language === 'ta'
    ? [
      {
        title: 'சந்திப்பதற்கு',
        text: 'திருநெல்வேலி பாளையங்கோட்டை பகுதியில் அமைந்துள்ள சுபுராஜ் சலூனை நேரடியாகச் சந்திக்கலாம்.',
      },
      {
        title: 'முன்பதிவு',
        text: 'சேவையைத் தேர்ந்தெடுத்து, புதுப்பித்த நேரத்தை ஆன்லைனில் முன்பதிவு செய்யலாம். அடுத்த வருகைக்கு தயாராகுங்கள்.',
      },
      {
        title: 'கேள்விகள்',
        text: 'சேவைகள், நேரம் அல்லது முடி பராமரிப்பு குறித்து ஏதேனும் கேள்விகள் இருந்தால், நேரடியாக சலூனைத் தொடர்புகொள்ளலாம்.',
      },
    ]
    : [
      {
        title: 'Visit the salon',
        text: 'Find us in Palayamkottai, Tirunelveli and visit for a consultation, styling session or routine refresh.',
      },
      {
        title: 'Book a session',
        text: 'Choose your preferred service and reserve a time directly on the website for a smooth salon visit.',
      },
      {
        title: 'Ask a question',
        text: 'If you have questions about timing, services or hair care, the team is happy to help before your visit.',
      },
    ]

  return (
    <section className="info-page">
      <div className="info-page-header">
        <p className="eyebrow"><span /> {language === 'ta' ? 'தொடர்பு கொள்ளுங்கள்' : 'CONTACT US'}</p>
        <h1>{language === 'ta' ? 'உங்கள் கேள்விகளுக்கு நாங்கள் இங்கே இருக்கிறோம்' : 'We’re here to help with your next salon visit'}</h1>
        <p>
          {language === 'ta'
            ? 'சேவை, இடம் அல்லது முன்பதிவு விவரங்கள் அனைத்தையும் நாங்கள் உதவ தயாராக இருக்கிறோம்.'
            : 'Whether you need directions, service details or help choosing the right treatment, we’re ready to help.'}
        </p>
      </div>

      <div className="info-grid">
        {cards.map(({ title, text }) => (
          <article key={title} className="info-card">
            <h2>{title}</h2>
            <p className="info-card-summary">{text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function FaqPage({ language }: { language: Language }) {
  const faqs = language === 'ta'
    ? [
      {
        question: 'எத்தனை வாரங்களுக்கு ஒருமுறை முடியை வெட்ட வேண்டும்?',
        answer: 'சிறப்பான முடிவுகளுக்கு பெரும்பாலான மக்கள் 4 முதல் 8 வாரங்களுக்கு ஒருமுறை டிரிம் எடுப்பது நல்லது. இதனால் முடியின் வடிவம் பாதுகாக்கப்பட்டு, பிளவு முனைகள் குறையும்.',
      },
      {
        question: 'சேதமடைந்த முடிக்கு சலூன் சிகிச்சைகள் உள்ளதா?',
        answer: 'ஆம், உலர்ந்த, சிக்கலான அல்லது இரசாயன சிகிச்சை செய்யப்பட்ட முடிக்கு நிவாரணம், பழுதுபார்ப்பு மற்றும் மென்மையாக்கம் செய்யும் சிகிச்சைகள் வழங்கப்படுகின்றன.',
      },
      {
        question: 'சிறப்பு நிகழ்வுகளுக்காக சேவைகளை முன்பதிவு செய்யலாமா?',
        answer: 'முற்றிலும். உங்கள் முடி வகை, விரும்பிய தோற்றம் மற்றும் நேர அட்டவணைக்கு ஏற்ப திருமணம், நிகழ்ச்சி மற்றும் ஸ்டைலிங் முன்பதிவுகளை தயார் செய்யலாம்.',
      },
      {
        question: 'சலூன் ஆலோசனையில் என்ன included ஆகும்?',
        answer: 'ஆலோசனை மூலம் உங்கள் முடியின் இலக்கு, தற்போதைய நிலை மற்றும் பொருத்தமான சேவை பற்றி புரிந்து கொள்வோம். முடி வெட்டு, நிறம், சிகிச்சை மற்றும் ஸ்டைலிங் விருப்பங்களை பரிந்துரைக்கலாம்.',
      },
      {
        question: 'எது எனக்குப் பொருத்தமான சேவை?',
        answer: 'எந்த சேவை பொருத்தமாக இருக்கும் என்பது உங்கள் முடி இலக்கு, அமைப்பு, தலைக்கு கீழே நிலை மற்றும் ஸ்டைலிங் பழக்கத்தைப் பொறுத்தது.',
      },
      {
        question: 'நிறப்பூர்வமும் ஹைலைட்களும் வழங்கப்படுகின்றனவா?',
        answer: 'ஆம். நிறத்தை புதுப்பித்தல், ஹைலைட்ஸ், ரூட் வேலை மற்றும் தனிப்பயன் முடித்தல் சேவைகள் வழங்கப்படுகின்றன. ஆலோசனை மூலம் சரியான நிறம் மற்றும் பராமரிப்பு திட்டம் தீர்மானிக்கப்படும்.',
      },
    ]
    : [
      {
        question: 'How often should I get a haircut?',
        answer:
          'Most people benefit from a trim every 4 to 8 weeks, depending on the style and how quickly the ends grow. Regular trims help keep shape, reduce split ends and support healthier growth.',
      },
      {
        question: 'Do you offer hair treatments for damaged hair?',
        answer:
          'Yes. We offer nourishment, repair and smoothing treatments that are tailored to dry, frizzy or chemically treated hair. A salon consultation can help you choose the right treatment for your hair condition.',
      },
      {
        question: 'Can I book a service for a special occasion?',
        answer:
          'Absolutely. We can prepare bridal, event and styling appointments based on your hair type, desired look and time schedule. It is best to book early for events and festive seasons.',
      },
      {
        question: 'What is included in a salon consultation?',
        answer:
          'A consultation helps us understand your hair goals, current condition and the most suitable service. We can recommend cuts, colours, treatment routines and styling options that fit your lifestyle and hair type.',
      },
      {
        question: 'How do I know which service is right for me?',
        answer:
          'The right service depends on your hair goals, texture, scalp health and styling routine. Our team can guide you based on your hair condition and the finish you want to achieve.',
      },
      {
        question: 'Do you provide colour and highlight services?',
        answer:
          'Yes. We offer colour refreshes, highlights, root work and custom finishing services. A consultation helps us choose the right shade and treatment plan for your hair.',
      },
    ]

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="info-page faq-page">
        <div className="info-page-header">
          <p className="eyebrow"><span /> {language === 'ta' ? 'அடிக்கடி கேட்கப்படும் கேள்விகள்' : 'FAQ'}</p>
          <h1>{language === 'ta' ? 'சலூன் சேவைகள் குறித்த அடிக்கடி கேட்கப்படும் கேள்விகள்' : 'Frequently asked questions about salon services'}</h1>
          <p>
            {language === 'ta'
              ? 'சலூனுக்கு அடுத்த முறை வருவதற்கு முன் நீங்கள் தெரிந்து கொள்ள வேண்டிய அனைத்தும் இங்கே உள்ளன.'
              : 'Everything you may want to know before booking your next visit at the salon.'}
          </p>
        </div>

        <div className="faq-list">
          {faqs.map(({ question, answer }) => (
            <article key={question} className="faq-item">
              <h2>{question}</h2>
              <p>{answer}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

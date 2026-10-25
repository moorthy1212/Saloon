export function HaircareAdvicePage() {
  const hairTypes = [
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
        <p className="eyebrow"><span /> HAIRCARE</p>
        <h1>Haircare advice for different hair types</h1>
        <p>
          Healthy hair starts with the right balance of cleansing, moisture and protection.
          These routines can help keep your hair looking fresh, manageable and strong.
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

export function FaqPage() {
  const faqs = [
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

  return (
    <section className="info-page faq-page">
      <div className="info-page-header">
        <p className="eyebrow"><span /> FAQ</p>
        <h1>Frequently asked questions about salon services</h1>
        <p>
          Everything you may want to know before booking your next visit at the salon.
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
  )
}

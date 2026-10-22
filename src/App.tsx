import { useEffect, useRef, useState, type FormEvent } from 'react'
import { DEFAULT_SETTINGS, isValidSchedule, type OpeningHoursEntry, type ScheduleSettings } from '../shared/schedule'
import './App.css'

const SHOP_TIME_ZONE = 'Asia/Kolkata'
const LANGUAGE_STORAGE_KEY = 'suburaaj-language'

type Language = 'en' | 'ta'
type ChatMessage = { role: 'user' | 'assistant'; content: string }
type ChatBookingStep = 'service' | 'date' | 'time' | 'name' | 'phone' | 'email' | 'confirm' | null
type AdminAppointment = {
  id: string
  slotStart: string
  name: string
  phone: string
  email?: string
  service: string
  emailNotified: boolean
}

const SERVICE_MENU = [
  { value: 'Haircut & shaving', en: 'Haircut & shaving', ta: 'முடி வெட்டுதல் மற்றும் ஷேவிங்', price: 160, offerPrice: 140 },
  { value: 'Hair dye / hair color', en: 'Hair dye / hair color', ta: 'முடி டை / கலரிங்', price: 100 },
  { value: 'Shaving', en: 'Shaving', ta: 'ஷேவிங்', price: 100, offerPrice: 80 },
  { value: 'Baby haircut', en: 'Baby haircut', ta: 'குழந்தைகள் முடி வெட்டு', price: 100 },
] as const

function ServiceIcon({ service }: { service: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      {service === 'Haircut & shaving' && (
        <>
          <path d="M18 55c2-7 1-11-3-16-3-4-4-10-2-17 2-10 10-17 21-17 8 0 14 4 16 11 2 5 0 9-4 12l-1 11-8 2-3 14" />
          <path d="M13 27c1-10 9-18 20-18 7 0 12 3 15 8-6-2-10-1-14 2-4 4-10 5-20 5m21-6c5-2 9-1 12 2l-3 5 5 3-5 3-1 5-7 2m-9-7h.2m-4 4 3 2 3-2m-6 6c3 2 6 2 9 0m-9 5c2 1 4 1 6 0m-8 7 7-2 3 5" />
          <path d="M18 18c3-5 8-8 14-8m-14 13c5 0 9-2 12-5m-4 20c1 3 3 5 6 6m7-2 5-2m-24 9 6-1" />
        </>
      )}
      {service === 'Hair dye / hair color' && (
        <>
          <path d="M15 55c3-7 2-12-2-17-4-6-3-15 1-22C18 8 26 5 34 6c9 1 15 8 15 18 0 5-2 9-5 12l-1 10-8 2-3 7" />
          <path d="M13 29c0-13 8-21 18-22 8-1 14 3 18 9-7-3-12-1-16 3-5 6-11 9-20 10m5-6c4-1 8-5 11-10m-8 17c2-2 4-3 6-3m-2 11h.2m-3 5c2 1 4 1 6 0m-13-20c-1 8 0 14 4 19m25-27c-1 6-4 10-8 13m5 6-2 5m-20 8 6-1" />
          <path d="M43 50c4 0 8 2 11 5l-2 4H39l1-5zm-1 4h12m-8-3 2-4 3 4m-32-38-4-5m7 3-1-6m28 9 5-4" />
        </>
      )}
      {service === 'Shaving' && (
        <>
          <path d="m11 43 30-28c2-2 5-2 7 0l3 3c2 2 2 5 0 7L22 52c-2 2-5 2-7 0l-4-4c-2-2-2-4 0-5Z" />
          <path d="m16 48 32-30m-36 27 7 7m27-36 6 6m-9-4 8 8" />
          <path d="m19 48 31 6c3 1 5 3 4 5l-1 2c-1 2-3 2-6 1l-30-10m4-1 30 7m-28-6 5-4m3 5 4-4m3 5 4-4m3 5 4-4" />
          <circle cx="17" cy="47" r="2" />
        </>
      )}
      {service === 'Baby haircut' && (
        <>
          <path d="M14 35c0-12 7-20 18-20s18 8 18 20-7 18-18 18-18-6-18-18Zm0 0c-5-1-7 2-6 6s4 6 8 4m34-10c5-1 7 2 6 6s-4 6-8 4" />
          <path d="M21 30c-2-5-1-10 2-13 1-5 5-7 9-5 4-3 9-1 10 4 4 2 4 8 1 13-3-5-7-7-12-7-4 0-7 3-10 8Zm3-11c3-3 8-4 13-2m-11 18h.2m12 0h.2m-9 7c2 2 5 2 7 0m-18-9-5-3m32 3 5-3m-26 18c1 2 3 3 5 4m14-4c-1 2-3 3-5 4" />
          <path d="M31 12c-1-4 1-7 4-8 2 0 3 2 2 4m-3-1 6-1m-29 32-3 4m47-4 3 4" />
        </>
      )}
    </svg>
  )
}

function getServiceLabel(value: string, language: Language) {
  const service = SERVICE_MENU.find((item) => item.value === value)
  return service ? service[language] : value
}

function formatServicePrice(value: string, language: Language = 'en') {
  const service = SERVICE_MENU.find((item) => item.value === value)
  if (!service) return ''
  if (!('offerPrice' in service)) return `₹${service.price}`
  return language === 'ta'
    ? `₹${service.offerPrice} (சலுகை; முன்பு ₹${service.price})`
    : `₹${service.offerPrice} (offer; was ₹${service.price})`
}

function isAdminAppointment(value: unknown): value is AdminAppointment {
  return typeof value === 'object' && value !== null
    && 'id' in value && typeof value.id === 'string'
    && 'slotStart' in value && typeof value.slotStart === 'string'
    && 'name' in value && typeof value.name === 'string'
    && 'phone' in value && typeof value.phone === 'string'
    && (!('email' in value) || typeof value.email === 'string')
    && 'service' in value && typeof value.service === 'string'
    && 'emailNotified' in value && typeof value.emailNotified === 'boolean'
}

const COPY = {
  en: {
    language: 'தமிழ்',
    languageLabel: 'Change language to Tamil',
    home: 'Suburaaj Salon home',
    navServices: 'Services',
    navHours: 'Opening hours',
    navAbout: 'Our approach',
    directions: 'Get directions',
    bookAppointment: 'Book an appointment',
    localSalon: 'YOUR LOCAL SALON',
    headlineFirst: 'Suburaaj Saloon',
    headlineSecond: 'in Palayamkottai.',
    heroDescription: 'Your neighbourhood salon in Palayamkottai, Tirunelveli. Visit us for a fresh haircut, styling, and a friendly welcome.',
    location: 'Palayamkottai, Tirunelveli, Tamil Nadu',
    viewServices: 'View our services',
    homeNote: 'Good hair days start with feeling at home.',
    salonImage: 'Warm, welcoming salon interior',
    openNow: 'Open now',
    closedNow: 'Closed now',
    caption: 'A calm space, made for you',
    todayAtSalon: 'Today at Suburaaj',
    localTime: 'LOCAL TIME · IST',
    experience: 'THE SUBURAAJ EXPERIENCE',
    serviceIntro: 'Thoughtful grooming. Honest prices.',
    priceListHeading: 'Our Services & Pricing',
    visit: 'COME ON BY',
    chairFirst: 'Your chair',
    chairSecond: 'is waiting.',
    visitDescription: 'Check whether we’re open before you visit. We look forward to seeing you.',
    liveStatus: 'Opening status updates automatically · India time',
    localArea: 'PALAYAMKOTTAI · TIRUNELVELI',
    openingHours: 'Opening hours',
    today: 'Today',
    closed: 'Closed',
    ist: 'IST · UTC+5:30',
    hoursFootnote: 'All times are local time in Tirunelveli (IST).',
    note: 'A NOTE FROM SUBURAAJ',
    aboutHeadingFirst: 'More than a haircut.',
    aboutHeadingSecond: 'A moment for yourself.',
    aboutDescription: 'With over 20 years of experience, we welcome you to come as you are and leave feeling a little more like yourself. That’s the Suburaaj way.',
    chatOpen: 'Chat with SURA',
    chatClose: 'Close chat',
    chatTitle: 'SURA Bot',
    chatStatus: 'Suburaaj Salon · Here to help',
    chatWelcome: 'Hi! I’m SURA, your salon assistant. Ask me about services, timings, location, or hair care.',
    chatPlaceholder: 'Type your question…',
    chatSend: 'Send',
    chatThinking: 'Thinking…',
    chatRateLimited: 'You’ve reached the chat limit. Please try again later.',
    chatBookPrompt: 'Sure, I can help you book here. Choose a service to get started. Your booking details go only to the secure booking and notification services, never to the chat AI.',
    chatChooseService: 'Which service would you like?',
    chatChooseDate: 'Choose a date for your appointment.',
    chatChooseTime: 'Choose one of the available times.',
    chatNoSlots: 'There are no available times on this date. Choose another date.',
    chatChangeDate: 'Choose another date',
    chatContinue: 'Show available times',
    chatAskName: 'What name should I put on the appointment? Your name will not be added to this chat.',
    chatAskPhone: 'What is your Indian mobile number? It will be sent only to the secure booking and notification services.',
    chatAskEmail: 'What email address should receive your booking confirmation? It will not be added to this chat.',
    chatNamePlaceholder: 'Type your name',
    chatPhonePlaceholder: 'Type your mobile number',
    chatEmailPlaceholder: 'Type your email address',
    chatConfirmPrompt: 'Please review the service and time below, then confirm your booking. Your contact details are kept private.',
    chatConfirm: 'Confirm booking',
    chatCancel: 'Cancel booking',
    chatBookingSuccess: 'Your appointment is booked for',
    chatBookingConflict: 'That time was just booked by someone else. Please choose another available time.',
    chatBookingRateLimit: 'Too many booking attempts. Please wait a few minutes before trying again.',
    chatBookingCancelled: 'Okay, I cancelled that booking. Your details were not sent.',
    chatBookingService: 'Service',
    chatBookingTime: 'Appointment time',
    chatBookingUnavailable: 'Online booking is temporarily unavailable. Please contact the salon directly.',
    chatInvalidName: 'Please enter a name between 2 and 80 characters.',
    chatInvalidPhone: 'Please enter a valid 10-digit Indian mobile number.',
    chatInvalidEmail: 'Please enter a valid email address.',
    chatPrivacy: 'Salon questions may be processed by Cloudflare Workers AI and sent to DeepSeek if needed. Booking details are submitted only to the secure booking and notification services and are never sent to chat AI.',
    chatUnavailable: 'Sorry, the assistant is unavailable right now. Please check the website for salon details.',
    chatQuickServices: 'What services and prices do you offer?',
    chatQuickHours: 'What are your opening hours?',
    chatQuickExperience: 'How much experience do you have?',
    brandTagline: 'Good hair days, made together.',
    mapTitle: 'Suburaaj salon location map',
    mapSalon: 'Suburaaj Salon · Palayamkottai',
    mapAddress: 'Tirunelveli, Tamil Nadu 627002',
    mapLink: 'Open in Google Maps',
    backToTop: 'Back to top ↑',
    rights: 'All rights reserved.',
    adminAccess: 'ADMIN ACCESS',
    manageTimings: 'Manage shop timings',
    username: 'Username',
    password: 'Password',
    enterPassword: 'Enter password',
    login: 'Log in',
    adminPanel: 'ADMIN PANEL',
    updateTimings: 'Update timings & holidays',
    scheduleInstructions: 'Set the salon’s local opening and closing times for each day. Mark a day closed when the salon is not open.',
    backToWebsite: 'Back to website',
    open: 'Open',
    holidayDates: 'Holiday closure dates',
    addHoliday: 'Add holiday',
    reset: 'Reset',
    saveChanges: 'Save changes',
    scheduleSaveError: 'Could not save the schedule. Check opening and closing times and try again.',
    scheduleInvalidHours: 'Each opening time must be earlier than its closing time.',
    scheduleSaving: 'Saving schedule…',
    scheduleSaved: 'Opening hours and holidays saved.',
    resetScheduleConfirm: 'Restore the default weekly hours and holiday dates? This will replace your current schedule.',
    holidayDatePast: 'Choose today or a future date for a holiday closure.',
    invalidLogin: 'Invalid admin username or password.',
    loginRateLimited: 'Too many login attempts. Try again later.',
    loginUnavailable: 'Unable to sign in right now. Please check the site configuration and try again.',
    logoutUnavailable: 'Could not end the admin session. Please try again before leaving this page.',
    pageViews: 'Page views',
    saveSuccess: 'Changes saved successfully.',
    saveFailed: 'Could not save changes. Please sign in again and retry.',
    appointmentHeading: 'Make an appointment',
    appointmentIntro: 'Choose an available one-hour slot and provide an email address for your confirmation. Your appointment is reserved as soon as you submit the form.',
    appointmentName: 'Full name',
    appointmentPhone: 'Mobile number',
    appointmentEmail: 'Email address for confirmation',
    appointmentService: 'Service',
    appointmentDate: 'Date',
    appointmentTime: 'Available time',
    appointmentSelectTime: 'Select an available time',
    appointmentNoSlots: 'No appointment times are available for this date. Choose another date.',
    appointmentSubmit: 'Reserve appointment',
    appointmentSubmitting: 'Reserving…',
    appointmentSuccess: 'Your appointment is booked and confirmation emails were sent to you and the salon.',
    appointmentSuccessNotificationPending: 'Your appointment is booked, but confirmation emails could not be sent. Please contact the salon to verify it.',
    appointmentFailure: 'We could not complete the booking. Please review your details and try again.',
    appointmentUnavailable: 'Booking is temporarily unavailable. Please contact the salon directly.',
    appointmentPreviewUnavailable: 'Appointment APIs do not run in the Vite preview. Start the Cloudflare Pages local runtime with “npm run dev:pages”.',
    appointmentNotConfigured: 'Online booking has not been configured for this site yet. Please contact the salon directly.',
    appointmentPrivacy: 'Your name, phone number, and email are encrypted in Cloudflare D1. To send confirmations, the required details are securely sent to Brevo. Only the signed-in salon admin can view stored bookings. Your details are never sent to chat AI.',
    appointments: 'Appointments',
    appointmentsLoading: 'Loading appointments…',
    noAppointments: 'No appointments have been booked.',
    appointmentsUnavailable: 'Could not load appointments. Please refresh or sign in again.',
    appointmentNotificationsOnHold: 'Pending email confirmations can be retried here.',
    appointmentEmailMissing: 'Email address unavailable',
    appointmentEmailSent: 'Confirmation emails sent',
    appointmentEmailPending: 'Confirmation email pending',
    retryAppointmentEmail: 'Retry email',
    appointmentEmailRetried: 'Confirmation emails sent.',
    editAppointment: 'Change time',
    cancelAppointment: 'Cancel appointment',
    closeAppointmentEdit: 'Stop editing',
    saveAppointmentChange: 'Save new time',
    appointmentChangeSaved: 'Appointment time updated.',
    appointmentChangeNotificationPending: 'Appointment time updated, but confirmation emails could not be sent yet.',
    appointmentCancelConfirm: 'Cancel this appointment? Its time slot will become available again.',
    appointmentCancelSaved: 'Appointment cancelled.',
    appointmentActionFailed: 'Could not update this appointment. Refresh and try again.',
    appointmentTimeUnavailable: 'That time is no longer available. Choose another time.',
    appointmentActionLoading: 'Saving…',
  },
  ta: {
    language: 'English',
    languageLabel: 'Change language to English',
    home: 'சுபுராஜ் சலூன் முகப்பு',
    navServices: 'சேவைகள்',
    navHours: 'திறந்திருக்கும் நேரம்',
    navAbout: 'எங்களைப் பற்றி',
    directions: 'வழியைப் பார்க்க',
    bookAppointment: 'முன்பதிவு செய்யுங்கள்',
    localSalon: 'உங்கள் அருகிலுள்ள சலூன்',
    headlineFirst: 'அழகான முடி.',
    headlineSecond: 'மகிழ்ச்சியான மனம்.',
    heroDescription: 'திருநெல்வேலி பாளையங்கோட்டையில் உள்ள உங்கள் அருகிலுள்ள சலூன். முடி வெட்டுதல், ஸ்டைலிங் மற்றும் அன்பான வரவேற்புக்கு வாருங்கள்.',
    location: 'பாளையங்கோட்டை, திருநெல்வேலி, தமிழ்நாடு',
    viewServices: 'எங்கள் சேவைகள்',
    homeNote: 'உங்கள் மனதிற்கு நெருக்கமான இடத்தில் அழகான முடி.',
    salonImage: 'அன்பான வரவேற்புடன் கூடிய சலூன்',
    openNow: 'இப்போது திறந்துள்ளது',
    closedNow: 'இப்போது மூடியுள்ளது',
    caption: 'உங்களுக்கான அமைதியான இடம்',
    todayAtSalon: 'இன்று சுபுராஜில்',
    localTime: 'உள்ளூர் நேரம் · IST',
    experience: 'சுபுராஜ் அனுபவம்',
    serviceIntro: 'அக்கறையான பராமரிப்பு. நேர்மையான விலைகள்.',
    priceListHeading: 'எங்கள் சேவைகள் மற்றும் விலைகள்',
    visit: 'வாருங்கள்',
    chairFirst: 'உங்களுக்கான இருக்கை',
    chairSecond: 'காத்திருக்கிறது.',
    visitDescription: 'வரும் முன் நாங்கள் திறந்துள்ளோமா என்று பாருங்கள். உங்களைச் சந்திக்க ஆவலாக இருக்கிறோம்.',
    liveStatus: 'கடை திறந்திருக்கும் நிலை தானாகவே புதுப்பிக்கப்படும் · இந்திய நேரம்',
    localArea: 'பாளையங்கோட்டை · திருநெல்வேலி',
    openingHours: 'திறந்திருக்கும் நேரம்',
    today: 'இன்று',
    closed: 'மூடியுள்ளது',
    ist: 'IST · UTC+5:30',
    hoursFootnote: 'அனைத்து நேரங்களும் திருநெல்வேலி உள்ளூர் நேரம் (IST).',
    note: 'சுபுராஜிடமிருந்து ஒரு குறிப்பு',
    aboutHeadingFirst: 'முடி வெட்டுதலை விட மேலானது.',
    aboutHeadingSecond: 'உங்களுக்கான ஒரு சிறிய இடைவேளை.',
    aboutDescription: '20 ஆண்டுகளுக்கும் மேலான அனுபவத்துடன், நீங்கள் நீங்களாகவே வாருங்கள். இன்னும் நம்பிக்கையுடன் திரும்பிச் செல்லுங்கள். இதுவே சுபுராஜ் வழி.',
    chatOpen: 'SURA-விடம் கேளுங்கள்',
    chatClose: 'உரையாடலை மூடு',
    chatTitle: 'SURA Bot',
    chatStatus: 'சுபுராஜ் சலூன் · உதவ தயார்',
    chatWelcome: 'வணக்கம்! நான் SURA, உங்கள் சலூன் உதவியாளர். சேவைகள், நேரம், இடம் அல்லது முடி பராமரிப்பு பற்றி கேளுங்கள்.',
    chatPlaceholder: 'உங்கள் கேள்வியை எழுதுங்கள்…',
    chatSend: 'அனுப்பு',
    chatThinking: 'பதிலளிக்கிறது…',
    chatRateLimited: 'உரையாடல் வரம்பை எட்டிவிட்டீர்கள். பின்னர் மீண்டும் முயற்சிக்கவும்.',
    chatBookPrompt: 'நிச்சயமாக, இங்கேயே முன்பதிவு செய்ய உதவுகிறேன். முதலில் ஒரு சேவையைத் தேர்வு செய்யுங்கள். உங்கள் முன்பதிவு விவரங்கள் பாதுகாப்பான முன்பதிவு மற்றும் அறிவிப்பு சேவைகளுக்கு மட்டுமே அனுப்பப்படும்; உரையாடல் AI-க்கு அனுப்பப்படாது.',
    chatChooseService: 'எந்த சேவையை விரும்புகிறீர்கள்?',
    chatChooseDate: 'முன்பதிவு செய்ய வேண்டிய தேதியைத் தேர்வு செய்யுங்கள்.',
    chatChooseTime: 'கிடைக்கும் நேரங்களில் ஒன்றைத் தேர்வு செய்யுங்கள்.',
    chatNoSlots: 'இந்தத் தேதியில் நேரங்கள் இல்லை. வேறு தேதியைத் தேர்வு செய்யுங்கள்.',
    chatChangeDate: 'வேறு தேதியைத் தேர்வு செய்யுங்கள்',
    chatContinue: 'கிடைக்கும் நேரங்களைக் காட்டு',
    chatAskName: 'முன்பதிவில் எந்தப் பெயரைச் சேர்க்க வேண்டும்? உங்கள் பெயர் இந்த உரையாடலில் சேர்க்கப்படாது.',
    chatAskPhone: 'உங்கள் இந்திய கைபேசி எண்ணை உள்ளிடுங்கள். அது பாதுகாப்பான முன்பதிவு மற்றும் அறிவிப்பு சேவைகளுக்கு மட்டுமே அனுப்பப்படும்.',
    chatAskEmail: 'முன்பதிவு உறுதிப்படுத்தலைப் பெற வேண்டிய மின்னஞ்சல் முகவரியை உள்ளிடுங்கள். அது இந்த உரையாடலில் சேர்க்கப்படாது.',
    chatNamePlaceholder: 'உங்கள் பெயரை எழுதுங்கள்',
    chatPhonePlaceholder: 'உங்கள் கைபேசி எண்ணை எழுதுங்கள்',
    chatEmailPlaceholder: 'உங்கள் மின்னஞ்சல் முகவரியை எழுதுங்கள்',
    chatConfirmPrompt: 'கீழே உள்ள சேவையையும் நேரத்தையும் சரிபார்த்து முன்பதிவை உறுதிசெய்யுங்கள். உங்கள் தொடர்பு விவரங்கள் தனிப்பட்டதாகப் பாதுகாக்கப்படும்.',
    chatConfirm: 'முன்பதிவை உறுதிசெய்',
    chatCancel: 'முன்பதிவை ரத்துசெய்',
    chatBookingSuccess: 'உங்கள் முன்பதிவு செய்யப்பட்டது:',
    chatBookingConflict: 'அந்த நேரம் வேறொருவரால் முன்பதிவு செய்யப்பட்டது. கிடைக்கும் வேறு நேரத்தைத் தேர்வு செய்யுங்கள்.',
    chatBookingRateLimit: 'பலமுறை முயற்சித்துள்ளீர்கள். சில நிமிடங்கள் கழித்து மீண்டும் முயற்சிக்கவும்.',
    chatBookingCancelled: 'சரி, முன்பதிவை ரத்துசெய்துவிட்டேன். உங்கள் விவரங்கள் அனுப்பப்படவில்லை.',
    chatBookingService: 'சேவை',
    chatBookingTime: 'முன்பதிவு நேரம்',
    chatBookingUnavailable: 'இணைய முன்பதிவு தற்காலிகமாகக் கிடைக்கவில்லை. சலூனை நேரடியாகத் தொடர்புகொள்ளவும்.',
    chatInvalidName: '2 முதல் 80 எழுத்துகளுக்குள் உங்கள் பெயரை உள்ளிடுங்கள்.',
    chatInvalidPhone: 'சரியான 10 இலக்க இந்திய கைபேசி எண்ணை உள்ளிடுங்கள்.',
    chatInvalidEmail: 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடுங்கள்.',
    chatPrivacy: 'சலூன் தொடர்பான கேள்விகள் Cloudflare Workers AI மூலம் செயலாக்கப்படலாம்; தேவைப்பட்டால் DeepSeek-க்கும் அனுப்பப்படலாம். முன்பதிவு விவரங்கள் பாதுகாப்பான முன்பதிவு மற்றும் அறிவிப்பு சேவைகளுக்கு மட்டுமே அனுப்பப்படும்; உரையாடல் AI-க்கு அனுப்பப்படாது.',
    chatUnavailable: 'மன்னிக்கவும், உதவியாளர் இப்போது கிடைக்கவில்லை. சலூன் விவரங்களுக்கு இணையதளத்தைப் பார்க்கவும்.',
    chatQuickServices: 'என்ன சேவைகள் மற்றும் விலைகள் உள்ளன?',
    chatQuickHours: 'திறந்திருக்கும் நேரம் என்ன?',
    chatQuickExperience: 'எத்தனை ஆண்டுகள் அனுபவம் உள்ளது?',
    brandTagline: 'அழகான முடி நாட்களை ஒன்றாக உருவாக்குவோம்.',
    mapTitle: 'சுபுராஜ் சலூன் அமைவிட வரைபடம்',
    mapSalon: 'சுபுராஜ் சலூன் · பாளையங்கோட்டை',
    mapAddress: 'திருநெல்வேலி, தமிழ்நாடு 627002',
    mapLink: 'கூகுள் மேப்ஸில் திறக்கவும்',
    backToTop: 'மேலே செல்ல ↑',
    rights: 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
    adminAccess: 'நிர்வாக அணுகல்',
    manageTimings: 'கடை நேரத்தை நிர்வகிக்கவும்',
    username: 'பயனர் பெயர்',
    password: 'கடவுச்சொல்',
    enterPassword: 'கடவுச்சொல்லை உள்ளிடவும்',
    login: 'உள்நுழைக',
    adminPanel: 'நிர்வாகப் பலகை',
    updateTimings: 'நேரம் மற்றும் விடுமுறைகளை மாற்றவும்',
    scheduleInstructions: 'ஒவ்வொரு நாளுக்கும் சலூனின் உள்ளூர் திறக்கும் மற்றும் மூடும் நேரங்களை அமைக்கவும். கடை திறக்காத நாளை மூடியதாகக் குறிக்கவும்.',
    backToWebsite: 'தளத்திற்குத் திரும்பு',
    open: 'திறக்கும் நேரம்',
    holidayDates: 'விடுமுறை நாட்கள்',
    addHoliday: 'விடுமுறையைச் சேர்க்கவும்',
    reset: 'மீட்டமை',
    saveChanges: 'மாற்றங்களைச் சேமிக்கவும்',
    scheduleSaveError: 'அட்டவணையைச் சேமிக்க முடியவில்லை. திறக்கும் மற்றும் மூடும் நேரங்களைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',
    scheduleInvalidHours: 'ஒவ்வொரு நாளிலும் திறக்கும் நேரம் மூடும் நேரத்திற்கு முன்பாக இருக்க வேண்டும்.',
    scheduleSaving: 'அட்டவணை சேமிக்கப்படுகிறது…',
    scheduleSaved: 'கடை நேரமும் விடுமுறை நாட்களும் சேமிக்கப்பட்டன.',
    resetScheduleConfirm: 'இயல்புநிலை வார நேரங்களையும் விடுமுறை நாட்களையும் மீட்டமைக்கவா? தற்போதைய அட்டவணை மாற்றப்படும்.',
    holidayDatePast: 'இன்றைய அல்லது எதிர்கால விடுமுறை தேதியைத் தேர்வு செய்யுங்கள்.',
    invalidLogin: 'பயனர் பெயர் அல்லது கடவுச்சொல் தவறு.',
    loginRateLimited: 'பலமுறை உள்நுழைய முயற்சித்துள்ளீர்கள். சிறிது நேரம் கழித்து முயற்சிக்கவும்.',
    loginUnavailable: 'இப்போது உள்நுழைய முடியவில்லை. தள அமைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',
    logoutUnavailable: 'நிர்வாக அமர்வை முடிக்க முடியவில்லை. இந்தப் பக்கத்தை விட்டு வெளியேறுவதற்கு முன் மீண்டும் முயற்சிக்கவும்.',
    pageViews: 'பக்கப் பார்வைகள்',
    saveSuccess: 'மாற்றங்கள் வெற்றிகரமாகச் சேமிக்கப்பட்டன.',
    saveFailed: 'மாற்றங்களைச் சேமிக்க முடியவில்லை. மீண்டும் உள்நுழைந்து முயற்சிக்கவும்.',
    appointmentHeading: 'முன்பதிவு செய்யுங்கள்',
    appointmentIntro: 'உறுதிப்படுத்தலுக்கான மின்னஞ்சல் முகவரியுடன் கிடைக்கும் ஒரு மணி நேரத்தைத் தேர்வு செய்யுங்கள். படிவத்தைச் சமர்ப்பித்ததும் உங்கள் நேரம் முன்பதிவு செய்யப்படும்.',
    appointmentName: 'முழுப் பெயர்',
    appointmentPhone: 'கைபேசி எண்',
    appointmentEmail: 'உறுதிப்படுத்தலுக்கான மின்னஞ்சல் முகவரி',
    appointmentService: 'சேவை',
    appointmentDate: 'தேதி',
    appointmentTime: 'கிடைக்கும் நேரம்',
    appointmentSelectTime: 'கிடைக்கும் நேரத்தைத் தேர்வு செய்யுங்கள்',
    appointmentNoSlots: 'இந்தத் தேதியில் நேரங்கள் இல்லை. வேறு தேதியைத் தேர்வு செய்யுங்கள்.',
    appointmentSubmit: 'முன்பதிவை உறுதிசெய்',
    appointmentSubmitting: 'முன்பதிவு செய்கிறது…',
    appointmentSuccess: 'உங்கள் முன்பதிவு செய்யப்பட்டது; உங்களுக்கும் சலூனுக்கும் உறுதிப்படுத்தல் மின்னஞ்சல்கள் அனுப்பப்பட்டன.',
    appointmentSuccessNotificationPending: 'உங்கள் முன்பதிவு செய்யப்பட்டது; உறுதிப்படுத்தல் மின்னஞ்சல்களை அனுப்ப முடியவில்லை. முன்பதிவை உறுதிசெய்ய சலூனைத் தொடர்புகொள்ளுங்கள்.',
    appointmentFailure: 'முன்பதிவை முடிக்க முடியவில்லை. விவரங்களைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',
    appointmentUnavailable: 'முன்பதிவு தற்காலிகமாகக் கிடைக்கவில்லை. சலூனை நேரடியாகத் தொடர்புகொள்ளவும்.',
    appointmentPreviewUnavailable: 'Vite முன்னோட்டத்தில் முன்பதிவு API இயங்காது. “npm run dev:pages” மூலம் Cloudflare Pages உள்ளூர் இயக்கத்தைத் தொடங்கவும்.',
    appointmentNotConfigured: 'இந்தத் தளத்தில் இணைய முன்பதிவு இன்னும் அமைக்கப்படவில்லை. சலூனை நேரடியாகத் தொடர்புகொள்ளவும்.',
    appointmentPrivacy: 'உங்கள் பெயர், கைபேசி எண், மின்னஞ்சல் ஆகியவை Cloudflare D1-ல் குறியாக்கம் செய்யப்படும். உறுதிப்படுத்தலை அனுப்ப தேவையான விவரங்கள் Brevo-க்கு பாதுகாப்பாக அனுப்பப்படும். சேமிக்கப்பட்ட முன்பதிவுகளை உள்நுழைந்த சலூன் நிர்வாகி மட்டுமே பார்க்க முடியும். உங்கள் விவரங்கள் உரையாடல் AI-க்கு அனுப்பப்படாது.',
    appointments: 'முன்பதிவுகள்',
    appointmentsLoading: 'முன்பதிவுகள் ஏற்றப்படுகின்றன…',
    noAppointments: 'முன்பதிவுகள் எதுவும் இல்லை.',
    appointmentsUnavailable: 'முன்பதிவுகளை ஏற்ற முடியவில்லை. மீண்டும் ஏற்றவும் அல்லது உள்நுழையவும்.',
    appointmentNotificationsOnHold: 'நிலுவையிலுள்ள உறுதிப்படுத்தல் மின்னஞ்சல்களை இங்கே மீண்டும் அனுப்பலாம்.',
    appointmentEmailMissing: 'மின்னஞ்சல் முகவரி இல்லை',
    appointmentEmailSent: 'உறுதிப்படுத்தல் மின்னஞ்சல்கள் அனுப்பப்பட்டன',
    appointmentEmailPending: 'உறுதிப்படுத்தல் மின்னஞ்சல் நிலுவையில் உள்ளது',
    retryAppointmentEmail: 'மின்னஞ்சலை மீண்டும் அனுப்பு',
    appointmentEmailRetried: 'உறுதிப்படுத்தல் மின்னஞ்சல்கள் அனுப்பப்பட்டன.',
    appointmentChangeNotificationPending: 'முன்பதிவு நேரம் மாற்றப்பட்டது; உறுதிப்படுத்தல் மின்னஞ்சல்களை இப்போது அனுப்ப முடியவில்லை.',
    editAppointment: 'நேரத்தை மாற்று',
    cancelAppointment: 'முன்பதிவை ரத்துசெய்',
    closeAppointmentEdit: 'மாற்றத்தை நிறுத்து',
    saveAppointmentChange: 'புதிய நேரத்தைச் சேமி',
    appointmentChangeSaved: 'முன்பதிவு நேரம் மாற்றப்பட்டது.',
    appointmentCancelConfirm: 'இந்த முன்பதிவை ரத்துசெய்யவா? அந்த நேரம் மீண்டும் கிடைக்கும்.',
    appointmentCancelSaved: 'முன்பதிவு ரத்துசெய்யப்பட்டது.',
    appointmentActionFailed: 'முன்பதிவை மாற்ற முடியவில்லை. புதுப்பித்து மீண்டும் முயற்சிக்கவும்.',
    appointmentTimeUnavailable: 'அந்த நேரம் இனி கிடைக்கவில்லை. வேறு நேரத்தைத் தேர்வு செய்யுங்கள்.',
    appointmentActionLoading: 'சேமிக்கிறது…',
  },
} as const

const DAY_NAMES: Record<Language, string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ta: ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'],
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

function getLocalDateKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

function formatScheduleTime(time: string) {
  const [hourText, minute] = time.split(':')
  const hour = Number(hourText)
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`
}

function formatHoursRange(open: string | null, close: string | null, closedLabel = 'Closed') {
  if (!open || !close) {
    return closedLabel
  }
  return `${formatScheduleTime(open)} – ${formatScheduleTime(close)}`
}

function formatAppointmentDateTime(slotStart: string, language: Language) {
  const appointmentDate = new Date(`${slotStart}:00+05:30`)
  return new Intl.DateTimeFormat(language === 'ta' ? 'ta-IN' : 'en-IN', {
    timeZone: SHOP_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(appointmentDate)
}

function getChatFaqAnswer(question: string, settings: ScheduleSettings, now: Date, language: Language) {
  const normalizedQuestion = question.toLowerCase()

  if (/hello|hi\b|hey\b|வணக்கம்|ஹலோ/.test(normalizedQuestion)) {
    return language === 'ta'
      ? 'வணக்கம்! எங்கள் சலூன் பற்றி என்ன தெரிந்துகொள்ள விரும்புகிறீர்கள்?'
      : 'Hello! What would you like to know about our salon?'
  }

  if (/experience|years|long have|அனுபவம்|வருடம்/.test(normalizedQuestion)) {
    return language === 'ta'
      ? 'சுபுராஜ் சலூனுக்கு 20 ஆண்டுகளுக்கும் மேலான அனுபவம் உள்ளது.'
      : 'Suburaaj Salon has over 20 years of experience.'
  }

  if (/where|location|address|direction|எங்கே|முகவரி|இடம்/.test(normalizedQuestion)) {
    return language === 'ta'
      ? 'நாங்கள் பாளையங்கோட்டை, திருநெல்வேலி, தமிழ்நாடு 627002-ல் உள்ளோம். வழியைப் பார்க்க இணையதளத்தின் கூகுள் மேப்ஸ் இணைப்பைப் பயன்படுத்துங்கள்.'
      : 'We are in Palayamkottai, Tirunelveli, Tamil Nadu 627002. Use the Google Maps link on the website for directions.'
  }

  if (/service|what do you|offer|price|cost|rate|how much|hair\s?cut|shav|facial|dye|color|colour|massage|சேவை|விலை|எவ்வளவு|வெட்ட|ஷேவிங்|ஃபேஷியல்|மசாஜ்/.test(normalizedQuestion)) {
    const priceList = SERVICE_MENU.map((service) => (
      `${service[language]} — ${formatServicePrice(service.value, language)}`
    )).join('\n')
    return language === 'ta'
      ? `எங்கள் சேவைகள் மற்றும் விலைகள்:\n${priceList}`
      : `Our services and prices:\n${priceList}`
  }

  if (/hour|open|close|timing|today|நேரம்|திறந்திரு|மூடிய|திறப்ப|மூட/.test(normalizedQuestion)) {
    const shopStatus = getShopStatus(now, settings.hours, settings.holidays, language)
    const todayLabel = language === 'ta' ? 'இன்றைய நிலை' : 'Today'
    const openLabel = shopStatus.isOpen
      ? language === 'ta' ? 'திறந்துள்ளது' : 'Open'
      : language === 'ta' ? 'மூடியுள்ளது' : 'Closed'
    const dailyHours = settings.hours.map((entry, index) => (
      `${DAY_NAMES[language][index]}: ${formatHoursRange(entry.open, entry.close, language === 'ta' ? 'மூடியுள்ளது' : 'Closed')}`
    )).join('\n')

    return `${todayLabel}: ${openLabel} · ${shopStatus.message}\n${dailyHours}`
  }

  return null
}

function findNextOpenDay(openingHours: OpeningHoursEntry[], startIndex: number) {
  for (let offset = 1; offset <= openingHours.length; offset += 1) {
    const nextIndex = (startIndex + offset) % openingHours.length
    const nextHours = openingHours[nextIndex]
    if (nextHours.open && nextHours.close) {
      return {
        nextIndex,
        nextHours,
        offset,
      }
    }
  }

  return {
    nextIndex: startIndex,
    nextHours: openingHours[startIndex],
    offset: 0,
  }
}

function getShopStatus(now: Date, openingHours: OpeningHoursEntry[], holidayDates: string[], language: Language) {
  const timeParts = new Intl.DateTimeFormat('en-IN', {
    timeZone: SHOP_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const parts = Object.fromEntries(timeParts.map(({ type, value }) => [type, value]))
  const todayIndex = WEEKDAY_INDEX[parts.weekday]
  const currentMinutes = Number(parts.hour) * 60 + Number(parts.minute)
  const todayHours = openingHours[todayIndex]
  const holidayKey = getLocalDateKey(now, SHOP_TIME_ZONE)

  if (holidayDates.includes(holidayKey)) {
    const { nextIndex, nextHours, offset } = findNextOpenDay(openingHours, todayIndex)
    const nextOpenTime = nextHours.open
    const reopenLabel = offset === 1
      ? language === 'ta' ? 'நாளை' : 'tomorrow'
      : DAY_NAMES[language][nextIndex]

    return {
      isOpen: false,
      todayIndex,
      message: nextOpenTime
        ? language === 'ta'
          ? `விடுமுறைக்காக மூடியுள்ளது · ${reopenLabel} ${formatScheduleTime(nextOpenTime)} மணிக்கு திறக்கும்`
          : `Closed for holiday · Opens ${reopenLabel} at ${formatScheduleTime(nextOpenTime)}`
        : language === 'ta'
          ? `விடுமுறைக்காக மூடியுள்ளது · மீண்டும் ${reopenLabel} திறக்கும்`
          : `Closed for holiday · Reopens ${reopenLabel}`,
    }
  }

  let nextOpenDayOffset = 0
  let nextOpenHours = todayHours

  if (todayHours.open && todayHours.close) {
    const [openHour, openMinute] = todayHours.open.split(':').map(Number)
    const [closeHour, closeMinute] = todayHours.close.split(':').map(Number)
    const opensAt = openHour * 60 + openMinute
    const closesAt = closeHour * 60 + closeMinute

    if (currentMinutes >= opensAt && currentMinutes < closesAt) {
      return {
        isOpen: true,
        todayIndex,
        message: language === 'ta'
          ? `இன்று திறந்துள்ளது · ${formatScheduleTime(todayHours.close)} மணிக்கு மூடும்`
          : `Open today · Closes at ${formatScheduleTime(todayHours.close)}`,
      }
    }

    if (currentMinutes < opensAt) {
      return {
        isOpen: false,
        todayIndex,
        message: language === 'ta'
          ? `இப்போது மூடியுள்ளது · இன்று ${formatScheduleTime(todayHours.open)} மணிக்கு திறக்கும்`
          : `Closed now · Opens today at ${formatScheduleTime(todayHours.open)}`,
      }
    }
  }

  const nextOpen = findNextOpenDay(openingHours, todayIndex)
  nextOpenDayOffset = nextOpen.offset
  nextOpenHours = nextOpen.nextHours

  const nextOpenDayIndex = (todayIndex + nextOpenDayOffset) % openingHours.length
  const reopensWhen = nextOpenDayOffset === 1
    ? language === 'ta' ? 'நாளை' : 'tomorrow'
    : DAY_NAMES[language][nextOpenDayIndex]

  return {
    isOpen: false,
    todayIndex,
    message: nextOpenHours.open
      ? language === 'ta'
        ? `இப்போது மூடியுள்ளது · ${reopensWhen} ${formatScheduleTime(nextOpenHours.open)} மணிக்கு திறக்கும்`
        : `Closed now · Opens ${reopensWhen} at ${formatScheduleTime(nextOpenHours.open)}`
      : language === 'ta'
        ? `இப்போது மூடியுள்ளது · ${reopensWhen} திறக்கும்`
        : `Closed now · Opens ${reopensWhen}`,
  }
}

function ScissorsIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="8" cy="8" r="4" />
      <circle cx="8" cy="24" r="4" />
      <path d="m11 11 17 17M11 21 28 4M14 16l8 0" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h12M10 4l6 6-6 6" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function App() {
  const [now, setNow] = useState(() => new Date())
  const [language, setLanguage] = useState<Language>(() => (
    window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'ta' ? 'ta' : 'en'
  ))
  const [settings, setSettings] = useState<ScheduleSettings>(DEFAULT_SETTINGS)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [adminUser, setAdminUser] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [pageViews, setPageViews] = useState<number | null>(null)
  const [draftHours, setDraftHours] = useState<OpeningHoursEntry[]>(settings.hours)
  const [draftHoliday, setDraftHoliday] = useState('')
  const [draftHolidays, setDraftHolidays] = useState<string[]>(settings.holidays)
  const [isScheduleSaving, setIsScheduleSaving] = useState(false)
  const [scheduleError, setScheduleError] = useState('')
  const [scheduleMessage, setScheduleMessage] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatQuestion, setChatQuestion] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [chatBookingStep, setChatBookingStep] = useState<ChatBookingStep>(null)
  const [appointmentDate, setAppointmentDate] = useState(() => getLocalDateKey(new Date(), SHOP_TIME_ZONE))
  const [appointmentTime, setAppointmentTime] = useState('')
  const [appointmentSlots, setAppointmentSlots] = useState<string[]>([])
  const [appointmentRefresh, setAppointmentRefresh] = useState(0)
  const [appointmentName, setAppointmentName] = useState('')
  const [appointmentPhone, setAppointmentPhone] = useState('')
  const [appointmentEmail, setAppointmentEmail] = useState('')
  const [appointmentService, setAppointmentService] = useState('')
  const [isAppointmentLoading, setIsAppointmentLoading] = useState(true)
  const [isAppointmentSubmitting, setIsAppointmentSubmitting] = useState(false)
  const [appointmentError, setAppointmentError] = useState('')
  const [appointmentBooked, setAppointmentBooked] = useState(false)
  const [appointments, setAppointments] = useState<AdminAppointment[]>([])
  const [appointmentsError, setAppointmentsError] = useState(false)
  const [isAdminAppointmentsLoading, setIsAdminAppointmentsLoading] = useState(true)
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null)
  const [adminEditDate, setAdminEditDate] = useState('')
  const [adminEditTime, setAdminEditTime] = useState('')
  const [adminEditSlots, setAdminEditSlots] = useState<string[]>([])
  const [isAdminEditSlotsLoading, setIsAdminEditSlotsLoading] = useState(false)
  const [appointmentActionError, setAppointmentActionError] = useState('')
  const [appointmentActionMessage, setAppointmentActionMessage] = useState('')
  const [appointmentActionId, setAppointmentActionId] = useState<string | null>(null)
  const [isAdminLoggingOut, setIsAdminLoggingOut] = useState(false)
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null)
  const recordedVisit = useRef(false)

  const text = COPY[language]
  const isAdminRoute = window.location.pathname.replace(/\/+$/, '') === '/admin'
  const isAppointmentRoute = window.location.pathname.replace(/\/+$/, '') === '/appointment'
  const status = getShopStatus(now, settings.hours, settings.holidays, language)

  useEffect(() => {
    fetch('/api/settings')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ settings: storedSettings }: { settings: ScheduleSettings }) => {
        setSettings(storedSettings)
        setDraftHours(storedSettings.hours)
        setDraftHolidays(storedSettings.holidays)
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (isAdminRoute) return
    if (recordedVisit.current) return
    recordedVisit.current = true

    fetch('/api/visit', { method: 'POST' })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ pageViews: count }: { pageViews: number }) => setPageViews(count))
      .catch(() => undefined)
  }, [isAdminRoute])

  useEffect(() => {
    if (!isAdminRoute) return
    fetch('/api/admin/session')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ authenticated }: { authenticated: boolean }) => {
        setIsAdminLoggedIn(authenticated)
        if (authenticated) setIsAdminAppointmentsLoading(true)
      })
      .catch(() => setIsAdminLoggedIn(false))
  }, [isAdminRoute])

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    document.documentElement.lang = language === 'ta' ? 'ta' : 'en-IN'
  }, [language])

  useEffect(() => {
    document.title = isAdminRoute
      ? 'Admin | Suburaaj Salon'
      : isAppointmentRoute
        ? 'Book an appointment | Suburaaj Salon'
        : 'Suburaaj Saloon | Subu Salon in Palayamkottai, Tirunelveli'
    document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.setAttribute(
      'content',
      isAdminRoute || isAppointmentRoute ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    )
  }, [isAdminRoute, isAppointmentRoute])

  useEffect(() => {
    if (!isAppointmentRoute && chatBookingStep !== 'time') return
    let cancelled = false
    fetch(`/api/appointments?date=${encodeURIComponent(appointmentDate)}`)
      .then(async (response) => {
        if (!response.headers.get('content-type')?.includes('application/json')) {
          throw new Error('vite-preview')
        }
        const result: unknown = await response.json()
        if (response.status === 503) throw new Error('booking-not-configured')
        if (!response.ok || !result || typeof result !== 'object' || !('slots' in result) || !Array.isArray(result.slots)) {
          throw new Error('Appointment slots could not be loaded.')
        }
        return result.slots.filter((slot): slot is string => typeof slot === 'string')
      })
      .then((slots) => {
        if (!cancelled) setAppointmentSlots(slots)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error('Appointment slots could not be loaded.', error)
          setAppointmentSlots([])
          setAppointmentError(
            error instanceof Error && error.message === 'vite-preview'
              ? text.appointmentPreviewUnavailable
              : error instanceof Error && error.message === 'booking-not-configured'
                ? text.appointmentNotConfigured
                : text.appointmentUnavailable,
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsAppointmentLoading(false)
      })
    return () => { cancelled = true }
  }, [
    appointmentDate,
    appointmentRefresh,
    chatBookingStep,
    isAppointmentRoute,
    text.appointmentNotConfigured,
    text.appointmentPreviewUnavailable,
    text.appointmentUnavailable,
  ])

  useEffect(() => {
    if (!isAdminRoute || !isAdminLoggedIn) return
    let cancelled = false
    fetch('/api/admin/appointments')
      .then(async (response) => {
        const result: unknown = await response.json()
        if (!response.ok || !result || typeof result !== 'object' || !('appointments' in result) || !Array.isArray(result.appointments)) {
          throw new Error('Appointments could not be loaded.')
        }
        if (!result.appointments.every(isAdminAppointment)) throw new Error('Appointment records were invalid.')
        return result.appointments
      })
      .then((items) => {
        if (!cancelled) {
          setAppointments(items)
          setAppointmentsError(false)
        }
      })
      .catch(() => {
        if (!cancelled) setAppointmentsError(true)
      })
      .finally(() => {
        if (!cancelled) setIsAdminAppointmentsLoading(false)
      })
    return () => { cancelled = true }
  }, [isAdminRoute, isAdminLoggedIn])

  useEffect(() => {
    if (!isAdminRoute || !isAdminLoggedIn || !editingAppointmentId || !adminEditDate) return
    let cancelled = false
    const editingAppointment = appointments.find(({ id }) => id === editingAppointmentId)
    fetch(`/api/appointments?date=${encodeURIComponent(adminEditDate)}`)
      .then(async (response) => {
        const result: unknown = await response.json()
        if (!response.ok || !result || typeof result !== 'object' || !('slots' in result) || !Array.isArray(result.slots)) {
          throw new Error('Appointment slots could not be loaded.')
        }
        const slots = result.slots.filter((slot): slot is string => typeof slot === 'string')
        if (editingAppointment?.slotStart.startsWith(`${adminEditDate}T`)) {
          slots.push(editingAppointment.slotStart.slice(11, 16))
          slots.sort()
        }
        return slots
      })
      .then((slots) => {
        if (!cancelled) setAdminEditSlots(slots)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error('Appointment reschedule slots could not be loaded.', error)
          setAppointmentActionError(text.appointmentsUnavailable)
          setAdminEditSlots([])
        }
      })
      .finally(() => {
        if (!cancelled) setIsAdminEditSlotsLoading(false)
      })
    return () => { cancelled = true }
  }, [
    adminEditDate,
    appointments,
    editingAppointmentId,
    isAdminLoggedIn,
    isAdminRoute,
    text.appointmentsUnavailable,
  ])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (isChatOpen) chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chatMessages, isChatLoading, isChatOpen])

  const currentTime = new Intl.DateTimeFormat('en-IN', {
    timeZone: SHOP_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  }).format(now)

  const todayHours = settings.hours[status.todayIndex]
  const appointmentMinDate = getLocalDateKey(now, SHOP_TIME_ZONE)
  const appointmentMaxDate = (() => {
    const lastDay = new Date(`${appointmentMinDate}T12:00:00.000Z`)
    lastDay.setUTCDate(lastDay.getUTCDate() + 30)
    return lastDay.toISOString().slice(0, 10)
  })()
  const isDraftScheduleValid = isValidSchedule({ hours: draftHours, holidays: draftHolidays })

  const startChatBooking = () => {
    setAppointmentDate(appointmentMinDate)
    setAppointmentTime('')
    setAppointmentName('')
    setAppointmentPhone('')
    setAppointmentEmail('')
    setAppointmentService('')
    setAppointmentError('')
    setChatBookingStep('service')
    setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatBookPrompt }])
  }

  const chooseChatBookingService = (service: string, label: string) => {
    setAppointmentService(service)
    setChatBookingStep('date')
    setChatMessages((messages) => [
      ...messages,
      { role: 'user', content: `${text.chatBookingService}: ${label}` },
      { role: 'assistant', content: text.chatChooseDate },
    ])
  }

  const showChatBookingTimes = () => {
    setAppointmentTime('')
    setAppointmentError('')
    setIsAppointmentLoading(true)
    setChatBookingStep('time')
    setAppointmentRefresh((value) => value + 1)
    setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatChooseTime }])
  }

  const chooseChatBookingTime = (time: string) => {
    setAppointmentTime(time)
    setChatBookingStep('name')
    setChatQuestion('')
    setChatMessages((messages) => [
      ...messages,
      { role: 'user', content: formatScheduleTime(time) },
      { role: 'assistant', content: text.chatAskName },
    ])
  }

  const cancelChatBooking = () => {
    setChatBookingStep(null)
    setAppointmentName('')
    setAppointmentPhone('')
    setAppointmentEmail('')
    setAppointmentService('')
    setAppointmentTime('')
    setAppointmentError('')
    setChatQuestion('')
    setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatBookingCancelled }])
  }

  const handleAdminLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUser, password: adminPassword }),
      })

      if (response.status === 401) {
        window.alert(text.invalidLogin)
        return
      }

      if (response.status === 429) {
        window.alert(text.loginRateLimited)
        return
      }

      if (!response.ok) {
        window.alert(text.loginUnavailable)
        return
      }

      setIsAdminLoggedIn(true)
      setIsAdminAppointmentsLoading(true)
      setAdminUser('')
      setAdminPassword('')
    } catch {
      window.alert(text.loginUnavailable)
    }
  }

  const handleAdminLogout = async (goToWebsite = false) => {
    if (isAdminLoggingOut) return
    setIsAdminLoggingOut(true)
    try {
      const response = await fetch('/api/admin/logout', { method: 'POST' })
      if (!response.ok) throw new Error('Admin logout request failed.')
      setIsAdminLoggedIn(false)
      setAppointments([])
      setIsAdminAppointmentsLoading(false)
      if (goToWebsite) window.location.assign('/')
    } catch (error) {
      console.error('Admin session could not be ended.', error)
      window.alert(text.logoutUnavailable)
    } finally {
      setIsAdminLoggingOut(false)
    }
  }

  const askChat = async (question: string) => {
    const cleanQuestion = question.trim()
    if (!cleanQuestion || isChatLoading) return

    setChatQuestion('')

    if (/appointment|book(?:ing)?|reserve|slot|முன்பதிவு|நேரம் பதிவு/.test(cleanQuestion.toLowerCase())) {
      setChatMessages((messages) => [...messages, { role: 'user', content: text.bookAppointment }])
      startChatBooking()
      return
    }

    setChatMessages((messages) => [...messages, { role: 'user', content: cleanQuestion }])

    const faqAnswer = getChatFaqAnswer(cleanQuestion, settings, now, language)
    if (faqAnswer) {
      setChatMessages((messages) => [...messages, { role: 'assistant', content: faqAnswer }])
      return
    }

    setIsChatLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: cleanQuestion, language }),
      })
      if (response.status === 429) {
        setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatRateLimited }])
        return
      }
      const result: unknown = await response.json()
      if (!response.ok || !result || typeof result !== 'object' || !('answer' in result)) {
        throw new Error('Chat service request failed.')
      }
      const answer = result.answer
      if (typeof answer !== 'string') throw new Error('Chat service returned an invalid answer.')
      setChatMessages((messages) => [...messages, { role: 'assistant', content: answer }])
    } catch {
      setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatUnavailable }])
    } finally {
      setIsChatLoading(false)
    }
  }

  const reserveAppointment = async (source: 'form' | 'chat') => {
    if (isAppointmentSubmitting) return
    setIsAppointmentSubmitting(true)
    setAppointmentError('')

    try {
      const response = await fetch('/api/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: appointmentName,
          phone: appointmentPhone,
          email: appointmentEmail,
          service: appointmentService,
          date: appointmentDate,
          time: appointmentTime,
        }),
      })
      const result: unknown = await response.json()
      if (!response.ok) {
        if (response.status === 409) {
          if (source === 'chat') {
            setChatBookingStep('time')
            setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatBookingConflict }])
          } else {
            setAppointmentError(language === 'ta'
              ? 'இந்த நேரம் இப்போது கிடைக்கவில்லை. வேறு நேரத்தைத் தேர்வு செய்யுங்கள்.'
              : 'That time is no longer available. Please choose another time.')
          }
          setAppointmentRefresh((value) => value + 1)
          setIsAppointmentLoading(true)
          setAppointmentTime('')
          return
        }
        if (response.status === 429) {
          if (source === 'chat') {
            setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatBookingRateLimit }])
          } else {
            setAppointmentError(language === 'ta'
              ? 'பலமுறை முயற்சித்துள்ளீர்கள். சில நிமிடங்கள் கழித்து முயற்சிக்கவும்.'
              : 'Too many attempts. Please try again in a few minutes.')
          }
          return
        }
        if (response.status === 503) {
          if (source === 'chat') {
            setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatBookingUnavailable }])
          } else {
            setAppointmentError(text.appointmentUnavailable)
          }
          return
        }
        throw new Error('Appointment request failed.')
      }
      if (!result || typeof result !== 'object' || !('appointment' in result)) {
        throw new Error('Appointment response was invalid.')
      }
      const notificationSent = 'notificationSent' in result && result.notificationSent === true
      setAppointmentBooked(notificationSent)
      const bookedSlot = formatAppointmentDateTime(`${appointmentDate}T${appointmentTime}`, language)
      setAppointmentName('')
      setAppointmentPhone('')
      setAppointmentEmail('')
      setAppointmentService('')
      setAppointmentTime('')
      setIsAppointmentLoading(true)
      setAppointmentRefresh((value) => value + 1)
      if (source === 'chat') {
        setChatBookingStep(null)
        setChatMessages((messages) => [
          ...messages,
          {
            role: 'assistant',
            content: `${text.chatBookingSuccess} ${bookedSlot}.${notificationSent ? '' : ` ${text.appointmentSuccessNotificationPending}`}`,
          },
        ])
      } else if (!notificationSent) {
        setAppointmentError(text.appointmentSuccessNotificationPending)
      }
    } catch (error) {
      console.error('Appointment booking failed.', error)
      if (source === 'chat') {
        setChatMessages((messages) => [...messages, { role: 'assistant', content: text.appointmentFailure }])
      } else {
        setAppointmentError(text.appointmentFailure)
      }
    } finally {
      setIsAppointmentSubmitting(false)
    }
  }

  const handleAppointmentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void reserveAppointment('form')
  }

  const handleChatSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const answer = chatQuestion.trim()
    if (chatBookingStep && /^(?:cancel|stop|never mind|ரத்து|வேண்டாம்)$/i.test(answer)) {
      setChatMessages((messages) => [...messages, { role: 'user', content: answer }])
      cancelChatBooking()
      return
    }
    if (chatBookingStep === 'name') {
      if (
        answer.length < 2
        || answer.length > 80
        || answer.split('').some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
      ) {
        setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatInvalidName }])
        return
      }
      setAppointmentName(answer)
      setChatQuestion('')
      setChatBookingStep('phone')
      setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatAskPhone }])
      return
    }
    if (chatBookingStep === 'phone') {
      const phone = answer.replace(/[\s()-]/g, '')
      if (!/^(?:\+?91)?[6-9]\d{9}$/.test(phone)) {
        setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatInvalidPhone }])
        return
      }
      setAppointmentPhone(answer)
      setChatQuestion('')
      setChatBookingStep('email')
      setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatAskEmail }])
      return
    }
    if (chatBookingStep === 'email') {
      const email = answer.trim().toLowerCase()
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatInvalidEmail }])
        return
      }
      setAppointmentEmail(email)
      setChatQuestion('')
      setChatBookingStep('confirm')
      setChatMessages((messages) => [...messages, { role: 'assistant', content: text.chatConfirmPrompt }])
      return
    }
    if (chatBookingStep) return
    void askChat(chatQuestion)
  }

  const handleHoursChange = (index: number, field: 'open' | 'close', value: string) => {
    const nextHours = [...draftHours]
    nextHours[index] = {
      ...nextHours[index],
      [field]: value || null,
    }

    if (field === 'open' && !value) {
      nextHours[index].close = null
    }

    setDraftHours(nextHours)
    setScheduleError('')
    setScheduleMessage('')
  }

  const handleClosedToggle = (index: number, isClosed: boolean) => {
    const nextHours = [...draftHours]
    nextHours[index] = {
      ...nextHours[index],
      open: isClosed ? null : nextHours[index].open ?? '10:00',
      close: isClosed ? null : nextHours[index].close ?? '20:30',
    }
    setDraftHours(nextHours)
    setScheduleError('')
    setScheduleMessage('')
  }

  const handleAddHoliday = () => {
    const cleanValue = draftHoliday.trim()
    if (!cleanValue) {
      return
    }

    if (cleanValue < appointmentMinDate) {
      setScheduleError(text.holidayDatePast)
      return
    }

    if (draftHolidays.includes(cleanValue)) return

    setDraftHolidays([...draftHolidays, cleanValue].sort())
    setDraftHoliday('')
    setScheduleError('')
    setScheduleMessage('')
  }

  const saveSchedule = async (nextSettings: ScheduleSettings) => {
    if (!isValidSchedule(nextSettings)) {
      setScheduleError(text.scheduleInvalidHours)
      setScheduleMessage('')
      return
    }

    setIsScheduleSaving(true)
    setScheduleError('')
    setScheduleMessage('')
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: nextSettings }),
      })
      if (!response.ok) throw new Error('Schedule update failed')
      setSettings(nextSettings)
      setDraftHours(nextSettings.hours)
      setDraftHolidays(nextSettings.holidays)
      setScheduleMessage(text.scheduleSaved)
    } catch (error) {
      console.error('Schedule update failed.', error)
      setScheduleError(text.scheduleSaveError)
    } finally {
      setIsScheduleSaving(false)
    }
  }

  const handleSaveSchedule = () => {
    void saveSchedule({
      hours: draftHours,
      holidays: draftHolidays,
    })
  }

  const resetSchedule = () => {
    if (!window.confirm(text.resetScheduleConfirm)) return
    void saveSchedule(DEFAULT_SETTINGS)
  }

  const startEditingAppointment = (appointment: AdminAppointment) => {
    setEditingAppointmentId(appointment.id)
    setAdminEditDate(appointment.slotStart.slice(0, 10))
    setAdminEditTime(appointment.slotStart.slice(11, 16))
    setAdminEditSlots([])
    setIsAdminEditSlotsLoading(true)
    setAppointmentActionError('')
    setAppointmentActionMessage('')
  }

  const saveAppointmentChange = async (appointmentId: string, time: string) => {
    setAppointmentActionId(appointmentId)
    setAppointmentActionError('')
    setAppointmentActionMessage('')
    try {
      const response = await fetch(`/api/admin/appointments?id=${encodeURIComponent(appointmentId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: adminEditDate, time }),
      })
      if (response.status === 409) {
        setAppointmentActionError(text.appointmentTimeUnavailable)
        return
      }
      if (!response.ok) throw new Error('Appointment could not be rescheduled.')
      const result: unknown = await response.json()
      const notificationSent = Boolean(
        result && typeof result === 'object'
        && 'notificationSent' in result
        && result.notificationSent === true,
      )

      const slotStart = `${adminEditDate}T${time}`
      setAppointments((items) => items
        .map((item) => item.id === appointmentId ? { ...item, slotStart, emailNotified: notificationSent } : item)
        .sort((left, right) => left.slotStart.localeCompare(right.slotStart)))
      setEditingAppointmentId(null)
      setAdminEditTime('')
      setAppointmentActionMessage(notificationSent
        ? text.appointmentChangeSaved
        : text.appointmentChangeNotificationPending)
    } catch (error) {
      console.error('Appointment could not be rescheduled.', error)
      setAppointmentActionError(text.appointmentActionFailed)
    } finally {
      setAppointmentActionId(null)
    }
  }

  const cancelAppointment = async (appointmentId: string) => {
    if (!window.confirm(text.appointmentCancelConfirm)) return
    setAppointmentActionId(appointmentId)
    setAppointmentActionError('')
    setAppointmentActionMessage('')
    try {
      const response = await fetch(`/api/admin/appointments?id=${encodeURIComponent(appointmentId)}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Appointment could not be cancelled.')
      setAppointments((items) => items.filter(({ id }) => id !== appointmentId))
      if (editingAppointmentId === appointmentId) setEditingAppointmentId(null)
      setAppointmentActionMessage(text.appointmentCancelSaved)
    } catch (error) {
      console.error('Appointment could not be cancelled.', error)
      setAppointmentActionError(text.appointmentActionFailed)
    } finally {
      setAppointmentActionId(null)
    }
  }

  const retryAppointmentNotification = async (appointmentId: string) => {
    setAppointmentActionId(appointmentId)
    setAppointmentActionError('')
    setAppointmentActionMessage('')
    try {
      const response = await fetch(`/api/admin/appointments?id=${encodeURIComponent(appointmentId)}`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Appointment notification could not be sent.')
      setAppointments((items) => items.map((item) => (
        item.id === appointmentId ? { ...item, emailNotified: true } : item
      )))
      setAppointmentActionMessage(text.appointmentEmailRetried)
    } catch (error) {
      console.error('Appointment notification retry failed.', error)
      setAppointmentActionError(text.appointmentActionFailed)
    } finally {
      setAppointmentActionId(null)
    }
  }

  if (isAdminRoute) {
    return (
      <main className="admin-page">
        <header className="admin-page-header">
          <a className="brand" href="/" aria-label={text.home}>
            <span className="brand-mark"><ScissorsIcon /></span>
            <span className="brand-name">
              <strong>SUBURAAJ</strong>
              <span>SALON &amp; STUDIO</span>
            </span>
          </a>
          <div className="admin-page-tools">
            <button
              type="button"
              className="language-toggle"
              aria-label={text.languageLabel}
              onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            >
              {text.language}
            </button>
            {isAdminLoggedIn && (
              <button
                type="button"
                className="secondary-button"
                disabled={isAdminLoggingOut}
                onClick={() => void handleAdminLogout()}
              >
                {language === 'ta' ? 'வெளியேறு' : 'Log out'}
              </button>
            )}
            {isAdminLoggedIn ? (
              <button
                type="button"
                className="admin-back-link"
                disabled={isAdminLoggingOut}
                onClick={() => void handleAdminLogout(true)}
              >
                {text.backToWebsite}
              </button>
            ) : (
              <a className="admin-back-link" href="/">{text.backToWebsite}</a>
            )}
          </div>
        </header>

        <section className="admin-page-content">
          {!isAdminLoggedIn ? (
            <form className="admin-login" onSubmit={handleAdminLogin}>
              <div className="admin-heading-row">
                <div>
                  <p className="eyebrow">{text.adminAccess}</p>
                  <h1>{text.manageTimings}</h1>
                </div>
              </div>
              <p className="admin-page-description">
                {language === 'ta' ? 'கடை நேரம், விடுமுறைகள் மற்றும் முன்பதிவுகளை நிர்வகிக்க உள்நுழையவும்.' : 'Sign in to manage salon hours, holidays, and appointments.'}
              </p>
              <label>
                <span>{text.username}</span>
                <input type="text" autoComplete="off" value={adminUser} onChange={(event) => setAdminUser(event.target.value)} required />
              </label>
              <label>
                <span>{text.password}</span>
                <input type="password" autoComplete="current-password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder={text.enterPassword} required />
              </label>
              <button type="submit" className="primary-button">{text.login}</button>
            </form>
          ) : (
            <div className="admin-panel">
              <div className="admin-heading-row">
                <div>
                  <p className="eyebrow">{text.adminPanel}</p>
                  <h1>{text.updateTimings}</h1>
                </div>
              </div>

              <div className="admin-section">
                <h2>{text.openingHours}</h2>
                <p className="admin-page-description">{text.scheduleInstructions}</p>
                <div className="admin-hours-list">
                  {draftHours.map((hours, index) => {
                    const isClosed = !hours.open || !hours.close

                    return (
                      <div className="admin-hours-row" key={hours.day}>
                        <span>{DAY_NAMES[language][index]}</span>
                        <label>
                          <span>{text.open}</span>
                          <input
                            type="time"
                            value={hours.open ?? ''}
                            disabled={isClosed}
                            onChange={(event) => handleHoursChange(index, 'open', event.target.value)}
                          />
                        </label>
                        <label>
                          <span>{language === 'ta' ? 'மூடும் நேரம்' : 'Close'}</span>
                          <input
                            type="time"
                            value={hours.close ?? ''}
                            disabled={isClosed}
                            onChange={(event) => handleHoursChange(index, 'close', event.target.value)}
                          />
                        </label>
                        <label className="closed-toggle">
                          <input
                            type="checkbox"
                            checked={isClosed}
                            onChange={(event) => handleClosedToggle(index, event.target.checked)}
                          />
                          <span>{text.closed}</span>
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="admin-section">
                <h2>{text.holidayDates}</h2>
                <div className="holiday-input-row">
                  <input
                    type="date"
                    min={appointmentMinDate}
                    value={draftHoliday}
                    onChange={(event) => {
                      setDraftHoliday(event.target.value)
                      setScheduleError('')
                      setScheduleMessage('')
                    }}
                  />
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={!draftHoliday || draftHolidays.includes(draftHoliday) || isScheduleSaving}
                    onClick={handleAddHoliday}
                  >
                    {text.addHoliday}
                  </button>
                </div>
                <div className="holiday-list">
                  {draftHolidays.map((holiday) => (
                    <span key={holiday} className="holiday-chip">
                      {holiday}
                      <button
                        type="button"
                        aria-label={`Remove ${holiday}`}
                        disabled={isScheduleSaving}
                        onClick={() => {
                          setDraftHolidays(draftHolidays.filter((item) => item !== holiday))
                          setScheduleError('')
                          setScheduleMessage('')
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="admin-section">
                <h2>{text.appointments}</h2>
                {isAdminAppointmentsLoading ? (
                  <p className="admin-page-description">{text.appointmentsLoading}</p>
                ) : appointmentsError ? (
                  <p className="admin-page-description">{text.appointmentsUnavailable}</p>
                ) : appointments.length === 0 ? (
                  <p className="admin-page-description">{text.noAppointments}</p>
                ) : (
                  <ol className="appointment-list">
                    {appointments.map((appointment) => (
                      <li className="appointment-admin-card" key={appointment.id}>
                        <div>
                          <strong>{formatAppointmentDateTime(appointment.slotStart, language)}</strong>
                          <span>{appointment.name} · {appointment.service}</span>
                          <a href={`tel:${appointment.phone}`}>{appointment.phone}</a>
                          {appointment.email
                            ? <a href={`mailto:${appointment.email}`}>{appointment.email}</a>
                            : <span>{text.appointmentEmailMissing}</span>}
                          <span>
                            {appointment.emailNotified ? text.appointmentEmailSent : text.appointmentEmailPending}
                          </span>
                        </div>
                        <div className="appointment-admin-actions">
                          {!appointment.emailNotified && appointment.email && (
                            <button
                              type="button"
                              className="secondary-button"
                              disabled={appointmentActionId !== null}
                              onClick={() => void retryAppointmentNotification(appointment.id)}
                            >
                              {appointmentActionId === appointment.id ? text.appointmentActionLoading : text.retryAppointmentEmail}
                            </button>
                          )}
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={appointmentActionId !== null}
                            onClick={() => {
                              if (editingAppointmentId === appointment.id) {
                                setEditingAppointmentId(null)
                                setAppointmentActionError('')
                              } else {
                                startEditingAppointment(appointment)
                              }
                            }}
                          >
                            {editingAppointmentId === appointment.id ? text.closeAppointmentEdit : text.editAppointment}
                          </button>
                          <button
                            type="button"
                            className="secondary-button appointment-cancel-button"
                            disabled={appointmentActionId !== null}
                            onClick={() => void cancelAppointment(appointment.id)}
                          >
                            {text.cancelAppointment}
                          </button>
                        </div>
                        {editingAppointmentId === appointment.id && (
                          <div className="appointment-admin-edit">
                            <label>
                              <span>{text.appointmentDate}</span>
                              <input
                                type="date"
                                min={appointmentMinDate}
                                max={appointmentMaxDate}
                                required
                                value={adminEditDate}
                                onChange={(event) => {
                                  setAdminEditDate(event.target.value)
                                  setAdminEditTime('')
                                  setAdminEditSlots([])
                                  setIsAdminEditSlotsLoading(true)
                                  setAppointmentActionError('')
                                }}
                              />
                            </label>
                            <label>
                              <span>{text.appointmentTime}</span>
                              <select
                                value={adminEditTime}
                                onChange={(event) => setAdminEditTime(event.target.value)}
                                disabled={isAdminEditSlotsLoading || adminEditSlots.length === 0}
                                required
                              >
                                <option value="" disabled>
                                  {isAdminEditSlotsLoading ? text.appointmentsLoading : text.appointmentSelectTime}
                                </option>
                                {adminEditSlots.map((slot) => (
                                  <option value={slot} key={slot}>{formatScheduleTime(slot)}</option>
                                ))}
                              </select>
                            </label>
                            <button
                              type="button"
                              className="primary-button"
                              disabled={
                                appointmentActionId !== null
                                || isAdminEditSlotsLoading
                                || !adminEditTime
                                || !adminEditSlots.includes(adminEditTime)
                              }
                              onClick={() => void saveAppointmentChange(appointment.id, adminEditTime)}
                            >
                              {appointmentActionId === appointment.id ? text.appointmentActionLoading : text.saveAppointmentChange}
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
                {appointmentActionError && <p className="appointment-error" role="alert">{appointmentActionError}</p>}
                {appointmentActionMessage && <p className="appointment-success" role="status">{appointmentActionMessage}</p>}
                <p className="admin-page-description">{text.appointmentNotificationsOnHold}</p>
              </div>

              <div className="admin-actions">
                <button type="button" className="secondary-button" disabled={isScheduleSaving} onClick={resetSchedule}>{text.reset}</button>
                <button type="button" className="primary-button" disabled={isScheduleSaving || !isDraftScheduleValid} onClick={handleSaveSchedule}>
                  {isScheduleSaving ? text.scheduleSaving : text.saveChanges}
                </button>
              </div>
              {!isDraftScheduleValid && <p className="appointment-error" role="alert">{text.scheduleInvalidHours}</p>}
              {scheduleError && <p className="appointment-error" role="alert">{scheduleError}</p>}
              {scheduleMessage && <p className="appointment-success" role="status">{scheduleMessage}</p>}
            </div>
          )}
        </section>
      </main>
    )
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href={isAppointmentRoute ? '/#home' : '#home'} aria-label={text.home}>
          <span className="brand-mark"><ScissorsIcon /></span>
          <span className="brand-name">
            <strong>SUBURAAJ</strong>
            <span>SALON &amp; STUDIO</span>
          </span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href={isAppointmentRoute ? '/#services' : '#services'}>{text.navServices}</a>
          <a href={isAppointmentRoute ? '/#hours' : '#hours'}>{text.navHours}</a>
          <a href={isAppointmentRoute ? '/#about' : '#about'}>{text.navAbout}</a>
        </nav>
        <button
          type="button"
          className="language-toggle"
          aria-label={text.languageLabel}
          onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
        >
          {text.language}
        </button>
        <a className="header-link appointment-header-link" href="/appointment">
          {text.bookAppointment} <span><ArrowIcon /></span>
        </a>
      </header>

      {isAppointmentRoute ? (
        <section className="appointment-page">
          <a className="text-link appointment-back-link" href="/">{language === 'ta' ? '← முகப்புக்குத் திரும்பு' : '← Back to the salon'}</a>
          <div className="appointment-card">
            <p className="eyebrow">{text.localSalon}</p>
            <h1>{text.appointmentHeading}</h1>
            <p className="appointment-intro">{text.appointmentIntro}</p>
            {appointmentBooked && <p className="appointment-success" role="status">{text.appointmentSuccess}</p>}
            {appointmentError && <p className="appointment-error" role="alert">{appointmentError}</p>}
            <form className="appointment-form" onSubmit={handleAppointmentSubmit}>
              <label>
                <span>{text.appointmentName}</span>
                <input
                  type="text"
                  autoComplete="name"
                  maxLength={80}
                  value={appointmentName}
                  onChange={(event) => setAppointmentName(event.target.value)}
                  required
                />
              </label>
              <label>
                <span>{text.appointmentPhone}</span>
                <input
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  pattern="(?:\+?91(?:\s|-)?)?[6-9]\d{9}"
                  title="Enter a valid Indian mobile number."
                  maxLength={16}
                  value={appointmentPhone}
                  onChange={(event) => setAppointmentPhone(event.target.value)}
                  required
                />
              </label>
              <label>
                <span>{text.appointmentEmail}</span>
                <input
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={appointmentEmail}
                  onChange={(event) => setAppointmentEmail(event.target.value)}
                  required
                />
              </label>
              <label>
                <span>{text.appointmentService}</span>
                <select value={appointmentService} onChange={(event) => setAppointmentService(event.target.value)} required>
                  <option value="" disabled>{language === 'ta' ? 'சேவையைத் தேர்வு செய்யுங்கள்' : 'Choose a service'}</option>
                  {SERVICE_MENU.map((service) => (
                    <option value={service.value} key={service.value}>
                      {service[language]} · {formatServicePrice(service.value, language)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{text.appointmentDate}</span>
                <input
                  type="date"
                  min={appointmentMinDate}
                  max={appointmentMaxDate}
                  value={appointmentDate}
                  onChange={(event) => {
                    setAppointmentDate(event.target.value)
                    setIsAppointmentLoading(true)
                    setAppointmentTime('')
                    setAppointmentBooked(false)
                    setAppointmentError('')
                  }}
                  required
                />
              </label>
              <label>
                <span>{text.appointmentTime}</span>
                <select
                  value={appointmentTime}
                  onChange={(event) => {
                    setAppointmentTime(event.target.value)
                    setAppointmentBooked(false)
                  }}
                  disabled={isAppointmentLoading || appointmentSlots.length === 0}
                  required
                >
                  <option value="" disabled>
                    {isAppointmentLoading ? text.chatThinking : appointmentSlots.length ? text.appointmentSelectTime : text.appointmentNoSlots}
                  </option>
                  {appointmentSlots.map((slot) => <option value={slot} key={slot}>{formatScheduleTime(slot)}</option>)}
                </select>
              </label>
              <button type="submit" className="primary-button" disabled={isAppointmentSubmitting || isAppointmentLoading || !appointmentSlots.length}>
                {isAppointmentSubmitting ? text.appointmentSubmitting : text.appointmentSubmit}
              </button>
            </form>
            <p className="appointment-privacy">{text.appointmentPrivacy}</p>
          </div>
        </section>
      ) : (
      <>
      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow"><span /> {text.localSalon}</p>
          <h1>{text.headlineFirst}<br /><em>{text.headlineSecond}</em></h1>
          <p className="hero-description">{text.heroDescription}</p>
          <p className="hero-location">{text.location}</p>
          <div className="hero-actions">
            <a className="button button-outline" href="/appointment">
              {text.bookAppointment} <ArrowIcon />
            </a>
            <a className="button button-dark" href="#services">
              {text.viewServices} <ArrowIcon />
            </a>
            <a className="text-link" href="https://maps.app.goo.gl/iHccRzc98oSVdeUU6" target="_blank" rel="noreferrer">{text.directions}</a>
          </div>
          <div className="hero-note">
            <span className="note-star">✳</span>
            <span>{text.homeNote}</span>
          </div>
        </div>

        <div className="hero-visual" role="img" aria-label={text.salonImage}>
          <div className="image-wash" />
          <div className={`availability-card ${status.isOpen ? 'is-open' : 'is-closed'}`} aria-live="polite">
            <span className="availability-dot" />
            <span>
              <strong>{status.isOpen ? text.openNow : text.closedNow}</strong>
              <small>{status.message}</small>
            </span>
          </div>
          <div className="visual-caption">
            <span className="caption-rule" />
            <span>{text.caption}</span>
          </div>
          <span className="visual-index">01 / 03</span>
        </div>
      </section>

      <section className="visit-strip" aria-label={text.todayAtSalon}>
        <div className={`live-status ${status.isOpen ? 'is-open' : 'is-closed'}`}>
          <span className="availability-dot" />
          <span><strong>{status.isOpen ? text.openNow : text.closedNow}</strong><small>{status.message}</small></span>
        </div>
        <div className="strip-divider" />
        <div className="strip-detail">
          <ClockIcon />
          <span>
            <strong>{text.todayAtSalon}</strong>
            <small>
              {formatHoursRange(todayHours.open, todayHours.close, text.closed)}
            </small>
          </span>
        </div>
        <div className="strip-time">
          <span>{text.localTime}</span>
          <strong>{currentTime}</strong>
        </div>
      </section>

      <section className="services-section section-wrap" id="services">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{text.experience}</p>
            <h2>{text.priceListHeading}</h2>
          </div>
          <p>{text.serviceIntro}</p>
        </div>
        <div className="service-grid">
          {SERVICE_MENU.map((service, index) => (
            <article className="service-card" key={service.value}>
              <span className="service-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="service-symbol"><ServiceIcon service={service.value} /></span>
              <h3>{service[language]}</h3>
              <p className="service-price">
                {'offerPrice' in service
                  ? (
                    <>
                      <del>₹{service.price}</del>
                      <span className="service-offer">
                        <small>{language === 'ta' ? 'சலுகை' : 'Offer'}</small>
                        <span>₹{service.offerPrice}</span>
                      </span>
                    </>
                  )
                  : `₹${service.price}`}
              </p>
              <a className="service-card-link" href="/appointment" aria-label={`${text.bookAppointment}: ${service[language]}`}>
                <ArrowIcon />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="hours-section" id="hours">
        <div className="hours-intro">
          <p className="eyebrow">{text.visit}</p>
          <h2>{text.chairFirst}<br /><em>{text.chairSecond}</em></h2>
          <p>{text.visitDescription}</p>
          <div className="hours-status-note">
            <ClockIcon />
            <span>{text.liveStatus}</span>
          </div>
        </div>
        <div className="hours-card">
          <div className="hours-card-heading">
            <div><span className="small-label">{text.localArea}</span><h3>{text.openingHours}</h3></div>
            <span className="timezone-pill">{text.ist}</span>
          </div>
          <div className="hours-list">
            {settings.hours.map((hours, index) => (
              <div className={`hours-row ${index === status.todayIndex ? 'today' : ''}`} key={hours.day}>
                <span>{DAY_NAMES[language][index]}{index === status.todayIndex && <small>{text.today}</small>}</span>
                <strong>{formatHoursRange(hours.open, hours.close, text.closed)}</strong>
              </div>
            ))}
          </div>
          <p className="hours-footnote">{text.hoursFootnote}</p>
        </div>
      </section>

      <section className="about-section section-wrap" id="about">
        <span className="about-mark">“</span>
        <div>
          <p className="eyebrow">{text.note}</p>
          <h2>{text.aboutHeadingFirst}<br /><em>{text.aboutHeadingSecond}</em></h2>
        </div>
        <p className="about-copy">{text.aboutDescription}</p>
      </section>

      <footer className="site-footer">
        <div className="footer-branding">
          <a className="brand footer-brand" href="#home">
            <span className="brand-mark"><ScissorsIcon /></span>
            <span className="brand-name"><strong>SUBURAAJ</strong><span>SALON &amp; STUDIO</span></span>
          </a>
          <p>{text.brandTagline}</p>
        </div>

        <div className="footer-map" aria-label="Suburaaj salon location map">
          <iframe
            className="map-frame"
            title={text.mapTitle}
            src="https://www.google.com/maps?q=8.727102,77.738194&z=17&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="map-address">
            <strong>{text.mapSalon}</strong>
            <span>{text.mapAddress}</span>
            <a
              href="https://maps.app.goo.gl/iHccRzc98oSVdeUU6"
              target="_blank"
              rel="noreferrer"
            >
              {text.mapLink}
            </a>
          </div>
        </div>

        <div className="footer-meta">
          <a href="#home" className="back-to-top">{text.backToTop}</a>
          <span className="page-views">{text.pageViews}: <strong>{pageViews?.toLocaleString(language) ?? '—'}</strong></span>
          <span className="copyright">© {now.getFullYear()} Suburaaj Salon &amp; Studio. {text.rights}</span>
        </div>
      </footer>

      <section className={`chat-widget${isChatOpen ? ' is-open' : ''}`} aria-label={text.chatTitle}>
        {isChatOpen && (
          <div className="chat-panel">
            <header className="chat-panel-header">
              <span className="chat-avatar"><ScissorsIcon /></span>
              <div>
                <strong>{text.chatTitle}</strong>
                <span className="chat-status">{text.chatStatus}</span>
              </div>
              <button type="button" className="chat-close" aria-label={text.chatClose} onClick={() => setIsChatOpen(false)}>×</button>
            </header>
            <div className="chat-messages" aria-live="polite" aria-busy={isChatLoading}>
              <div className="chat-bubble-row assistant">
                <span className="chat-message-avatar"><ScissorsIcon /></span>
                <p className="chat-bubble assistant">{text.chatWelcome}</p>
              </div>
              {chatMessages.map((message, index) => (
                message.role === 'assistant'
                  ? (
                    <div className="chat-bubble-row assistant" key={`${index}-${message.role}`}>
                      <span className="chat-message-avatar"><ScissorsIcon /></span>
                      <div className="chat-bubble assistant">
                        <p>{message.content}</p>
                      </div>
                    </div>
                  )
                  : <p className="chat-bubble user" key={`${index}-${message.role}`}>{message.content}</p>
              ))}
              {chatBookingStep && (
                <div className="chat-booking-controls">
                  {chatBookingStep === 'service' && (
                    <>
                      <p>{text.chatChooseService}</p>
                      {SERVICE_MENU.map((service) => (
                        <button
                          type="button"
                          key={service.value}
                          onClick={() => chooseChatBookingService(service.value, `${service[language]} · ${formatServicePrice(service.value, language)}`)}
                        >
                          {service[language]} · {formatServicePrice(service.value, language)}
                        </button>
                      ))}
                    </>
                  )}
                  {chatBookingStep === 'date' && (
                    <>
                      <label>
                        <span>{text.appointmentDate}</span>
                        <input
                          type="date"
                          min={appointmentMinDate}
                          max={appointmentMaxDate}
                          value={appointmentDate}
                          onChange={(event) => setAppointmentDate(event.target.value)}
                        />
                      </label>
                      <button type="button" onClick={showChatBookingTimes}>{text.chatContinue}</button>
                    </>
                  )}
                  {chatBookingStep === 'time' && (
                    <>
                      {isAppointmentLoading
                        ? <p>{text.chatThinking}</p>
                        : appointmentError
                          ? null
                        : appointmentSlots.length
                          ? appointmentSlots.map((slot) => (
                            <button type="button" key={slot} onClick={() => chooseChatBookingTime(slot)}>
                              {formatScheduleTime(slot)}
                            </button>
                          ))
                          : <p>{text.chatNoSlots}</p>}
                      <button type="button" className="chat-booking-secondary" onClick={() => setChatBookingStep('date')}>
                        {text.chatChangeDate}
                      </button>
                    </>
                  )}
                  {chatBookingStep === 'confirm' && (
                    <>
                      <p><strong>{text.chatBookingService}:</strong> {getServiceLabel(appointmentService, language)} · {formatServicePrice(appointmentService, language)}</p>
                      <p><strong>{text.chatBookingTime}:</strong> {formatAppointmentDateTime(`${appointmentDate}T${appointmentTime}`, language)}</p>
                      <button type="button" disabled={isAppointmentSubmitting} onClick={() => void reserveAppointment('chat')}>
                        {isAppointmentSubmitting ? text.appointmentSubmitting : text.chatConfirm}
                      </button>
                    </>
                  )}
                  {appointmentError && <p className="chat-booking-error" role="alert">{appointmentError}</p>}
                  <button type="button" className="chat-booking-secondary" onClick={cancelChatBooking}>{text.chatCancel}</button>
                </div>
              )}
              {isChatLoading && (
                <div className="chat-bubble-row assistant">
                  <span className="chat-message-avatar"><ScissorsIcon /></span>
                  <p className="chat-bubble assistant">{text.chatThinking}</p>
                </div>
              )}
              {chatMessages.length === 0 && (
                <div className="chat-quick-questions">
                  <button type="button" onClick={() => void askChat(text.chatQuickServices)}>{text.chatQuickServices}</button>
                  <button type="button" onClick={() => void askChat(text.chatQuickHours)}>{text.chatQuickHours}</button>
                  <button type="button" onClick={() => void askChat(text.chatQuickExperience)}>{text.chatQuickExperience}</button>
                </div>
              )}
              <div ref={chatMessagesEndRef} />
            </div>
            <form className="chat-form" onSubmit={handleChatSubmit}>
              <input
                value={chatQuestion}
                maxLength={
                  chatBookingStep === 'phone' ? 16
                    : chatBookingStep === 'name' ? 80
                      : chatBookingStep === 'email' ? 254
                        : 500
                }
                onChange={(event) => setChatQuestion(event.target.value)}
                type={chatBookingStep === 'phone' ? 'tel' : chatBookingStep === 'email' ? 'email' : 'text'}
                inputMode={chatBookingStep === 'phone' ? 'tel' : chatBookingStep === 'email' ? 'email' : 'text'}
                autoComplete="off"
                placeholder={
                  chatBookingStep === 'name' ? text.chatNamePlaceholder
                    : chatBookingStep === 'phone' ? text.chatPhonePlaceholder
                      : chatBookingStep === 'email' ? text.chatEmailPlaceholder
                        : text.chatPlaceholder
                }
                aria-label={
                  chatBookingStep === 'name' ? text.chatNamePlaceholder
                    : chatBookingStep === 'phone' ? text.chatPhonePlaceholder
                      : chatBookingStep === 'email' ? text.chatEmailPlaceholder
                        : text.chatPlaceholder
                }
                disabled={isChatLoading || Boolean(
                  chatBookingStep
                  && chatBookingStep !== 'name'
                  && chatBookingStep !== 'phone'
                  && chatBookingStep !== 'email',
                )}
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatQuestion.trim() || Boolean(
                  chatBookingStep
                  && chatBookingStep !== 'name'
                  && chatBookingStep !== 'phone'
                  && chatBookingStep !== 'email',
                )}
              >
                {text.chatSend}
              </button>
            </form>
            <p className="chat-privacy">{text.chatPrivacy}</p>
          </div>
        )}
        <button
          hidden={isChatOpen}
          type="button"
          className="chat-toggle"
          aria-expanded={isChatOpen}
          aria-label={text.chatOpen}
          title={text.chatOpen}
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          <span className="chat-toggle-icon" aria-hidden="true"><ScissorsIcon /></span>
        </button>
      </section>
      </>
      )}

    </main>
  )
}

export default App

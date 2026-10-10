// Central business data for Vinarija Veritas.
// Edit prices, contact data, shipping rules and wine texts here — nothing is hard-coded in components.
// Localised strings use the shape { sr, en }. 'TODO_EN' marks an English text that has not been
// provided by the winery yet; the i18n layer falls back to Serbian for those.

export const site = {
  name: 'Vinarija Veritas',
  legalName: 'Vinarija VERITAS',
  foundingYear: 2010,
  url: 'https://vinarijaveritas.com',

  contact: {
    address: {
      street: 'Stražilovački put 105',
      locality: 'Ešikovac',
      postalCode: '21205',
      city: 'Sremski Karlovci',
      country: 'RS',
      full: 'Stražilovački put 105, Ešikovac, 21205 Sremski Karlovci',
    },
    // NOTE: the old site also lists 063 8588 593 — TODO: confirm the correct number with the client.
    phone: { display: '069 624804', href: 'tel:+38169624804', e164: '+38169624804' },
    email: 'vinarijaveritas@gmail.com',
    instagram: { handle: '@vinarija_veritas', url: 'https://www.instagram.com/vinarija_veritas/' },
    geo: { lat: 45.183035050717, lng: 19.936923980713 },
    // TODO: opening hours unknown. Only known fact: opens at 12:00 on Sundays. Keep null to hide the row.
    openingHours: null,
  },

  maps: {
    // Keyless embed. If a Google Maps API key is configured later, switch to the JS API with a dark style.
    embed: 'https://www.google.com/maps?q=45.183035050717,19.936923980713&z=15&output=embed',
    directions: 'https://www.google.com/maps/dir/?api=1&destination=45.183035050717,19.936923980713',
    shops: 'https://www.google.com/maps/d/embed?mid=1N2tgGGSB5fWkiM0aNv-Gx_-5mD352AM&ehbc=2E312F',
  },

  shop: {
    currency: 'RSD',
    locale: 'sr-Latn-RS',
    minBottles: 3,
    freeDeliveryFrom: 6,
    // TODO: delivery fee below 6 bottles is not known yet. null = "to be confirmed" message.
    deliveryFee: null,
    orderPrefix: 'VER',
  },

  forms: {
    // Web3Forms access key — set VITE_FORM_ACCESS_KEY in .env (see README).
    endpoint: 'https://api.web3forms.com/submit',
    accessKey: import.meta.env?.VITE_FORM_ACCESS_KEY || '',
    recipient: 'vinarijaveritas@gmail.com',
    // Send a copy of the order to the customer (Web3Forms `ccemail` — needs a plan that supports it).
    customerCopy: false,
  },

  // Intro: real drone footage for shots 1–2 (flight through the vineyard + rise into the sky).
  // Put the files in /public/video/ and set the paths, e.g. '/video/dron-vinograd.mp4'.
  // While null, the procedural 3D vineyard is used. The 3D barrel pour always follows.
  intro: {
    droneVideo: null, // 1920×1080 or 2560×1440 H.264/HEVC mp4, ~5 s, muted
    droneVideoMobile: null, // optional lighter/vertical version for phones
    droneVideoPoster: null, // first frame as a JPG/WebP
    droneVideoEnd: null, // optional cut point in seconds
  },

  // Full-bleed background photo per section (ids from src/config/images.js). The overlay colour is
  // taken automatically from each photo's dominant colour, so text, lines and tint match the picture.
  // Change `image` to use another photo; `strength` (0–1) = how dark the overlay is.
  sectionBackgrounds: {
    philosophy: { image: 'philosophy', strength: 0.86, blur: true },
    about: { image: 'gallery-dji_0047', fallback: 'about-hero', fallbackMobile: 'about-hero-mobile', strength: 0.78 },
    vineyards: { image: 'vineyards-hero', mobile: 'vineyards-hero-mobile', strength: 0.72 },
    cellar: { image: 'cellar-hero', mobile: 'cellar-hero-mobile', strength: 0.82 },
    visits: { image: 'visits-hero', mobile: 'visits-hero-mobile', strength: 0.78 },
    gallery: { image: 'gallery-aca_8631', strength: 0.88 },
    shops: { image: 'gallery-aca_8470', strength: 0.84 },
    contact: { image: 'gallery-dji_0047', strength: 0.82 },
  },

  // About section background video. TODO: replace the photo with a video — set e.g. '/video/vinograd.mp4'.
  aboutVideo: null,

  legal: {
    terms: '/uslovi-koriscenja.html',
    privacy: '/politika-privatnosti.html',
  },
};

// Booking: visit types (value is sent in the email subject).
export const visitTypes = [
  'Obilazak i degustacija',
  'Degustacija',
  'Poslovni sastanak',
  'Team-building',
  'Svečani ručak / večera',
  'Venčanje',
  'Krštenje',
  'Rođendan',
  'Drugo',
];

// Arrival time options for the booking form.
export const visitTimes = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

export const minNoticeHours = 24;

const TODO_EN = 'TODO_EN';

// Wines — all texts verbatim from the winery (with the corrections from the brief, section 12).
export const wines = [
  {
    id: 'bela-harmonija',
    name: 'BELA HARMONIJA',
    price: 1080,
    image: 'bottle-bela-harmonija',
    theme: { from: '#E9DDB5', to: '#B9A66A', accent: '#F6EBC4', text: 'dark' },
    description: {
      sr: 'Osvežavajući miris zelenog bilja upotpunjuju medne note vinogradarske breskve. Dopadljive, vibrantne kiseline daju karakter ovom vinu. Na ukusu sočna limeta sa dugom, postojanom mineralnom završnicom.',
      en: TODO_EN,
    },
    specs: {
      variety: 'Sauvignon Blanc',
      type: { sr: 'Suvo belo vino', en: TODO_EN },
      aging: { sr: 'Inoks', en: TODO_EN },
      temperature: '8–10 °C',
    },
  },
  {
    id: 'domina-rose',
    name: 'DOMINA Rosé',
    price: 960,
    image: 'bottle-domina-rose',
    theme: { from: '#F1D3CF', to: '#C98A8A', accent: '#FBE4E0', text: 'dark' },
    description: {
      sr: 'Vino zavodljive provansalske boje rozea, mirisa citrusa, šumskog voća i finih blagih zelenih aroma. Mekog, nežnog tela lepo izbalansiranih kiselina koje ovom vinu daju svežinu i eleganciju.',
      en: TODO_EN,
    },
    specs: {
      variety: 'Cabernet Sauvignon',
      type: { sr: 'Suvo roze vino', en: TODO_EN },
      aging: { sr: 'Inoks', en: TODO_EN },
      temperature: '10–12 °C',
    },
  },
  {
    id: 'monte-karlovci',
    name: 'MONTE KARLOVCI',
    price: 1560,
    image: 'bottle-monte-karlovci',
    theme: { from: '#6E1423', to: '#2A0710', accent: '#B0283E', text: 'light' },
    description: {
      sr: 'Dominantnog mirisa zrelog crvenog voća. Ukus mu je pun, zaokružen između voćne slasti višnje sa diskretnim tonovima vanile i slatkih nota mente. Dobro balansirano, nežnih svilenkastih tanina umereno duge završnice.',
      en: TODO_EN,
    },
    specs: {
      variety: 'Merlot',
      type: { sr: 'Suvo crveno vino', en: TODO_EN },
      aging: { sr: 'Barik', en: TODO_EN },
      temperature: '16–18 °C',
    },
  },
  {
    id: 'cuk-cuvee',
    name: 'ĆUK Cuvée',
    price: 1920,
    image: 'bottle-cuk-cuvee',
    theme: { from: '#4A0E1C', to: '#2B0F2A', accent: '#7B3A78', text: 'light' },
    description: {
      sr: 'Intenzivan miris podseća na aroniju, borovnicu, cvet ljubičice uz dašak svežine eukaliptusa. Na ukusu se prepliću arome kupina i crnih dudinja. Bogata struktura somotastih tanina koji će tek sazreti nagoveštava veliki potencijal za odležavanje.',
      en: TODO_EN,
    },
    specs: {
      variety: '80% Cabernet Sauvignon, 20% Merlot',
      type: { sr: 'Suvo crveno vino', en: TODO_EN },
      aging: { sr: 'Barik', en: TODO_EN },
      temperature: '16–18 °C',
    },
  },
  {
    id: 'momentum',
    name: 'MOMENTUM',
    price: 5400,
    flagship: true,
    image: 'bottle-momentum',
    theme: { from: '#0B0809', to: '#0B0809', accent: '#C6A15B', text: 'light', particles: true },
    description: {
      sr: 'Izuzetno ekstraktivno vino, raskošnog bukea. Miris je intrigirajući na veoma zrelu kupinu. Beskonačni slojevi bogatog ukusa sa obiljem sočnosti oble strukture svilenih tanina. Živahne strelice eukaliptusa i lovora ubadaju se u kupinu i crnu ribizlu. Menta se prepliće kroz elegantne i suptilne talase hrasta do skladne, postojane duge, kafene završnice. Preporuka je obavezno dekantirati.',
      en: TODO_EN,
    },
    specs: {
      variety: 'Cabernet Sauvignon',
      type: { sr: 'Suvo crveno vino', en: TODO_EN },
      aging: { sr: 'Barik', en: TODO_EN },
      vintage: '2017',
      temperature: '16–18 °C',
    },
    awards: {
      text: {
        sr: 'Vino Momentum Cabernet Sauvignon 2017, na koje smo posebno ponosni, osvojilo je izuzetna priznanja na prestižnim vinskim ocenjivanjima. Izdvojili bismo osvojenu ZLATNU MEDALJU na prestižnom ocenjivanju na Decanteru u Londonu 2022. godine. Pored toga, srebrnu medalju na Decanteru u Londonu 2020., zlato na BIWC Sofia 2020, zlatnu medalju u Beču na AWC Vienna 2020, kao i veliko zlato (96 poena) u kategoriji Crvena mirna vina od internacionalnih nearomatičnih sorti na Velikom ocenjivanju vina Srbije u hotelu Radisson Collection, Beograd.',
        en: TODO_EN,
      },
      badges: [
        { event: 'Decanter London 2022', medal: { sr: 'Zlato', en: TODO_EN }, tier: 'gold' },
        { event: 'Decanter London 2020', medal: { sr: 'Srebro', en: TODO_EN }, tier: 'silver' },
        { event: 'BIWC Sofia 2020', medal: { sr: 'Zlato', en: TODO_EN }, tier: 'gold' },
        { event: 'AWC Vienna 2020', medal: { sr: 'Zlato', en: TODO_EN }, tier: 'gold' },
        { event: 'Veliko ocenjivanje vina Srbije', medal: { sr: 'Veliko zlato (96 poena)', en: TODO_EN }, tier: 'gold' },
      ],
    },
  },
  {
    id: 'bermet',
    name: 'BERMET',
    price: 840,
    image: 'bottle-bermet',
    theme: { from: '#8A4B1F', to: '#3A1E0F', accent: '#D08A4A', text: 'light' },
    description: {
      sr: 'Raskošan miris suvog voća prate intenzivne arome cimeta, karanfilića, anisa, vanile i crne čokolade. Obogaćeno je sa preko 20 vrsta lekovitog bilja i začina.',
      en: TODO_EN,
    },
    specs: {
      type: { sr: 'Aromatizovano slatko crveno vino', en: TODO_EN },
      temperature: '16–18 °C',
    },
  },
];

export const findWine = (id) => wines.find((w) => w.id === id);

export const RAMEN_PRICE = 175;

export const steps = [
  {
    id: 1,
    key: "fideo",
    label: "Fideo",
    subtitle: "1 a elegir",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11h16c0 5-3.6 9-8 9S4 16 4 11z"/><path d="M4 11c0 0 2-2 8-2s8 2 8 2"/><line x1="9" y1="4" x2="12" y2="9"/><line x1="15" y1="4" x2="12" y2="9"/></svg>`,
    required: true,
    options: [
      { id: "egg-noodle", name: "Egg Noodle", extra: 0 },
      { id: "fideo-cristal", name: "Fideo Cristal", extra: 0 },
    ],
  },
  {
    id: 2,
    key: "verduras",
    label: "Verduras",
    subtitle: "3 a elegir (50 gr)",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22c2-4 4-8 10-8"/><path d="M12 14c0-6 3-10 10-12-1 7-4 11-10 12z"/><path d="M12 22V14"/></svg>`,
    required: true,
    max: 3,
    options: [
      { id: "mix-verdura", name: "Mix de Verdura", extra: 0 },
      { id: "brocoli-baby", name: "Brócoli Baby", extra: 0 },
      { id: "elote", name: "Elote", extra: 0 },
      { id: "champinon", name: "Champiñón", extra: 0 },
      { id: "germinado", name: "Germinado", extra: 0 },
    ],
  },
  {
    id: 3,
    key: "proteina",
    label: "Proteína",
    subtitle: "2 a elegir (80 gr)",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 11c0 0 1-5-4-7S4 7 4 7l1 1s1-3 5-2 4 5 4 5z"/><path d="M10 13c0 0-1 5 4 7s6-3 6-3l-1-1s-1 3-5 2-4-5-4-5z"/><path d="M6 12h12"/></svg>`,
    required: true,
    max: 2,
    options: [
      { id: "huevo-duro", name: "Huevo Duro", extra: 0 },
      { id: "pollito", name: "Pollito", extra: 0 },
      { id: "tocino-crujiente", name: "Tocino Crujiente", extra: 0 },
      { id: "costillitas-cerdo", name: "Costillitas de Cerdo", extra: 0 },
      { id: "camaron", name: "Camarón", extra: 0 },
      { id: "tofu", name: "Tofu", extra: 0 },
      { id: "ravioles-4-quesos", name: "Ravioles 4 Quesos", extra: 0, note: "Naruto S/No" },
    ],
  },
  {
    id: 4,
    key: "extras",
    label: "Extras",
    subtitle: "Opcionales",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    required: false,
    options: [
      { id: "doble-pasta", name: "Doble Pasta", extra: 55 },
      { id: "tofu-extra", name: "Tofu", extra: 40 },
      { id: "ravioles-4q", name: "Ravioles 4 Quesos", extra: 45 },
      { id: "costilla-cerdo", name: "Costilla de Cerdo", extra: 55 },
      { id: "camaron-extra", name: "Camarón", extra: 70 },
      { id: "tocino-crujiente-extra", name: "Tocino Crujiente", extra: 35 },
      { id: "pollito-extra", name: "Pollito", extra: 40 },
      { id: "huevo-duro-extra", name: "Huevo Duro", extra: 25 },
    ],
  },
  {
    id: 5,
    key: "caldo",
    label: "Caldo",
    subtitle: "1 a elegir",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.5 9A2 2 0 0 1 15.5 19h-7a2 2 0 0 1-2-1z"/><path d="M5 8c0-2 1-4 7-4s7 2 7 4"/><path d="M9 13c0 0 .5 2 3 2s3-2 3-2"/></svg>`,
    required: true,
    options: [
      { id: "hongo-shiitake", name: "Hongo Shiitake", extra: 0 },
      { id: "camaron-pikin", name: "Camarón Pikín", extra: 0 },
      { id: "miso", name: "Miso", extra: 0 },
    ],
  },
];

export const complementos = [
  { id: "gyozas", name: "Gyozas 6 pz", price: 135 },
  { id: "dumplings", name: "Dumplings 4 pz", price: 120 },
  { id: "yakimeshi", name: "Yakimeshi", price: 110 },
  { id: "camarones-crunchy", name: "Camarones Crunchy", price: 135 },
  { id: "kushiague", name: "Kushiague 5 pz", price: 140 },
  { id: "rollos-primavera", name: "Rollos Primavera 4 pz", price: 95 },
];

export const pastas = [
  { id: "pad-thai", name: "Pad Thai", price: 175 },
  { id: "patsiu", name: "Patsiu", price: 175 },
  { id: "camaron-pasta", name: "Camarón", price: 175 },
];

export const bebidas = [
  { id: "refrescos", name: "Refrescos", price: 45 },
  { id: "te-jazmin", name: "Té de Jazmín", price: 40 },
  { id: "agua-limon-chia", name: "Agua de Limón con Chía", price: 40 },
  { id: "frutos-rojos", name: "Frutos Rojos", price: 45 },
  { id: "ramune", name: "Ramune", price: 90 },
  { id: "corona-victoria", name: "Corona / Victoria", price: 50 },
  { id: "lucky-buda", name: "Lucky Buda", price: 119 },
];

export const postres = [
  { id: "tempura-helado", name: "Témpura Helado", price: 75, note: "Cajeta o Jarabe Hershey's" },
  { id: "kabi-kari", name: "Kabi Kari", price: 75, note: "Cajeta o Jarabe Hershey's" },
  { id: "pocky", name: "Pocky", price: 70 },
];
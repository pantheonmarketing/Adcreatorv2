import { Roboto, Open_Sans, Oswald, Montserrat, Raleway, Poppins, Lato, Anton, Playfair_Display } from 'next/font/google';

const roboto = Roboto({ subsets: ['latin'], weight: '400', display: 'swap' });
const openSans = Open_Sans({ subsets: ['latin'], weight: '400', display: 'swap' });
const oswald = Oswald({ subsets: ['latin'], weight: '400', display: 'swap' });
const montserrat = Montserrat({ subsets: ['latin'], weight: '400', display: 'swap' });
const raleway = Raleway({ subsets: ['latin'], weight: '400', display: 'swap' });
const poppins = Poppins({ subsets: ['latin'], weight: '400', display: 'swap' });
const lato = Lato({ subsets: ['latin'], weight: '400', display: 'swap' });
const anton = Anton({ subsets: ['latin'], weight: '400', display: 'swap' });
const playfairDisplay = Playfair_Display({ subsets: ['latin'], weight: '400', display: 'swap' });

export const fonts = {
  Roboto: roboto,
  'Open Sans': openSans,
  Oswald: oswald,
  Montserrat: montserrat,
  Raleway: raleway,
  Poppins: poppins,
  Lato: lato,
  Anton: anton,
  'Playfair Display': playfairDisplay,
  Impact: 'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif',
};
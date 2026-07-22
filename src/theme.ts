import { createTheme } from '@mui/material/styles';

export const ACCENT_COLOR = '#64748B';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: ACCENT_COLOR,
    },
    background: {
      default: '#0a0a0f',
      paper: '#13131c',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
});

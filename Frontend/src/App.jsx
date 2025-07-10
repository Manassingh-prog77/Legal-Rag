import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import LegalAssistantChat from './Chat-Bot/LegalAssistantInterface'; // Adjust path if needed

// Define a custom theme for a premium, professional look
const professionalTheme = createTheme({
  palette: {
    primary: {
      main: '#1a73e8', // A refined, slightly muted blue (similar to Google's primary blue)
      light: '#4285f4', // Lighter shade
      dark: '#0f4c81', // Darker shade
      contrastText: '#fff',
    },
    secondary: {
      main: '#5f6368', // Darker grey for secondary text/icons
    },
    background: {
      default: '#f1f3f4', // Very light grey background for the chat area
      paper: '#ffffff', // White for message blocks and dialogs
    },
    text: {
      primary: '#202124', // Very dark grey for main text
      secondary: '#5f6368', // Muted grey for secondary text (similar to secondary.main)
    },
    grey: {
      100: '#f8f9fa', // Very light grey (used for input background)
      200: '#e8eaed', // Light grey (for subtle borders)
      300: '#dadce0', // Medium light grey (for heavier borders)
      400: '#bdc1c6', // Medium grey
      500: '#9aa0a6', // Darker grey
    },
     warning: { // Add a warning color for the mock highlight message
        light: '#fce8b2',
        main: '#f9ab00',
        dark: '#c58100',
    }
  },
  typography: {
    fontFamily: [
      'Roboto', // Default MUI font, widely used and professional
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontSize: '1.8rem',
      fontWeight: 500, // Slightly less bold
    },
     h5: {
       fontSize: '1.5rem',
        fontWeight: 500,
     },
     h6: {
       fontSize: '1.25rem',
        fontWeight: 500,
     },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5, // Standard readability
    },
    body2: {
      fontSize: '0.875rem', // Standard size for body2
      lineHeight: 1.4,
    },
    caption: {
      fontSize: '0.75rem', // Smaller for source details
    },
     subtitle2: {
       fontSize: '0.875rem',
        fontWeight: 700, // Bold for labels like "Legal Position"
     }
  },
  shape: {
    borderRadius: 8, // Standard border radius
  },
   spacing: 8, // Default spacing unit (adjust as needed)
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          boxShadow: 'none', // Start with no shadow, add on hover if desired
          '&:hover': {
              boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px', // Subtle shadow on hover
          }
        },
        containedPrimary: {
             '&:hover': {
                 backgroundColor: '#0f4c81', // Darker primary on hover
             }
        }
      },
    },
    MuiCard: { // Not using Card for messages anymore, but keep if needed elsewhere
        styleOverrides: {
            root: {
                borderRadius: 8,
            }
        }
    },
     MuiDialog: {
        styleOverrides: {
            paper: {
                borderRadius: 8,
            }
        }
     },
     MuiTextField: {
         styleOverrides: {
             root: {
                 // Styles handled by the styled component/sx in the chat component
             }
         }
     },
     MuiIconButton: {
         styleOverrides: {
             root: {
                 '&:hover': {
                     backgroundColor: 'rgba(0, 0, 0, 0.04)', // Subtle hover background
                 }
             }
         }
     }
  },
});


function App() {
  return (
    <ThemeProvider theme={professionalTheme}>
      <CssBaseline /> {/* Resets CSS and applies basic theme styles */}
      <LegalAssistantChat />
    </ThemeProvider>
  );
}

export default App;
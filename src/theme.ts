'use client';

import { createTheme } from "@mui/material";

const theme = createTheme({
    palette: {
        primary: {
            main: "#0F1729",
        },
        secondary: {
            main: "#f50057",
        },
    },
    typography: {
        fontFamily: "Inter, sans-serif",
    },
});

export default theme;
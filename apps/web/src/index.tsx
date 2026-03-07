import { MantineProvider, createTheme } from "@mantine/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import "@mantine/core/styles.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

const theme = createTheme({
  fontFamily: "Inter, sans-serif",
});

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <StrictMode>
    <HelmetProvider>
      <MantineProvider theme={theme}>
        <RouterProvider router={router} />
      </MantineProvider>
    </HelmetProvider>
  </StrictMode>
);

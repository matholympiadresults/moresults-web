import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { MantineProvider } from "@mantine/core";
import { Layout } from "./index";
import { NAV_LINKS, ROUTES } from "@/constants/routes";

// Mock useMantineColorScheme
const mockToggleColorScheme = vi.fn();
vi.mock("@mantine/core", async () => {
  const actual = await vi.importActual("@mantine/core");
  return {
    ...actual,
    useMantineColorScheme: () => ({
      colorScheme: "light",
      toggleColorScheme: mockToggleColorScheme,
    }),
  };
});

function renderLayout(initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <MantineProvider>
        <Layout />
      </MantineProvider>
    </MemoryRouter>
  );
}

describe("Layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the site title", () => {
      renderLayout();

      expect(screen.getByText("Math Olympiad Results")).toBeInTheDocument();
    });

    it("renders the site title as a link to home", () => {
      renderLayout();

      const titleLink = screen.getByRole("link", { name: "Math Olympiad Results" });
      expect(titleLink).toHaveAttribute("href", ROUTES.HOME);
    });

    it("renders the color scheme toggle button", () => {
      renderLayout();

      expect(screen.getByRole("button", { name: "Toggle color scheme" })).toBeInTheDocument();
    });

    it("renders navigation links in desktop view", () => {
      renderLayout();

      NAV_LINKS.forEach((link) => {
        expect(screen.getByRole("link", { name: link.label })).toBeInTheDocument();
      });
    });
  });

  describe("navigation links", () => {
    it("renders all expected navigation links", () => {
      renderLayout();

      expect(screen.getByRole("link", { name: "Contestants" })).toHaveAttribute(
        "href",
        "/contestants"
      );
      expect(screen.getByRole("link", { name: "Competitions" })).toHaveAttribute(
        "href",
        "/competitions"
      );
      expect(screen.getByRole("link", { name: "Countries" })).toHaveAttribute(
        "href",
        "/countries/individual"
      );
      expect(screen.getByRole("link", { name: "Compare Countries" })).toHaveAttribute(
        "href",
        "/countries/compare"
      );
      expect(screen.getByRole("link", { name: "Hall of Fame" })).toHaveAttribute(
        "href",
        "/hall-of-fame"
      );
      expect(screen.getByRole("link", { name: "Data" })).toHaveAttribute("href", "/data");
    });

    it("marks Contestants link as active when on contestants page", () => {
      renderLayout("/contestants");

      const contestantsLink = screen.getByRole("link", { name: "Contestants" });
      expect(contestantsLink).toHaveAttribute("data-active", "true");
    });

    it("marks Competitions link as active when on competitions page", () => {
      renderLayout("/competitions");

      const competitionsLink = screen.getByRole("link", { name: "Competitions" });
      expect(competitionsLink).toHaveAttribute("data-active", "true");
    });

    it("marks Countries link as active when on countries individual page", () => {
      renderLayout("/countries/individual");

      const countriesLink = screen.getByRole("link", { name: "Countries" });
      expect(countriesLink).toHaveAttribute("data-active", "true");
    });

    it("marks Hall of Fame link as active when on hall of fame page", () => {
      renderLayout("/hall-of-fame");

      const hallOfFameLink = screen.getByRole("link", { name: "Hall of Fame" });
      expect(hallOfFameLink).toHaveAttribute("data-active", "true");
    });

    it("does not mark other links as active when on home page", () => {
      renderLayout("/");

      NAV_LINKS.forEach((link) => {
        const navLink = screen.getByRole("link", { name: link.label });
        expect(navLink).not.toHaveAttribute("data-active", "true");
      });
    });
  });

  describe("color scheme toggle", () => {
    it("calls toggleColorScheme when toggle button is clicked", async () => {
      const user = userEvent.setup();
      renderLayout();

      const toggleButton = screen.getByRole("button", { name: "Toggle color scheme" });
      await user.click(toggleButton);

      expect(mockToggleColorScheme).toHaveBeenCalledTimes(1);
    });
  });

  describe("mobile navigation", () => {
    const getBurgerButton = () => {
      // Burger button is identified by the mantine-Burger-root class
      return document.querySelector(".mantine-Burger-root") as HTMLElement;
    };

    const getDrawer = () => {
      // Drawer root element with mantine-Drawer-root class
      return document.querySelector(".mantine-Drawer-root") as HTMLElement;
    };

    const getDrawerContent = () => {
      // Drawer content element
      return document.querySelector(".mantine-Drawer-content") as HTMLElement;
    };

    it("renders the burger menu button", () => {
      renderLayout();

      const burgerButton = getBurgerButton();
      expect(burgerButton).toBeInTheDocument();
    });

    it("toggles burger button state when clicked", async () => {
      const user = userEvent.setup();
      renderLayout();

      const burgerButton = getBurgerButton();
      const burgerInner = burgerButton.querySelector(".mantine-Burger-burger");

      // Initially closed
      expect(burgerInner).not.toHaveAttribute("data-opened");

      await user.click(burgerButton);

      // Now opened
      expect(burgerInner).toHaveAttribute("data-opened", "true");
    });

    it("renders drawer element for mobile navigation", () => {
      renderLayout();

      const drawer = getDrawer();
      expect(drawer).toBeInTheDocument();
    });

    it("opens drawer with navigation content when burger is clicked", async () => {
      const user = userEvent.setup();
      renderLayout();

      const burgerButton = getBurgerButton();
      await user.click(burgerButton);

      // Wait for drawer content to appear
      await waitFor(() => {
        expect(getDrawerContent()).toBeInTheDocument();
      });

      // Should contain the Navigation title
      expect(screen.getByText("Navigation")).toBeInTheDocument();
    });

    it("renders navigation links in drawer when opened", async () => {
      const user = userEvent.setup();
      renderLayout();

      const burgerButton = getBurgerButton();
      await user.click(burgerButton);

      // Wait for drawer content to appear
      await waitFor(() => {
        expect(getDrawerContent()).toBeInTheDocument();
      });

      const drawerContent = getDrawerContent()!;
      // Check that all nav links are present in drawer
      NAV_LINKS.forEach((link) => {
        expect(drawerContent).toHaveTextContent(link.label);
      });
    });

    it("closes drawer when a navigation link is clicked", async () => {
      const user = userEvent.setup();
      renderLayout();

      const burgerButton = getBurgerButton();
      await user.click(burgerButton);

      // Wait for drawer content to appear
      await waitFor(() => {
        expect(getDrawerContent()).toBeInTheDocument();
      });

      const drawerContent = getDrawerContent()!;
      // Click on a nav link in the drawer
      const contestantsLink = drawerContent.querySelector('a[href="/contestants"]');
      expect(contestantsLink).toBeInTheDocument();
      await user.click(contestantsLink!);

      // Burger state should toggle back to closed
      const burgerInner = burgerButton.querySelector(".mantine-Burger-burger");
      expect(burgerInner).not.toHaveAttribute("data-opened");
    });

    it("closes drawer when close button is clicked", async () => {
      const user = userEvent.setup();
      renderLayout();

      const burgerButton = getBurgerButton();
      await user.click(burgerButton);

      // Wait for drawer content to appear
      await waitFor(() => {
        expect(getDrawerContent()).toBeInTheDocument();
      });

      const drawerContent = getDrawerContent()!;
      const closeButton = drawerContent
        .closest(".mantine-Drawer-content")
        ?.querySelector(".mantine-Drawer-close") as HTMLElement;
      expect(closeButton).toBeInTheDocument();
      await user.click(closeButton);

      // Burger state should toggle back to closed
      const burgerInner = burgerButton.querySelector(".mantine-Burger-burger");
      expect(burgerInner).not.toHaveAttribute("data-opened");
    });
  });
});
